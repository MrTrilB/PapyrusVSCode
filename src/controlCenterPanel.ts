import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { startMcpServer, stopMcpServer, restartMcpServer } from './mcpServerManager';

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
  private readonly extensionPath: string;
  private disposables: vscode.Disposable[] = [];

  public static get currentPanel(): ControlCenterPanel | undefined {
    return ControlCenterPanel.instance;
  }

  public postMessage(message: any): void {
    if (this.panel.webview) {
      this.panel.webview.postMessage(message);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.extensionPath = extensionUri.fsPath;
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
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'controlCenter.js')
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
    if (message.type === 'papyrusTools.autoDetect') {
      await this.handleAutoDetectRequest(message.payload);
    } else if (message.type === 'papyrusTools.openSettings') {
      await this.handleOpenSettingsRequest(message.payload);
    } else if (message.type === 'papyrusTools.requestSetupState') {
      await this.postSetupState();
    } else if (message.type === 'papyrusTools.gameProfileChanged') {
      await this.handleGameProfileChanged(message.payload as { game: string });
    } else if (message.type === 'papyrusTools.saveWizardSettings') {
      await this.handleSaveWizardSettings(message.payload);
    } else if (message.type === 'papyrusTools.pathCheck') {
      await this.handlePathCheck(message.payload);
    } else if (message.type === 'papyrusTools.requestWorkspaceProjects') {
      await this.handleWorkspaceProjectsRequest(message.payload);
    } else if (message.type === 'papyrusTools.saveWorkspaceProject') {
      await this.handleWorkspaceProjectSave(message.payload);
    } else if (message.type === 'papyrusTools.loadWorkspaceProject') {
      await this.handleWorkspaceProjectLoad(message.payload);
    } else if (message.type === 'papyrusTools.updateWorkspaceProject') {
      await this.handleWorkspaceProjectUpdate(message.payload);
    } else if (message.type === 'papyrusTools.deleteWorkspaceProject') {
      await this.handleWorkspaceProjectDelete(message.payload);
    } else if (message.type === 'papyrusTools.revealPath') {
      await this.handleRevealPath(message.payload);
    } else if (message.type === 'papyrusTools.setSetupWizardCompleted') {
      await this.handleSetSetupWizardCompleted(message.payload);
    } else if (message.type === 'papyrusTools.scanScripts') {
      await this.handleScanScriptsRequest();
    } else if (message.type === 'papyrusTools.rebuildIndex') {
      await this.handleRebuildIndexRequest();
    } else if (message.type === 'papyrusTools.exportProfile') {
      await this.handleExportProfileRequest();
    } else if (message.type === 'papyrusTools.importProfile') {
      await this.handleImportProfileRequest();
    } else if (message.type === 'papyrusTools.clearSettings') {
      await this.handleClearSettingsRequest();
    } else if (message.type === 'papyrusTools.createDefaults') {
      await this.handleCreateDefaultsRequest();
    } else if (message.type === 'papyrusTools.startMcpServer') {
      await this.handleStartMcpServer();
    } else if (message.type === 'papyrusTools.stopMcpServer') {
      await this.handleStopMcpServer();
    } else if (message.type === 'papyrusTools.restartMcpServer') {
      await this.handleRestartMcpServer();
    } else if (message.type === 'papyrusTools.executeCommand') {
      await this.handleExecuteCommand(message.payload);
    }
  }

  private async handleAutoDetectRequest(payload: unknown) {
    const request = typeof payload === 'object' && payload !== null ? payload as { applyAll?: boolean } : undefined;
    const applyAll = request?.applyAll !== false;

    type DetectedEntry = { compilerPath?: string; scriptPaths?: string[] };
    type DetectedRecord = Record<string, DetectedEntry>;

    try {
      const detected = await vscode.commands.executeCommand<DetectedRecord | undefined>('papyrusTools.autoDetectGamePaths', {
        applyAll,
        skipPrompts: true,
        silent: true
      });

      const appliedProfiles = Object.entries(detected && typeof detected === 'object' ? detected : {})
        .filter(([, info]) => {
          if (!info) return false;
          const hasCompiler = typeof info.compilerPath === 'string' && info.compilerPath.trim().length > 0;
          const hasScripts = Array.isArray(info.scriptPaths) && info.scriptPaths.length > 0;
          return hasCompiler || hasScripts;
        })
        .map(([key]) => key);

      const status = appliedProfiles.length ? 'success' : 'empty';
      this.panel.webview.postMessage({
        type: 'papyrusTools.autoDetectResult',
        status,
        detected,
        appliedProfiles
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      console.error('[Papyrus Tools] Auto-detect request failed:', error);
      this.panel.webview.postMessage({
        type: 'papyrusTools.autoDetectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus auto-detect failed: ${message}`);
    }
  }

  private async handleOpenSettingsRequest(payload: unknown) {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { query?: string } : undefined;
      const query = request?.query || '@ext:MrTrilB.papyrus-tools papyrusTools.games';
      await vscode.commands.executeCommand('workbench.action.openSettings', query);
    } catch (error) {
      console.error('[Papyrus Tools] Failed to open settings from Control Center webview:', error);
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

  private mapGameKeyToConfigPrefix(profileKey: 'starfield' | 'fallout' | 'skyrim'): { script: string; compiler: string; namespace: string; output: string } {
    switch (profileKey) {
      case 'starfield':
        return {
          script: 'starfield.ScriptSourceDirectory',
          compiler: 'starfield.CompilerDirectory',
          namespace: 'starfield.compiler.Namespace',
          output: 'starfield.compiler.outputDirectory'
        };
      case 'fallout':
        return {
          script: 'Fallout.ScriptSourceDirectory',
          compiler: 'Fallout.CompilerDirectory',
          namespace: 'Fallout.compiler.Namespace',
          output: 'Fallout.compiler.outputDirectory'
        };
      case 'skyrim':
      default:
        return {
          script: 'Skyrim.ScriptSourceDirectory',
          compiler: 'Skyrim.CompilerDirectory',
          namespace: 'Skyrim.compiler.Namespace',
          output: 'Skyrim.compiler.outputDirectory'
        };
    }
  }

  private sanitizeProjectSettings(input: unknown): Array<{ name: string; namespace: string; active?: boolean }> {
    if (!Array.isArray(input)) {
      return [];
    }
    const seen = new Set<string>();
    const projects: Array<{ name: string; namespace: string; active?: boolean }> = [];
    for (const entry of input) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const obj = entry as Record<string, unknown>;
      const name = typeof obj.name === 'string'
        ? obj.name.trim()
        : typeof obj.ProjectName === 'string'
          ? obj.ProjectName.trim()
          : typeof obj.projectName === 'string'
            ? obj.projectName.trim()
            : '';
      const namespace = typeof obj.namespace === 'string'
        ? obj.namespace.trim()
        : typeof obj.ProjectNamespace === 'string'
          ? obj.ProjectNamespace.trim()
          : typeof obj.projectNamespace === 'string'
            ? obj.projectNamespace.trim()
            : '';
      const active = typeof obj.active === 'boolean' ? obj.active : undefined;
      if (!name || !namespace) {
        continue;
      }
      const key = `${name.toLowerCase()}::${namespace.toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      projects.push({ name, namespace, active });
    }
    return projects;
  }

  private removeProjectsByNameOrNamespace(
    projects: Array<{ name: string; namespace: string; active?: boolean }>,
    projectName: string,
    namespaceDir: string
  ): Array<{ name: string; namespace: string; active?: boolean }> {
    const normalizedName = typeof projectName === 'string' ? projectName.trim().toLowerCase() : '';
    const normalizedNamespace = this.normalizeFsPath(namespaceDir).toLowerCase();
    return projects.filter(project => {
      const entryName = project.name.trim().toLowerCase();
      if (normalizedName && entryName === normalizedName) {
        return false;
      }
      const entryNamespace = this.normalizeFsPath(project.namespace).toLowerCase();
      if (normalizedNamespace && entryNamespace === normalizedNamespace) {
        return false;
      }
      return true;
    });
  }

  private normalizeFsPath(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    try {
      return path.normalize(trimmed);
    } catch {
      return trimmed;
    }
  }

  private normalizeGameKey(raw: unknown): 'starfield' | 'fallout' | 'skyrim' | undefined {
    if (typeof raw !== 'string') {
      return undefined;
    }
    const value = raw.trim().toLowerCase();
    if (!value) {
      return undefined;
    }
    if (value === 'starfield') {
      return 'starfield';
    }
    if (value === 'fallout' || value === 'fallout4') {
      return 'fallout';
    }
    if (value === 'skyrim' || value === 'skyrimse' || value === 'skyrimae') {
      return 'skyrim';
    }
    return undefined;
  }

  private resolveGameFromNamespace(namespaceDir: string, gamesRecord: Record<string, any>): 'starfield' | 'fallout' | 'skyrim' | undefined {
    const normalized = namespaceDir.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    const candidates: Array<'starfield' | 'fallout' | 'skyrim'> = ['starfield', 'fallout', 'skyrim'];
    for (const key of candidates) {
      const entry = gamesRecord[key];
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const compare = typeof entry.namespaceDir === 'string' ? path.normalize(entry.namespaceDir).toLowerCase() : '';
      if (compare && compare === normalized) {
        return key;
      }
      const fragmentsCompare = typeof entry.namespaceFragmentsDir === 'string' ? path.normalize(entry.namespaceFragmentsDir).toLowerCase() : '';
      if (fragmentsCompare && normalized.startsWith(fragmentsCompare)) {
        return key;
      }
      const rootCompare = typeof entry.rootPath === 'string' ? path.normalize(entry.rootPath).toLowerCase() : '';
      if (rootCompare && normalized.startsWith(rootCompare)) {
        return key;
      }
    }
    return undefined;
  }

  private getDefaultGameName(game: 'starfield' | 'fallout' | 'skyrim'): 'Starfield' | 'Fallout' | 'Skyrim' {
    switch (game) {
      case 'fallout':
        return 'Fallout';
      case 'skyrim':
        return 'Skyrim';
      case 'starfield':
      default:
        return 'Starfield';
    }
  }

  private collectProjectSummaries(
    projects: Array<{ name: string; namespace: string }>,
    gamesRecord: Record<string, any>
  ): Array<{
    name: string;
    namespace: string;
    namespaceFolder: string;
    namespaceExists: boolean;
    outputDir: string;
    outputExists: boolean;
    namespaceFragmentsDir: string;
    namespaceFragmentsExists: boolean;
    outputFragmentsDir: string;
    outputFragmentsExists: boolean;
    game?: 'starfield' | 'fallout' | 'skyrim';
  }> {
    const summaries: Array<{
      name: string;
      namespace: string;
      namespaceFolder: string;
      namespaceExists: boolean;
      outputDir: string;
      outputExists: boolean;
      namespaceFragmentsDir: string;
      namespaceFragmentsExists: boolean;
      outputFragmentsDir: string;
      outputFragmentsExists: boolean;
      game?: 'starfield' | 'fallout' | 'skyrim';
    }> = [];

    for (const project of projects) {
      const namespaceDir = this.normalizeFsPath(project.namespace);
      if (!namespaceDir) {
        continue;
      }
      const namespaceExists = namespaceDir ? fs.existsSync(namespaceDir) : false;
      const namespaceFolder = namespaceDir ? path.basename(namespaceDir) : project.name;

      let manifestEntry: any;
      if (namespaceDir) {
        const settingsDir = path.join(namespaceDir, '.vscode');
        const manifestPath = path.join(settingsDir, 'papyrus-projects.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const raw = fs.readFileSync(manifestPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const found = parsed.find((entry: any) => {
                if (!entry || typeof entry !== 'object') {
                  return false;
                }
                const code = typeof entry.code === 'string' ? entry.code.trim().toLowerCase() : '';
                return code === project.name.toLowerCase();
              });
              manifestEntry = found;
            }
          } catch (error) {
            console.warn('[Papyrus Tools] Failed to parse papyrus-projects.json for project summary:', error);
          }
        }
      }

      const outputDir = this.normalizeFsPath(manifestEntry?.outputDir);
      const namespaceFragmentsDir = this.normalizeFsPath(manifestEntry?.namespaceFragmentsDir);
      const outputFragmentsDir = this.normalizeFsPath(manifestEntry?.outputFragmentsDir);
      const outputExists = outputDir ? fs.existsSync(outputDir) : false;
      const namespaceFragmentsExists = namespaceFragmentsDir ? fs.existsSync(namespaceFragmentsDir) : false;
      const outputFragmentsExists = outputFragmentsDir ? fs.existsSync(outputFragmentsDir) : false;

      const manifestGame = this.normalizeGameKey(manifestEntry?.game);
      const resolvedGame = manifestGame || (namespaceDir ? this.resolveGameFromNamespace(namespaceDir, gamesRecord) : undefined);

      summaries.push({
        name: project.name,
        namespace: namespaceDir,
        namespaceFolder,
        namespaceExists,
        outputDir,
        outputExists,
        namespaceFragmentsDir,
        namespaceFragmentsExists,
        outputFragmentsDir,
        outputFragmentsExists,
        game: resolvedGame
      });
    }

    return summaries;
  }

  private async postSetupState(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
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
      const gameConfig = this.getGameConfig(key);
      if (gameConfig) {
        const entry = gamesRecord[key];
        const rawScriptPaths: string[] = [];
        if (Array.isArray(entry?.scriptPaths)) {
          rawScriptPaths.push(...entry.scriptPaths);
        }
        const topLevelScript = cfg.get<string>(this.mapGameKeyToConfigPrefix(key).script) || '';
        if (topLevelScript.trim()) {
          rawScriptPaths.push(topLevelScript);
        }
        const scriptPaths = this.sanitizePathArray(rawScriptPaths);

        const compilerFromGames = typeof entry?.compiler?.path === 'string' ? entry.compiler.path.trim() : '';
        const compilerTopLevel = (cfg.get<string>(this.mapGameKeyToConfigPrefix(key).compiler) || '').trim();
        const compilerPath = compilerFromGames || compilerTopLevel;

        const outputFragmentsDir = typeof entry?.outputFragmentsDir === 'string' ? entry.outputFragmentsDir.trim() : '';

        payload[key] = {
          scriptPaths,
          compilerPath,
          namespaceDir: gameConfig.namespaceDir,
          namespaceFragmentsDir: gameConfig.namespaceFragmentsDir,
          outputDir: gameConfig.outputDir,
          outputFragmentsDir,
          rootPath: gameConfig.rootPath
        };
      }
    }

    const setupWizardCompleted = cfg.get<boolean>('SetupWizard') === true;
    const projectsSetting = cfg.get<unknown>('Projects');
    const projects = this.sanitizeProjectSettings(projectsSetting);
    const detailedProjects = this.collectProjectSummaries(projects, gamesRecord);

    const defaultGameSetting = cfg.get<string>('defaultGame');
    const defaultGameKey = this.normalizeGameKey(defaultGameSetting);
    let activeProjectPayload: {
      name: string;
      namespaceDir: string;
      outputDir: string;
      namespaceFragmentsDir: string;
      outputFragmentsDir: string;
      game?: 'starfield' | 'fallout' | 'skyrim';
    } | undefined;

    if (defaultGameKey) {
      const activeEntry = gamesRecord[defaultGameKey];
      const namespaceDirValue = this.normalizeFsPath(activeEntry?.namespaceDir);
      if (namespaceDirValue) {
        const outputDirValue = this.normalizeFsPath(activeEntry?.outputDir);
        const namespaceFragmentsDirValue = this.normalizeFsPath(activeEntry?.namespaceFragmentsDir);
        const outputFragmentsDirValue = this.normalizeFsPath(activeEntry?.outputFragmentsDir);
        const namespaceLookup = namespaceDirValue.toLowerCase();
        const matchingProject = detailedProjects.find(project => project.namespace.toLowerCase() === namespaceLookup);
        const fallbackName = matchingProject?.namespaceFolder || path.basename(namespaceDirValue);
        activeProjectPayload = {
          name: matchingProject?.name || fallbackName,
          namespaceDir: namespaceDirValue,
          outputDir: outputDirValue,
          namespaceFragmentsDir: namespaceFragmentsDirValue,
          outputFragmentsDir: outputFragmentsDirValue,
          game: defaultGameKey
        };
      }
    }

    this.panel.webview.postMessage({
      type: 'papyrusTools.setupState',
      payload: {
        games: payload,
        setupWizardCompleted,
        projects: detailedProjects,
        activeProject: activeProjectPayload
      }
    });
  }

  private async handleGameProfileChanged(payload: { game: string }): Promise<void> {
    const game = payload.game as 'skyrim' | 'fallout' | 'starfield';
    const gameConfig = this.getGameConfig(game);

    if (gameConfig) {
      this.postMessage({
        type: 'papyrusTools.folderPaths',
        payload: {
          [game]: {
            namespaceDir: gameConfig.namespaceDir,
            outputDir: gameConfig.outputDir,
            namespaceFragmentsDir: gameConfig.namespaceFragmentsDir,
            rootPath: gameConfig.rootPath
          }
        }
      });
    }
  }

  private getGameConfig(game: 'skyrim' | 'fallout' | 'starfield'): {
    namespaceDir: string;
    outputDir: string;
    namespaceFragmentsDir: string;
    outputFragmentsDir: string;
    rootPath: string;
  } | undefined {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const gamesRaw = cfg.get<unknown>('games');
    const gamesRecord = (gamesRaw && typeof gamesRaw === 'object' && !Array.isArray(gamesRaw)) ? gamesRaw as Record<string, any> : {};

    const entry = gamesRecord[game];
    const prefixes = this.mapGameKeyToConfigPrefix(game);

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

    const namespaceDirFromConfig = cfg.get<string>(prefixes.namespace) || '';
    const namespaceDirFromGames = typeof entry?.namespaceDir === 'string' ? entry.namespaceDir.trim() : '';
    const namespaceDir = namespaceDirFromConfig || namespaceDirFromGames;

    const namespaceFragmentsDir = typeof entry?.namespaceFragmentsDir === 'string' ? entry.namespaceFragmentsDir.trim() : '';

    const outputDirFromConfig = cfg.get<string>(prefixes.output) || '';
    const outputDirFromGames = typeof entry?.outputDir === 'string' ? entry.outputDir.trim() : '';
    const outputDir = outputDirFromConfig || outputDirFromGames;

    const outputFragmentsDir = typeof entry?.outputFragmentsDir === 'string' ? entry.outputFragmentsDir.trim() : '';
    const rootPath = this.deriveGameRoot(scriptPaths, compilerPath, game);

    return {
      namespaceDir,
      outputDir,
      namespaceFragmentsDir,
      outputFragmentsDir,
      rootPath
    };
  }

  private async handleSaveWizardSettings(payload: unknown): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const target = vscode.ConfigurationTarget.Global;

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
      this.panel.webview.postMessage({ type: 'papyrusTools.saveWizardSettingsResult', status: 'error', message: 'Invalid payload received.' });
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

        if (namespaceDir) {
          existing.namespaceDir = namespaceDir;
        } else {
          delete existing.namespaceDir;
        }

        if (namespaceFragmentsDir) {
          existing.namespaceFragmentsDir = namespaceFragmentsDir;
        } else {
          delete existing.namespaceFragmentsDir;
        }

        if (outputDir) {
          existing.outputDir = outputDir;
        } else {
          delete existing.outputDir;
        }

        if (outputFragmentsDir) {
          existing.outputFragmentsDir = outputFragmentsDir;
        } else {
          delete existing.outputFragmentsDir;
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
        await cfg.update(prefixes.output, outputDir, target);
      }

      await cfg.update('games', Object.keys(currentGames).length ? currentGames : undefined, target);
      await cfg.update('SetupWizard', true, target);

      for (const dir of ensurePaths) {
        if (!dir) {
          continue;
        }
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
          console.warn('[Papyrus Tools] Failed to ensure directory from wizard:', dir, error);
        }
      }

      this.panel.webview.postMessage({
        type: 'papyrusTools.saveWizardSettingsResult',
        status: 'success'
      });
      await this.postSetupState();
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrusTools.saveWizardSettingsResult',
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

      const response: { type: 'papyrusTools.pathCheckResult'; requestId?: string; namespaceExists?: boolean; outputExists?: boolean } = {
        type: 'papyrusTools.pathCheckResult',
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
      console.error('[Papyrus Tools] Failed to evaluate path existence from Control Center:', error);
    }
  }

  private async handleWorkspaceProjectsRequest(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { namespace?: string; game?: string } : undefined;
      const namespacePath = typeof request?.namespace === 'string' ? request.namespace.trim() : '';
      if (!namespacePath) {
        this.panel.webview.postMessage({
          type: 'papyrusTools.workspaceProjects',
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
          console.warn('[Papyrus Tools] Failed to read papyrus-projects.json:', error);
        }
      }

      this.panel.webview.postMessage({
        type: 'papyrusTools.workspaceProjects',
        projects
      });
    } catch (error) {
      console.error('[Papyrus Tools] Failed to collect workspace projects:', error);
      this.panel.webview.postMessage({
        type: 'papyrusTools.workspaceProjects',
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
        projectName?: string;
        namespaceDir?: string;
        outputDir?: string;
        namespaceFragmentsDir?: string;
        outputFragmentsDir?: string;
        ensure?: string[];
      } : undefined;

      const game = typeof request?.game === 'string' ? request.game.trim() : '';
  const requestedProjectName = typeof request?.projectName === 'string' ? request.projectName.trim() : '';
      const legacyCodeName = typeof request?.code === 'string' ? request.code.trim() : '';
      const projectName = requestedProjectName || legacyCodeName;
      const namespaceDir = typeof request?.namespaceDir === 'string' ? request.namespaceDir.trim() : '';
      const outputDir = typeof request?.outputDir === 'string' ? request.outputDir.trim() : '';
      const namespaceFragmentsDir = typeof request?.namespaceFragmentsDir === 'string' ? request.namespaceFragmentsDir.trim() : '';
      const outputFragmentsDir = typeof request?.outputFragmentsDir === 'string' ? request.outputFragmentsDir.trim() : '';
      const ensure = Array.isArray(request?.ensure) ? request.ensure.filter((value): value is string => typeof value === 'string' && value.trim().length > 0) : [];

      if (!game || !projectName || !namespaceDir || !outputDir) {
        this.panel.webview.postMessage({
          type: 'papyrusTools.saveWorkspaceProjectResult',
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
          console.warn('[Papyrus Tools] Failed to parse existing papyrus-projects.json:', error);
        }
      }

      const nextProjects = projects.filter(project => project.code.toLowerCase() !== projectName.toLowerCase());
      nextProjects.push({
        code: projectName,
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
          console.warn('[Papyrus Tools] Failed to ensure workspace project directory:', target, error);
        }
      }

        const cfg = vscode.workspace.getConfiguration('papyrusTools');
        const targetScope = vscode.ConfigurationTarget.Global;
        const existingProjects = this.sanitizeProjectSettings(cfg.get<unknown>('Projects'));
        const updatedProjects = this.removeProjectsByNameOrNamespace(existingProjects, projectName, namespaceDir);
        updatedProjects.push({ name: projectName, namespace: namespaceDir, active: false });
        await cfg.update('Projects', updatedProjects, targetScope);

      this.panel.webview.postMessage({
        type: 'papyrusTools.saveWorkspaceProjectResult',
        status: 'success'
      });
      await this.postSetupState();
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrusTools.saveWorkspaceProjectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus workspace project failed to save: ${message}`);
    }
  }

  private async handleWorkspaceProjectLoad(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as {
        name?: string;
        game?: string;
        namespaceDir?: string;
        outputDir?: string;
        namespaceFragmentsDir?: string;
        outputFragmentsDir?: string;
      } : undefined;

      const projectName = typeof request?.name === 'string' ? request.name.trim() : '';
      const gameKey = this.normalizeGameKey(request?.game);
      const namespaceDir = this.normalizeFsPath(request?.namespaceDir);
      const outputDir = this.normalizeFsPath(request?.outputDir);
      const namespaceFragmentsDir = this.normalizeFsPath(request?.namespaceFragmentsDir);
      const outputFragmentsDir = this.normalizeFsPath(request?.outputFragmentsDir);

      if (!projectName || !gameKey || !namespaceDir || !outputDir) {
        this.panel.webview.postMessage({
          type: 'papyrusTools.loadWorkspaceProjectResult',
          status: 'error',
          message: 'Missing required details to load the project.'
        });
        return;
      }

      const cfg = vscode.workspace.getConfiguration('papyrusTools');
      const target = vscode.ConfigurationTarget.Global;

      // Update the Projects setting to manage active state
      const existingProjects = this.sanitizeProjectSettings(cfg.get<unknown>('Projects'));
      let updatedProjects = this.removeProjectsByNameOrNamespace(existingProjects, projectName, namespaceDir);
      updatedProjects = updatedProjects.map(project => ({
        ...project,
        active: false // Set all existing projects to inactive
      }));

      updatedProjects.push({
        name: projectName,
        namespace: namespaceDir,
        active: true
      });

      await cfg.update('Projects', updatedProjects, target);

      const gamesRaw = cfg.get<unknown>('games');
      const currentGames = (gamesRaw && typeof gamesRaw === 'object' && !Array.isArray(gamesRaw)) ? { ...(gamesRaw as Record<string, any>) } : {};
      const existing = currentGames[gameKey] && typeof currentGames[gameKey] === 'object' && !Array.isArray(currentGames[gameKey])
        ? { ...(currentGames[gameKey] as Record<string, any>) }
        : {};

      existing.namespaceDir = namespaceDir;
      existing.outputDir = outputDir;
      if (namespaceFragmentsDir) {
        existing.namespaceFragmentsDir = namespaceFragmentsDir;
      } else {
        delete existing.namespaceFragmentsDir;
      }
      if (outputFragmentsDir) {
        existing.outputFragmentsDir = outputFragmentsDir;
      } else {
        delete existing.outputFragmentsDir;
      }

      currentGames[gameKey] = existing;

      if (Object.keys(currentGames).length > 0) {
        await cfg.update('games', currentGames, target);
      } else {
        await cfg.update('games', undefined, target);
      }

      await cfg.update('defaultGame', this.getDefaultGameName(gameKey), target);

      this.panel.webview.postMessage({
        type: 'papyrusTools.loadWorkspaceProjectResult',
        status: 'success',
        project: {
          name: projectName,
          game: gameKey
        }
      });
      await this.postSetupState();
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrusTools.loadWorkspaceProjectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus failed to load workspace project: ${message}`);
    }
  }

  private async handleWorkspaceProjectUpdate(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as {
        originalName?: string;
        originalNamespaceDir?: string;
        name?: string;
        game?: string;
        namespaceDir?: string;
        outputDir?: string;
        namespaceFragmentsDir?: string;
        outputFragmentsDir?: string;
      } : undefined;

      const originalName = typeof request?.originalName === 'string' ? request.originalName.trim() : '';
      const originalNamespaceDir = this.normalizeFsPath(request?.originalNamespaceDir);
      const projectName = typeof request?.name === 'string' ? request.name.trim() : '';
      const gameKey = this.normalizeGameKey(request?.game);
      const namespaceDir = this.normalizeFsPath(request?.namespaceDir);
      const outputDir = this.normalizeFsPath(request?.outputDir);
      const namespaceFragmentsDir = this.normalizeFsPath(request?.namespaceFragmentsDir);
      const outputFragmentsDir = this.normalizeFsPath(request?.outputFragmentsDir);

      if (!projectName || !namespaceDir || !outputDir || !gameKey) {
        this.panel.webview.postMessage({
          type: 'papyrusTools.updateWorkspaceProjectResult',
          status: 'error',
          message: 'Missing required fields to update the project.'
        });
        return;
      }

      const removeCode = (manifestPath: string, code: string) => {
        const targetCode = code ? code.toLowerCase() : '';
        if (!code || !manifestPath || !fs.existsSync(manifestPath)) {
          return [] as any[];
        }
        try {
          const raw = fs.readFileSync(manifestPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) {
            return [] as any[];
          }
          const filtered = parsed.filter((entry: any) => {
            if (!entry || typeof entry !== 'object') {
              return true;
            }
            const codeValue = typeof entry.code === 'string' ? entry.code.trim().toLowerCase() : '';
            if (!codeValue) {
              return true;
            }
            return codeValue !== targetCode;
          });
          return filtered;
        } catch (error) {
          console.warn('[Papyrus Tools] Failed to update project manifest while removing entry:', error);
          return [] as any[];
        }
      };

      if (originalNamespaceDir) {
        const oldManifest = path.join(originalNamespaceDir, '.vscode', 'papyrus-projects.json');
        if (fs.existsSync(oldManifest)) {
          const filtered = removeCode(oldManifest, originalName || projectName);
          try {
            fs.writeFileSync(oldManifest, JSON.stringify(filtered, null, 2), 'utf8');
          } catch (error) {
            console.warn('[Papyrus Tools] Failed to write updated project manifest for old namespace:', error);
          }
        }
      }

      const newSettingsDir = path.join(namespaceDir, '.vscode');
      if (!fs.existsSync(newSettingsDir)) {
        fs.mkdirSync(newSettingsDir, { recursive: true });
      }
      const newManifest = path.join(newSettingsDir, 'papyrus-projects.json');
      let manifestEntries: any[] = [];
      if (fs.existsSync(newManifest)) {
        try {
          const rawManifest = fs.readFileSync(newManifest, 'utf8');
          const parsed = JSON.parse(rawManifest);
          if (Array.isArray(parsed)) {
            manifestEntries = parsed;
          }
        } catch (error) {
          console.warn('[Papyrus Tools] Failed to parse target manifest while updating project:', error);
        }
      }

      const targetCode = projectName.toLowerCase();
      const filtered = manifestEntries.filter(entry => {
        if (!entry || typeof entry !== 'object') {
          return true;
        }
        const codeValue = typeof entry.code === 'string' ? entry.code.trim().toLowerCase() : '';
        if (!codeValue) {
          return true;
        }
        return codeValue !== targetCode;
      });

      filtered.push({
        code: projectName,
        game: gameKey,
        namespaceDir,
        outputDir,
        namespaceFragmentsDir: namespaceFragmentsDir || undefined,
        outputFragmentsDir: outputFragmentsDir || undefined
      });

      try {
        fs.writeFileSync(newManifest, JSON.stringify(filtered, null, 2), 'utf8');
      } catch (error) {
        console.warn('[Papyrus Tools] Failed to persist updated project manifest:', error);
      }

      const cfg = vscode.workspace.getConfiguration('papyrusTools');
      const target = vscode.ConfigurationTarget.Global;
      const existingProjects = this.sanitizeProjectSettings(cfg.get<unknown>('Projects'));
      let updatedProjects = existingProjects;
      if (originalName) {
        const normalizedOriginalName = originalName.toLowerCase();
        updatedProjects = updatedProjects.filter(entry => entry.name.toLowerCase() !== normalizedOriginalName);
      }
      updatedProjects = this.removeProjectsByNameOrNamespace(updatedProjects, projectName, namespaceDir);
      updatedProjects.push({ name: projectName, namespace: namespaceDir, active: false });
      await cfg.update('Projects', updatedProjects, target);

      this.panel.webview.postMessage({
        type: 'papyrusTools.updateWorkspaceProjectResult',
        status: 'success'
      });
      await this.postSetupState();
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrusTools.updateWorkspaceProjectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus failed to update workspace project: ${message}`);
    }
  }

  private async handleWorkspaceProjectDelete(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as {
        name?: string;
        namespaceDir?: string;
      } : undefined;

      const projectName = typeof request?.name === 'string' ? request.name.trim() : '';
      const namespaceDir = this.normalizeFsPath(request?.namespaceDir);

      if (!projectName) {
        this.panel.webview.postMessage({
          type: 'papyrusTools.deleteWorkspaceProjectResult',
          status: 'error',
          message: 'Missing project name to delete.'
        });
        return;
      }

      if (namespaceDir) {
        const manifestPath = path.join(namespaceDir, '.vscode', 'papyrus-projects.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const raw = fs.readFileSync(manifestPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const targetCode = projectName.toLowerCase();
              const filtered = parsed.filter((entry: any) => {
                if (!entry || typeof entry !== 'object') {
                  return true;
                }
                const codeValue = typeof entry.code === 'string' ? entry.code.trim().toLowerCase() : '';
                if (!codeValue) {
                  return true;
                }
                return codeValue !== targetCode;
              });
              fs.writeFileSync(manifestPath, JSON.stringify(filtered, null, 2), 'utf8');
            }
          } catch (error) {
            console.warn('[Papyrus Tools] Failed to update project manifest while deleting entry:', error);
          }
        }
      }

      const cfg = vscode.workspace.getConfiguration('papyrusTools');
      const target = vscode.ConfigurationTarget.Global;
      const existingProjects = this.sanitizeProjectSettings(cfg.get<unknown>('Projects'));
      const updatedProjects = this.removeProjectsByNameOrNamespace(existingProjects, projectName, namespaceDir);
      await cfg.update('Projects', updatedProjects, target);

      this.panel.webview.postMessage({
        type: 'papyrusTools.deleteWorkspaceProjectResult',
        status: 'success'
      });
      await this.postSetupState();
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'papyrusTools.deleteWorkspaceProjectResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus failed to delete workspace project: ${message}`);
    }
  }

  private async handleRevealPath(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { target?: string } : undefined;
      const target = this.normalizeFsPath(request?.target);
      if (!target) {
        return;
      }
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(target));
    } catch (error) {
      console.error('[Papyrus Tools] Failed to reveal path from Control Center:', error);
    }
  }

  private async handleSetSetupWizardCompleted(payload: unknown): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const request = typeof payload === 'object' && payload !== null ? payload as { completed?: unknown } : undefined;
    const completed = typeof request?.completed === 'boolean' ? request.completed : false;
    try {
      await cfg.update('SetupWizard', completed, target);
      await this.postSetupState();
    } catch (error) {
      console.error('[Papyrus Tools] Failed to update Setup Wizard completion state:', error);
    }
  }

  private async handleScanScriptsRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.scanScriptsForDiagnostics');
      // The scan command doesn't return detailed results, so we'll send a generic success
      this.panel.webview.postMessage({
        type: 'papyrusTools.scanResult',
        status: 'success',
        message: 'Script scan completed'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during script scan';
      console.error('[Papyrus Tools] Script scan request failed:', error);
      this.panel.webview.postMessage({
        type: 'papyrusTools.scanResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus script scan failed: ${message}`);
    }
  }

  private async handleRebuildIndexRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.rebuildIndex');
      this.panel.webview.postMessage({
        type: 'papyrusTools.rebuildResult',
        status: 'success',
        message: 'Index rebuilt successfully'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during index rebuild';
      console.error('[Papyrus Tools] Index rebuild request failed:', error);
      this.panel.webview.postMessage({
        type: 'papyrusTools.rebuildResult',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Papyrus index rebuild failed: ${message}`);
    }
  }

  private async handleExportProfileRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.exportCurrentProfile');
      // The export command handles its own success messaging
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during profile export';
      console.error('[Papyrus Tools] Profile export request failed:', error);
      vscode.window.showErrorMessage(`Papyrus profile export failed: ${message}`);
    }
  }

  private async handleImportProfileRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.importProfile');
      // The import command handles its own success messaging
      await this.postSetupState(); // Refresh the setup state after import
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during profile import';
      console.error('[Papyrus Tools] Profile import request failed:', error);
      vscode.window.showErrorMessage(`Papyrus profile import failed: ${message}`);
    }
  }

  private async handleClearSettingsRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.clearStoredSettings');
      await this.postSetupState(); // Refresh the setup state after clearing
      vscode.window.showInformationMessage('Papyrus stored settings cleared successfully');
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during settings clear';
      console.error('[Papyrus Tools] Clear settings request failed:', error);
      vscode.window.showErrorMessage(`Papyrus clear settings failed: ${message}`);
    }
  }

  private async handleCreateDefaultsRequest(): Promise<void> {
    try {
      await vscode.commands.executeCommand('papyrusTools.createDefaultProfiles');
      await this.postSetupState(); // Refresh the setup state after creating defaults
      // The command handles its own success messaging
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error during default profile creation';
      console.error('[Papyrus Tools] Create defaults request failed:', error);
      vscode.window.showErrorMessage(`Papyrus create defaults failed: ${message}`);
    }
  }

  private async handleStartMcpServer(): Promise<void> {
    try {
      await startMcpServer(this.extensionPath);
      // Send status update to webview
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'running'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'start',
        status: 'success'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error starting MCP server';
      console.error('[Papyrus Tools] Start MCP server request failed:', error);
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopped'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'start',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Failed to start MCP server: ${message}`);
    }
  }

  private async handleStopMcpServer(): Promise<void> {
    try {
      // Send stopping status first
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopping'
      });
      await stopMcpServer();
      // Send stopped status after successful stop
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopped'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'stop',
        status: 'success'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error stopping MCP server';
      console.error('[Papyrus Tools] Stop MCP server request failed:', error);
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopped'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'stop',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Failed to stop MCP server: ${message}`);
    }
  }

  private async handleRestartMcpServer(): Promise<void> {
    try {
      // Send stopping status first
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopping'
      });
      await restartMcpServer(this.extensionPath);
      // Send running status after successful restart
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'running'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'restart',
        status: 'success'
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error restarting MCP server';
      console.error('[Papyrus Tools] Restart MCP server request failed:', error);
      this.panel.webview.postMessage({
        command: 'mcpServerStatusUpdate',
        status: 'stopped'
      });
      this.panel.webview.postMessage({
        type: 'papyrusTools.mcpServerControlResult',
        command: 'restart',
        status: 'error',
        message
      });
      vscode.window.showErrorMessage(`Failed to restart MCP server: ${message}`);
    }
  }

  private async handleExecuteCommand(payload: unknown): Promise<void> {
    try {
      const request = typeof payload === 'object' && payload !== null ? payload as { commandId?: string } : undefined;
      const commandId = typeof request?.commandId === 'string' ? request.commandId.trim() : '';

      if (!commandId) {
        console.error('[Papyrus Tools] Execute command request failed: missing commandId');
        return;
      }

      await vscode.commands.executeCommand(commandId);
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error executing command';
      console.error('[Papyrus Tools] Execute command request failed:', error);
      vscode.window.showErrorMessage(`Failed to execute command: ${message}`);
    }
  }
}
