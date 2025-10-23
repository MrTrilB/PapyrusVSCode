import * as vscode from 'vscode';
import { GameProfile, SUPPORTED_GAMES } from './gameTypes';

const BASE_KEYWORDS = [
  'ScriptName', 'Extends', 'Import', 'Property', 'Function', 'EndFunction', 'Event', 'EndEvent',
  'If', 'ElseIf', 'Else', 'EndIf', 'While', 'EndWhile', 'Return', 'State', 'EndState', 'Goto', 'Auto',
  'Global', 'Native', 'Hidden', 'Conditional', 'ReadOnly', 'Const'
];

const PAPYRUS_TYPES = [
  'Bool', 'Int', 'Float', 'String', 'Var', 'Form', 'ObjectReference', 'Actor', 'Alias', 'Quest'
];

const DESKTOP_ONLY_COMMANDS: Array<{ id: string; title: string }> = [
  { id: 'papyrusTools.switchGame', title: 'Papyrus: Switch Game Profile' },
  { id: 'papyrusTools.switchProject', title: 'Papyrus: Switch Project' },
  { id: 'papyrusTools.openControlCenter', title: 'Papyrus: Open Control Center' },
  { id: 'papyrusTools.configureScriptFolders', title: 'Papyrus: Configure Script Folders' },
  { id: 'papyrusTools.rebuildIndex', title: 'Papyrus: Rebuild Script Index' },
  { id: 'papyrusTools.addScriptFolder', title: 'Papyrus: Add Script Folder' },
  { id: 'papyrusTools.setupWorkspaceProfile', title: 'Papyrus: Setup Workspace Profile' },
  { id: 'papyrusTools.autoDetectGamePaths', title: 'Papyrus: Auto-Detect Game Paths' },
  { id: 'papyrusTools.scanScriptsForDiagnostics', title: 'Papyrus: Scan Scripts for Diagnostics' },
  { id: 'papyrusTools.openCurrentGameSettings', title: 'Papyrus: Open Current Game Settings' },
  { id: 'papyrusTools.openWorkspaceSettingsJson', title: 'Papyrus: Open Workspace Settings (JSON)' },
  { id: 'papyrusTools.exportCurrentProfile', title: 'Papyrus: Export Current Game Profile' },
  { id: 'papyrusTools.importProfile', title: 'Papyrus: Import Game Profile' },
  { id: 'papyrusTools.createDefaultProfiles', title: 'Papyrus: Create Default Game Profiles' },
  { id: 'papyrusTools.clearStoredSettings', title: 'Papyrus: Clear Stored Settings' },
  { id: 'papyrusTools.refreshProjectDirectory', title: 'Refresh Project Directory' },
  { id: 'papyrusTools.refreshOutputDirectory', title: 'Refresh Output Directory' },
  { id: 'papyrusTools.addFileToProject', title: 'Add File' },
  { id: 'papyrusTools.addFolderToProject', title: 'Add Folder' },
  { id: 'papyrusTools.deleteFileFromProject', title: 'Delete File' },
  { id: 'papyrusTools.deleteFolderFromProject', title: 'Delete Folder' }
];

function getKeywordsForGame(game: GameProfile): string[] {
  const extras: string[] = [];
  if (game === 'Fallout' || game === 'Starfield') {
    extras.push('Struct', 'EndStruct');
  }
  return [...BASE_KEYWORDS, ...extras];
}

function getGame(): GameProfile {
  const cfg = vscode.workspace.getConfiguration('papyrusTools');
  const candidate = cfg.get<string>('defaultGame', 'Starfield');
  return SUPPORTED_GAMES.includes(candidate as GameProfile) ? (candidate as GameProfile) : 'Starfield';
}

function showDesktopOnlyMessage(commandTitle?: string) {
  const message = commandTitle
    ? `${commandTitle} is only available in the desktop version of VS Code.`
    : 'This Papyrus Tools feature is only available in the desktop version of VS Code.';
  void vscode.window.showInformationMessage(message, 'Learn more').then(selection => {
    if (selection === 'Learn more') {
      void vscode.env.openExternal(vscode.Uri.parse('https://aka.ms/vscode-web')); 
    }
  });
}

