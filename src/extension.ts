import * as vscode from 'vscode';
import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import { GameProfile, GameProfileKey, SUPPORTED_GAMES, GAME_TO_PROFILE_KEY, PROFILE_KEY_TO_GAME } from './gameTypes';
import { registerPapyrusCommandsView } from './papyrusSidebarView';
import { GameSettingKeys, LEGACY_GAME_SETTING_KEYS, loadGameConfigurationKeys } from './configKeys';
import { CompilerSettingsSnapshot } from './papyrusConfigTypes';
import { runWorkspaceSetupWizard } from './workspaceSetup';
import { ControlCenterPanel } from './controlCenterPanel';

interface DefaultProfileData {
  scriptPaths: string[];
  compiler: {
    path: string;
    args: string[];
    includeFlags: string[];
    cwd: string;
  };
}

const DEFAULT_PROFILE_DATA: Record<GameProfileKey, DefaultProfileData> = {
  skyrim: {
    scriptPaths: [
      'C:/Program Files (x86)/Steam/steamapps/common/Skyrim/Data/Scripts/Source',
      'C:/Program Files/Steam/steamapps/common/Skyrim/Data/Scripts/Source',
      'C:/SteamLibrary/steamapps/common/Skyrim/Data/Scripts/Source',
      'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
      'C:/Program Files/Steam/steamapps/common/Skyrim Special Edition/Data/Scripts/Source',
      'C:/SteamLibrary/steamapps/common/Skyrim Special Edition/Data/Scripts/Source'
    ],
    compiler: {
      path: 'C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition/Papyrus Compiler/PapyrusCompiler.exe',
      args: ['-optimize'],
      includeFlags: [],
      cwd: ''
    }
  },
  fallout: {
    scriptPaths: [
      'C:/Program Files (x86)/Steam/steamapps/common/Fallout 4/Data/Scripts/Source',
      'C:/Program Files/Steam/steamapps/common/Fallout 4/Data/Scripts/Source',
      'C:/SteamLibrary/steamapps/common/Fallout 4/Data/Scripts/Source'
    ],
    compiler: {
      path: 'C:/Program Files (x86)/Steam/steamapps/common/Fallout 4/Papyrus Compiler/PapyrusCompiler.exe',
      args: ['-optimize'],
      includeFlags: [],
      cwd: ''
    }
  },
  starfield: {
    scriptPaths: [
      'C:/Program Files (x86)/Steam/steamapps/common/Starfield/Data/Scripts/Source',
      'C:/Program Files/Steam/steamapps/common/Starfield/Data/Scripts/Source',
      'C:/SteamLibrary/steamapps/common/Starfield/Data/Scripts/Source'
    ],
    compiler: {
      path: 'C:/Program Files (x86)/Steam/steamapps/common/Starfield/Tools/Papyrus Compiler/PapyrusCompiler.exe',
      args: ['-optimize'],
      includeFlags: [],
      cwd: ''
    }
  }
};

const BASE_KEYWORDS = [
  'ScriptName', 'Extends', 'Import', 'Property', 'Function', 'EndFunction', 'Event', 'EndEvent',
  'If', 'ElseIf', 'Else', 'EndIf', 'While', 'EndWhile', 'Return', 'State', 'EndState', 'Goto', 'Auto',
  'Global', 'Native', 'Hidden', 'Conditional', 'ReadOnly', 'Const'
];

function getKeywordsForGame(game: GameProfile): string[] {
  const extras: string[] = [];
  // Structs are supported in Fallout 4 and Starfield
  if (game === 'Fallout' || game === 'Starfield') {
    extras.push('Struct', 'EndStruct');
  }
  return [...BASE_KEYWORDS, ...extras];
}

