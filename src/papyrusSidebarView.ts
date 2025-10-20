import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class PapyrusMainWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'papyrus-tools-main';
  private _webviewView?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    console.log('Papyrus Tools: resolveWebviewView called for', webviewView.viewType);
    this._webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getSetupStatus': {
            const config = vscode.workspace.getConfiguration('papyrusTools');
            const completed = config.get('SetupWizard', false);
            webviewView.webview.postMessage({
              type: 'papyrusTools.setSetupWizardCompleted',
              payload: { completed }
            });
            break;
          }
          case 'openControlCenter':
            await vscode.commands.executeCommand('papyrusTools.openControlCenter');
            break;
          case 'compileFile':
            await vscode.commands.executeCommand('papyrusTools.compileFile');
            break;
          case 'switchGame':
            await vscode.commands.executeCommand('papyrusTools.switchGame');
            break;
          case 'openQuickStart':
            // Handle quick start guide opening
            break;
          case 'openExamples':
            // Handle examples opening
            break;
        }
      },
      undefined,
      []
    );

    // Listen for theme changes
    const themeChangeDisposable = vscode.window.onDidChangeActiveColorTheme(theme => {
      this.postTheme(theme.kind);
    });

    // Listen for configuration changes
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('papyrusTools.SetupWizard') && this._webviewView) {
        const config = vscode.workspace.getConfiguration('papyrusTools');
        const completed = config.get('SetupWizard', false);
        this._webviewView.webview.postMessage({
          type: 'papyrusTools.setSetupWizardCompleted',
          payload: { completed }
        });
      }
    });

    webviewView.onDidDispose(() => {
      themeChangeDisposable.dispose();
      configChangeDisposable.dispose();
    });
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
    if (!this._webviewView?.webview) {
      return;
    }
    this._webviewView.webview.postMessage({
      type: 'theme',
      theme: this.getThemeMode(kind)
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    console.log('Papyrus Tools: generating HTML for webview');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'mainView.js'));

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    const initialTheme = this.getThemeMode(vscode.window.activeColorTheme.kind);

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Papyrus Tools</title>
      </head>
      <body>
        <div id="root">
          <div style="padding: 20px; color: blue; background: lightgray; font-size: 18px; border: 2px solid red;">
            <h2>LOADING: Webview initialized</h2>
            <p>If you see this, React hasn't mounted yet.</p>
            <p>Check webview developer tools console for errors.</p>
          </div>
        </div>
        <script nonce="${nonce}">
          const vscodeApi = acquireVsCodeApi();
          window.__papyrusInitialState = { theme: '${initialTheme}' };
          window.__papyrusVsCodeApi = vscodeApi;
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}



// File/directory items for project browsing
class PapyrusFileItem extends vscode.TreeItem {
  constructor(public readonly uri: vscode.Uri, public readonly isDirectory: boolean) {
    super(path.basename(uri.fsPath), isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    this.resourceUri = uri;
    this.iconPath = vscode.ThemeIcon.File;
    this.contextValue = isDirectory ? 'papyrusDirectory' : 'papyrusFile';
    this.command = isDirectory ? undefined : {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [uri]
    };
  }
}



class PapyrusDummyItem extends vscode.TreeItem {
  constructor(title: string, description: string, iconId: string) {
    super(title || '', vscode.TreeItemCollapsibleState.None);
    this.description = title ? description : '';
    this.tooltip = title ? title : description;
    this.iconPath = new vscode.ThemeIcon(iconId);
    this.contextValue = 'papyrusDummy';
  }
}

type PapyrusTreeItem = PapyrusFileItem | PapyrusDummyItem;

class PapyrusCommandsProvider implements vscode.TreeDataProvider<PapyrusTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PapyrusTreeItem | undefined | null | void> = new vscode.EventEmitter<PapyrusTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PapyrusTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  protected setupWizardCompleted: boolean = false;

  constructor() {
    this.checkSetupWizardStatus();
  }

