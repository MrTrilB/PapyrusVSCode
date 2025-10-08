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

  // Status bar: quick open settings for current game
  const settingsStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  settingsStatus.name = 'Papyrus Settings';
  settingsStatus.text = '$(gear)';
  settingsStatus.tooltip = 'Open Papyrus settings for current game';
  settingsStatus.command = 'papyrus.openCurrentGameSettings';
  settingsStatus.show();

  // Settings helpers: merge top-level per-game settings with papyrus.games
  const gameToProfileKey = (g: GameProfile): 'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield' => (g.toLowerCase() as any);
  const topLevelKeyForGame = (g: GameProfile): 'skyrim'|'fallout4'|'starfield'|undefined => {
    if (g === 'Starfield') return 'starfield';
    if (g === 'Fallout4') return 'fallout4';
    if (g === 'Skyrim' || g === 'SkyrimSE' || g === 'SkyrimAE') return 'skyrim';
    return undefined;
  };
  const getMergedGameConfig = (cfg: vscode.WorkspaceConfiguration, g: GameProfile) => {
    const gKey = gameToProfileKey(g);
    const tlKey = topLevelKeyForGame(g);
    const gamesObj = cfg.get<any>('games') || {};
    const per = gamesObj[gKey] || {};
    const top = tlKey ? (cfg.get<any>(tlKey) || {}) : {};
    const scriptPaths: string[] = [];
    const addAll = (arr?: string[]) => { if (Array.isArray(arr)) for (const p of arr) if (p && !scriptPaths.includes(p)) scriptPaths.push(p); };
    addAll(top.scriptPaths);
    addAll(per.scriptPaths);
    const compiler = {
      path: (top.compiler?.path) || (per.compiler?.path) || cfg.get<string>('compiler.path') || '',
      args: (top.compiler?.args) || (per.compiler?.args) || cfg.get<string[]>('compiler.args') || [],
      cwd: (top.compiler?.cwd) || (per.compiler?.cwd) || cfg.get<string>('compiler.cwd') || ''
    };
    return { scriptPaths, compiler };
  };

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
    const merged = getMergedGameConfig(cfg, g);
    const folders: string[] = merged.scriptPaths || [];
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
  const computeBlockDiagnostics = (lines: string[]): vscode.Diagnostic[] => {
    const diags: vscode.Diagnostic[] = [];
    let ifCount = 0;
    let whileCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].replace(/\/\/.*$/, '');
      if (/\bIf\b/i.test(text)) ifCount++;
      if (/\bEndIf\b/i.test(text)) ifCount--;
      if (/\bWhile\b/i.test(text)) whileCount++;
      if (/\bEndWhile\b/i.test(text)) whileCount--;
      if (ifCount < 0) {
        diags.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, Math.max(0, text.length)), 'Unexpected EndIf without matching If', vscode.DiagnosticSeverity.Error));
        ifCount = 0;
      }
      if (whileCount < 0) {
        diags.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, Math.max(0, text.length)), 'Unexpected EndWhile without matching While', vscode.DiagnosticSeverity.Error));
        whileCount = 0;
      }
    }
    if (ifCount > 0) {
      diags.push(new vscode.Diagnostic(new vscode.Range(Math.max(0, lines.length - 1), 0, Math.max(0, lines.length - 1), 0), 'Missing EndIf', vscode.DiagnosticSeverity.Error));
    }
    if (whileCount > 0) {
      diags.push(new vscode.Diagnostic(new vscode.Range(Math.max(0, lines.length - 1), 0, Math.max(0, lines.length - 1), 0), 'Missing EndWhile', vscode.DiagnosticSeverity.Error));
    }
    return diags;
  };

  const validate = (doc: vscode.TextDocument) => {
    if (doc.languageId !== 'papyrus') return;
    const lines: string[] = [];
    for (let i = 0; i < doc.lineCount; i++) lines.push(doc.lineAt(i).text);
    const diags = computeBlockDiagnostics(lines);
    diagCollection.set(doc.uri, diags);
  };
  context.subscriptions.push(diagCollection);
  if (vscode.window.activeTextEditor?.document) validate(vscode.window.activeTextEditor.document);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validate));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => validate(e.document)));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => diagCollection.delete(doc.uri)));


  // Scan command: walk configured script paths and produce diagnostics for each file
  const scanScriptsCmd = vscode.commands.registerCommand('papyrus.scanScriptsForDiagnostics', async () => {
    const out = vscode.window.createOutputChannel('Papyrus Scan');
    out.clear();
    out.appendLine('Papyrus scan started...');
  const cfg = vscode.workspace.getConfiguration('papyrus');
  const game = getGame();
  const merged = getMergedGameConfig(cfg, game);
  const scriptPaths: string[] = merged.scriptPaths || [];
    if (scriptPaths.length === 0) {
      out.appendLine('No scriptPaths configured for current profile. Configure script folders or run Auto-Detect first.');
      out.show(true);
      vscode.window.showWarningMessage('Papyrus: No script paths configured for current profile.');
      return;
    }
    let filesScanned = 0;
    let filesWithIssues = 0;
    const issues: { uri: vscode.Uri; diag: vscode.Diagnostic }[] = [];
    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            // skip node_modules and hidden
            if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
            walk(full);
          } else if (ent.isFile() && /\.psc$/i.test(ent.name)) {
            try {
              const content = fs.readFileSync(full, 'utf8');
              const lines = content.split(/\r?\n/);
              const diags = computeBlockDiagnostics(lines);
              const uri = vscode.Uri.file(full);
              if (diags.length > 0) {
                filesWithIssues++;
                diagCollection.set(uri, diags);
                diags.forEach(d => issues.push({ uri, diag: d }));
              } else {
                // clear any previous diagnostics for this file
                diagCollection.delete(uri);
              }
              filesScanned++;
            } catch {}
          }
        }
      } catch {}
    };
    for (const root of scriptPaths) walk(root);
    out.appendLine(`Scan complete. Files scanned: ${filesScanned}. Files with issues: ${filesWithIssues}.`);
    for (const it of issues) {
      const pos = it.diag.range.start;
      out.appendLine(`${it.uri.fsPath}:${pos.line + 1}:${pos.character + 1} - ${it.diag.message}`);
    }
    out.show(true);
    if (filesWithIssues > 0) {
      vscode.window.showWarningMessage(`Papyrus scan found issues in ${filesWithIssues} file(s). See Problems and 'Papyrus Scan' output.`);
    } else {
      vscode.window.showInformationMessage('Papyrus scan found no issues.');
    }
  });

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
    const merged = getMergedGameConfig(cfg, game);
    const compilerPath: string = merged.compiler.path || '';
    const args: string[] = merged.compiler.args || [];
    const cwd: string | undefined = merged.compiler.cwd || undefined;

    // Build include arg from configured script folders
    const includeFlag: string = cfg.get<string>('compiler.includeFlag') || '-i';
    const sep: string = cfg.get<string>('compiler.pathSeparator') || ';';
    const scriptPaths: string[] = merged.scriptPaths || [];
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
      // Also update top-level convenience for Starfield/Fallout 4
      if (profileKey === 'starfield' || profileKey === 'fallout4') {
        const tl = cfg.get<any>(profileKey) || {};
        const tlArr: string[] = Array.isArray(tl.scriptPaths) ? [...tl.scriptPaths] : [];
        if (!tlArr.includes(newPath)) tlArr.push(newPath);
        const merged = { ...tl, scriptPaths: tlArr };
        await cfg.update(profileKey, merged, target);
      }
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
      // Also update top-level convenience for Starfield/Fallout 4
      if (profileKey === 'starfield' || profileKey === 'fallout4') {
        const tl = cfg.get<any>(profileKey) || {};
        const merged = { ...tl, compiler: { ...(tl.compiler || {}), path: pathValue } };
        await cfg.update(profileKey, merged, target);
      }
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

  // Open Settings for current game
  const openCurrentGameSettingsCmd = vscode.commands.registerCommand('papyrus.openCurrentGameSettings', async () => {
    const g = getGame();
    const tl = ((): string => {
      switch (g) {
        case 'Starfield': return 'papyrus.starfield';
        case 'Fallout4': return 'papyrus.fallout4';
        case 'Skyrim':
        case 'SkyrimSE':
        case 'SkyrimAE':
          return 'papyrus.skyrim';
        default:
          return 'papyrus';
      }
    })();
    // First switch to Workspace settings tab, then apply filter query for our section
    await vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
    await vscode.commands.executeCommand('workbench.action.openSettings', tl);
  });

  // Open workspace settings JSON directly for transparency
  const openWorkspaceSettingsJsonCmd = vscode.commands.registerCommand('papyrus.openWorkspaceSettingsJson', async () => {
    await vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile');
  });

  // Export current game profile (merged) to JSON
  const exportCurrentProfileCmd = vscode.commands.registerCommand('papyrus.exportCurrentProfile', async () => {
    const g = getGame();
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const merged = getMergedGameConfig(cfg, g);
    const includeFlag: string = cfg.get<string>('compiler.includeFlag') || '-i';
    const pathSeparator: string = cfg.get<string>('compiler.pathSeparator') || ';';
    const payload = {
      game: g,
      scriptPaths: merged.scriptPaths || [],
      compiler: {
        path: merged.compiler?.path || '',
        args: merged.compiler?.args || [],
        cwd: merged.compiler?.cwd || ''
      },
      includeFlag,
      pathSeparator
    };
    const defaultFileName = `papyrus-profile-${g}.json`;
    const uri = await vscode.window.showSaveDialog({
      saveLabel: 'Export',
      filters: { 'JSON': ['json'] },
      defaultUri: vscode.Uri.file(path.join((vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()), defaultFileName))
    });
    if (!uri) return;
    try {
      const json = JSON.stringify(payload, null, 2);
      fs.writeFileSync(uri.fsPath, json, 'utf8');
      vscode.window.showInformationMessage(`Papyrus: Exported profile for ${g} to ${uri.fsPath}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Papyrus: Failed to export profile: ${e?.message || e}`);
    }
  });

  // Import game profile from JSON
  const importProfileCmd = vscode.commands.registerCommand('papyrus.importProfile', async () => {
    try {
      const pick = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'JSON': ['json'] },
        openLabel: 'Import'
      });
      if (!pick || pick.length === 0) return;
      const filePath = pick[0].fsPath;
      const content = fs.readFileSync(filePath, 'utf8');
      let data: any;
      try {
        data = JSON.parse(content);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Papyrus: Failed to parse JSON: ${e?.message || e}`);
        return;
      }
      // Validate basic shape
      const game = (data?.game as GameProfile) || getGame();
      const validGames: GameProfile[] = ['Skyrim','SkyrimSE','SkyrimAE','Fallout4','Fallout76','Starfield'];
      if (!validGames.includes(game)) {
        vscode.window.showErrorMessage('Papyrus: Invalid or missing "game" in profile JSON.');
        return;
      }
      const scripts: string[] = Array.isArray(data?.scriptPaths) ? data.scriptPaths.filter((x: any) => typeof x === 'string' && x.trim()) : [];
      const compiler = data?.compiler || {};
      const includeFlag = typeof data?.includeFlag === 'string' ? data.includeFlag : undefined;
      const pathSeparator = typeof data?.pathSeparator === 'string' ? data.pathSeparator : undefined;

      const cfg = vscode.workspace.getConfiguration('papyrus');
      const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

      // Determine profile key and top-level key
      const profileKey = (game.toLowerCase() as 'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield');
      const tlKey = ((): 'skyrim'|'fallout4'|'starfield'|undefined => {
        if (game === 'Starfield') return 'starfield';
        if (game === 'Fallout4') return 'fallout4';
        if (game === 'Skyrim' || game === 'SkyrimSE' || game === 'SkyrimAE') return 'skyrim';
        return undefined;
      })();

      // Merge into papyrus.games[profileKey]
      const games = cfg.get<any>('games') || {};
      const prev = games[profileKey] || {};
      const mergedPaths: string[] = Array.isArray(prev.scriptPaths) ? [...prev.scriptPaths] : [];
      for (const p of scripts) { if (!mergedPaths.includes(p)) mergedPaths.push(p); }
      const nextCompiler = {
        ...(prev.compiler || {}),
        ...(typeof compiler?.path === 'string' ? { path: compiler.path } : {}),
        ...(Array.isArray(compiler?.args) ? { args: compiler.args } : {}),
        ...(typeof compiler?.cwd === 'string' ? { cwd: compiler.cwd } : {})
      };
      const nextGames = {
        ...games,
        [profileKey]: {
          ...(games[profileKey] || {}),
          ...(mergedPaths.length ? { scriptPaths: mergedPaths } : {}),
          ...(Object.keys(nextCompiler).length ? { compiler: nextCompiler } : {})
        }
      };
      await cfg.update('games', nextGames, target);

      // Update top-level convenience if applicable
      if (tlKey) {
        const tl = cfg.get<any>(tlKey) || {};
        const tlPaths: string[] = Array.isArray(tl.scriptPaths) ? [...tl.scriptPaths] : [];
        for (const p of scripts) { if (!tlPaths.includes(p)) tlPaths.push(p); }
        const tlCompiler = {
          ...(tl.compiler || {}),
          ...(typeof compiler?.path === 'string' ? { path: compiler.path } : {}),
          ...(Array.isArray(compiler?.args) ? { args: compiler.args } : {}),
          ...(typeof compiler?.cwd === 'string' ? { cwd: compiler.cwd } : {})
        };
        const tlNext = {
          ...tl,
          ...(tlPaths.length ? { scriptPaths: tlPaths } : {}),
          ...(Object.keys(tlCompiler).length ? { compiler: tlCompiler } : {})
        };
        await cfg.update(tlKey, tlNext, target);
      }

      // Optionally update global includeFlag and pathSeparator
      if (includeFlag) await cfg.update('compiler.includeFlag', includeFlag, target);
      if (pathSeparator) await cfg.update('compiler.pathSeparator', pathSeparator, target);

      // Optionally set active game to imported game
      const setActive = await vscode.window.showQuickPick([
        { label: `Set active profile to ${game}`, value: 'yes' },
        { label: 'Keep current active profile', value: 'no' }
      ], { placeHolder: 'Apply imported game as active profile?' });
      if (setActive?.value === 'yes') {
        await cfg.update('game', game, target);
        updateGameStatus();
      }

      await buildIndex();
      vscode.window.showInformationMessage(`Papyrus: Imported profile for ${game}.`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Papyrus: Import failed: ${e?.message || e}`);
    }
  });

  // Auto-detect game installations (Steam) and configure compiler/script paths
  const autoDetectCmd = vscode.commands.registerCommand('papyrus.autoDetectGamePaths', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrus');
  const autoCfg = (cfg.get<any>('autoDetect') || {});
    const useVdf: boolean = autoCfg.useLibraryFoldersVdf !== false; // default true
  const additionalBasePaths: string[] = Array.isArray(autoCfg.additionalBasePaths) ? autoCfg.additionalBasePaths : [];
  const includeBothScriptPaths: boolean = !!autoCfg.includeBothScriptPaths;
    const enableFlags = {
      skyrim: autoCfg.enableSkyrim !== false,
      skyrimse: autoCfg.enableSkyrimSE !== false,
      skyrimae: autoCfg.enableSkyrimAE !== false,
      fallout4: autoCfg.enableFallout4 !== false,
      fallout76: autoCfg.enableFallout76 !== false,
      starfield: autoCfg.enableStarfield !== false
    };

    type Detected = { compilerPath?: string; scriptPaths: string[] };
    const detected: Record<'skyrim'|'skyrimse'|'skyrimae'|'fallout4'|'fallout76'|'starfield', Detected> = {
      skyrim: { scriptPaths: [] },
      skyrimse: { scriptPaths: [] },
      skyrimae: { scriptPaths: [] },
      fallout4: { scriptPaths: [] },
      fallout76: { scriptPaths: [] },
      starfield: { scriptPaths: [] }
    };

    // Build base common paths set from defaults, user-configured, and libraryfolders.vdf
    const baseCommonPaths = new Set<string>();
    const pushCommon = (p: string) => {
      // Normalize input: if user provides a library root, append steamapps/common
      const norm = p.replace(/\\/g, '/');
      if (/steamapps\/common\/?$/i.test(norm)) {
        baseCommonPaths.add(path.normalize(norm));
      } else if (/steamapps\/?$/i.test(norm)) {
        baseCommonPaths.add(path.normalize(path.join(norm, 'common')));
      } else {
        baseCommonPaths.add(path.normalize(path.join(norm, 'steamapps', 'common')));
      }
    };
    // Default common locations
    [
      'C:/Program Files (x86)/Steam/steamapps/common',
      'C:/Program Files/Steam/steamapps/common',
      'C:/SteamLibrary/steamapps/common',
      'D:/SteamLibrary/steamapps/common',
      'E:/SteamLibrary/steamapps/common',
      'F:/SteamLibrary/steamapps/common'
    ].forEach(pushCommon);
    // User-configured additional bases
    for (const p of additionalBasePaths) pushCommon(p);

    // Add default GOG Galaxy and Epic Games roots (games live directly under these)
    const extraRoots = [
      'C:/Program Files (x86)/GOG Galaxy/Games',
      'C:/GOG Games', 'D:/GOG Games', 'E:/GOG Games', 'F:/GOG Games',
      'C:/Program Files/Epic Games', 'D:/Program Files/Epic Games', 'E:/Program Files/Epic Games', 'F:/Program Files/Epic Games'
    ];
    for (const r of extraRoots) baseCommonPaths.add(path.normalize(r.replace(/\\/g, '/')));

    // Try to parse Steam libraryfolders.vdf for additional libraries
    const tryRead = (p: string): string | undefined => {
      try { if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); } catch {}
      return undefined;
    };
    const env = process.env;
    const localAppData = env.LOCALAPPDATA ? env.LOCALAPPDATA.replace(/\\/g, '/') : undefined;
    const programFilesX86 = env['ProgramFiles(x86)'] ? env['ProgramFiles(x86)']!.replace(/\\/g, '/') : undefined;
    const programFiles = env['ProgramFiles'] ? env['ProgramFiles']!.replace(/\\/g, '/') : undefined;
    const vdfCandidates: string[] = [];
    if (useVdf) {
      if (programFilesX86) {
        vdfCandidates.push(
          `${programFilesX86}/Steam/steamapps/libraryfolders.vdf`,
          `${programFilesX86}/Steam/config/libraryfolders.vdf`
        );
      }
      if (programFiles) {
        vdfCandidates.push(
          `${programFiles}/Steam/steamapps/libraryfolders.vdf`,
          `${programFiles}/Steam/config/libraryfolders.vdf`
        );
      }
      if (localAppData) {
        vdfCandidates.push(
          `${localAppData}/Steam/steamapps/libraryfolders.vdf`,
          `${localAppData}/Steam/config/libraryfolders.vdf`
        );
      }
      for (const vdfPath of vdfCandidates) {
        const content = tryRead(vdfPath);
        if (!content) continue;
        // Extract all path values ("path" "<library>") and append steamapps/common
        const re = /"path"\s*"([^"]+)"/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) {
          const lib = m[1].replace(/\\\\/g, '\\');
          pushCommon(lib);
        }
      }
    }

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

    for (const baseRoot of baseCommonPaths) {
      if (!fs.existsSync(baseRoot)) continue;
      for (const entry of gameDirs.base) {
        for (const dirName of entry.names) {
          const gameRoot = path.join(baseRoot, dirName);
          if (!fs.existsSync(gameRoot)) continue;
          // Skip if disabled by settings
          if (!enableFlags[entry.profile]) continue;
          // Detect compiler path: try common subpaths
          const compiler = findFirstExisting(
            path.join(gameRoot, 'Papyrus Compiler', 'PapyrusCompiler.exe'),
            path.join(gameRoot, 'Tools', 'Papyrus Compiler', 'PapyrusCompiler.exe')
          );
          if (compiler && !detected[entry.profile].compilerPath) {
            detected[entry.profile].compilerPath = compiler;
          }
          // Detect script sources: prefer Data\Scripts\Source; optionally include both
          const scriptsSource = path.join(gameRoot, 'Data', 'Scripts', 'Source');
          const scripts = path.join(gameRoot, 'Data', 'Scripts');
          const arr = detected[entry.profile].scriptPaths;
          const srcExists = fs.existsSync(scriptsSource);
          const scriptsExists = fs.existsSync(scripts);
          if (srcExists) {
            if (!arr.includes(scriptsSource)) arr.push(scriptsSource);
            if (includeBothScriptPaths && scriptsExists && !arr.includes(scripts)) arr.push(scripts);
          } else if (scriptsExists) {
            if (!arr.includes(scripts)) arr.push(scripts);
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
      return detected;
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
      return detected;
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
    return detected;
  });

  // Seed default profiles for each game with typical paths
  const createDefaultProfilesCmd = vscode.commands.registerCommand('papyrus.createDefaultProfiles', async () => {
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

    // Baseline defaults (these may not exist on disk; they are intended as sensible starting points)
    const defaults = {
      skyrim: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Skyrim/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Skyrim/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Skyrim/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Skyrim/Papyrus Compiler/PapyrusCompiler.exe'
      },
      skyrimse: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Skyrim Special Edition/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Papyrus Compiler/PapyrusCompiler.exe'
      },
      skyrimae: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Skyrim Special Edition/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Papyrus Compiler/PapyrusCompiler.exe'
      },
      fallout4: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Fallout 4/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Fallout 4/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Fallout 4/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Fallout 4/Papyrus Compiler/PapyrusCompiler.exe'
      },
      fallout76: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Fallout76/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Fallout76/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Fallout76/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Fallout76/Papyrus Compiler/PapyrusCompiler.exe'
      },
      starfield: {
        scriptPaths: [
          'C:/Program Files (x86)/Steam/steamapps/common/Starfield/Data/Scripts/Source',
          'C:/Program Files/Steam/steamapps/common/Starfield/Data/Scripts/Source',
          'C:/SteamLibrary/steamapps/common/Starfield/Data/Scripts/Source'
        ],
        compilerPath: 'C:/Program Files (x86)/Steam/steamapps/common/Starfield/Tools/Papyrus Compiler/PapyrusCompiler.exe'
      }
    } as const;

    const games = cfg.get<any>('games') || {};
    const next: any = { ...games };
    const mergeArr = (a: string[] = [], b: string[] = []) => {
      const out = [...a];
      for (const p of b) if (p && !out.includes(p)) out.push(p);
      return out;
    };

    // Seed/merge for each profile
    for (const key of Object.keys(defaults) as Array<keyof typeof defaults>) {
      const prev = games[key] || {};
      const combinedPaths = mergeArr(prev.scriptPaths || [], defaults[key].scriptPaths as unknown as string[]);
      const compiler = { ...(prev.compiler || {}), path: (prev.compiler?.path || defaults[key].compilerPath) };
      next[key] = { ...prev, scriptPaths: combinedPaths, compiler };

      // Update top-level convenience where applicable
      let tlKey: 'skyrim'|'fallout4'|'starfield'|undefined;
      if (key === 'starfield') tlKey = 'starfield';
      else if (key === 'fallout4') tlKey = 'fallout4';
      else if (key === 'skyrim' || key === 'skyrimse' || key === 'skyrimae') tlKey = 'skyrim';
      if (tlKey) {
        const tl = cfg.get<any>(tlKey) || {};
        const tlPaths = mergeArr(tl.scriptPaths || [], defaults[key].scriptPaths as unknown as string[]);
        const tlCompiler = { ...(tl.compiler || {}), path: (tl.compiler?.path || defaults[key].compilerPath) };
        const tlNext = { ...tl, scriptPaths: tlPaths, compiler: tlCompiler };
        await cfg.update(tlKey, tlNext, target);
      }
    }

    await cfg.update('games', next, target);
    await buildIndex();
    vscode.window.showInformationMessage('Papyrus: Default game profiles created/merged with current settings.');
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
    scanScriptsCmd,
    autoDetectCmd,
    switchGameCmd,
    cfgChange,
    gameStatus,
    settingsStatus,
    openCurrentGameSettingsCmd
    ,exportCurrentProfileCmd
    ,importProfileCmd
    ,openWorkspaceSettingsJsonCmd
    ,createDefaultProfilesCmd
  );
}

export function deactivate() {}
