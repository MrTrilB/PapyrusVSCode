import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const getNonce = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return nonce;
};

export class ControlCenterPanel {
  private static instance: ControlCenterPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(theme => {
        this.postTheme(theme.kind);
      })
    );
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage(message => this.handleMessage(message))
    );
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (ControlCenterPanel.instance) {
      ControlCenterPanel.instance.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'papyrusControlCenter',
      'Papyrus Control Center',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')]
      }
    );

    ControlCenterPanel.instance = new ControlCenterPanel(panel, context.extensionUri);
  }

  public dispose() {
    ControlCenterPanel.instance = undefined;

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      try {
        disposable?.dispose();
      } catch {
        // ignore
      }
    }

    this.panel.dispose();
  }

  private update() {
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'main.js')
    );
    const initialTheme = this.getThemeMode(vscode.window.activeColorTheme.kind);

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} https: data:`,
      `script-src ${webview.cspSource} 'nonce-${nonce}'`,
      `connect-src ${webview.cspSource}`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Papyrus Control Center</title>
  <style>
    html, body {
      padding: 0;
      margin: 0;
      height: 100%;
      width: 100%;
      background-color: transparent;
      font-family: "Segoe UI", sans-serif;
    }

    #root {
      height: 100%;
      width: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    const vscodeApi = acquireVsCodeApi();
    window.__papyrusInitialState = { theme: '${initialTheme}' };
    window.__papyrusVsCodeApi = vscodeApi;
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getThemeMode(kind: vscode.ColorThemeKind): 'light' | 'dark' | 'highContrast' {
    switch (kind) {
      case vscode.ColorThemeKind.HighContrast:
      case vscode.ColorThemeKind.HighContrastLight:
        return 'highContrast';
      case vscode.ColorThemeKind.Dark:
        return 'dark';
      case vscode.ColorThemeKind.Light:
      default:
        return 'light';
    }
  }

  private postTheme(kind: vscode.ColorThemeKind) {
    if (!this.panel.webview) {
      return;
    }
    this.panel.webview.postMessage({
      type: 'theme',
      theme: this.getThemeMode(kind)
    });
  }

  private async handleMessage(rawMessage: unknown) {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return;
    }

    const message = rawMessage as { type?: string; payload?: unknown };
    if (message.type === 'papyrus.autoDetect') {
      await this.handleAutoDetectRequest(message.payload);
    } else if (message.type === 'papyrus.openSettings') {
      await this.handleOpenSettingsRequest(message.payload);
    } else if (message.type === 'papyrus.requestSetupState') {
      await this.postSetupState();
    } else if (message.type === 'papyrus.saveWizardSettings') {
      await this.handleSaveWizardSettings(message.payload);
    } else if (message.type === 'papyrus.pathCheck') {
      await this.handlePathCheck(message.payload);
    } else if (message.type === 'papyrus.requestWorkspaceProjects') {
      await this.handleWorkspaceProjectsRequest(message.payload);
    } else if (message.type === 'papyrus.saveWorkspaceProject') {
      await this.handleWorkspaceProjectSave(message.payload);
    }
  }

  private async handleAutoDetectRequest(payload: unknown) {
    const request = typeof payload === 'object' && payload !== null ? payload as { applyAll?: boolean } : undefined;
    const applyAll = request?.applyAll !== false;

    type DetectedEntry = { compilerPath?: string; scriptPaths?: string[] };
    type DetectedRecord = Record<string, DetectedEntry>;

    try {
      const detected = await vscode.commands.executeCommand<DetectedRecord | undefined>('papyrus.autoDetectGamePaths', {
        applyAll,
        skipPrompts: true,
        silent: true
      });

      const result: DetectedRecord = detected && typeof detected === 'object' ? detected : {};
      const appliedProfiles = Object.entries(result)
        .filter(([, info]) => {
          if (!info) return false;
          const hasCompiler = typeof info.compilerPath === 'string' && info.compilerPath.trim().length > 0;
          const hasScripts = Array.isArray(info.scriptPaths) && info.scriptPaths.length > 0;
          return hasCompiler || hasScripts;
        })
        .map(([key]) => key);

      const status = appliedProfiles.length ? 'success' : 'empty';
      this.panel.webview.postMessage({
        type: 'papyrus.autoDetectResult',
        status,
        detected: result,
        appliedProfiles
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      console.error('[Papyrus] Auto-detect request failed:', error);
      this.panel.webview.postMessage({
        type: 'papyrus.autoDetectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus auto-detect failed: ${message}`);
    }
  }

  private async handleOpenSettingsRequest(payload: unknown) {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { query?: string } : undefined;
      const query = request?.query || '@ext:MrTrilB.papyrus-tools papyrus.games';
      await vscode.commands.executeCommand('workbench.action.openSettings', query);
    } catch (error) {
      console.error('[Papyrus] Failed to open settings from Control Center webview:', error);
    }
  }

  private sanitizePathArray(input: unknown): string[] {
    if (!Array.isArray(input)) {
      return [];
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of input) {
      if (typeof value !== 'string') {
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  }

  private deriveGameRoot(scriptPaths: string[], compilerPath: string | undefined, profileKey: 'starfield' | 'fallout' | 'skyrim'): string {
    for (const candidate of scriptPaths) {
      const normalized = candidate.replace(/\\/g, '/');
      const idx = normalized.toLowerCase().indexOf('/data/scripts');
      if (idx > 0) {
        return path.normalize(normalized.slice(0, idx));
      }
    }
    if (compilerPath) {
      const normalized = compilerPath.replace(/\\/g, '/');
      const suffix = profileKey === 'starfield' ? '/tools/papyrus compiler' : '/papyrus compiler';
      const idx = normalized.toLowerCase().indexOf(suffix);
      if (idx > 0) {
        return path.normalize(normalized.slice(0, idx));
      }
    }
    return '';
  }

  private mapGameKeyToConfigPrefix(profileKey: 'starfield' | 'fallout' | 'skyrim'): { script: string; compiler: string; namespace: string; namespaceFragments: string; output: string; outputFragments: string } {
    switch (profileKey) {
      case 'starfield':
        return {
          script: 'starfield.ScriptSourceDirectory',
          compiler: 'starfield.CompilerDirectory',
          namespace: 'starfield.compiler.Namespace',
          namespaceFragments: 'starfield.compiler.NamespaceFragments',
          output: 'starfield.compiler.outputDirectory',
          outputFragments: 'starfield.compiler.outputDirectoryFragments'
        };
      case 'fallout':
        return {
          script: 'Fallout.ScriptSourceDirectory',
          compiler: 'Fallout.CompilerDirectory',
          namespace: 'Fallout.compiler.Namespace',
          namespaceFragments: 'Fallout.compiler.NamespaceFragments',
          output: 'Fallout.compiler.outputDirectory',
          outputFragments: 'Fallout.compiler.outputDirectoryFragments'
        };
      case 'skyrim':
      default:
        return {
          script: 'Skyrim.ScriptSourceDirectory',
          compiler: 'Skyrim.CompilerDirectory',
          namespace: 'Skyrim.compiler.Namespace',
          namespaceFragments: 'Skyrim.compiler.NamespaceFragments',
          output: 'Skyrim.compiler.outputDirectory',
          outputFragments: 'Skyrim.compiler.outputDirectoryFragments'
        };
    }
  }

  private async postSetupState(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const gamesRaw = cfg.get<unknown>('games');
    const gamesRecord = (gamesRaw && typeof gamesRaw === 'object' && !Array.isArray(gamesRaw)) ? gamesRaw as Record<string, any> : {};

    const payload: Record<string, {
      scriptPaths: string[];
      compilerPath: string;
      namespaceDir: string;
      namespaceFragmentsDir: string;
      outputDir: string;
      outputFragmentsDir: string;
      rootPath: string;
    }> = {};

    const games: Array<'starfield' | 'fallout' | 'skyrim'> = ['starfield', 'fallout', 'skyrim'];
    for (const key of games) {
      const entry = gamesRecord[key];
      const prefixes = this.mapGameKeyToConfigPrefix(key);

      const rawScriptPaths: string[] = [];
      if (Array.isArray(entry?.scriptPaths)) {
        rawScriptPaths.push(...entry.scriptPaths);
      }
      const topLevelScript = cfg.get<string>(prefixes.script) || '';
      if (topLevelScript.trim()) {
        rawScriptPaths.push(topLevelScript);
      }
      const scriptPaths = this.sanitizePathArray(rawScriptPaths);

      const compilerFromGames = typeof entry?.compiler?.path === 'string' ? entry.compiler.path.trim() : '';
      const compilerTopLevel = (cfg.get<string>(prefixes.compiler) || '').trim();
      const compilerPath = compilerFromGames || compilerTopLevel;

      const namespaceDir = cfg.get<string>(prefixes.namespace) || '';
      const namespaceFragmentsDir = cfg.get<string>(prefixes.namespaceFragments) || '';
      const outputDir = cfg.get<string>(prefixes.output) || '';
      const outputFragmentsDir = cfg.get<string>(prefixes.outputFragments) || '';
      const rootPath = this.deriveGameRoot(scriptPaths, compilerPath, key);

      payload[key] = {
        scriptPaths,
        compilerPath,
        namespaceDir,
        namespaceFragmentsDir,
        outputDir,
        outputFragmentsDir,
        rootPath
      };
    }

    this.panel.webview.postMessage({
      type: 'papyrus.setupState',
      payload
    });
  }

  private async handleSaveWizardSettings(payload: unknown): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

    type GamePayload = {
      key?: string;
      scriptPaths?: unknown;
      compilerPath?: unknown;
      namespaceDir?: unknown;
      namespaceFragmentsDir?: unknown;
      outputDir?: unknown;
      outputFragmentsDir?: unknown;
      ensure?: unknown;
    };

    const request = typeof payload === 'object' && payload !== null ? payload as { games?: unknown } : undefined;
    if (!request?.games || !Array.isArray(request.games)) {
      this.panel.webview.postMessage({ type: 'papyrus.saveWizardSettingsResult', status: 'error', message: 'Invalid payload received.' });
      return;
    }

    try {
      const gamesRaw = cfg.get<unknown>('games');
      const currentGames = (gamesRaw && typeof gamesRaw === 'object' && !Array.isArray(gamesRaw)) ? { ...(gamesRaw as Record<string, any>) } : {};

      const ensurePaths: string[] = [];

      for (const entry of request.games as GamePayload[]) {
        const key = typeof entry?.key === 'string' ? entry.key.trim().toLowerCase() : '';
        if (key !== 'starfield' && key !== 'fallout' && key !== 'skyrim') {
          continue;
        }

        const scriptPaths = this.sanitizePathArray(entry?.scriptPaths);
        const compilerPath = typeof entry?.compilerPath === 'string' ? entry.compilerPath.trim() : '';
        const namespaceDir = typeof entry?.namespaceDir === 'string' ? entry.namespaceDir.trim() : '';
        const namespaceFragmentsDir = typeof entry?.namespaceFragmentsDir === 'string' ? entry.namespaceFragmentsDir.trim() : '';
        const outputDir = typeof entry?.outputDir === 'string' ? entry.outputDir.trim() : '';
        const outputFragmentsDir = typeof entry?.outputFragmentsDir === 'string' ? entry.outputFragmentsDir.trim() : '';
        const ensure = this.sanitizePathArray(entry?.ensure);
        ensurePaths.push(...ensure);

        const existing = currentGames[key] && typeof currentGames[key] === 'object' && !Array.isArray(currentGames[key])
          ? { ...(currentGames[key] as Record<string, any>) }
          : {};

        if (scriptPaths.length > 0) {
          existing.scriptPaths = scriptPaths;
        } else {
          delete existing.scriptPaths;
        }

        const existingCompiler = existing.compiler && typeof existing.compiler === 'object' && !Array.isArray(existing.compiler)
          ? { ...(existing.compiler as Record<string, any>) }
          : {};

        if (compilerPath) {
          existingCompiler.path = compilerPath;
        } else {
          delete existingCompiler.path;
        }

        if (Object.keys(existingCompiler).length > 0) {
          existing.compiler = existingCompiler;
        } else {
          delete existing.compiler;
        }

        if (Object.keys(existing).length > 0) {
          currentGames[key] = existing;
        } else if (key in currentGames) {
          delete currentGames[key];
        }

        const prefixes = this.mapGameKeyToConfigPrefix(key);
        const firstScriptPath = scriptPaths[0] || '';
        await cfg.update(prefixes.script, firstScriptPath, target);
        await cfg.update(prefixes.compiler, compilerPath, target);
        await cfg.update(prefixes.namespace, namespaceDir, target);
        await cfg.update(prefixes.namespaceFragments, namespaceFragmentsDir, target);
        await cfg.update(prefixes.output, outputDir, target);
        await cfg.update(prefixes.outputFragments, outputFragmentsDir, target);
      }

      await cfg.update('games', Object.keys(currentGames).length ? currentGames : undefined, target);

      for (const dir of ensurePaths) {
        if (!dir) {
          continue;
        }
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
          console.warn('[Papyrus] Failed to ensure directory from wizard:', dir, error);
        }
      }

      await this.postSetupState();

      this.panel.webview.postMessage({
        type: 'papyrus.saveWizardSettingsResult',
        status: 'success'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrus.saveWizardSettingsResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus wizard failed to save settings: ${message}`);
    }
  }

  private async handlePathCheck(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { requestId?: string; namespace?: string; output?: string } : undefined;
      const requestId = typeof request?.requestId === 'string' ? request.requestId : undefined;
      const namespacePath = typeof request?.namespace === 'string' ? request.namespace.trim() : '';
      const outputPath = typeof request?.output === 'string' ? request.output.trim() : '';

      const response: { type: 'papyrus.pathCheckResult'; requestId?: string; namespaceExists?: boolean; outputExists?: boolean } = {
        type: 'papyrus.pathCheckResult',
        requestId
      };

      if (namespacePath) {
        response.namespaceExists = fs.existsSync(namespacePath);
      }

      if (outputPath) {
        response.outputExists = fs.existsSync(outputPath);
      }

      this.panel.webview.postMessage(response);
    } catch (error) {
      console.error('[Papyrus] Failed to evaluate path existence from Control Center:', error);
    }
  }

  private async handleWorkspaceProjectsRequest(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { namespace?: string; game?: string } : undefined;
      const namespacePath = typeof request?.namespace === 'string' ? request.namespace.trim() : '';
      if (!namespacePath) {
        this.panel.webview.postMessage({
          type: 'papyrus.workspaceProjects',
          projects: []
        });
        return;
      }

      const settingsDir = path.join(namespacePath, '.vscode');
      const projectsFile = path.join(settingsDir, 'papyrus-projects.json');
      let projects: Array<{ code: string; game: string; namespaceDir: string; fragmentsDir?: string }> = [];

      if (fs.existsSync(projectsFile)) {
        try {
          const raw = fs.readFileSync(projectsFile, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            projects = parsed.filter(entry => typeof entry?.code === 'string');
          }
        } catch (error) {
          console.warn('[Papyrus] Failed to read papyrus-projects.json:', error);
        }
      }

      this.panel.webview.postMessage({
        type: 'papyrus.workspaceProjects',
        projects
      });
    } catch (error) {
      console.error('[Papyrus] Failed to collect workspace projects:', error);
      this.panel.webview.postMessage({
        type: 'papyrus.workspaceProjects',
        projects: [],
        message: 'Failed to load projects.'
      });
    }
  }

  private async handleWorkspaceProjectSave(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as {
        game?: string;
        code?: string;
        namespaceDir?: string;
        outputDir?: string;
        namespaceFragmentsDir?: string;
        outputFragmentsDir?: string;
        ensure?: string[];
      } : undefined;

      const game = typeof request?.game === 'string' ? request.game.trim() : '';
      const codeName = typeof request?.code === 'string' ? request.code.trim() : '';
      const namespaceDir = typeof request?.namespaceDir === 'string' ? request.namespaceDir.trim() : '';
      const outputDir = typeof request?.outputDir === 'string' ? request.outputDir.trim() : '';
      const namespaceFragmentsDir = typeof request?.namespaceFragmentsDir === 'string' ? request.namespaceFragmentsDir.trim() : '';
      const outputFragmentsDir = typeof request?.outputFragmentsDir === 'string' ? request.outputFragmentsDir.trim() : '';
      const ensure = Array.isArray(request?.ensure) ? request.ensure.filter((value): value is string => typeof value === 'string' && value.trim().length > 0) : [];

      if (!game || !codeName || !namespaceDir || !outputDir) {
        this.panel.webview.postMessage({
          type: 'papyrus.saveWorkspaceProjectResult',
          status: 'error',
          message: 'Missing required fields to save the project.'
        });
        return;
      }

      const settingsDir = path.join(namespaceDir, '.vscode');
      const projectsFile = path.join(settingsDir, 'papyrus-projects.json');

      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }

      let projects: Array<{ code: string; game: string; namespaceDir: string; outputDir: string; namespaceFragmentsDir?: string; outputFragmentsDir?: string }> = [];
      if (fs.existsSync(projectsFile)) {
        try {
          const raw = fs.readFileSync(projectsFile, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            projects = parsed.filter(entry => typeof entry?.code === 'string');
          }
        } catch (error) {
          console.warn('[Papyrus] Failed to parse existing papyrus-projects.json:', error);
        }
      }

      const nextProjects = projects.filter(project => project.code.toLowerCase() !== codeName.toLowerCase());
      nextProjects.push({
        code: codeName,
        game,
        namespaceDir,
        outputDir,
        namespaceFragmentsDir: namespaceFragmentsDir || undefined,
        outputFragmentsDir: outputFragmentsDir || undefined
      });

      fs.writeFileSync(projectsFile, JSON.stringify(nextProjects, null, 2), 'utf8');

      // Ensure directories exist if requested
      for (const target of ensure) {
        try {
          if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
          }
        } catch (error) {
          console.warn('[Papyrus] Failed to ensure workspace project directory:', target, error);
        }
      }

      this.panel.webview.postMessage({
        type: 'papyrus.saveWorkspaceProjectResult',
        status: 'success'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrus.saveWorkspaceProjectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus workspace project failed to save: ${message}`);
    }
  }
}
