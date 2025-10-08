import * as vscode from 'vscode';
import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';

type GameProfile = 'Skyrim' | 'SkyrimSE' | 'SkyrimAE' | 'Fallout4' | 'Fallout76' | 'Starfield';

const BASE_KEYWORDS = [
  'ScriptName', 'Extends', 'Import', 'Property', 'Function', 'EndFunction', 'Event', 'EndEvent',
  'If', 'ElseIf', 'Else', 'EndIf', 'While', 'EndWhile', 'Return', 'State', 'EndState', 'Goto', 'Auto',
  'Global', 'Native', 'Hidden', 'Conditional', 'ReadOnly', 'Const'
];

function getKeywordsForGame(game: GameProfile): string[] {
  const extras: string[] = [];
  // Structs are supported in Fallout 4+, Fallout 76, and Starfield
  if (game === 'Fallout4' || game === 'Fallout76' || game === 'Starfield') {
    extras.push('Struct', 'EndStruct');
  }
  return [...BASE_KEYWORDS, ...extras];
}

const PAPYRUS_TYPES = [
  'Bool', 'Int', 'Float', 'String', 'Var', 'Form', 'ObjectReference', 'Actor', 'Alias', 'Quest'
];

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: 'papyrus', scheme: '*' };

  const getGame = (): GameProfile => {
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const g = cfg.get<string>('game', 'Skyrim');
    const allowed: GameProfile[] = ['Skyrim', 'SkyrimSE', 'SkyrimAE', 'Fallout4', 'Fallout76', 'Starfield'];
    return (allowed.includes(g as GameProfile) ? (g as GameProfile) : 'Skyrim');
  };

  // Status bar to show/switch game profile
  const gameStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  gameStatus.name = 'Papyrus Game Profile';
  gameStatus.command = 'papyrus.switchGame';
  const updateGameStatus = () => {
    const g = getGame();
    gameStatus.text = `$(tools) Papyrus: ${g}`;
    gameStatus.tooltip = 'Switch Papyrus game profile';
    gameStatus.show();
  };
  updateGameStatus();

  // --- Simple Script Indexer ---
  type ScriptIndexEntry = {
    scriptName: string;
    extends?: string;
    uri: vscode.Uri;
    functions: { name: string; line: number }[];
    events: { name: string; line: number }[];
  };
  let scriptIndex: Map<string, ScriptIndexEntry> = new Map(); // key: lowercased script name

  const parsePapyrus = (uri: vscode.Uri, content: string): ScriptIndexEntry | undefined => {
    let scriptNameMatch = /\bScriptName\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:extends\s+([A-Za-z_][A-Za-z0-9_]*))?/i.exec(content);
    const functions: { name: string; line: number }[] = [];
    const events: { name: string; line: number }[] = [];
    if (!scriptNameMatch) return undefined;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m = /\bFunction\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(line);
      if (m) functions.push({ name: m[1], line: i });
      m = /\bEvent\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(line);
      if (m) events.push({ name: m[1], line: i });
    }
    return {
      scriptName: scriptNameMatch[1],
      extends: scriptNameMatch[2],
      uri,
      functions,
      events
    };
  };

  const buildIndex = async () => {
    scriptIndex = new Map();
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const g = getGame();
    const key = g.toLowerCase() as 'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield';
    const gamesCfg = cfg.get<any>('games') || {};
    const folders: string[] = (gamesCfg[key]?.scriptPaths as string[] | undefined) || [];
    const globPatterns = folders.map(f => new vscode.RelativePattern(vscode.Uri.file(f).fsPath, '**/*.psc'));
    for (const pat of globPatterns) {
      const uris = await vscode.workspace.findFiles(pat, '**/node_modules/**');
      for (const u of uris) {
        try {
          const buf = await vscode.workspace.fs.readFile(u);
          const content = Buffer.from(buf).toString('utf8');
          const entry = parsePapyrus(u, content);
          if (entry) scriptIndex.set(entry.scriptName.toLowerCase(), entry);
        } catch {
          // ignore read errors
        }
      }
    }
  };
  // build index initially (non-blocking)
  buildIndex();

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    selector,
    {
      provideCompletionItems(document, position) {
        // mark parameters as used to satisfy noUnusedParameters
        void document;
        void position;
        const items: vscode.CompletionItem[] = [];
        const keywords = getKeywordsForGame(getGame());
        for (const kw of keywords) {
          const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
          items.push(item);
        }
        for (const t of PAPYRUS_TYPES) {
          const item = new vscode.CompletionItem(t, vscode.CompletionItemKind.TypeParameter);
          items.push(item);
        }
        return items;
      }
    },
    '.' // trigger on dot to help with object members later
  );

  const hoverProvider = vscode.languages.registerHoverProvider(selector, {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return undefined;
      const word = document.getText(range);
      const allKeywords = getKeywordsForGame(getGame());
      if (allKeywords.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
        return new vscode.Hover(`Papyrus keyword: ${word}`);
      }
      if (PAPYRUS_TYPES.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
        return new vscode.Hover(`Papyrus type: ${word}`);
      }
      return undefined;
    }
  });

  // Document symbols (Outline)
  const symbolProvider = vscode.languages.registerDocumentSymbolProvider(selector, {
    provideDocumentSymbols(document) {
      const result: vscode.DocumentSymbol[] = [];
      const functionRegex = /\b(Function|Event)\s+([A-Za-z_][A-Za-z0-9_]*)/i;
      const propertyRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s+Property\s+([A-Za-z_][A-Za-z0-9_]*)/i;
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text;
        let m = functionRegex.exec(text);
        if (m) {
          const kind = m[1].toLowerCase() === 'function' ? vscode.SymbolKind.Function : vscode.SymbolKind.Event;
          const name = m[2];
          result.push(new vscode.DocumentSymbol(name, '', kind, line.range, line.range));
          continue;
        }
        m = propertyRegex.exec(text);
        if (m) {
          const typeName = m[1];
          const name = m[2];
          const sym = new vscode.DocumentSymbol(name, typeName, vscode.SymbolKind.Property, line.range, line.range);
          result.push(sym);
        }
      }
      return result;
    }
  });

  // Go to definition for functions/events within a file
  const definitionProvider = vscode.languages.registerDefinitionProvider(selector, {
    provideDefinition(document, position) {
      const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
      if (!range) return [];
      const word = document.getText(range);
      const declRegex = new RegExp(String.raw`\b(Function|Event)\s+${word}\b`, 'i');
      const locations: vscode.Location[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        if (declRegex.test(line)) {
          const loc = new vscode.Location(document.uri, new vscode.Position(i, Math.max(0, line.indexOf(word))));
          locations.push(loc);
        }
      }
      // If not found locally, try index: ScriptName matches identifier
      if (locations.length === 0) {
        const entry = scriptIndex.get(word.toLowerCase());
        if (entry) {
          locations.push(new vscode.Location(entry.uri, new vscode.Position(0, 0)));
        }
      }
      return locations;
    }
  });
  // Workspace symbols from index
  const workspaceSymbols = vscode.languages.registerWorkspaceSymbolProvider({
    provideWorkspaceSymbols(query: string) {
      const q = query.toLowerCase();
      const symbols: vscode.SymbolInformation[] = [];
      for (const entry of scriptIndex.values()) {
        if (!q || entry.scriptName.toLowerCase().includes(q)) {
          symbols.push(new vscode.SymbolInformation(entry.scriptName, vscode.SymbolKind.Class, '', new vscode.Location(entry.uri, new vscode.Position(0, 0))));
        }
        for (const fn of entry.functions) {
          const name = `${entry.scriptName}.${fn.name}`;
          if (!q || name.toLowerCase().includes(q)) {
            symbols.push(new vscode.SymbolInformation(name, vscode.SymbolKind.Function, entry.scriptName, new vscode.Location(entry.uri, new vscode.Position(fn.line, 0))));
          }
        }
        for (const ev of entry.events) {
          const name = `${entry.scriptName}.${ev.name}`;
          if (!q || name.toLowerCase().includes(q)) {
            symbols.push(new vscode.SymbolInformation(name, vscode.SymbolKind.Event, entry.scriptName, new vscode.Location(entry.uri, new vscode.Position(ev.line, 0))));
          }
        }
      }
      return symbols;
    }
  });

  // Commands to manage index
  const rebuildIndexCmd = vscode.commands.registerCommand('papyrus.rebuildIndex', async () => {
    await buildIndex();
    vscode.window.showInformationMessage('Papyrus script index rebuilt.');
  });

  const addScriptFolderCmd = vscode.commands.registerCommand('papyrus.addScriptFolder', async () => {
    const g = getGame();
    const key = g.toLowerCase() as 'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield';
    const uri = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: 'Select Script Folder' });
    if (!uri || uri.length === 0) return;
    const folder = uri[0].fsPath;
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const games = cfg.get<any>('games') || {};
    const arr: string[] = Array.isArray(games[key]?.scriptPaths) ? [...games[key].scriptPaths] : [];
    if (!arr.includes(folder)) arr.push(folder);
    const next = { ...games, [key]: { ...(games[key] || {}), scriptPaths: arr } };
    await cfg.update('games', next, target);
    await buildIndex();
    vscode.window.showInformationMessage(`Added script folder for ${g}.`);
  });

  // Basic diagnostics: block balance for If/EndIf and While/EndWhile
  const diagCollection = vscode.languages.createDiagnosticCollection('papyrus');
  const validate = (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'papyrus') return;
    const diags: vscode.Diagnostic[] = [];
    let ifCount = 0;
    let whileCount = 0;
    for (let i = 0; i < doc.lineCount; i++) {
      const text = doc.lineAt(i).text.replace(/\/\/.*$/, ''); // strip line comment
      if (/\bIf\b/i.test(text)) ifCount++;
      if (/\bEndIf\b/i.test(text)) ifCount--;
      if (/\bWhile\b/i.test(text)) whileCount++;
      if (/\bEndWhile\b/i.test(text)) whileCount--;
      if (ifCount < 0) {
        diags.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, text.length), 'Unexpected EndIf without matching If', vscode.DiagnosticSeverity.Error));
        ifCount = 0;
      }
      if (whileCount < 0) {
        diags.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, text.length), 'Unexpected EndWhile without matching While', vscode.DiagnosticSeverity.Error));
        whileCount = 0;
      }
    }
    if (ifCount > 0) {
      diags.push(new vscode.Diagnostic(new vscode.Range(doc.lineCount - 1, 0, doc.lineCount - 1, 0), 'Missing EndIf', vscode.DiagnosticSeverity.Error));
    }
    if (whileCount > 0) {
      diags.push(new vscode.Diagnostic(new vscode.Range(doc.lineCount - 1, 0, doc.lineCount - 1, 0), 'Missing EndWhile', vscode.DiagnosticSeverity.Error));
    }
    diagCollection.set(doc.uri, diags);
  };
  context.subscriptions.push(diagCollection);
  if (vscode.window.activeTextEditor?.document) validate(vscode.window.activeTextEditor.document);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validate));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => validate(e.document)));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => diagCollection.delete(doc.uri)));

  // Compile command
  const compileCmd = vscode.commands.registerCommand('papyrus.compileFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor to compile.');
      return;
    }
    const doc = editor.document;
    if (doc.languageId !== 'papyrus') {
      vscode.window.showErrorMessage('Active file is not a Papyrus (.psc) document.');
      return;
    }
    await doc.save();
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const game = getGame();
    const key = game.toLowerCase() as 'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield';
    // Prefer per-game compiler settings, fallback to global
  const gamesCfg = cfg.get<any>('games') || {};
  const perGame = (gamesCfg[key]?.compiler) || {};
  const compilerPath: string = perGame.path || cfg.get<string>('compiler.path') || '';
  const args: string[] = perGame.args || cfg.get<string[]>('compiler.args') || [];
  const cwd: string | undefined = perGame.cwd || cfg.get<string>('compiler.cwd') || undefined;

  // Build include arg from configured script folders
  const includeFlag: string = cfg.get<string>('compiler.includeFlag') || '-i';
  const sep: string = cfg.get<string>('compiler.pathSeparator') || ';';
  const scriptPaths: string[] = (gamesCfg[key]?.scriptPaths as string[] | undefined) || [];
    if (!compilerPath || !fs.existsSync(compilerPath)) {
      vscode.window.showErrorMessage('Papyrus compiler path is not set or does not exist. Configure papyrus.compiler.path.');
      return;
    }
    const scriptPath = doc.uri.fsPath;
    const cmd = `${compilerPath}`;
    const finalArgs: string[] = [...args];
    if (scriptPaths.length > 0) {
      const joined = scriptPaths.join(sep);
      const flag = includeFlag.includes('=') ? `${includeFlag}"${joined}"` : `${includeFlag}="${joined}"`;
      finalArgs.push(flag);
    }
    finalArgs.push(scriptPath);
    const term = vscode.window.createTerminal({ name: 'Papyrus Compile', cwd });
    term.sendText([cmd, ...finalArgs.map(a => a.includes(' ') ? `"${a}"` : a)].join(' '));
    term.show();
  });

  // Configure script folders command: sets per-game include paths
  const configureScriptFoldersCmd = vscode.commands.registerCommand('papyrus.configureScriptFolders', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const currentGames = cfg.get<any>('games') || {};

    // Helper to push a unique path to scriptPaths array for a profile key
    const pushScriptPath = async (profileKey: string, newPath: string) => {
      const next = { ...currentGames };
      const arr: string[] = Array.isArray(next[profileKey]?.scriptPaths) ? [...next[profileKey].scriptPaths] : [];
      if (!arr.includes(newPath)) arr.push(newPath);
      next[profileKey] = { ...(next[profileKey] || {}), scriptPaths: arr };
      await cfg.update('games', next, target);
    };

    // Starfield default path (from user input)
  const starfieldDefault = 'C:\\SteamLibrary\\steamapps\\common\\Starfield\\Data\\Scripts';
    const sfPath = await vscode.window.showInputBox({
      title: 'Starfield Script Folder (Data/Scripts)',
      value: starfieldDefault,
      prompt: 'Enter the Starfield script folder path (leave empty to skip)'
    });
    if (sfPath && sfPath.trim()) {
      await pushScriptPath('starfield', sfPath.trim());
    }

    // Fallout 4 default path (from user input)
  const fo4Default = 'C:\\SteamLibrary\\steamapps\\common\\Fallout 4\\Data\\Scripts';
    const fo4Path = await vscode.window.showInputBox({
      title: 'Fallout 4 Script Folder (Data/Scripts)',
      value: fo4Default,
      prompt: 'Enter the Fallout 4 script folder path (leave empty to skip)'
    });
    if (fo4Path && fo4Path.trim()) {
      await pushScriptPath('fallout4', fo4Path.trim());
    }

    vscode.window.showInformationMessage('Papyrus script folders updated (where provided).');
  });

  // Configure compilers command: prompts for known paths per installed games
  const configureCompilersCmd = vscode.commands.registerCommand('papyrus.configureCompilers', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrus');

    // Helper to update a nested setting under papyrus.games
    const updateGameCompiler = async (profileKey: string, pathValue: string) => {
      const current = cfg.get<any>('games') || {};
      const next = { ...current, [profileKey]: { ...(current[profileKey] || {}), compiler: { ...(current[profileKey]?.compiler || {}), path: pathValue } } };
      await cfg.update('games', next, target);
    };

    // Ask to set Starfield compiler
    const starfieldDefault = 'C:\\SteamLibrary\\steamapps\\common\\Starfield\\Tools\\Papyrus Compiler\\PapyrusCompiler.exe';
    const sfPath = await vscode.window.showInputBox({
      title: 'Starfield Papyrus Compiler Path',
      value: starfieldDefault,
      prompt: 'Enter the full path to PapyrusCompiler.exe for Starfield (leave empty to skip)'
    });
    if (sfPath && sfPath.trim()) {
      await updateGameCompiler('starfield', sfPath.trim());
    }

    // Ask to set Fallout 4 compiler
    const fo4Default = 'C:\\SteamLibrary\\steamapps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe';
    const fo4Path = await vscode.window.showInputBox({
      title: 'Fallout 4 Papyrus Compiler Path',
      value: fo4Default,
      prompt: 'Enter the full path to PapyrusCompiler.exe for Fallout 4 (leave empty to skip)'
    });
    if (fo4Path && fo4Path.trim()) {
      await updateGameCompiler('fallout4', fo4Path.trim());
    }

    vscode.window.showInformationMessage('Papyrus compiler paths updated (where provided).');
  });

  // Auto-detect game installations (Steam) and configure compiler/script paths
  const autoDetectCmd = vscode.commands.registerCommand('papyrus.autoDetectGamePaths', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrus');

    type Detected = { compilerPath?: string; scriptPaths: string[] };
    const detected: Record<'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield', Detected> = {
      skyrim: { scriptPaths: [] },
      skyrimse: { scriptPaths: [] },
      skyrimae: { scriptPaths: [] },
      fallout4: { scriptPaths: [] },
      fallout76: { scriptPaths: [] },
      starfield: { scriptPaths: [] }
    };

    // Common Steam library locations to probe (keep small/fast)
    const bases = [
      'C:/Program Files (x86)/Steam/steamapps/common',
      'C:/Program Files/Steam/steamapps/common',
      'C:/SteamLibrary/steamapps/common',
      'D:/SteamLibrary/steamapps/common',
      'E:/SteamLibrary/steamapps/common',
      'F:/SteamLibrary/steamapps/common'
    ];

    const gameDirs: Record<string, { profile: keyof typeof detected; names: string[] }[]> = {
      // multiple potential folder names per title
      base: [
        { profile: 'skyrim', names: ['Skyrim'] },
        { profile: 'skyrimse', names: ['Skyrim Special Edition'] },
        { profile: 'skyrimae', names: ['Skyrim Special Edition'] }, // AE shares SE path
        { profile: 'fallout4', names: ['Fallout 4'] },
        { profile: 'fallout76', names: ['Fallout76', 'Fallout 76'] },
        { profile: 'starfield', names: ['Starfield'] }
      ]
    } as any;

    const findFirstExisting = (...candidatePaths: string[]): string | undefined => {
      for (const p of candidatePaths) {
        try {
          if (fs.existsSync(p)) return p;
        } catch {}
      }
      return undefined;
    };

    for (const baseRoot of bases) {
      if (!fs.existsSync(baseRoot)) continue;
      for (const entry of gameDirs.base) {
        for (const dirName of entry.names) {
          const gameRoot = path.join(baseRoot, dirName);
          if (!fs.existsSync(gameRoot)) continue;
          // Detect compiler path: try common subpaths
          const compiler = findFirstExisting(
            path.join(gameRoot, 'Papyrus Compiler', 'PapyrusCompiler.exe'),
            path.join(gameRoot, 'Tools', 'Papyrus Compiler', 'PapyrusCompiler.exe')
          );
          if (compiler && !detected[entry.profile].compilerPath) {
            detected[entry.profile].compilerPath = compiler;
          }
          // Detect script sources: prefer Data\Scripts\Source, fallback Data\Scripts
          const scriptsSource = path.join(gameRoot, 'Data', 'Scripts', 'Source');
          const scripts = path.join(gameRoot, 'Data', 'Scripts');
          const toAdd = fs.existsSync(scriptsSource) ? scriptsSource : (fs.existsSync(scripts) ? scripts : undefined);
          if (toAdd) {
            const arr = detected[entry.profile].scriptPaths;
            if (!arr.includes(toAdd)) arr.push(toAdd);
          }
        }
      }
    }

    // Show a summary and let the user apply per-profile
    const parts: string[] = [];
    for (const [key, info] of Object.entries(detected)) {
      const items: string[] = [];
      if (info.compilerPath) items.push(`compiler: ${info.compilerPath}`);
      if (info.scriptPaths.length) items.push(`scripts: ${info.scriptPaths.join('; ')}`);
      if (items.length) parts.push(`${key}: ${items.join(' | ')}`);
    }
    if (!parts.length) {
      vscode.window.showInformationMessage('No game installations detected in common Steam library locations.');
      return;
    }

    const confirm = await vscode.window.showQuickPick([
      { label: 'Apply all detected paths', description: parts.join('\n'), value: 'all' },
      { label: 'Review per game (interactive)', value: 'interactive' },
      { label: 'Cancel', value: 'cancel' }
    ], { placeHolder: 'Apply detected Papyrus compiler and script paths?' });
    if (!confirm || confirm.value === 'cancel') return;

    const currentGames = cfg.get<any>('games') || {};

    const applyProfile = async (profileKey: keyof typeof detected) => {
      const d = detected[profileKey];
      if (!d.compilerPath && d.scriptPaths.length === 0) return;
      const next = { ...currentGames };
      const prev = next[profileKey] || {};
      const prevCompiler = prev.compiler || {};
      const prevPaths: string[] = Array.isArray(prev.scriptPaths) ? [...prev.scriptPaths] : [];
      if (d.compilerPath) {
        next[profileKey] = {
          ...prev,
          compiler: { ...prevCompiler, path: d.compilerPath }
        };
      }
      if (d.scriptPaths.length) {
        const merged = [...prevPaths];
        for (const p of d.scriptPaths) if (!merged.includes(p)) merged.push(p);
        next[profileKey] = { ...(next[profileKey] || prev), scriptPaths: merged };
      }
      await cfg.update('games', next, target);
    };

    if (confirm.value === 'all') {
      for (const key of Object.keys(detected) as (keyof typeof detected)[]) {
        await applyProfile(key);
      }
      await buildIndex();
      vscode.window.showInformationMessage('Applied all detected Papyrus paths.');
      return;
    }

    // Interactive per-game review
    for (const key of Object.keys(detected) as (keyof typeof detected)[]) {
      const d = detected[key];
      if (!d.compilerPath && d.scriptPaths.length === 0) continue;
      const choice = await vscode.window.showQuickPick([
        { label: `Apply ${key}`, description: [d.compilerPath ? `compiler: ${d.compilerPath}` : '', d.scriptPaths.length ? `scripts: ${d.scriptPaths.join('; ')}` : ''].filter(Boolean).join(' | '), value: 'apply' },
        { label: 'Skip', value: 'skip' }
      ], { placeHolder: `Apply detected paths for ${key}?` });
      if (choice && choice.value === 'apply') {
        await applyProfile(key);
      }
    }
    await buildIndex();
    vscode.window.showInformationMessage('Auto-detection complete. Applied selected Papyrus paths.');
  });

  // Switch game command
  const switchGameCmd = vscode.commands.registerCommand('papyrus.switchGame', async () => {
    const options: GameProfile[] = ['Skyrim', 'SkyrimSE', 'SkyrimAE', 'Fallout4', 'Fallout76', 'Starfield'];
    const pick = await vscode.window.showQuickPick(options, {
      title: 'Select Papyrus game profile',
      placeHolder: 'Choose the target game for Papyrus features and compiler configs'
    });
    if (!pick) return;
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    await vscode.workspace.getConfiguration('papyrus').update('game', pick, target);
    updateGameStatus();
    vscode.window.showInformationMessage(`Papyrus game profile set to ${pick}.`);
  });

  // React to configuration changes
  const cfgChange = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('papyrus.game')) updateGameStatus();
  });

  context.subscriptions.push(
    completionProvider,
    hoverProvider,
    symbolProvider,
    definitionProvider,
  workspaceSymbols,
    compileCmd,
  rebuildIndexCmd,
  addScriptFolderCmd,
    configureScriptFoldersCmd,
    configureCompilersCmd,
    autoDetectCmd,
    switchGameCmd,
    cfgChange,
    gameStatus
  );
}

export function deactivate() {}