const PAPYRUS_TYPES = [
  'Bool', 'Int', 'Float', 'String', 'Var', 'Form', 'ObjectReference', 'Actor', 'Alias', 'Quest'
];

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: 'papyrus', scheme: '*' };
  const resourcesRoot = path.join(context.extensionPath, 'resources');

  registerPapyrusCommandsView(context);

  const getGame = (): GameProfile => {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const g = cfg.get<string>('defaultGame', 'Starfield');
    return SUPPORTED_GAMES.includes(g as GameProfile) ? (g as GameProfile) : 'Starfield';
  };

  const gameToProfileKey = (g: GameProfile): GameProfileKey => GAME_TO_PROFILE_KEY[g];

  const getGamesConfig = (cfg: vscode.WorkspaceConfiguration): Record<string, any> => {
    const raw = cfg.get<any>('games');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }
    return raw as Record<string, any>;
  };

  const getActiveProject = (): { name: string; namespace: string; outputDir: string } | undefined => {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const game = getGame();
    const gameKey = gameToProfileKey(game);
    const gamesRecord = getGamesConfig(cfg);
    const gameEntry = gamesRecord[gameKey];
    const namespaceDir = gameEntry?.namespaceDir?.trim();
    if (!namespaceDir) return undefined;
    const projects = cfg.get<unknown>('Projects') as any[];
    const project = projects?.find((p: any) => p.namespace === namespaceDir);
    if (!project) return undefined;
    const outputDir = gameEntry?.outputDir?.trim() || '';
    return { name: project.name, namespace: namespaceDir, outputDir };
  };

  // Status bar to show/switch game profile
  const gameStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  gameStatus.name = 'Papyrus Game Profile';
  gameStatus.command = 'papyrusTools.switchGame';
  const updateGameStatus = () => {
    const g = getGame();
    gameStatus.text = `$(tools) Papyrus: ${g}`;
    gameStatus.tooltip = 'Switch Papyrus game profile';
    gameStatus.show();
  };
  updateGameStatus();

  // Status bar to show/switch active project
  const projectStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  projectStatus.name = 'Papyrus Active Project';
  projectStatus.command = 'papyrusTools.switchProject';
  const updateProjectStatus = () => {
    const activeProjectName = getActiveProject()?.name;
    if (activeProjectName) {
      projectStatus.text = `$(folder) ${activeProjectName}`;
      projectStatus.tooltip = 'Switch active Papyrus project';
      projectStatus.show();
    } else {
      projectStatus.text = `$(folder) none`;
      projectStatus.tooltip = 'No active Papyrus project';
      projectStatus.show();
    }
  };
  updateProjectStatus();

  const getMergedGameConfig = (cfg: vscode.WorkspaceConfiguration, g: GameProfile): NormalizedGameSettings => {
    const gKey = gameToProfileKey(g);
    const configured = getConfiguredGameSettings(cfg, gKey);
    const defaults = DEFAULT_PROFILE_DATA[gKey];
    const scriptPaths = mergeUniquePaths(configured.scriptPaths, defaults?.scriptPaths ?? []);
    const compilerPath = configured.compiler.path || defaults?.compiler.path || '';
    return {
      scriptPaths,
      compiler: {
        path: compilerPath,
        args: [...configured.compiler.args],
        cwd: configured.compiler.cwd,
        includeFlags: [...configured.compiler.includeFlags]
      }
    };
  };

  // --- Simple Script Indexer ---
  type PapyrusParameterInfo = {
    name: string;
    type?: string;
    defaultValue?: string;
  };

  type PapyrusCallableInfo = {
    name: string;
    line: number;
    signature: string;
    parameters: PapyrusParameterInfo[];
    documentation?: string;
    returnType?: string;
    modifiers?: string[];
  };

  const GENERAL_PAPYRUS_SETTINGS: string[] = [
    'defaultGame',
    'compiler.includeFlag',
    'compiler.pathSeparator',
    'autoDetect.additionalBasePaths',
    'autoDetect.includeBothScriptPaths',
    'autoDetect.useLibraryFoldersVdf',
    'SetupWizard',
    'Projects'
  ];

  const clearPapyrusSettingsForTarget = async (target: vscode.ConfigurationTarget) => {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    for (const key of GENERAL_PAPYRUS_SETTINGS) {
      await cfg.update(key, undefined, target);
    }
    await cfg.update('games', undefined, target);

    for (const profileKey of Object.keys(GAME_SETTING_KEYS) as GameProfileKey[]) {
      const keys = GAME_SETTING_KEYS[profileKey];
      await updatePapyrusConfig(keys.scriptDirectory, undefined, target);
      await updatePapyrusConfig(keys.compilerDirectory, undefined, target);
      await updatePapyrusConfig(keys.compilerArgs, undefined, target);
      await updatePapyrusConfig(keys.compilerIncludeFlags, undefined, target);
      await updatePapyrusConfig(keys.namespaceDirectory, undefined, target);
      await updatePapyrusConfig(keys.outputDirectory, undefined, target);
      await updatePapyrusConfig(keys.autoDetect, undefined, target);
    }
  };

  const clearPapyrusSettings = async (targets: vscode.ConfigurationTarget[]) => {
    for (const target of targets) {
      await clearPapyrusSettingsForTarget(target);
    }
    await buildIndex();
  };

  type ScriptIndexEntry = {
    scriptName: string;
    extends?: string;
    documentation?: string;
    uri: vscode.Uri;
    functions: PapyrusCallableInfo[];
    events: PapyrusCallableInfo[];
  };
  let scriptIndex: Map<string, ScriptIndexEntry> = new Map(); // key: lowercased script name

  const escapeMarkdown = (text: string): string => text.replace(/[\\`*_{}#+\-|!]/g, '\\$&');

  const buildCallableSignature = (callable: PapyrusCallableInfo, kind: 'Function' | 'Event'): string => {
    const params = callable.parameters.map(param => {
      const pieces = [] as string[];
      if (param.type) pieces.push(param.type);
      pieces.push(param.name);
      if (param.defaultValue) pieces.push(`= ${param.defaultValue}`);
      return pieces.join(' ');
    }).join(', ');
    const modifiers = callable.modifiers?.length ? ` ${callable.modifiers.join(' ')}` : '';
    const returnPart = callable.returnType ? `${callable.returnType} ` : 'Function ';
    const head = kind === 'Event' ? `Event ${callable.name}` : `${returnPart}${callable.name}`;
    return `${head}(${params})${modifiers}`.trim();
  };

  const parseParameters = (raw: string): PapyrusParameterInfo[] => {
    if (!raw.trim()) return [];
    return raw.split(',').map(segment => {
      const part = segment.trim();
      if (!part) return { name: '' };
      const [lhs, rhs] = part.split('=').map(p => p.trim());
      const tokens = lhs.split(/\s+/).filter(Boolean);
      const name = tokens.pop() || '';
      const type = tokens.join(' ') || undefined;
      return {
        name,
        type,
        defaultValue: rhs || undefined
      } satisfies PapyrusParameterInfo;
    }).filter(param => param.name !== '');
  };

  const stripInlineComments = (text: string): string => {
    const semiIndex = text.indexOf(';');
    if (semiIndex >= 0) return text.slice(0, semiIndex);
    const slashIndex = text.indexOf('//');
    if (slashIndex >= 0) return text.slice(0, slashIndex);
    return text;
  };

  const extractDocBlock = (lines: string[], startLine: number): string | undefined => {
    const docLines: string[] = [];
    for (let i = startLine - 1; i >= 0; i--) {
      const raw = lines[i];
      if (!raw.trim()) {
        if (docLines.length > 0) break;
        continue;
      }
      const trimmed = raw.trim();
      const commentMatch = /^;+\s?(.*)$/.exec(trimmed) || /^\/\/\s?(.*)$/.exec(trimmed);
      if (commentMatch) {
        docLines.unshift(commentMatch[1]);
        continue;
      }
      if (/^\{/.test(trimmed) || /^}/.test(trimmed)) {
        // Skip accidental block comment delimiters without including them
        continue;
      }
      break;
    }
    if (docLines.length === 0) return undefined;
    return docLines.join('\n');
  };

  const parsePapyrus = (uri: vscode.Uri, content: string): ScriptIndexEntry | undefined => {
    const scriptNameMatch = /\bScriptName\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:extends\s+([A-Za-z_][A-Za-z0-9_]*))?/i.exec(content);
    if (!scriptNameMatch) return undefined;

    const lines = content.split(/\r?\n/);
    const functions: PapyrusCallableInfo[] = [];
    const events: PapyrusCallableInfo[] = [];
    const functionRegex = /^\s*(?:(?<ret>[A-Za-z_][A-Za-z0-9_]*\s*(?:\[\])?)\s+)?Function\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\((?<params>[^)]*)\)\s*(?<tail>.*)$/i;
    const eventRegex = /^\s*Event\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\((?<params>[^)]*)\)\s*(?<tail>.*)$/i;

    let scriptDocumentation: string | undefined;
    const scriptLineIndex = lines.findIndex(line => /\bScriptName\b/i.test(line));
    if (scriptLineIndex > 0) {
      scriptDocumentation = extractDocBlock(lines, scriptLineIndex);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const functionMatch = functionRegex.exec(line);
      if (functionMatch && functionMatch.groups) {
        const params = parseParameters(functionMatch.groups.params || '');
        const tail = stripInlineComments(functionMatch.groups.tail || '');
        const modifiers = tail.split(/\s+/).map(t => t.trim()).filter(Boolean);
        const returnType = functionMatch.groups.ret?.trim();
        const callable: PapyrusCallableInfo = {
          name: functionMatch.groups.name,
          line: i,
          parameters: params,
          returnType,
          modifiers,
          signature: '',
          documentation: extractDocBlock(lines, i)
        };
    callable.signature = buildCallableSignature(callable, 'Function');
        functions.push(callable);
        continue;
      }

      const eventMatch = eventRegex.exec(line);
      if (eventMatch && eventMatch.groups) {
        const params = parseParameters(eventMatch.groups.params || '');
        const tail = stripInlineComments(eventMatch.groups.tail || '');
        const modifiers = tail.split(/\s+/).map(t => t.trim()).filter(Boolean);
        const callable: PapyrusCallableInfo = {
          name: eventMatch.groups.name,
          line: i,
          parameters: params,
          modifiers,
          signature: '',
          documentation: extractDocBlock(lines, i)
        };
    callable.signature = buildCallableSignature(callable, 'Event');
        events.push(callable);
      }
    }

    return {
      scriptName: scriptNameMatch[1],
      extends: scriptNameMatch[2],
      documentation: scriptDocumentation,
      uri,
      functions,
      events
    };
  };

  const getBundledPapyrusRoots = (game: GameProfile): string[] => {
    if (!fs.existsSync(resourcesRoot)) return [];
    const relsByGame: Record<GameProfile, string[]> = {
      Skyrim: ['SkyrimSE/vanilla'],
      Fallout: ['Fallout4/vanilla'],
      Starfield: ['Starfield/vanilla', 'Starfield/sfse', 'Starfield/ini-manipulator']
    };
    const rels = relsByGame[game] || [];
    const roots: string[] = [];
    for (const rel of rels) {
      const full = path.join(resourcesRoot, rel);
      if (fs.existsSync(full)) roots.push(full);
    }
    return roots;
  };

  const enumeratePapyrusFiles = (roots: string[]): string[] => {
    const files: string[] = [];
    const stack = [...roots];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const full = path.join(current, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
          stack.push(full);
        } else if (ent.isFile() && /\.psc$/i.test(ent.name)) {
          files.push(full);
        }
      }
    }
    return files;
  };

  const loadBundledScripts = (game: GameProfile) => {
    const roots = getBundledPapyrusRoots(game);
    if (roots.length === 0) return;
    const files = enumeratePapyrusFiles(roots);
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const entry = parsePapyrus(vscode.Uri.file(file), content);
        if (!entry) continue;
        const key = entry.scriptName.toLowerCase();
        if (!scriptIndex.has(key)) {
          scriptIndex.set(key, entry);
        }
      } catch {
        // ignore unreadable files
      }
    }
  };

  const buildCallableSnippet = (callable: PapyrusCallableInfo): vscode.SnippetString => {
    if (callable.parameters.length === 0) {
      return new vscode.SnippetString(`${callable.name}()$0`);
    }
    const placeholders = callable.parameters.map((param, idx) => {
      const placeholderName = param.name || `param${idx + 1}`;
      return `\${${idx + 1}:${placeholderName}}`;
    }).join(', ');
    return new vscode.SnippetString(`${callable.name}(${placeholders})$0`);
  };

  const renderCallableMarkdown = (kind: 'Function' | 'Event', callable: PapyrusCallableInfo, scriptEntry: ScriptIndexEntry): vscode.MarkdownString => {
    const md = new vscode.MarkdownString();
    md.isTrusted = false;
    const rel = vscode.workspace.asRelativePath(scriptEntry.uri, false);
    const signature = escapeMarkdown(callable.signature || `${callable.name}()`);
    md.appendMarkdown(`**${kind}** \`${escapeMarkdown(callable.name)}\``);
    md.appendMarkdown(`\nDefined in \`${escapeMarkdown(scriptEntry.scriptName)}.psc\` — ${escapeMarkdown(rel)} (line ${callable.line + 1})`);
    if (signature) {
      md.appendMarkdown(`\n\n\`\`\`papyrus\n${signature}\n\`\`\``);
    }
    if (callable.parameters.length > 0) {
      md.appendMarkdown(`\n\n**Parameters**`);
      for (const param of callable.parameters) {
        const typePart = param.type ? `: \`${escapeMarkdown(param.type)}\`` : '';
        const optionalPart = param.defaultValue ? ' *(optional)*' : '';
        const defaultPart = param.defaultValue ? ` (default \`${escapeMarkdown(param.defaultValue)}\`)` : '';
        md.appendMarkdown(`\n- \`${escapeMarkdown(param.name)}\`${typePart}${optionalPart}${defaultPart}`);
      }
    }
    if (callable.returnType) {
      md.appendMarkdown(`\n\n**Returns** \`${escapeMarkdown(callable.returnType)}\``);
    }
    if (callable.documentation) {
      md.appendMarkdown(`\n\n${escapeMarkdown(callable.documentation).replace(/\n/g, '\n\n')}`);
    }
    if (callable.modifiers && callable.modifiers.length > 0) {
      md.appendMarkdown(`\n\nModifiers: ${callable.modifiers.map(mod => `\`${escapeMarkdown(mod)}\``).join(' ')}`);
    }
    return md;
  };

  const buildIndex = async () => {
    scriptIndex = new Map();
    const game = getGame();
    loadBundledScripts(game);
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const merged = getMergedGameConfig(cfg, game);
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

  const mergeUniquePaths = (existing: string[] = [], additions: string[] = []) => {
    const out = [...existing];
    for (const candidate of additions) {
      if (!candidate) continue;
      if (!out.some(p => p.toLowerCase() === candidate.toLowerCase())) {
        out.push(candidate);
      }
    }
    return out;
  };

  let GAME_SETTING_KEYS: Record<GameProfileKey, GameSettingKeys> = { ...LEGACY_GAME_SETTING_KEYS };
  try {
    GAME_SETTING_KEYS = loadGameConfigurationKeys(context.extensionPath);
  } catch (error) {
    console.warn('[Papyrus Tools] Falling back to legacy configuration key map:', error);
  }
  for (const profileKey of Object.keys(GAME_SETTING_KEYS) as GameProfileKey[]) {
    const mapping = GAME_SETTING_KEYS[profileKey];
    const missing: string[] = [];
    if (!mapping.scriptDirectory) missing.push('ScriptSourceDirectory');
    if (!mapping.compilerDirectory) missing.push('CompilerDirectory');
    if (missing.length) {
      console.warn(`[Papyrus Tools] Configuration mapping for ${profileKey} is missing: ${missing.join(', ')}`);
    }
  }

  const updatePapyrusConfig = async (key: string | undefined, value: any, target: vscode.ConfigurationTarget) => {
    if (!key) return false;
    const fullKey = key.startsWith('papyrusTools.') ? key : `papyrusTools.${key}`;
    const inspected = vscode.workspace.getConfiguration().inspect(fullKey);
    if (!inspected) {
      console.warn(`[Papyrus Tools] Skip update for ${fullKey}: setting is not contributed`);
      return false;
    }
    try {
      await vscode.workspace.getConfiguration().update(fullKey, value, target);
      return true;
    } catch (error: any) {
      if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
        console.warn(`[Papyrus Tools] Skip update for ${fullKey}: ${error.message}`, error);
        return false;
      }
      throw error;
    }
  };

  const clearWorkspaceConfigValue = async (key: string | undefined, expected: string | string[]) => {
    if (!key) return;
    const fullKey = key.startsWith('papyrusTools.') ? key : `papyrusTools.${key}`;
    const inspected = vscode.workspace.getConfiguration().inspect<any>(fullKey);
    if (!inspected) return;
    const current = inspected.workspaceValue;
    if (current === undefined) return;

    if (Array.isArray(expected)) {
      const workspaceArray = sanitizeStringArray(Array.isArray(current) ? current : []);
      if (workspaceArray.length === 0 || arraysEqual(workspaceArray, sanitizeStringArray(expected))) {
        await vscode.workspace.getConfiguration().update(fullKey, undefined, vscode.ConfigurationTarget.Workspace);
      }
      return;
    }

    const workspaceValue = typeof current === 'string' ? current.trim() : '';
    const expectedValue = (expected || '').trim();
    if (!workspaceValue || workspaceValue.toLowerCase() === expectedValue.toLowerCase()) {
      await vscode.workspace.getConfiguration().update(fullKey, undefined, vscode.ConfigurationTarget.Workspace);
    }
  };

  const pruneWorkspaceGamesEntry = async (
    cfg: vscode.WorkspaceConfiguration,
    profileKey: GameProfileKey
  ) => {
    const inspected = cfg.inspect<any>('games');
    if (!inspected) return;
    const workspaceValue = inspected.workspaceValue;
    if (workspaceValue === undefined) return;

    if (!workspaceValue || typeof workspaceValue !== 'object' || Array.isArray(workspaceValue)) {
      if (workspaceValue !== undefined) {
        await cfg.update('games', undefined, vscode.ConfigurationTarget.Workspace);
      }
      return;
    }

    const workspaceGames = { ...workspaceValue } as Record<string, unknown>;
    if (workspaceGames[profileKey] !== undefined) {
      delete workspaceGames[profileKey];
      await cfg.update('games', Object.keys(workspaceGames).length ? workspaceGames : undefined, vscode.ConfigurationTarget.Workspace);
      return;
    }

    if (Object.keys(workspaceGames).length === 0) {
      await cfg.update('games', undefined, vscode.ConfigurationTarget.Workspace);
    }
  };

  type NormalizedGameSettings = CompilerSettingsSnapshot;

  const cloneNormalized = (settings: NormalizedGameSettings): NormalizedGameSettings => ({
    scriptPaths: [...settings.scriptPaths],
    compiler: {
      path: settings.compiler.path,
      args: [...settings.compiler.args],
      cwd: settings.compiler.cwd,
      includeFlags: [...settings.compiler.includeFlags]
    }
  });

  const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

  const normalizedEquals = (a: NormalizedGameSettings, b: NormalizedGameSettings) =>
    arraysEqual(a.scriptPaths, b.scriptPaths) &&
    a.compiler.path === b.compiler.path &&
    arraysEqual(a.compiler.args, b.compiler.args) &&
    arraysEqual(a.compiler.includeFlags, b.compiler.includeFlags) &&
    a.compiler.cwd === b.compiler.cwd;

  const sanitizeStringArray = (input: any): string[] => {
    if (!Array.isArray(input)) return [];
    const out: string[] = [];
    for (const value of input) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed) out.push(trimmed);
    }
    return out;
  };

  const mergeUniqueStrings = (existing: string[] = [], additions: string[] = []) => {
    const out = [...existing];
    for (const value of additions) {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      if (!trimmed) continue;
      if (!out.includes(trimmed)) {
        out.push(trimmed);
      }
    }
    return out;
  };

  const getGamesEntry = (cfg: vscode.WorkspaceConfiguration, profileKey: GameProfileKey): any | undefined => {
    const games = getGamesConfig(cfg);
    const entry = games[profileKey];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return undefined;
    }
    return entry;
  };

  const getConfiguredGameSettings = (cfg: vscode.WorkspaceConfiguration, profileKey: GameProfileKey): NormalizedGameSettings => {
    const keys = GAME_SETTING_KEYS[profileKey];
    const gamesEntry = getGamesEntry(cfg, profileKey);
    const gamesCompiler = gamesEntry?.compiler && typeof gamesEntry.compiler === 'object' ? gamesEntry.compiler : undefined;

    let scriptPaths = mergeUniquePaths([], sanitizeStringArray(gamesEntry?.scriptPaths));
    if (keys.scriptDirectory) {
      const scriptDir = cfg.get<string>(keys.scriptDirectory)?.trim();
      if (scriptDir) {
        scriptPaths = mergeUniquePaths(scriptPaths, [scriptDir]);
      }
    }

    const compilerPathFromGames = typeof gamesCompiler?.path === 'string' ? gamesCompiler.path.trim() : '';
    const compilerPathTop = keys.compilerDirectory ? (cfg.get<string>(keys.compilerDirectory)?.trim() || '') : '';
    const compilerPath = compilerPathTop || compilerPathFromGames;

    const argsFromGames = sanitizeStringArray(gamesCompiler?.args);
    const argsFromConfig = keys.compilerArgs ? sanitizeStringArray(cfg.get<string[]>(keys.compilerArgs)) : [];
    const compilerArgs = mergeUniqueStrings(argsFromGames, argsFromConfig);

    const includeFromGames = sanitizeStringArray(gamesCompiler?.includeFlags);
    const includeFromConfig = keys.compilerIncludeFlags ? sanitizeStringArray(cfg.get<string[]>(keys.compilerIncludeFlags)) : [];
    const compilerIncludeFlags = mergeUniqueStrings(includeFromGames, includeFromConfig);

    const compilerCwd = typeof gamesCompiler?.cwd === 'string' ? gamesCompiler.cwd.trim() : '';

    return {
      scriptPaths,
      compiler: {
        path: compilerPath,
        args: compilerArgs,
        cwd: compilerCwd,
        includeFlags: compilerIncludeFlags
      }
    } satisfies NormalizedGameSettings;
  };

  const updatePapyrusGamesEntry = async (
    cfg: vscode.WorkspaceConfiguration,
    target: vscode.ConfigurationTarget,
    profileKey: GameProfileKey,
    settings: NormalizedGameSettings
  ) => {
    const sanitizedScriptPaths = mergeUniquePaths([], sanitizeStringArray(settings.scriptPaths));
    const sanitizedArgs = mergeUniqueStrings([], sanitizeStringArray(settings.compiler.args));
    const sanitizedIncludeFlags = mergeUniqueStrings([], sanitizeStringArray(settings.compiler.includeFlags));
    const normalizedPath = (settings.compiler.path || '').trim();
    const normalizedCwd = (settings.compiler.cwd || '').trim();

    const current = getGamesConfig(cfg);
    const existingEntryRaw = current[profileKey];
    const nextGames = { ...current };
    const nextEntry = existingEntryRaw && typeof existingEntryRaw === 'object' && !Array.isArray(existingEntryRaw)
      ? { ...existingEntryRaw }
      : {};

    if (sanitizedScriptPaths.length > 0) {
      nextEntry.scriptPaths = sanitizedScriptPaths;
    } else {
      delete nextEntry.scriptPaths;
    }

    const existingCompiler = nextEntry.compiler && typeof nextEntry.compiler === 'object' && !Array.isArray(nextEntry.compiler)
      ? { ...nextEntry.compiler }
      : {};
    const compilerPayload: Record<string, any> = { ...existingCompiler };

    if (normalizedPath) {
      compilerPayload.path = normalizedPath;
    } else {
      delete compilerPayload.path;
    }

    if (sanitizedArgs.length > 0) {
      compilerPayload.args = sanitizedArgs;
    } else {
      delete compilerPayload.args;
    }

    if (normalizedCwd) {
      compilerPayload.cwd = normalizedCwd;
    } else {
      delete compilerPayload.cwd;
    }

    if (sanitizedIncludeFlags.length > 0) {
      compilerPayload.includeFlags = sanitizedIncludeFlags;
    } else {
      delete compilerPayload.includeFlags;
    }

    if (Object.keys(compilerPayload).length > 0) {
      nextEntry.compiler = compilerPayload;
    } else {
      delete nextEntry.compiler;
    }

    let changed = false;
    if (Object.keys(nextEntry).length === 0) {
      if (profileKey in nextGames) {
        delete nextGames[profileKey];
        changed = true;
      }
    } else {
      const existingJson = existingEntryRaw && typeof existingEntryRaw === 'object' && !Array.isArray(existingEntryRaw)
        ? JSON.stringify(existingEntryRaw)
        : undefined;
      const nextJson = JSON.stringify(nextEntry);
      if (existingJson !== nextJson) {
        nextGames[profileKey] = nextEntry;
        changed = true;
      }
    }

    if (!changed) {
      return false;
    }

    try {
      await cfg.update('games', nextGames, target);
      return true;
    } catch (error: any) {
      if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
        console.warn(`[Papyrus Tools] Skip update for papyrusTools.games.${profileKey}: ${error.message}`, error);
        return false;
      }
      throw error;
    }
  };

  const applyGameSettings = async (
    cfg: vscode.WorkspaceConfiguration,
    target: vscode.ConfigurationTarget,
    profileKey: GameProfileKey,
    settings: NormalizedGameSettings
  ) => {
    const keys = GAME_SETTING_KEYS[profileKey];
    const primaryScript = settings.scriptPaths[0]?.trim() || '';
    await updatePapyrusConfig(keys.scriptDirectory, primaryScript, target);
    await updatePapyrusConfig(keys.compilerDirectory, settings.compiler.path || '', target);
    await updatePapyrusConfig(keys.compilerArgs, [...settings.compiler.args], target);
    await updatePapyrusConfig(keys.compilerIncludeFlags, [...settings.compiler.includeFlags], target);
    await updatePapyrusGamesEntry(cfg, target, profileKey, settings);
    if (target === vscode.ConfigurationTarget.Global) {
      await clearWorkspaceConfigValue(keys.scriptDirectory, primaryScript);
      await clearWorkspaceConfigValue(keys.compilerDirectory, settings.compiler.path || '');
      await clearWorkspaceConfigValue(keys.compilerArgs, [...settings.compiler.args]);
      await clearWorkspaceConfigValue(keys.compilerIncludeFlags, [...settings.compiler.includeFlags]);
      await pruneWorkspaceGamesEntry(cfg, profileKey);
    }
  };

  const updateGameSettingsEntry = async (
    cfg: vscode.WorkspaceConfiguration,
    target: vscode.ConfigurationTarget,
    profileKey: GameProfileKey,
    mutator: (current: NormalizedGameSettings) => NormalizedGameSettings | null
  ): Promise<boolean> => {
    const current = getConfiguredGameSettings(cfg, profileKey);
    const updated = mutator(cloneNormalized(current));
    if (!updated || normalizedEquals(current, updated)) return false;
    await applyGameSettings(cfg, target, profileKey, updated);
    return true;
  };

  const applyDefaultProfile = async (
    game: GameProfile,
    options: { forceCompilerPath?: boolean; rebuildIndex?: boolean; notify?: boolean } = {}
  ): Promise<boolean> => {
    const { forceCompilerPath = false, rebuildIndex = true, notify = false } = options;
    const profileKey = gameToProfileKey(game);
    const defaults = DEFAULT_PROFILE_DATA[profileKey];
    if (!defaults) return false;

    const cfg = vscode.workspace.getConfiguration('papyrusTools');
  const target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;
    const keys = GAME_SETTING_KEYS[profileKey];
    const scriptConfigValue = keys.scriptDirectory ? (cfg.get<string>(keys.scriptDirectory)?.trim() || '') : '';
    const compilerConfigValue = keys.compilerDirectory ? (cfg.get<string>(keys.compilerDirectory)?.trim() || '') : '';

    const gameChanged = await updateGameSettingsEntry(cfg, target, profileKey, current => {
      const next = cloneNormalized(current);
      let changed = false;
      if ((!scriptConfigValue && defaults.scriptPaths.length > 0) || (next.scriptPaths.length === 0 && defaults.scriptPaths.length > 0)) {
        next.scriptPaths = [defaults.scriptPaths[0]];
        changed = true;
      }
      if (defaults.scriptPaths.length > 0) {
        const primaryDefault = defaults.scriptPaths[0];
        const normalizedDefault = primaryDefault.toLowerCase();
        const scriptConfigLower = (scriptConfigValue || '').toLowerCase();
        const shouldEnsureDefault = !scriptConfigLower || scriptConfigLower === normalizedDefault;
        if (shouldEnsureDefault) {
          const mergedScripts = mergeUniquePaths(next.scriptPaths, [primaryDefault]);
          if (!arraysEqual(next.scriptPaths, mergedScripts)) {
            next.scriptPaths = mergedScripts;
            changed = true;
          }
        }
      }
      const nextCompiler = (next.compiler.path || '').toLowerCase();
      const defaultCompiler = (defaults.compiler.path || '').toLowerCase();
      if (((forceCompilerPath || !compilerConfigValue) && defaultCompiler && nextCompiler !== defaultCompiler) || (!next.compiler.path && defaults.compiler.path)) {
        next.compiler.path = defaults.compiler.path;
        changed = true;
      }
      if (next.compiler.args.length === 0 && defaults.compiler.args.length > 0) {
        next.compiler.args = [...defaults.compiler.args];
        changed = true;
      }
      if (next.compiler.includeFlags.length === 0 && defaults.compiler.includeFlags.length > 0) {
        next.compiler.includeFlags = [...defaults.compiler.includeFlags];
        changed = true;
      }
      if (!next.compiler.cwd && defaults.compiler.cwd) {
        next.compiler.cwd = defaults.compiler.cwd;
        changed = true;
      }
      return changed ? next : null;
    });

    const changed = gameChanged;
    if (changed && rebuildIndex) {
      await buildIndex();
    }
    if (changed && notify) {
      vscode.window.showInformationMessage(`Papyrus: Applied default settings for ${game}.`);
    }
    return changed;
  };
  // Apply defaults for the active game and build the initial index (non-blocking)
  void (async () => {
    await applyDefaultProfile(getGame(), { rebuildIndex: false });
    await buildIndex();
  })();

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    selector,
    {
      provideCompletionItems(document, position) {
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

        if (getGame() === 'Starfield' && scriptIndex.size > 0) {
          const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
          const match = /([A-Za-z_][A-Za-z0-9_]*)\.\s*([A-Za-z_][A-Za-z0-9_]*)?$/.exec(linePrefix);
          if (match) {
            const scriptToken = match[1].toLowerCase();
            const entry = scriptIndex.get(scriptToken);
            if (entry) {
              const replaceRange = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
              const seen = new Set<string>();
              for (const fn of entry.functions) {
                const lower = fn.name.toLowerCase();
                if (seen.has(lower)) continue;
                seen.add(lower);
                const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Method);
                item.detail = fn.signature || `${entry.scriptName}.${fn.name}`;
                item.insertText = buildCallableSnippet(fn);
                item.documentation = renderCallableMarkdown('Function', fn, entry);
                if (replaceRange) item.range = replaceRange;
                item.sortText = `0_${fn.name}`;
                items.push(item);
              }
              for (const ev of entry.events) {
                const lower = ev.name.toLowerCase();
                if (seen.has(lower)) continue;
                seen.add(lower);
                const item = new vscode.CompletionItem(ev.name, vscode.CompletionItemKind.Event);
                item.detail = ev.signature || `${entry.scriptName}.${ev.name}`;
                item.documentation = renderCallableMarkdown('Event', ev, entry);
                if (replaceRange) item.range = replaceRange;
                item.sortText = `0_${ev.name}`;
                items.push(item);
              }
            }
          }
        }
        return items;
      }
    }
  );

  const hoverProvider = vscode.languages.registerHoverProvider(selector, {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return undefined;
      const word = document.getText(range);
      const lower = word.toLowerCase();
      const allKeywords = getKeywordsForGame(getGame()).map(w => w.toLowerCase());
      if (allKeywords.includes(lower)) {
        return new vscode.Hover(new vscode.MarkdownString(`**Keyword** \`${word}\` — core Papyrus language construct.`), range);
      }
      if (PAPYRUS_TYPES.map(w => w.toLowerCase()).includes(lower)) {
        return new vscode.Hover(new vscode.MarkdownString(`**Type** \`${word}\` — built-in Papyrus type.`), range);
      }

      const scriptEntry = scriptIndex.get(lower);
      if (scriptEntry) {
        const location = vscode.workspace.asRelativePath(scriptEntry.uri, false);
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**Script** \`${escapeMarkdown(scriptEntry.scriptName)}\``);
        if (scriptEntry.extends) {
          md.appendMarkdown(`\nExtends: \`${escapeMarkdown(scriptEntry.extends)}\``);
        }
        md.appendMarkdown(`\nSource: ${escapeMarkdown(location)}`);
        if (scriptEntry.documentation) {
          md.appendMarkdown(`\n\n${escapeMarkdown(scriptEntry.documentation).replace(/\n/g, '\n\n')}`);
        }
        const fnCount = scriptEntry.functions.length;
        const evCount = scriptEntry.events.length;
        if (fnCount > 0 || evCount > 0) {
          md.appendMarkdown('\n\n---\n');
          if (fnCount > 0) {
            const fnList = scriptEntry.functions.slice(0, 6).map(fn => `- \`${escapeMarkdown(fn.signature || `${fn.name}()`)}\``).join('\n');
            md.appendMarkdown(`**Functions**\n${fnList}`);
            if (fnCount > 6) {
              md.appendMarkdown(`\n…(+${fnCount - 6} more)`);
            }
          }
          if (evCount > 0) {
            if (fnCount > 0) md.appendMarkdown('\n\n');
            const evList = scriptEntry.events.slice(0, 6).map(ev => `- \`${escapeMarkdown(ev.signature || ev.name)}\``).join('\n');
            md.appendMarkdown(`**Events**\n${evList}`);
            if (evCount > 6) {
              md.appendMarkdown(`\n…(+${evCount - 6} more)`);
            }
          }
        }
        md.isTrusted = false;
        return new vscode.Hover(md, range);
      }

      const functionHits: Array<{ entry: ScriptIndexEntry; kind: 'Function' | 'Event'; callable: PapyrusCallableInfo }> = [];
      for (const entry of scriptIndex.values()) {
        for (const fn of entry.functions) {
          if (fn.name.toLowerCase() === lower) {
            functionHits.push({ entry, kind: 'Function', callable: fn });
          }
        }
        for (const ev of entry.events) {
          if (ev.name.toLowerCase() === lower) {
            functionHits.push({ entry, kind: 'Event', callable: ev });
          }
        }
      }
      if (functionHits.length > 0) {
        const primary = functionHits[0];
        const md = renderCallableMarkdown(primary.kind, primary.callable, primary.entry);
        if (functionHits.length > 1) {
          md.appendMarkdown('\n\n---\n**Other matches**');
          const others = functionHits.slice(1).map(hit => {
            const rel = vscode.workspace.asRelativePath(hit.entry.uri, false);
            return `\n- ${escapeMarkdown(hit.entry.scriptName)}.psc (line ${hit.callable.line + 1}) — ${escapeMarkdown(rel)}`;
          }).join('');
          md.appendMarkdown(others);
        }
        return new vscode.Hover(md, range);
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
  const rebuildIndexCmd = vscode.commands.registerCommand('papyrusTools.rebuildIndex', async () => {
    await buildIndex();
    vscode.window.showInformationMessage('Papyrus script index rebuilt.');
  });

  const addScriptFolderCmd = vscode.commands.registerCommand('papyrusTools.addScriptFolder', async () => {
    const g = getGame();
    const key = GAME_TO_PROFILE_KEY[g];
    const uri = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: 'Select Script Folder' });
    if (!uri || uri.length === 0) return;
    const folder = uri[0].fsPath;
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
  const target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;
    await updateGameSettingsEntry(cfg, target, key, current => {
      if (current.scriptPaths.length === 1 && current.scriptPaths[0].toLowerCase() === folder.toLowerCase()) {
        return null;
      }
      const next = cloneNormalized(current);
      next.scriptPaths = [folder];
      return next;
    });
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
  const scanScriptsCmd = vscode.commands.registerCommand('papyrusTools.scanScriptsForDiagnostics', async () => {
    const out = vscode.window.createOutputChannel('Papyrus Scan');
    out.clear();
    out.appendLine('Papyrus scan started...');
  const cfg = vscode.workspace.getConfiguration('papyrusTools');
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
            } catch {
              // Ignore file read errors during scanning
            }
          }
        }
      } catch {
        // Ignore scanning errors
      }
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

  // Compile command: simple one-click with build type selection
  const compileCmd = vscode.commands.registerCommand('papyrusTools.compileFile', async () => {
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

    const buildType = await vscode.window.showQuickPick(['Release', 'Debug'], { placeHolder: 'Choose build type' });
    if (!buildType) return;

    const project = getActiveProject();
    if (!project) {
      vscode.window.showErrorMessage('No active project configured. Run the Setup Wizard first.');
      return;
    }

    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const game = getGame();
    const settings = getMergedGameConfig(cfg, game);
    const compilerPath = settings.compiler.path;
    if (!compilerPath || !fs.existsSync(compilerPath)) {
      vscode.window.showErrorMessage(`Compiler not found for ${game}. Configure paths first.`);
      return;
    }

    await doc.save();

    const flags: string[] = [];
    if (buildType === 'Release') flags.push('-optimize');
    if (buildType === 'Debug') flags.push('-debug');

    const extensionResourcePath = path.join(resourcesRoot, game.toLowerCase(), 'vanilla');
    const scriptPaths = [project.namespace, extensionResourcePath, ...settings.scriptPaths.filter(p => p !== project.namespace)].filter(p => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });
    const includeArg = `-i="${scriptPaths.join(';')}"`;

    const relativeDir = path.relative(project.namespace, path.dirname(doc.uri.fsPath));
    const outputDir = path.join(project.outputDir, relativeDir);
    const outputArg = `-o="${outputDir}"`;

    const args = [doc.uri.fsPath, includeArg, outputArg, ...flags];
    const cwd = path.dirname(doc.uri.fsPath);

    const startProcessArgs = args.map(arg => `"${arg.replace(/"/g, '""')}"`).join(', ');
    const powershellCommand = `Start-Process -FilePath "${compilerPath.replace(/"/g, '""')}" -ArgumentList ${startProcessArgs} -NoNewWindow -Wait`;

    const terminal = vscode.window.createTerminal({ name: `Papyrus Compile (${game})`, cwd });
    terminal.sendText(powershellCommand);
    terminal.show();

    vscode.window.showInformationMessage(`Compiling ${path.basename(doc.uri.fsPath)} in ${buildType} mode.`);
  });

  // Compile entire project command
  const compileProjectCmd = vscode.commands.registerCommand('papyrusTools.compileProject', async () => {
    const buildType = await vscode.window.showQuickPick(['Release', 'Debug'], { placeHolder: 'Choose build type for project compilation' });
    if (!buildType) return;

    const project = getActiveProject();
    if (!project) {
      vscode.window.showErrorMessage('No active project configured. Run the Setup Wizard first.');
      return;
    }

    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const game = getGame();
    const settings = getMergedGameConfig(cfg, game);
    const compilerPath = settings.compiler.path;
    if (!compilerPath || !fs.existsSync(compilerPath)) {
      vscode.window.showErrorMessage(`Compiler not found for ${game}. Configure paths first.`);
      return;
    }

    // Find all .psc files in project namespace
    const pscFiles: string[] = [];
    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            if (ent.name !== 'node_modules' && !ent.name.startsWith('.')) {
              walk(full);
            }
          } else if (ent.isFile() && /\.psc$/i.test(ent.name)) {
            pscFiles.push(full);
          }
        }
      } catch {}
    };
    walk(project.namespace);

    if (pscFiles.length === 0) {
      vscode.window.showInformationMessage('No .psc files found in the project.');
      return;
    }

    const flags: string[] = [];
    if (buildType === 'Release') flags.push('-optimize');
    if (buildType === 'Debug') flags.push('-debug');

    const extensionResourcePath = path.join(resourcesRoot, game.toLowerCase(), 'vanilla');
    const scriptPaths = [project.namespace, extensionResourcePath, ...settings.scriptPaths.filter(p => p !== project.namespace)].filter(p => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });
    const includeArg = `-i="${scriptPaths.join(';')}"`;

    const terminal = vscode.window.createTerminal({ name: `Papyrus Compile Project (${game})`, cwd: project.namespace });

    for (const pscFile of pscFiles) {
      const relativeDir = path.relative(project.namespace, path.dirname(pscFile));
      const outputDir = path.join(project.outputDir, relativeDir);
      const outputArg = `-o="${outputDir}"`;
      const args = [pscFile, includeArg, outputArg, ...flags];
      const startProcessArgs = args.map(arg => `"${arg.replace(/"/g, '""')}"`).join(', ');
      const powershellCommand = `Start-Process -FilePath "${compilerPath.replace(/"/g, '""')}" -ArgumentList ${startProcessArgs} -NoNewWindow -Wait`;
      terminal.sendText(powershellCommand);
    }

    terminal.show();
    vscode.window.showInformationMessage(`Compiling ${pscFiles.length} files in ${project.name} project (${buildType} mode).`);
  });

  // Configure script folders command: sets per-game include paths
  const configureScriptFoldersCmd = vscode.commands.registerCommand('papyrusTools.configureScriptFolders', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrusTools');

    // Helper to push a unique path to scriptPaths array for a profile key
  const pushScriptPath = async (profileKey: 'starfield' | 'fallout', newPath: string) => {
      const trimmed = newPath.trim();
      if (!trimmed) return;
      await updateGameSettingsEntry(cfg, target, profileKey, current => {
        if (current.scriptPaths.length === 1 && current.scriptPaths[0].toLowerCase() === trimmed.toLowerCase()) {
          return null;
        }
        const next = cloneNormalized(current);
        next.scriptPaths = [trimmed];
        return next;
      });
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
  await pushScriptPath('fallout', fo4Path.trim());
    }

    vscode.window.showInformationMessage('Papyrus script folders updated (where provided).');
  });

  // Configure compilers command: prompts for known paths per installed games
  const configureCompilersCmd = vscode.commands.registerCommand('papyrusTools.configureCompilers', async () => {
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrusTools');

    // Helper to update a nested setting under papyrusTools.games
  const updateGameCompiler = async (profileKey: 'starfield' | 'fallout', pathValue: string) => {
      const trimmed = pathValue.trim();
      if (!trimmed) return;
      await updateGameSettingsEntry(cfg, target, profileKey, current => {
        if (current.compiler.path === trimmed) return null;
        const next = cloneNormalized(current);
        next.compiler.path = trimmed;
        return next;
      });
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
  await updateGameCompiler('fallout', fo4Path.trim());
    }

    vscode.window.showInformationMessage('Papyrus compiler paths updated (where provided).');
  });

  const setupWorkspaceProfileCmd = vscode.commands.registerCommand('papyrusTools.setupWorkspaceProfile', async () => {
    await runWorkspaceSetupWizard();
  });

  const clearStoredSettingsCmd = vscode.commands.registerCommand('papyrusTools.clearStoredSettings', async () => {
    const workspaceAvailable = !!vscode.workspace.workspaceFolders?.length;
    const scopeOptions: Array<{ label: string; detail: string; targets: vscode.ConfigurationTarget[] }> = [];

    if (workspaceAvailable) {
      scopeOptions.push({
        label: 'Workspace Only',
        detail: 'Remove Papyrus settings stored in the current workspace folder.',
        targets: [vscode.ConfigurationTarget.Workspace]
      });
    }

    scopeOptions.push({
      label: 'User Settings Only',
      detail: 'Remove Papyrus settings stored in your global/user profile.',
      targets: [vscode.ConfigurationTarget.Global]
    });

    if (workspaceAvailable) {
      scopeOptions.push({
        label: 'Workspace + User Settings',
        detail: 'Clear Papyrus settings from both workspace and user scopes.',
        targets: [vscode.ConfigurationTarget.Workspace, vscode.ConfigurationTarget.Global]
      });
    }

    const pick = await vscode.window.showQuickPick(scopeOptions, {
      placeHolder: 'Select which Papyrus settings scope you want to clear.'
    });

    if (!pick) {
      return;
    }

    try {
      await clearPapyrusSettings(pick.targets);
      vscode.window.showInformationMessage(`Papyrus: Cleared stored settings (${pick.label}).`);
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Papyrus: Failed to clear settings – ${message}`);
    }
  });

  const openControlCenterCmd = vscode.commands.registerCommand('papyrusTools.openControlCenter', () => {
    ControlCenterPanel.createOrShow(context);
  });

  // Open Settings for current game
  const openCurrentGameSettingsCmd = vscode.commands.registerCommand('papyrusTools.openCurrentGameSettings', async () => {
    const g = getGame();
    const tl = ((): string => {
      switch (g) {
        case 'Starfield': return 'papyrusTools.starfield';
        case 'Fallout': return 'papyrusTools.Fallout';
        case 'Skyrim': return 'papyrusTools.Skyrim';
        default: return 'papyrusTools';
      }
    })();
    // First switch to Workspace settings tab, then apply filter query for our section
    await vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
    await vscode.commands.executeCommand('workbench.action.openSettings', tl);
  });

  // Open workspace settings JSON directly for transparency
  const openWorkspaceSettingsJsonCmd = vscode.commands.registerCommand('papyrusTools.openWorkspaceSettingsJson', async () => {
    await vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile');
  });

  // Export current game profile (merged) to JSON
  const exportCurrentProfileCmd = vscode.commands.registerCommand('papyrusTools.exportCurrentProfile', async () => {
    const g = getGame();
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
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
  const importProfileCmd = vscode.commands.registerCommand('papyrusTools.importProfile', async () => {
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
  const validGames: GameProfile[] = ['Skyrim','Fallout','Starfield'];
      if (!validGames.includes(game)) {
        vscode.window.showErrorMessage('Papyrus: Invalid or missing "game" in profile JSON.');
        return;
      }
      const scripts: string[] = Array.isArray(data?.scriptPaths) ? data.scriptPaths.filter((x: any) => typeof x === 'string' && x.trim()) : [];
      const compiler = data?.compiler || {};
      const includeFlag = typeof data?.includeFlag === 'string' ? data.includeFlag : undefined;
      const pathSeparator = typeof data?.pathSeparator === 'string' ? data.pathSeparator : undefined;

      const cfg = vscode.workspace.getConfiguration('papyrusTools');
      const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

      // Determine profile key for papyrusTools.games
  const profileKey = (game.toLowerCase() as 'skyrim'|'fallout'|'starfield');

      // Merge into papyrusTools.games[profileKey]
      const sanitizedScripts = sanitizeStringArray(scripts);
      await updateGameSettingsEntry(cfg, target, profileKey, current => {
        let changed = false;
        const next = cloneNormalized(current);
        if (sanitizedScripts.length) {
          const merged = mergeUniquePaths(next.scriptPaths, sanitizedScripts);
          if (!arraysEqual(next.scriptPaths, merged)) {
            next.scriptPaths = merged;
            changed = true;
          }
        }
        if (typeof compiler?.path === 'string') {
          const trimmed = compiler.path.trim();
          if (trimmed && next.compiler.path !== trimmed) {
            next.compiler.path = trimmed;
            changed = true;
          }
        }
        if (Array.isArray(compiler?.args)) {
          const args = sanitizeStringArray(compiler.args);
          if (!arraysEqual(next.compiler.args, args)) {
            next.compiler.args = args;
            changed = true;
          }
        }
        if (typeof compiler?.cwd === 'string') {
          const trimmedCwd = compiler.cwd.trim();
          if (trimmedCwd && next.compiler.cwd !== trimmedCwd) {
            next.compiler.cwd = trimmedCwd;
            changed = true;
          }
        }
        return changed ? next : null;
      });

      // Update top-level convenience if applicable

      // Optionally update global includeFlag and pathSeparator
      if (includeFlag) await cfg.update('compiler.includeFlag', includeFlag, target);
      if (pathSeparator) await cfg.update('compiler.pathSeparator', pathSeparator, target);

      // Optionally set active game to imported game
      const setActive = await vscode.window.showQuickPick([
        { label: `Set active profile to ${game}`, value: 'yes' },
        { label: 'Keep current active profile', value: 'no' }
      ], { placeHolder: 'Apply imported game as active profile?' });
      if (setActive?.value === 'yes') {
  await cfg.update('defaultGame', game, target);
        updateGameStatus();
      }

      await buildIndex();
      vscode.window.showInformationMessage(`Papyrus: Imported profile for ${game}.`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Papyrus: Import failed: ${e?.message || e}`);
    }
  });

  type AutoDetectOptions = {
    applyAll?: boolean;
    skipPrompts?: boolean;
    silent?: boolean;
  };

  // Auto-detect game installations (Steam) and configure compiler/script paths
  const autoDetectCmd = vscode.commands.registerCommand('papyrusTools.autoDetectGamePaths', async (options?: AutoDetectOptions) => {
    const applyAll = options?.applyAll === true;
    const skipPrompts = options?.skipPrompts === true;
    const silent = options?.silent === true;
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const autoCfg = (cfg.get<any>('autoDetect') || {});
    const envAdditionalRaw = process.env.PAPYRUS_AUTODETECT_BASE_PATHS;
    const envAdditional = envAdditionalRaw ? envAdditionalRaw.split(path.delimiter).map(p => p.trim()).filter(Boolean) : [];
    const additionalBasePaths: string[] = [
      ...(Array.isArray(autoCfg.additionalBasePaths) ? autoCfg.additionalBasePaths : []),
      ...envAdditional
    ];
    const envUseVdf = process.env.PAPYRUS_AUTODETECT_USE_VDF;
    const useVdf: boolean = envUseVdf !== undefined ? !/^(0|false|no)$/i.test(envUseVdf) : autoCfg.useLibraryFoldersVdf !== false; // default true
    const envIncludeBoth = process.env.PAPYRUS_AUTODETECT_INCLUDE_BOTH;
    const includeBothScriptPaths: boolean = envIncludeBoth !== undefined ? /^(1|true|yes)$/i.test(envIncludeBoth) : !!autoCfg.includeBothScriptPaths;
    const envOnly = process.env.PAPYRUS_AUTODETECT_ONLY;
    const normalizeProfileKey = (raw: string): GameProfileKey | undefined => {
      const lower = raw.trim().toLowerCase();
      if (!lower) return undefined;
      if (['skyrim', 'skyrimse', 'skyrimae'].includes(lower)) return 'skyrim';
      if (['fallout', 'fallout4', 'fallout76'].includes(lower)) return 'fallout';
      if (lower === 'starfield') return 'starfield';
      return undefined;
    };
    const onlyKeys = envOnly ? envOnly.split(',').map(normalizeProfileKey).filter((key): key is GameProfileKey => !!key) : undefined;
    const keyAllowed = (key: GameProfileKey) => !onlyKeys || onlyKeys.includes(key);
    const isEnabled = (...flags: Array<boolean | undefined>): boolean => flags.every(flag => flag !== false);
    const enableFlags: Record<GameProfileKey, boolean> = {
      skyrim: keyAllowed('skyrim') && isEnabled(autoCfg.enableSkyrim, autoCfg.enableSkyrimSE, autoCfg.enableSkyrimAE),
      fallout: keyAllowed('fallout') && isEnabled(autoCfg.enableFallout, autoCfg.enableFallout4, autoCfg.enableFallout76),
      starfield: keyAllowed('starfield') && isEnabled(autoCfg.enableStarfield)
    };

    type Detected = { compilerPath?: string; scriptPaths: string[] };
    const detected: Record<GameProfileKey, Detected> = {
      skyrim: { scriptPaths: [] },
      fallout: { scriptPaths: [] },
      starfield: { scriptPaths: [] }
    };
    const detectedRoots: Partial<Record<GameProfileKey, string>> = {};

    try {
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

      const tryRead = (p: string): string | undefined => {
        try { if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); } catch {} // eslint-disable-line no-empty
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

      const gameDirs: { profile: GameProfileKey; names: string[] }[] = [
        { profile: 'skyrim', names: ['Skyrim', 'Skyrim Special Edition', 'Skyrim Anniversary Edition'] },
        { profile: 'fallout', names: ['Fallout 4'] },
        { profile: 'starfield', names: ['Starfield'] }
      ];

    const findFirstExisting = (...candidatePaths: string[]): string | undefined => {
      for (const p of candidatePaths) {
        try {
          if (fs.existsSync(p)) return p;
        } catch {} // eslint-disable-line no-empty
      }
      return undefined;
    };

    for (const baseRoot of baseCommonPaths) {
      if (!fs.existsSync(baseRoot)) continue;
      for (const entry of gameDirs) {
        for (const dirName of entry.names) {
          const gameRoot = path.join(baseRoot, dirName);
          if (!fs.existsSync(gameRoot)) continue;
          if (!detectedRoots[entry.profile]) detectedRoots[entry.profile] = gameRoot;
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

    const ensureFallbacks = (profile: GameProfileKey, root: string) => {
      const info = detected[profile];
      if (!info) return;
      if (info.scriptPaths.length === 0) {
        const preferred = path.join(root, 'Data', 'Scripts', 'Source');
        const secondary = path.join(root, 'Data', 'Scripts');
        info.scriptPaths.push(preferred);
        if (!info.scriptPaths.some(p => p.toLowerCase() === secondary.toLowerCase())) {
          info.scriptPaths.push(secondary);
        }
      }
      if (!info.compilerPath) {
        if (profile === 'starfield') {
          info.compilerPath = path.join(root, 'Tools', 'Papyrus Compiler', 'PapyrusCompiler.exe');
        } else {
          info.compilerPath = path.join(root, 'Papyrus Compiler', 'PapyrusCompiler.exe');
        }
      }
    };

    const canonicalRoots: Record<GameProfileKey, string> = {
      skyrim: path.normalize('C:/SteamLibrary/steamapps/common/Skyrim Special Edition'),
      fallout: path.normalize('C:/SteamLibrary/steamapps/common/Fallout 4'),
      starfield: path.normalize('C:/SteamLibrary/steamapps/common/Starfield')
    };

    for (const profile of Object.keys(detected) as GameProfileKey[]) {
      const root = detectedRoots[profile] || canonicalRoots[profile];
      if (!root) continue;
      ensureFallbacks(profile, root);
    }

    // Show a summary and let the user apply per-profile
    const parts: string[] = [];
    for (const [key, info] of Object.entries(detected)) {
      const display = PROFILE_KEY_TO_GAME[key as GameProfileKey] || key;
      const items: string[] = [];
      if (info.compilerPath) items.push(`compiler: ${info.compilerPath}`);
      if (info.scriptPaths.length) items.push(`scripts: ${info.scriptPaths.join('; ')}`);
      if (items.length) parts.push(`${display}: ${items.join(' | ')}`);
    }
    const applyProfile = async (profileKey: GameProfileKey) => {
      const d = detected[profileKey];
      if (!d.compilerPath && d.scriptPaths.length === 0) return;
      const sanitizedScripts = sanitizeStringArray(d.scriptPaths);
      const trimmedCompiler = d.compilerPath?.trim();
      try {
        await updateGameSettingsEntry(cfg, target, profileKey, current => {
          let changed = false;
          const next = cloneNormalized(current);
          if (sanitizedScripts.length) {
            const merged = mergeUniquePaths(next.scriptPaths, sanitizedScripts);
            if (!arraysEqual(next.scriptPaths, merged)) {
              next.scriptPaths = merged;
              changed = true;
            }
          }
          if (trimmedCompiler && next.compiler.path !== trimmedCompiler) {
            next.compiler.path = trimmedCompiler;
            changed = true;
          }
          return changed ? next : null;
        });
      } catch (error: any) {
        if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
          console.warn(`[Papyrus Tools] Auto-detect skip for ${profileKey}: ${error.message}`, error);
        } else {
          throw error;
        }
      }
    };

    if (!parts.length) {
      if (!silent) {
        vscode.window.showInformationMessage('No game installations detected in common Steam library locations.');
      }
      return detected;
    }

    if (applyAll) {
      for (const key of Object.keys(detected) as GameProfileKey[]) {
        try {
          await applyProfile(key);
        } catch (error: any) {
          if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
            console.warn(`[Papyrus Tools] Auto-detect skip for ${key}: ${error.message}`, error);
          } else {
            throw error;
          }
        }
      }
      await buildIndex();
      if (!silent) {
        vscode.window.showInformationMessage('Applied all detected Papyrus paths.');
      }
      return detected;
    }

    if (skipPrompts) {
      return detected;
    }

    const confirm = await vscode.window.showQuickPick([
      { label: 'Apply all detected paths', description: parts.join('\n'), value: 'all' },
      { label: 'Review per game (interactive)', value: 'interactive' },
      { label: 'Cancel', value: 'cancel' }
    ], { placeHolder: 'Apply detected Papyrus compiler and script paths?' });
    if (!confirm || confirm.value === 'cancel') return;

    if (confirm.value === 'all') {
      for (const key of Object.keys(detected) as GameProfileKey[]) {
        try {
          await applyProfile(key);
        } catch (error: any) {
          if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
            console.warn(`[Papyrus Tools] Auto-detect skip for ${key}: ${error.message}`, error);
          } else {
            throw error;
          }
        }
      }
      await buildIndex();
      if (!silent) {
        vscode.window.showInformationMessage('Applied all detected Papyrus paths.');
      }
      return detected;
    }

    // Interactive per-game review
    for (const key of Object.keys(detected) as GameProfileKey[]) {
      const d = detected[key];
      if (!d.compilerPath && d.scriptPaths.length === 0) continue;
      const display = PROFILE_KEY_TO_GAME[key] || key;
      const choice = await vscode.window.showQuickPick([
        { label: `Apply ${display}`, description: [d.compilerPath ? `compiler: ${d.compilerPath}` : '', d.scriptPaths.length ? `scripts: ${d.scriptPaths.join('; ')}` : ''].filter(Boolean).join(' | '), value: 'apply' },
        { label: 'Skip', value: 'skip' }
      ], { placeHolder: `Apply detected paths for ${display}?` });
      if (choice && choice.value === 'apply') {
        try {
          await applyProfile(key);
        } catch (error: any) {
          if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
            console.warn(`[Papyrus Tools] Auto-detect skip for ${key}: ${error.message}`, error);
          } else {
            throw error;
          }
        }
      }
    }
      await buildIndex();
      if (!silent) {
        vscode.window.showInformationMessage('Auto-detection complete. Applied selected Papyrus paths.');
      }
      return detected;
    } catch (error: any) {
      if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
        console.warn('[Papyrus Tools] Auto-detect encountered unregistered configuration; returning detected paths.', error);
        return detected;
      }
      throw error;
    }
  });

  // Seed default profiles for each game with typical paths
  const createDefaultProfilesCmd = vscode.commands.registerCommand('papyrusTools.createDefaultProfiles', async () => {
    let applied = false;
    for (const game of SUPPORTED_GAMES) {
      const result = await applyDefaultProfile(game, { forceCompilerPath: true, rebuildIndex: false });
      applied = applied || result;
    }
    if (applied) {
      await buildIndex();
      vscode.window.showInformationMessage('Papyrus: Default game profiles applied.');
    } else {
      vscode.window.showInformationMessage('Papyrus: Default game profiles already match the defaults.');
    }
  });

  // Switch game command
  const switchGameCmd = vscode.commands.registerCommand('papyrusTools.switchGame', async () => {
    const pick = await vscode.window.showQuickPick(SUPPORTED_GAMES, {
      title: 'Select Papyrus game profile',
      placeHolder: 'Choose the target game for Papyrus features and compiler configs'
    });
    if (!pick) return;
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration('papyrusTools').update('defaultGame', pick, target);
    updateGameStatus();
    vscode.window.showInformationMessage(`Papyrus game profile set to ${pick}. Defaults will be applied automatically.`);
  });

  // Switch project command
  const switchProjectCmd = vscode.commands.registerCommand('papyrusTools.switchProject', async () => {
    const cfg = vscode.workspace.getConfiguration('papyrusTools');
    const projectsSetting = cfg.get<unknown>('Projects');
    const projects = Array.isArray(projectsSetting) ? projectsSetting.filter(p => p && typeof p === 'object' && p.name && p.namespace) : [];

    if (projects.length === 0) {
      vscode.window.showInformationMessage('No projects configured. Use the Control Center to set up projects.');
      return;
    }

    const projectItems = projects.map((p: any) => ({
      label: p.name,
      description: p.namespace,
      detail: `Project: ${p.name}`,
      project: p
    }));

    const pick = await vscode.window.showQuickPick(projectItems, {
      title: 'Select Papyrus Project',
      placeHolder: 'Choose the project to switch to'
    });

    if (!pick) return;

    // Load the selected project
    const game = getGame();
    const gameKey = gameToProfileKey(game);
    const target: vscode.ConfigurationTarget = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

    // Update the game's namespace directory to match the selected project
    const gamesRecord = getGamesConfig(cfg);
    const currentGameEntry = gamesRecord[gameKey] || {};
    const updatedGameEntry = { ...currentGameEntry, namespaceDir: pick.project.namespace };

    const updatedGames = { ...gamesRecord, [gameKey]: updatedGameEntry };
    await cfg.update('games', updatedGames, target);

    updateProjectStatus();
    await buildIndex();
    vscode.window.showInformationMessage(`Switched to project: ${pick.project.name}`);
  });

  // Create new script command
  const createNewScriptCmd = vscode.commands.registerCommand('papyrusTools.createNewScript', async () => {
    const project = getActiveProject();
    if (!project) {
      vscode.window.showErrorMessage('No active project configured. Run the Setup Wizard first.');
      return;
    }

    const scriptName = await vscode.window.showInputBox({
      title: 'Create New Papyrus Script',
      prompt: 'Enter the script name (without namespace prefix)',
      value: 'MyScript',
      placeHolder: 'e.g., MyScript'
    });

    if (!scriptName || !scriptName.trim()) return;

    const trimmedName = scriptName.trim();
    
    // Extract parent namespace from namespace path
    // Path format: .../Scripts/Source/{ParentNamespace}/{ProjectName}/...
    const namespaceDir = project.namespace;
    const scriptsSourceIndex = namespaceDir.indexOf('Scripts\\Source\\');
    let baseNamespace = project.name;
    
    if (scriptsSourceIndex !== -1) {
      const pathAfterSource = namespaceDir.substring(scriptsSourceIndex + 'Scripts\\Source\\'.length);
      const pathParts = pathAfterSource.split('\\').filter(part => part && part !== '.');
      if (pathParts.length >= 2) {
        // pathParts[0] is parent namespace (e.g., "TrilB"), pathParts[1] is project name (e.g., "Mod01")
        baseNamespace = pathParts[0] + ':' + pathParts[1];
      }
    }
    
    const fullScriptName = `${baseNamespace}:${trimmedName}`;
    const fileName = trimmedName.replace(/:/g, '') + '.psc';
    const filePath = path.join(project.namespace, fileName);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      vscode.window.showErrorMessage(`Script file already exists: ${fileName}`);
      return;
    }

    // Create the basic script template
    const template = `ScriptName ${fullScriptName} extends Quest

; ${fullScriptName}
; Auto-generated Papyrus script template
; Customize this script as needed

; Properties
Actor Property PlayerRef Auto

; Events
Event OnInit()
    ; Initialization code here
EndEvent

; Functions
Function MyFunction()
    ; Function implementation
EndFunction
`;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(filePath, template, 'utf8');

      // Open the file in editor
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);

      vscode.window.showInformationMessage(`Created new script: ${fileName}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to create script: ${error?.message || error}`);
    }
  });

  // React to configuration changes
  const cfgChange = vscode.workspace.onDidChangeConfiguration(async e => {
  if (e.affectsConfiguration('papyrusTools.defaultGame')) {
      updateGameStatus();
      updateProjectStatus();
      await applyDefaultProfile(getGame(), { notify: true });
    }
    if (e.affectsConfiguration('papyrusTools.games') || e.affectsConfiguration('papyrusTools.Projects')) {
      updateProjectStatus();
    }
  });

  // GitHub Chat Integration
  const chatParticipant = vscode.chat.createChatParticipant('papyrusTools.assistant', async (request: vscode.ChatRequest, _context: vscode.ChatContext, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) => {
    const { command, prompt } = request;

    try {
      switch (command) {
        case 'help':
          await handleHelpCommand(prompt, response, _token);
          break;
        case 'generate':
          await handleGenerateCommand(prompt, response, _token);
          break;
        case 'explain':
          await handleExplainCommand(prompt, response, _token);
          break;
        case 'debug':
          await handleDebugCommand(prompt, response, _token);
          break;
        default:
          await handleGeneralQuery(prompt, response, _token);
          break;
      }
    } catch (error) {
      response.markdown(`Sorry, I encountered an error while processing your request: ${error}`);
    }
  });

  // Chat command handlers
  async function handleHelpCommand(prompt: string, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) {
    const game = getGame();
    response.markdown(`## Papyrus Scripting Help for ${game}

### Basic Syntax
- **Script Declaration**: \`ScriptName MyScript\` (extends ParentScript)
- **Properties**: \`[Global|Conditional|Hidden] Type Property PropertyName\`
- **Functions**: \`Function MyFunction(ParamType paramName)\` ... \`EndFunction\`
- **Events**: \`Event MyEvent(ParamType paramName)\` ... \`EndEvent\`

### Common Keywords
${getKeywordsForGame(game).slice(0, 10).map(kw => `\`${kw}\``).join(', ')}