class DesktopOnlyTreeItem extends vscode.TreeItem {
  constructor(message: string) {
    super(message, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('globe');
    this.tooltip = 'Open this workspace in the desktop version of VS Code to unlock full Papyrus Tools features.';
  }
}

class DesktopOnlyTreeProvider implements vscode.TreeDataProvider<DesktopOnlyTreeItem> {
  readonly onDidChangeTreeData: vscode.Event<DesktopOnlyTreeItem | undefined | void> = new vscode.EventEmitter<DesktopOnlyTreeItem | undefined | void>().event;
  getTreeItem(element: DesktopOnlyTreeItem): vscode.TreeItem {
    return element;
  }
  getChildren(_element?: DesktopOnlyTreeItem): vscode.ProviderResult<DesktopOnlyTreeItem[]> {
    if (_element) {
      return [];
    }
    return [new DesktopOnlyTreeItem('Available in the desktop extension')];
  }
}

class PapyrusMainWebviewPlaceholder implements vscode.WebviewViewProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: false,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'Assets')]
    };

    webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Papyrus Tools</title>
      <style>
        body { font-family: var(--vscode-font-family); margin: 0; padding: 24px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
        h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
        p { line-height: 1.5; }
        a { color: var(--vscode-textLink-foreground); }
      </style>
    </head>
    <body>
      <h1>Papyrus Tools (web)</h1>
      <p>The Control Center and project explorers are only available in the desktop version of Visual Studio Code.</p>
      <p>You can still access Papyrus syntax highlighting, snippets, completions, and hovers while browsing on <code>vscode.dev</code>.</p>
      <p><a href="https://marketplace.visualstudio.com/items?itemName=MrTrilB.papyrus-tools" target="_blank" rel="noreferrer">Open marketplace listing</a></p>
    </body>
    </html>`;
  }
}

function registerLanguageFeatures(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: 'papyrus', scheme: '*' };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, {
      provideCompletionItems() {
        const items: vscode.CompletionItem[] = [];
        const keywords = getKeywordsForGame(getGame());
        for (const kw of keywords) {
          items.push(new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword));
        }
        for (const t of PAPYRUS_TYPES) {
          items.push(new vscode.CompletionItem(t, vscode.CompletionItemKind.TypeParameter));
        }
        return items;
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        if (!range) return undefined;
        const word = document.getText(range);
        const lower = word.toLowerCase();
        if (getKeywordsForGame(getGame()).some(k => k.toLowerCase() === lower)) {
          return new vscode.Hover(new vscode.MarkdownString(`**Keyword** \`${word}\``), range);
        }
        if (PAPYRUS_TYPES.some(t => t.toLowerCase() === lower)) {
          return new vscode.Hover(new vscode.MarkdownString(`**Type** \`${word}\``), range);
        }
        return undefined;
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, {
      provideDocumentSymbols(document) {
        const symbols: vscode.DocumentSymbol[] = [];
        const functionRegex = /\b(Function|Event)\s+([A-Za-z_][A-Za-z0-9_]*)/i;
        const propertyRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s+Property\s+([A-Za-z_][A-Za-z0-9_]*)/i;
        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const text = line.text;
          const funcMatch = functionRegex.exec(text);
          if (funcMatch) {
            const kind = funcMatch[1].toLowerCase() === 'function' ? vscode.SymbolKind.Function : vscode.SymbolKind.Event;
            const name = funcMatch[2];
            symbols.push(new vscode.DocumentSymbol(name, '', kind, line.range, line.range));
            continue;
          }
          const propMatch = propertyRegex.exec(text);
          if (propMatch) {
            const typeName = propMatch[1];
            const name = propMatch[2];
            symbols.push(new vscode.DocumentSymbol(name, typeName, vscode.SymbolKind.Property, line.range, line.range));
          }
        }
        return symbols;
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, {
      provideDefinition(document, position) {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        if (!range) return [];
        const word = document.getText(range);
        const regex = new RegExp(String.raw`\b(Function|Event)\s+${word}\b`, 'i');
        const locations: vscode.Location[] = [];
        for (let i = 0; i < document.lineCount; i++) {
          const text = document.lineAt(i).text;
          if (regex.test(text)) {
            locations.push(new vscode.Location(document.uri, new vscode.Position(i, Math.max(0, text.indexOf(word)))));
          }
        }
        return locations;
      }
    })
  );

  const diagCollection = vscode.languages.createDiagnosticCollection('papyrus');
  context.subscriptions.push(diagCollection);

  const validate = (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'papyrus') return;
    const lines: string[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
      lines.push(doc.lineAt(i).text);
    }
    const diagnostics: vscode.Diagnostic[] = [];
    let ifCount = 0;
    let whileCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].replace(/\/\/.*$/, '');
      if (/\bIf\b/i.test(text)) ifCount++;
      if (/\bEndIf\b/i.test(text)) ifCount--;
      if (/\bWhile\b/i.test(text)) whileCount++;
      if (/\bEndWhile\b/i.test(text)) whileCount--;
      if (ifCount < 0) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, Math.max(0, text.length)), 'Unexpected EndIf without matching If', vscode.DiagnosticSeverity.Error));
        ifCount = 0;
      }
      if (whileCount < 0) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, Math.max(0, text.length)), 'Unexpected EndWhile without matching While', vscode.DiagnosticSeverity.Error));
        whileCount = 0;
      }
    }
    if (ifCount > 0) {
      diagnostics.push(new vscode.Diagnostic(new vscode.Range(Math.max(0, lines.length - 1), 0, Math.max(0, lines.length - 1), 0), 'Missing EndIf', vscode.DiagnosticSeverity.Error));
    }
    if (whileCount > 0) {
      diagnostics.push(new vscode.Diagnostic(new vscode.Range(Math.max(0, lines.length - 1), 0, Math.max(0, lines.length - 1), 0), 'Missing EndWhile', vscode.DiagnosticSeverity.Error));
    }
    diagCollection.set(doc.uri, diagnostics);
  };

  if (vscode.window.activeTextEditor?.document) {
    validate(vscode.window.activeTextEditor.document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validate),
    vscode.workspace.onDidChangeTextDocument(e => validate(e.document)),
    vscode.workspace.onDidCloseTextDocument(doc => diagCollection.delete(doc.uri))
  );
}