  getTreeItem(element: PapyrusTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(_element?: PapyrusTreeItem): vscode.TreeItem[] {
    // Base implementation - should be overridden by subclasses
    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  checkSetupWizardStatus(): void {
    const config = vscode.workspace.getConfiguration('papyrusTools');
    this.setupWizardCompleted = config.get('SetupWizard', false);
  }

  getProjectDirectory(): string | undefined {
    // First check if there's an active project
    const activeProject = this.getActiveProject();
    if (activeProject?.namespaceDir) {
      return activeProject.namespaceDir;
    }

    // Fall back to default game configuration
    const config = vscode.workspace.getConfiguration('papyrusTools');
    const games = config.get('games', {}) as any;
    const defaultGame = config.get('defaultGame', 'Starfield');
    const gameConfig = games[defaultGame];
    if (gameConfig && gameConfig.namespaceDir) {
      return gameConfig.namespaceDir;
    }
    return undefined;
  }

  getOutputDirectory(): string | undefined {
    // First check if there's an active project
    const activeProject = this.getActiveProject();
    if (activeProject?.outputDir) {
      return activeProject.outputDir;
    }

    // Fall back to default game configuration
    const config = vscode.workspace.getConfiguration('papyrusTools');
    const games = config.get('games', {}) as any;
    const defaultGame = config.get('defaultGame', 'Starfield');
    const gameConfig = games[defaultGame];
    if (gameConfig && gameConfig.outputDir) {
      return gameConfig.outputDir;
    }
    return undefined;
  }

  getActiveProject(): { namespaceDir: string; outputDir: string; namespaceFragmentsDir?: string; outputFragmentsDir?: string } | undefined {
    // First check for active project in Projects setting
    const config = vscode.workspace.getConfiguration('papyrusTools');
    const projects = config.get('Projects', []) as Array<{ name: string; namespace: string; active?: boolean }>;
    const activeProject = projects.find(project => project.active === true);
    if (activeProject) {
      // Find the project details from the manifest file
      const settingsDir = path.join(activeProject.namespace, '.vscode');
      const manifestPath = path.join(settingsDir, 'papyrus-projects.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const raw = fs.readFileSync(manifestPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const manifestEntry = parsed.find((entry: any) => {
              if (!entry || typeof entry !== 'object') {
                return false;
              }
              const code = typeof entry.code === 'string' ? entry.code.trim().toLowerCase() : '';
              return code === activeProject.name.toLowerCase();
            });
            if (manifestEntry) {
              return {
                namespaceDir: activeProject.namespace,
                outputDir: manifestEntry.outputDir || '',
                namespaceFragmentsDir: manifestEntry.namespaceFragmentsDir,
                outputFragmentsDir: manifestEntry.outputFragmentsDir
              };
            }
          }
        } catch (error) {
          console.warn('[Papyrus Tools] Failed to parse papyrus-projects.json for active project:', error);
        }
      }
    }

    // Fall back to default game configuration
    const games = config.get('games', {}) as any;
    const defaultGame = config.get('defaultGame', 'Starfield');
    const gameConfig = games[defaultGame];
    if (gameConfig && gameConfig.namespaceDir && gameConfig.outputDir) {
      return {
        namespaceDir: gameConfig.namespaceDir,
        outputDir: gameConfig.outputDir,
        namespaceFragmentsDir: gameConfig.namespaceFragmentsDir,
        outputFragmentsDir: gameConfig.outputFragmentsDir
      };
    }
    return undefined;
  }

  getDirectoryContents(dirPath: string): PapyrusFileItem[] {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.name !== '.' && entry.name !== '..' && entry.name !== '.vscode')
        .map(entry => {
          const fullPath = path.join(dirPath, entry.name);
          const uri = vscode.Uri.file(fullPath);
          return new PapyrusFileItem(uri, entry.isDirectory());
        })
        .sort((a, b) => {
          // Directories first, then files, both alphabetically
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          const aLabel = typeof a.label === 'string' ? a.label : (a.label?.label || '');
          const bLabel = typeof b.label === 'string' ? b.label : (b.label?.label || '');
          return aLabel.localeCompare(bLabel);
        });
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  }
}

class PapyrusProjectProvider extends PapyrusCommandsProvider implements vscode.TreeDragAndDropController<PapyrusTreeItem> {
  dropMimeTypes = ['application/vnd.code.tree.papyrustools'];
  dragMimeTypes = ['application/vnd.code.tree.papyrustools'];

  handleDrag(source: readonly PapyrusTreeItem[], dataTransfer: vscode.DataTransfer, _token: vscode.CancellationToken): void | Thenable<void> {
    dataTransfer.set('application/vnd.code.tree.papyrustools', new vscode.DataTransferItem(source));
  }