### Game-Specific Features
${game === 'Starfield' ? '- **Structs**: `Struct MyStruct` ... `EndStruct`' : ''}
${game === 'Fallout' || game === 'Starfield' ? '- **Arrays**: `Type[] myArray`' : ''}

### Getting Started
1. Set up your game profile with \`Papyrus: Switch Game Profile\`
2. Configure compiler paths with \`Papyrus: Auto-Detect Game Paths\`
3. Create scripts in \`.psc\` files
4. Compile with \`Papyrus: Compile Current File\`

${prompt ? `\n**Your question**: ${prompt}\n\nFeel free to ask me specific questions about Papyrus scripting!` : ''}`);
  }

  async function handleGenerateCommand(prompt: string, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) {
    if (!prompt.trim()) {
      response.markdown('Please describe what Papyrus code you\'d like me to generate. For example: "Generate a script that handles player death" or "Create a function to check if an actor is alive".');
      return;
    }

    const game = getGame();
    response.markdown(`## Generated Papyrus Code for ${game}

\`\`\`papyrus
; ${prompt}
ScriptName GeneratedScript

; Auto-generated Papyrus script
; This is a basic template - customize as needed

; Properties
Actor Property PlayerRef Auto

; Events
Event OnInit()
    ; Initialization code here
EndEvent

; Functions
Function ExampleFunction()
    ; Function implementation
EndFunction
\`\`\`

**Note**: This is a basic template. Please review and modify the generated code to fit your specific needs. Make sure to:
- Set appropriate property references
- Add proper error handling
- Test thoroughly before use in production

Would you like me to generate something more specific?`);
  }

  async function handleExplainCommand(prompt: string, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) {
    if (!prompt.trim()) {
      response.markdown('Please provide some Papyrus code or a concept you\'d like me to explain. For example: "Explain how properties work" or paste a code snippet.');
      return;
    }

    // Check if it's a code snippet or concept question
    const isCodeSnippet = prompt.includes('Function') || prompt.includes('Event') || prompt.includes('ScriptName') || prompt.includes('Property');

    if (isCodeSnippet) {
      response.markdown(`## Code Explanation

Looking at your Papyrus code snippet:

\`\`\`papyrus
${prompt}
\`\`\`

### Analysis:
- **Language**: Papyrus scripting for Bethesda games
- **Purpose**: ${analyzeCodePurpose(prompt)}
- **Key Elements**: ${analyzeCodeElements(prompt)}

### Best Practices:
- Use meaningful variable and function names
- Add comments for complex logic
- Handle edge cases and null references
- Test scripts thoroughly before deployment

Would you like me to suggest improvements or explain any specific part in more detail?`);
    } else {
      // Handle concept questions
      const concept = prompt.toLowerCase();
      if (concept.includes('property') || concept.includes('properties')) {
        response.markdown(`## Papyrus Properties

Properties in Papyrus are variables that can be accessed from other scripts and the game engine.

### Syntax:
\`\`\`papyrus
[Flags] Type Property PropertyName [Auto|= DefaultValue]
\`\`\`

### Flags:
- **Auto**: Automatically filled by the game engine
- **Conditional**: Can be conditional
- **Global**: Shared across all instances
- **Hidden**: Not visible in property windows
- **ReadOnly**: Cannot be modified after initialization

### Example:
\`\`\`papyrus
Actor Property PlayerRef Auto        ; Auto-filled by engine
Int Property Health = 100            ; With default value
Global Bool Property IsActive = true ; Global property
\`\`\`

Properties are essential for script communication and data persistence.`);
      } else if (concept.includes('function') || concept.includes('functions')) {
        response.markdown(`## Papyrus Functions

Functions in Papyrus contain reusable code that can be called from other scripts.

### Syntax:
\`\`\`papyrus
[Global] ReturnType Function FunctionName(ParameterType paramName, ...)
    ; Function body
    Return value ; if not void
EndFunction
\`\`\`

### Key Points:
- **Global functions** can be called without an object reference
- **Parameters** are passed by value (except arrays and structs)
- **Return values** are optional
- Functions can be **overridden** in child scripts

### Example:
\`\`\`papyrus
Int Function CalculateDamage(Int baseDamage, Float multiplier)
    Return Math.Floor(baseDamage * multiplier)
EndFunction
\`\`\`

Functions help organize code and promote reusability.`);
      } else {
        response.markdown(`## Papyrus Concept: ${prompt}

I'm not sure about that specific concept, but here are some key Papyrus concepts you might find helpful:

### Core Concepts:
- **Scripts**: The basic unit of Papyrus code
- **Properties**: Variables accessible across scripts
- **Functions**: Reusable code blocks
- **Events**: Code that runs in response to game events
- **States**: Different behavioral modes for scripts

### Data Types:
- **Primitive**: Bool, Int, Float, String
- **Game Objects**: Actor, ObjectReference, Form, etc.
- **Collections**: Arrays (in newer games)

### Control Flow:
- **If/ElseIf/Else/EndIf**: Conditional execution
- **While/EndWhile**: Loops
- **States**: Script state management

Try asking about a specific concept like "properties", "functions", "events", or "states"!`);
      }
    }
  }

  async function handleDebugCommand(prompt: string, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) {
    if (!prompt.trim()) {
      response.markdown('Please describe the issue you\'re experiencing with your Papyrus script. Include any error messages, unexpected behavior, or code snippets that aren\'t working as expected.');
      return;
    }

    response.markdown(`## Papyrus Debugging Assistance

### Common Issues & Solutions:

**1. Compilation Errors:**
- Check for missing semicolons or incorrect syntax
- Verify all variables are properly declared
- Ensure function calls match parameter types

**2. Runtime Issues:**
- Use \`Debug.Trace()\` for logging: \`Debug.Trace("Variable value: " + myVar)\`
- Check for null references before using objects
- Verify property references are set correctly

**3. Logic Errors:**
- Add boundary checks for array access
- Validate function parameters
- Test edge cases (empty arrays, zero values, etc.)

### Debug Tools Available:
- **Papyrus: Scan Scripts for Diagnostics** - Find syntax issues
- **Papyrus: Rebuild Script Index** - Refresh script references
- **Debug.Trace()** - Add logging to your scripts

### Your Issue: "${prompt}"

**Suggested Debugging Steps:**
1. Add Debug.Trace statements to track execution flow
2. Check the Papyrus log files in your game's directory
3. Use the Control Center's debugging tools
4. Test with minimal code to isolate the problem

Would you like me to help analyze a specific error or code snippet?`);
  }

  async function handleGeneralQuery(prompt: string, response: vscode.ChatResponseStream, _token: vscode.CancellationToken) {
    const game = getGame();
    const lowerPrompt = prompt.toLowerCase();

    // Route to appropriate handler based on content
    if (lowerPrompt.includes('help') || lowerPrompt.includes('how') || lowerPrompt.includes('what')) {
      await handleHelpCommand(prompt, response, _token);
    } else if (lowerPrompt.includes('generate') || lowerPrompt.includes('create') || lowerPrompt.includes('make')) {
      await handleGenerateCommand(prompt, response, _token);
    } else if (lowerPrompt.includes('explain') || lowerPrompt.includes('understand') || lowerPrompt.includes('mean')) {
      await handleExplainCommand(prompt, response, _token);
    } else if (lowerPrompt.includes('debug') || lowerPrompt.includes('error') || lowerPrompt.includes('problem') || lowerPrompt.includes('fix')) {
      await handleDebugCommand(prompt, response, _token);
    } else {
      // General assistance
      response.markdown(`## Papyrus Assistant

Hello! I'm here to help you with Papyrus scripting for Bethesda games (${game}). I can help you:

### What I Can Do:
- **📚 Get Help**: Learn Papyrus syntax, keywords, and concepts
- **⚡ Generate Code**: Create Papyrus script templates and examples
- **🔍 Explain Code**: Analyze and explain existing Papyrus code
- **🐛 Debug Issues**: Help troubleshoot script problems

### Quick Commands:
- \`/help\` - Get general Papyrus help
- \`/generate\` - Generate code snippets
- \`/explain\` - Explain code or concepts
- \`/debug\` - Get debugging assistance

### Your Query: "${prompt}"

Try using one of the specific commands above, or ask me directly about Papyrus scripting concepts, syntax, or best practices!

**Current Game Profile**: ${game}
**Available Tools**: Compiler, Script Index, Diagnostics, Control Center`);
    }
  }

  // Helper functions for code analysis
  function analyzeCodePurpose(code: string): string {
    if (code.includes('OnInit')) return 'Script initialization and setup';
    if (code.includes('OnDeath') || code.includes('OnDying')) return 'Death event handling';
    if (code.includes('Property') && code.includes('Auto')) return 'Property definitions and references';
    if (code.includes('Debug.Trace')) return 'Debug logging and diagnostics';
    if (code.includes('Game.GetPlayer()')) return 'Player interaction and manipulation';
    return 'General script functionality';
  }

  function analyzeCodeElements(code: string): string {
    const elements = [];
    if (code.includes('ScriptName')) elements.push('Script declaration');
    if (code.includes('Property')) elements.push('Property definitions');
    if (code.includes('Function')) elements.push('Function definitions');
    if (code.includes('Event')) elements.push('Event handlers');
    if (code.includes('If ') || code.includes('While ')) elements.push('Control flow');
    if (code.includes('Debug.')) elements.push('Debug statements');
    return elements.length > 0 ? elements.join(', ') : 'Basic script structure';
  }

  context.subscriptions.push(
    completionProvider,
    hoverProvider,
    symbolProvider,
    definitionProvider,
  workspaceSymbols,
    compileCmd,
    compileProjectCmd,
  rebuildIndexCmd,
  addScriptFolderCmd,
    configureScriptFoldersCmd,
    configureCompilersCmd,
    setupWorkspaceProfileCmd,
  clearStoredSettingsCmd,
  openControlCenterCmd,
    scanScriptsCmd,
    autoDetectCmd,
    switchGameCmd,
    switchProjectCmd,
    createNewScriptCmd,
    cfgChange,
    gameStatus,
    projectStatus,
    openCurrentGameSettingsCmd
    ,exportCurrentProfileCmd
    ,importProfileCmd
    ,openWorkspaceSettingsJsonCmd
    ,createDefaultProfilesCmd,
    chatParticipant
  );

  // Register MCP server definition provider
  const mcpProvider: vscode.McpServerDefinitionProvider = {
    provideMcpServerDefinitions: (_token: vscode.CancellationToken) => {
      const env: Record<string, string | number | null> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
      return [{
        id: 'papyrus-tools-mcp',
        label: 'Papyrus Tools MCP Server',
        displayName: 'Papyrus Tools MCP Server',
        description: 'Provides Papyrus scripting tools for Bethesda games',
        command: 'node',
        args: [context.asAbsolutePath('out/mcpServer.js')],
        env
      }];
    }
  };

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('papyrus-tools-mcp', mcpProvider)
  );
}

export function deactivate() {}