function registerDesktopOnlyCommands(context: vscode.ExtensionContext) {
  if (vscode.env.uiKind !== vscode.UIKind.Web) {
    return;
  }
  for (const cmd of DESKTOP_ONLY_COMMANDS) {
    context.subscriptions.push(vscode.commands.registerCommand(cmd.id, () => showDesktopOnlyMessage(cmd.title)));
  }
}

function registerChatParticipant(context: vscode.ExtensionContext) {
  if (vscode.env.uiKind !== vscode.UIKind.Web) {
    return;
  }
  if (!('chat' in vscode) || typeof vscode.chat.createChatParticipant !== 'function') {
    return;
  }
  const participant = vscode.chat.createChatParticipant('papyrusTools.assistant', async (_request, _chatContext, response, _token) => {
    response.markdown('Papyrus Tools assisted chat is only available in the desktop version of VS Code.');
  });
  context.subscriptions.push(participant);
}

export function activate(context: vscode.ExtensionContext) {
  registerLanguageFeatures(context);
  registerDesktopOnlyCommands(context);
  registerChatParticipant(context);

  const mainPlaceholder = new PapyrusMainWebviewPlaceholder(context.extensionUri);
  if (vscode.env.uiKind === vscode.UIKind.Web) {
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('papyrus-tools-main', mainPlaceholder),
      vscode.window.registerTreeDataProvider('papyrus-tools-project-folder', new DesktopOnlyTreeProvider()),
      vscode.window.registerTreeDataProvider('papyrus-tools-output-folder', new DesktopOnlyTreeProvider())
    );

    void vscode.window.showInformationMessage('Papyrus Tools is running in read-only mode on vscode.dev. Install the desktop extension to unlock project automation and compiler helpers.');
  }
}

export function deactivate() {}