  async handleDrop(target: PapyrusTreeItem | undefined, dataTransfer: vscode.DataTransfer, _token: vscode.CancellationToken): Promise<void> {
    const transferItem = dataTransfer.get('application/vnd.code.tree.papyrustools');
    if (!transferItem) {
      return;
    }

    const sourceItems = transferItem.value as readonly PapyrusTreeItem[];
    if (!sourceItems || sourceItems.length === 0) {
      return;
    }

    // Determine target directory
    let targetDir: string;
    if (target instanceof PapyrusFileItem && target.isDirectory) {
      targetDir = target.uri.fsPath;
    } else if (target instanceof PapyrusFileItem && !target.isDirectory) {
      // If dropping on a file, use its parent directory
      targetDir = path.dirname(target.uri.fsPath);
    } else {
      // Dropping on empty space - use the namespace directory (root)
      const activeProject = this.getActiveProject();
      if (!activeProject?.namespaceDir) {
        return;
      }
      targetDir = activeProject.namespaceDir;
    }

    // Process each dragged item
    for (const item of sourceItems) {
      if (!(item instanceof PapyrusFileItem)) {
        continue;
      }

      const sourcePath = item.uri.fsPath;
      const fileName = path.basename(sourcePath);
      const targetPath = path.join(targetDir, fileName);

      try {
        if (sourcePath === targetPath) {
          continue; // Same location, skip
        }

        if (fs.existsSync(targetPath)) {
          const result = await vscode.window.showWarningMessage(
            `File "${fileName}" already exists in the target location. Overwrite?`,
            { modal: true },
            'Overwrite',
            'Skip'
          );
          if (result !== 'Overwrite') {
            continue;
          }
        }

        if (item.isDirectory) {
          // Move directory
          fs.renameSync(sourcePath, targetPath);
        } else {
          // Move file
          fs.renameSync(sourcePath, targetPath);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to move "${fileName}": ${error}`);
      }
    }

    this.refresh();
  }
  getChildren(element?: PapyrusTreeItem): vscode.TreeItem[] {
    if (!element) {
      // Project folder view - show the namespace directory as root
      const activeProject = this.getActiveProject();
      if (activeProject?.namespaceDir) {
        const uri = vscode.Uri.file(activeProject.namespaceDir);
        return [new PapyrusFileItem(uri, true)];
      } else {
        return [new PapyrusDummyItem('No project directory configured', 'Use Control Center to set up a project', 'warning')];
      }
    }

    // Handle directory expansion
    if (element instanceof PapyrusFileItem && element.isDirectory) {
      return this.getDirectoryContents(element.uri.fsPath);
    }

    return [];
  }
}

class PapyrusOutputProvider extends PapyrusCommandsProvider {
  getChildren(element?: PapyrusTreeItem): vscode.TreeItem[] {
    if (!element) {
      // Output folder view - show output directory contents
      const outputDir = this.getOutputDirectory();
      if (outputDir) {
        return this.getDirectoryContents(outputDir);
      } else {
        return [new PapyrusDummyItem('No output directory configured', 'Use Control Center to configure output path', 'warning')];
      }
    }

    // Handle directory expansion
    if (element instanceof PapyrusFileItem && element.isDirectory) {
      return this.getDirectoryContents(element.uri.fsPath);
    }

    return [];
  }
}

export const registerPapyrusCommandsView = (context: vscode.ExtensionContext) => {
  const mainProvider = new PapyrusMainWebviewProvider(context.extensionUri);
  const projectProvider = new PapyrusProjectProvider();
  const outputProvider = new PapyrusOutputProvider();

  // Register webview provider for main view
  const mainRegistration = vscode.window.registerWebviewViewProvider(PapyrusMainWebviewProvider.viewType, mainProvider);

  // Register tree data providers for project and output views
  const projectRegistration = vscode.window.registerTreeDataProvider('papyrus-tools-project-folder', projectProvider);
  const outputRegistration = vscode.window.registerTreeDataProvider('papyrus-tools-output-folder', outputProvider);

  // Create tree views for project and output views
  const projectView = vscode.window.createTreeView('papyrus-tools-project-folder', {
    treeDataProvider: projectProvider,
    showCollapseAll: true,
    dragAndDropController: projectProvider
  });

  const outputView = vscode.window.createTreeView('papyrus-tools-output-folder', {
    treeDataProvider: outputProvider,
    showCollapseAll: true
  });

  // Register view actions
  const refreshProjectCmd = vscode.commands.registerCommand('papyrusTools.refreshProjectDirectory', () => {
    projectProvider.refresh();
  });

  const refreshOutputCmd = vscode.commands.registerCommand('papyrusTools.refreshOutputDirectory', () => {
    outputProvider.refresh();
  });

  const addFileCmd = vscode.commands.registerCommand('papyrusTools.addFileToProject', async (item?: PapyrusFileItem) => {
    const activeProject = projectProvider.getActiveProject();
    if (!activeProject?.namespaceDir) {
      const result = await vscode.window.showErrorMessage(
        'No project directory configured. Would you like to open the Control Center to set up a project?',
        'Open Control Center',
        'Cancel'
      );
      if (result === 'Open Control Center') {
        await vscode.commands.executeCommand('papyrusTools.openControlCenter');
      }
      return;
    }

    // Determine target directory based on context
    let targetDir: string;
    let isInFragments = false;

    if (item && item.isDirectory) {
      // Right-clicked on a directory
      targetDir = item.uri.fsPath;
      // Check if the target directory path contains "Fragments" folder
      const pathParts = targetDir.split(path.sep);
      isInFragments = pathParts.includes('Fragments');
    } else {
      // Clicked on main view or empty space - use project root, not fragments
      targetDir = activeProject.namespaceDir;
      isInFragments = false;
    }

    const fileName = await vscode.window.showInputBox({
      prompt: 'Enter the name of the new Papyrus file',
      placeHolder: 'MyScript'
    });

    if (!fileName) return;

    // Automatically append .psc extension if not present
    const finalFileName = fileName.toLowerCase().endsWith('.psc') ? fileName : `${fileName}.psc`;

    const filePath = path.join(targetDir, finalFileName);
    try {
      if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('File already exists');
        return;
      }

      // Create appropriate template based on location
      const scriptName = path.basename(finalFileName, '.psc');
      let template: string;

      if (isInFragments) {
        // Fragment script template
        template = `ScriptName ${scriptName} Extends Quest

; Fragment script for quest functionality
; This script is attached to a quest and contains fragment functions

Function Fragment_0()
    ; Called from quest stage 0
EndFunction

Function Fragment_1()
    ; Called from quest stage 1
EndFunction

Function Fragment_2()
    ; Called from quest stage 2
EndFunction
`;
      } else {
        // Regular script template
        template = `ScriptName ${scriptName} Extends ObjectReference

; Add your script logic here

Function OnInit()
    ; Called when the script initializes
EndFunction
`;
      }

      fs.writeFileSync(filePath, template, 'utf8');
      projectProvider.refresh();

      // Open the new file
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create file: ${error}`);
    }
  });

  const addFolderCmd = vscode.commands.registerCommand('papyrusTools.addFolderToProject', async (item?: PapyrusFileItem) => {
    const activeProject = projectProvider.getActiveProject();
    if (!activeProject?.namespaceDir) {
      const result = await vscode.window.showErrorMessage(
        'No project directory configured. Would you like to open the Control Center to set up a project?',
        'Open Control Center',
        'Cancel'
      );
      if (result === 'Open Control Center') {
        await vscode.commands.executeCommand('papyrusTools.openControlCenter');
      }
      return;
    }

    // If an item was passed (from right-click), use its directory, otherwise use project root
    const targetDir = item && item.isDirectory ? item.uri.fsPath : activeProject.namespaceDir;

    const folderName = await vscode.window.showInputBox({
      prompt: 'Enter the name of the new folder',
      placeHolder: 'MyFolder'
    });

    if (!folderName) return;

    const folderPath = path.join(targetDir, folderName);
    try {
      if (fs.existsSync(folderPath)) {
        vscode.window.showErrorMessage('Folder already exists');
        return;
      }

      fs.mkdirSync(folderPath, { recursive: true });
      projectProvider.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
    }
  });

  const deleteFileCmd = vscode.commands.registerCommand('papyrusTools.deleteFileFromProject', async (item: PapyrusFileItem) => {
    if (!item || item.isDirectory) {
      return;
    }

    const fileName = path.basename(item.uri.fsPath);
    const result = await vscode.window.showWarningMessage(
      `Are you sure you want to delete "${fileName}"?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (result !== 'Delete') {
      return;
    }

    try {
      fs.unlinkSync(item.uri.fsPath);
      projectProvider.refresh();
      vscode.window.showInformationMessage(`File "${fileName}" deleted successfully`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
    }
  });

  const deleteFolderCmd = vscode.commands.registerCommand('papyrusTools.deleteFolderFromProject', async (item: PapyrusFileItem) => {
    if (!item || !item.isDirectory) {
      return;
    }

    const folderName = path.basename(item.uri.fsPath);
    const result = await vscode.window.showWarningMessage(
      `Are you sure you want to delete the folder "${folderName}" and all its contents?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (result !== 'Delete') {
      return;
    }

    try {
      fs.rmSync(item.uri.fsPath, { recursive: true, force: true });
      projectProvider.refresh();
      vscode.window.showInformationMessage(`Folder "${folderName}" deleted successfully`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete folder: ${error}`);
    }
  });

  // Listen for configuration changes to update the views
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('papyrusTools.games') || e.affectsConfiguration('papyrusTools.Projects') || e.affectsConfiguration('papyrusTools.defaultGame')) {
      projectProvider.refresh();
      outputProvider.refresh();
    }
  });

  context.subscriptions.push(
    mainRegistration,
    projectRegistration,
    outputRegistration,
    projectView,
    outputView,
    refreshProjectCmd,
    refreshOutputCmd,
    addFileCmd,
    addFolderCmd,
    deleteFileCmd,
    deleteFolderCmd,
    configChangeDisposable
  );

  return { mainProvider, projectProvider, outputProvider };
};
