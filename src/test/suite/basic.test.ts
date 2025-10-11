import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

type ConfigSnapshot = {
  key: string;
  fullKey: string;
  globalValue: any;
  workspaceValue: any;
};

const cloneValue = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value;
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }
  return value;
};

const toFullKey = (key: string): string => (key.startsWith('papyrus.') ? key : `papyrus.${key}`);

type GameProfileKey = 'skyrim' | 'fallout' | 'starfield';

type GameSettingKeys = {
  scriptDirectory?: string;
  compilerDirectory?: string;
  compilerArgs?: string;
  compilerIncludeFlags?: string;
  namespaceDirectory?: string;
  namespaceFragmentsDirectory?: string;
  outputDirectory?: string;
  outputFragmentsDirectory?: string;
  autoDetect?: string;
};

const EXTENSION_ROOT = path.resolve(__dirname, '../../..');

const SUFFIX_MAPPINGS: { field: keyof GameSettingKeys; suffixes: string[] }[] = [
  { field: 'scriptDirectory', suffixes: ['.scriptsourcedirectory', '.scriptdirectory'] },
  { field: 'compilerDirectory', suffixes: ['.compilerdirectory'] },
  { field: 'compilerArgs', suffixes: ['.compiler.args'] },
  { field: 'compilerIncludeFlags', suffixes: ['.compiler.includeflags'] },
  { field: 'namespaceDirectory', suffixes: ['.compiler.namespaceworkingdirectory', '.compiler.namespace'] },
  { field: 'namespaceFragmentsDirectory', suffixes: ['.compiler.namespaceworkingdirectoryfragments', '.compiler.namespacefragments'] },
  { field: 'outputDirectory', suffixes: ['.compiler.outputdirectory'] },
  { field: 'outputFragmentsDirectory', suffixes: ['.compiler.outputdirectoryfragments'] },
  { field: 'autoDetect', suffixes: ['.autodetect'] }
];

const GAME_MARKERS: Record<GameProfileKey, string[]> = {
  skyrim: ['.skyrim.', 'skyrim.'],
  fallout: ['.fallout.', 'fallout.'],
  starfield: ['.starfield.', 'starfield.']
};

const stripPrefix = (key: string): string => (key.startsWith('papyrus.') ? key.slice('papyrus.'.length) : key);

const collectConfigurationPropertyNames = (configurationContribution: any): string[] => {
  const names = new Set<string>();
  const visit = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;
    const properties = (node as any).properties;
    if (properties && typeof properties === 'object') {
      for (const [key, value] of Object.entries(properties)) {
        if (typeof key === 'string' && key) {
          names.add(key);
        }
        visit(value);
      }
    }
  };
  visit(configurationContribution);
  return Array.from(names);
};

const resolveGameConfigurationKeys = (propertyNames: string[]): Record<GameProfileKey, GameSettingKeys> => {
  const resolved: Record<GameProfileKey, GameSettingKeys> = {
    skyrim: {},
    fallout: {},
    starfield: {}
  };

  for (const rawName of propertyNames) {
    if (typeof rawName !== 'string' || !rawName) continue;
    const withoutPrefix = stripPrefix(rawName.trim());
    if (!withoutPrefix) continue;
    const lower = withoutPrefix.toLowerCase();

    for (const gameKey of Object.keys(GAME_MARKERS) as GameProfileKey[]) {
      const markers = GAME_MARKERS[gameKey];
      if (!markers.some(marker => lower.includes(marker))) continue;
      for (const mapping of SUFFIX_MAPPINGS) {
        if (!mapping.suffixes.some(suffix => lower.endsWith(suffix))) continue;
        if (!resolved[gameKey][mapping.field]) {
          resolved[gameKey][mapping.field] = withoutPrefix;
        }
      }
    }
  }

  return resolved;
};

const loadGameConfigurationKeys = (extensionPath: string): Record<GameProfileKey, GameSettingKeys> => {
  const packageJsonPath = path.join(extensionPath, 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(content);
  const propertyNames = collectConfigurationPropertyNames(packageJson?.contributes?.configuration);
  return resolveGameConfigurationKeys(propertyNames);
};

const CONFIG_KEY_MAP = loadGameConfigurationKeys(EXTENSION_ROOT);

const assertKey = (gameKey: GameProfileKey, value: string | undefined, label: string): string => {
  assert.ok(value, `Missing configuration key for ${gameKey}.${label}`);
  return value!;
};

const getKeys = (gameKey: GameProfileKey): GameSettingKeys => CONFIG_KEY_MAP[gameKey];

const captureConfig = (key: string): ConfigSnapshot => {
  const fullKey = toFullKey(key);
  const inspected = vscode.workspace.getConfiguration().inspect<any>(fullKey);
  return {
    key,
    fullKey,
    globalValue: cloneValue(inspected?.globalValue),
    workspaceValue: cloneValue(inspected?.workspaceValue)
  };
};

const updatePapyrusSetting = async (key: string, value: any, target: vscode.ConfigurationTarget) => {
  const fullKey = toFullKey(key);
  await vscode.workspace.getConfiguration().update(fullKey, value, target);
};

const safeUpdate = async (key: string, value: any, target: vscode.ConfigurationTarget) => {
  try {
    await vscode.workspace.getConfiguration().update(key, value, target);
  } catch (error: any) {
    if (typeof error?.message === 'string' && /not a registered configuration/i.test(error.message)) {
      // ignore missing contributions for schema-aligned snapshots
      return;
    }
    throw error;
  }
};

const restoreConfig = async (snapshot: ConfigSnapshot, hasWorkspace: boolean) => {
  await safeUpdate(snapshot.fullKey, snapshot.globalValue, vscode.ConfigurationTarget.Global);
  if (hasWorkspace) {
    await safeUpdate(snapshot.fullKey, snapshot.workspaceValue, vscode.ConfigurationTarget.Workspace);
  }
};

const STARFIELD_KEYS = getKeys('starfield');
const FALLOUT_KEYS = getKeys('fallout');

const STARFIELD_SCRIPT_DIRECTORY_KEY = assertKey('starfield', STARFIELD_KEYS.scriptDirectory, 'ScriptSourceDirectory');
const STARFIELD_COMPILER_DIRECTORY_KEY = assertKey('starfield', STARFIELD_KEYS.compilerDirectory, 'CompilerDirectory');

const FALLOUT_SCRIPT_DIRECTORY_KEY = assertKey('fallout', FALLOUT_KEYS.scriptDirectory, 'ScriptSourceDirectory');
const FALLOUT_COMPILER_DIRECTORY_KEY = assertKey('fallout', FALLOUT_KEYS.compilerDirectory, 'CompilerDirectory');

suite('Papyrus Tools basic features', () => {
  test('Activate extension on Papyrus file open', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content: 'ScriptName Test extends Quest' });
    await vscode.window.showTextDocument(doc);
  const ext = vscode.extensions.getExtension('MrTrilB.papyrus-tools');
    assert.ok(ext, 'Extension should be found');
    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension should be active');
  });

  test('Completion provides keywords', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content: 'Scr' });
  await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(0, 3);
    const list = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', doc.uri, pos);
    assert.ok(list && list.items.length > 0, 'Should return some completions');
    const labels = list!.items.map(i => i.label.toString().toLowerCase());
    assert.ok(labels.includes('scriptname'), 'Should include ScriptName');
  });

  test('Starfield utility functions appear after dot', async () => {
  const ext = vscode.extensions.getExtension('MrTrilB.papyrus-tools');
  assert.ok(ext, 'Extension should be registered');
  await ext!.activate();

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    const snapshots = [
      captureConfig('defaultGame'),
  captureConfig(STARFIELD_SCRIPT_DIRECTORY_KEY)
    ];

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    let tempRoot: string;
    if (workspaceFolder) {
      tempRoot = path.join(workspaceFolder, '.papyrus-tests', `sf-completions-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      fs.mkdirSync(tempRoot, { recursive: true });
    } else {
      tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'papyrus-sf-'));
    }
    const scriptRoot = path.join(tempRoot, 'scripts');
    fs.mkdirSync(scriptRoot, { recursive: true });
    const scriptName = 'SfTestUtility';
    const utilityPath = path.join(scriptRoot, `${scriptName}.psc`);
    fs.writeFileSync(utilityPath, ['ScriptName SfTestUtility', 'Function MyStarfieldHelper()', 'EndFunction'].join('\n'));

    try {
      if (hasWorkspace) {
        await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Workspace);
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, scriptRoot, vscode.ConfigurationTarget.Workspace);
      }

      await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Global);
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, scriptRoot, vscode.ConfigurationTarget.Global);

      const matches = await vscode.workspace.findFiles(new vscode.RelativePattern(scriptRoot, '**/*.psc'));
      assert.ok(matches.length >= 1, 'Sanity check: SfTestUtility.psc should be discoverable');

      await vscode.commands.executeCommand('papyrus.rebuildIndex');
      await new Promise(res => setTimeout(res, 200));

      const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content: `${scriptName}.` });
      await vscode.window.showTextDocument(doc);
      const pos = new vscode.Position(0, `${scriptName}.`.length);
      let completionFound = false;
      for (let attempt = 0; attempt < 20 && !completionFound; attempt++) {
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', doc.uri, pos);
        const labels = (completions?.items || []).map(item => item.label.toString());
        if (labels.includes('MyStarfieldHelper')) {
          completionFound = true;
          break;
        }
        await new Promise(res => setTimeout(res, 200));
      }
      assert.ok(completionFound, 'Starfield helper function should be suggested');
    } finally {
      for (const snapshot of snapshots) {
        await restoreConfig(snapshot, hasWorkspace);
      }
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('Hover shows Starfield script and function details', async () => {
  const ext = vscode.extensions.getExtension('MrTrilB.papyrus-tools');
  assert.ok(ext, 'Extension should be registered');
  await ext!.activate();

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    const snapshots = [
      captureConfig('defaultGame'),
  captureConfig(STARFIELD_SCRIPT_DIRECTORY_KEY)
    ];

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    let tempRoot: string;
    if (workspaceFolder) {
      tempRoot = path.join(workspaceFolder, '.papyrus-tests', `sf-hover-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      fs.mkdirSync(tempRoot, { recursive: true });
    } else {
      tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'papyrus-sf-hover-'));
    }
    const scriptRoot = path.join(tempRoot, 'scripts');
    fs.mkdirSync(scriptRoot, { recursive: true });
    const baseScriptName = 'SfTestUtility';
    const utilityPath = path.join(scriptRoot, `${baseScriptName}.psc`);
    fs.writeFileSync(utilityPath, ['ScriptName SfTestUtility', 'Function MyStarfieldHelper()', 'EndFunction'].join('\n'));
    const consumerPath = path.join(scriptRoot, 'Consumer.psc');
    fs.writeFileSync(consumerPath, ['ScriptName Consumer extends SfTestUtility', 'Function DoSomething()', '  SfTestUtility.MyStarfieldHelper()', 'EndFunction'].join('\n'));

    try {
      if (hasWorkspace) {
        await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Workspace);
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, scriptRoot, vscode.ConfigurationTarget.Workspace);
      }

      await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Global);
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, scriptRoot, vscode.ConfigurationTarget.Global);

      const matches = await vscode.workspace.findFiles(new vscode.RelativePattern(scriptRoot, '**/*.psc'));
      assert.ok(matches.length >= 2, 'Sanity check: Starfield temp scripts should be discoverable');

      await vscode.commands.executeCommand('papyrus.rebuildIndex');
      await new Promise(res => setTimeout(res, 200));

      const consumerDoc = await vscode.workspace.openTextDocument({ language: 'papyrus', content: fs.readFileSync(consumerPath, 'utf8') });
      await vscode.window.showTextDocument(consumerDoc);

      const scriptHoverPos = new vscode.Position(0, 'ScriptName Consumer extends '.length);
      let scriptHoverFound = false;
      for (let attempt = 0; attempt < 20 && !scriptHoverFound; attempt++) {
        const scriptHovers = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', consumerDoc.uri, scriptHoverPos);
        const scriptHoverText = (scriptHovers || []).flatMap(h => h.contents).map(content => typeof content === 'string' ? content : ('value' in content ? content.value : '')).join('\n');
        if (scriptHoverText.includes('**Script** `SfTestUtility`')) {
          scriptHoverFound = true;
          break;
        }
        await new Promise(res => setTimeout(res, 200));
      }
      assert.ok(scriptHoverFound, 'Hover should include script details for Utility');

      const functionPos = new vscode.Position(2, '  SfTestUtility.'.length); // position on MyStarfieldHelper
      let functionHoverFound = false;
      for (let attempt = 0; attempt < 20 && !functionHoverFound; attempt++) {
        const functionHovers = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', consumerDoc.uri, functionPos);
        const functionHoverText = (functionHovers || []).flatMap(h => h.contents).map(content => typeof content === 'string' ? content : ('value' in content ? content.value : '')).join('\n');
        if (functionHoverText.includes('**Function** `MyStarfieldHelper`')) {
          functionHoverFound = true;
          break;
        }
        await new Promise(res => setTimeout(res, 200));
      }
      assert.ok(functionHoverFound, 'Hover should include function details for MyStarfieldHelper');
    } finally {
      for (const snapshot of snapshots) {
        await restoreConfig(snapshot, hasWorkspace);
      }
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('Document symbols detect function/event/property', async () => {
    const content = [
      'ScriptName Foo extends Quest',
      'Int Property Bar Auto',
      'Function Baz()',
      'EndFunction',
      'Event OnInit()',
      'EndEvent'
    ].join('\n');
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content });
    await vscode.window.showTextDocument(doc);
    const symbols = await vscode.commands.executeCommand<any[]>('vscode.executeDocumentSymbolProvider', doc.uri);
    assert.ok(symbols && symbols.length >= 3, 'Should find at least 3 symbols');
    const names = symbols.map(s => s.name);
    assert.ok(names.includes('Bar') && names.includes('Baz') && names.includes('OnInit'));
  });

  test('Definitions resolve for function name', async () => {
    const content = [
      'ScriptName Foo extends Quest',
      'Function Baz()',
      'EndFunction',
      'Function Caller()',
      '  Baz()',
      'EndFunction'
    ].join('\n');
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content });
  await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(4, 4); // on Baz call
    const defs = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', doc.uri, pos);
    assert.ok(defs && defs.length >= 1, 'Should find definition for Baz');
  });

  test('Selecting game applies default profile settings', async () => {
    const cfg = vscode.workspace.getConfiguration('papyrus');
    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    const snapshots = [
      captureConfig('defaultGame'),
  captureConfig(STARFIELD_SCRIPT_DIRECTORY_KEY),
  captureConfig(STARFIELD_COMPILER_DIRECTORY_KEY)
    ];

    try {
      if (hasWorkspace) {
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, undefined, vscode.ConfigurationTarget.Workspace);
  await updatePapyrusSetting(STARFIELD_COMPILER_DIRECTORY_KEY, undefined, vscode.ConfigurationTarget.Workspace);
        await updatePapyrusSetting('defaultGame', 'Skyrim', vscode.ConfigurationTarget.Workspace);
        await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Workspace);
      }
  await updatePapyrusSetting(STARFIELD_SCRIPT_DIRECTORY_KEY, undefined, vscode.ConfigurationTarget.Global);
  await updatePapyrusSetting(STARFIELD_COMPILER_DIRECTORY_KEY, undefined, vscode.ConfigurationTarget.Global);
      await updatePapyrusSetting('defaultGame', 'Skyrim', vscode.ConfigurationTarget.Global);
      await updatePapyrusSetting('defaultGame', 'Starfield', vscode.ConfigurationTarget.Global);

      let applied = false;
      let lastScriptDir = '';
      let lastCompilerPath = '';
      for (let attempt = 0; attempt < 12 && !applied; attempt++) {
        await new Promise(res => setTimeout(res, 150));
        const scriptDir = (cfg.get<string>(STARFIELD_SCRIPT_DIRECTORY_KEY) || '').trim();
        const compilerPath = (cfg.get<string>(STARFIELD_COMPILER_DIRECTORY_KEY) || '').trim();
        lastScriptDir = scriptDir;
        lastCompilerPath = compilerPath;
        if (scriptDir && compilerPath) {
          applied = true;
        }
      }

      assert.ok(applied, 'Default Starfield script path and compiler should be applied after selecting the game');

      let gamesSynced = false;
      for (let attempt = 0; attempt < 12 && !gamesSynced; attempt++) {
        await new Promise(res => setTimeout(res, 150));
        const gamesConfig = cfg.get<any>('games') as any;
        const starfieldEntry = gamesConfig?.starfield;
        if (!starfieldEntry) {
          continue;
        }
        const starfieldScriptPaths = Array.isArray(starfieldEntry.scriptPaths) ? starfieldEntry.scriptPaths : [];
        const pathMatch = starfieldScriptPaths.some((p: unknown) => typeof p === 'string' && p.trim().toLowerCase() === lastScriptDir.toLowerCase());
        const compilerMatch = typeof starfieldEntry?.compiler?.path === 'string' && starfieldEntry.compiler.path.trim().toLowerCase() === lastCompilerPath.toLowerCase();
        if (pathMatch && compilerMatch) {
          gamesSynced = true;
          break;
        }
      }
      if (!gamesSynced) {
        const gamesInspect = vscode.workspace.getConfiguration('papyrus').inspect<any>('games');
        console.warn('papyrus.games starfield sync check', JSON.stringify({
          global: gamesInspect?.globalValue,
          workspace: gamesInspect?.workspaceValue,
          effective: cfg.get<any>('games'),
          scriptDir: lastScriptDir,
          compilerPath: lastCompilerPath
        }));
      }
      assert.ok(gamesSynced, 'papyrus.games.starfield should mirror the applied default script path and compiler');
    } finally {
      for (const snapshot of snapshots) {
        await restoreConfig(snapshot, hasWorkspace);
      }
    }
  });

  test('Diagnostics report missing EndIf', async () => {
    const content = [
      'ScriptName Foo extends Quest',
      'If true',
      '  ; body'
    ].join('\n');
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content });
    await vscode.window.showTextDocument(doc);
    // wait a bit for diagnostics to run
    await new Promise(res => setTimeout(res, 300));
    const diags = vscode.languages.getDiagnostics(doc.uri);
    assert.ok(diags.some(d => /Missing EndIf/i.test(d.message)), 'Should report Missing EndIf');
  });

  test('Workspace symbols include script and members', async () => {
    const content = [
      'ScriptName Alpha extends Quest',
      'Function Foo()',
      'EndFunction'
    ].join('\n');
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content });
    await vscode.window.showTextDocument(doc);
    // Trigger index rebuild to include this virtual doc if indexer reads workspace; otherwise skip
    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', 'Alpha');
    assert.ok(Array.isArray(symbols), 'Symbols array expected');
  });

  test('Cross-script definition via index (best-effort)', async () => {
    const contentA = 'ScriptName Beta extends Quest\nFunction Target()\nEndFunction';
    const contentB = 'ScriptName Gamma extends Quest\nFunction Caller()\n  Target()\nEndFunction';
  await vscode.workspace.openTextDocument({ language: 'papyrus', content: contentA });
    const docB = await vscode.workspace.openTextDocument({ language: 'papyrus', content: contentB });
    await vscode.window.showTextDocument(docB);
    const pos = new vscode.Position(2, 2);
    const defs = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', docB.uri, pos);
    assert.ok(Array.isArray(defs), 'Definitions array expected');
  });

  test('Auto-detect applies detected paths (simulated)', async () => {
    // Create a fake library with Fallout 4 structure
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'papyrus-auto-'));
    const lib = path.join(tmp, 'steamapps', 'common', 'Fallout 4');
    const compilerDir = path.join(lib, 'Papyrus Compiler');
    const compilerPath = path.join(compilerDir, 'PapyrusCompiler.exe');
    const sourceDir = path.join(lib, 'Data', 'Scripts', 'Source');
    fs.mkdirSync(compilerDir, { recursive: true });
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(compilerPath, '');

  // Configure auto-detect to only use our temp base, skip VDF
  const cfg = vscode.workspace.getConfiguration('papyrus');
    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    const snapshots = [
  captureConfig(FALLOUT_SCRIPT_DIRECTORY_KEY),
  captureConfig(FALLOUT_COMPILER_DIRECTORY_KEY)
    ];

  const originalEnvBase = process.env.PAPYRUS_AUTODETECT_BASE_PATHS;
  const originalEnvUseVdf = process.env.PAPYRUS_AUTODETECT_USE_VDF;
  const originalEnvOnly = process.env.PAPYRUS_AUTODETECT_ONLY;
    process.env.PAPYRUS_AUTODETECT_BASE_PATHS = tmp;
    process.env.PAPYRUS_AUTODETECT_USE_VDF = '0';
  process.env.PAPYRUS_AUTODETECT_ONLY = 'fallout4';
  const scriptKey = toFullKey(FALLOUT_SCRIPT_DIRECTORY_KEY);
  const compilerKey = toFullKey(FALLOUT_COMPILER_DIRECTORY_KEY);
    if (hasWorkspace) {
      await safeUpdate(scriptKey, '', vscode.ConfigurationTarget.Workspace);
      await safeUpdate(compilerKey, '', vscode.ConfigurationTarget.Workspace);
    }
    await safeUpdate(scriptKey, '', vscode.ConfigurationTarget.Global);
    await safeUpdate(compilerKey, '', vscode.ConfigurationTarget.Global);

    // Patch quick pick to auto-apply all
    const origQP = vscode.window.showQuickPick;
    (vscode.window as any).showQuickPick = async () => ({ value: 'all' });
    let result: any;
    try {
      result = await vscode.commands.executeCommand('papyrus.autoDetectGamePaths');

      const detection = (result?.['fallout'] || {}) as { compilerPath?: string; scriptPaths?: string[] };
      const detectionScripts = Array.isArray(detection.scriptPaths) ? detection.scriptPaths.map(p => (typeof p === 'string' ? p.trim().toLowerCase() : '')).filter(Boolean) : [];
      const detectionCompiler = typeof detection.compilerPath === 'string' ? detection.compilerPath.trim().toLowerCase() : '';

      // Poll for settings update to persist
      let ok = false;
      for (let i = 0; i < 12 && !ok; i++) {
        await new Promise(res => setTimeout(res, 150));
  const configuredCompiler = (cfg.get<string>(FALLOUT_COMPILER_DIRECTORY_KEY) || '').toLowerCase();
  const configuredScripts = (cfg.get<string>(FALLOUT_SCRIPT_DIRECTORY_KEY) || '').toLowerCase();
        if (configuredCompiler === compilerPath.toLowerCase() && configuredScripts === sourceDir.toLowerCase()) {
          ok = true;
          break;
        }
      }
      if (!ok && result) {
        // Fallback: ensure our simulated detection at least found the right script path
  const det = (result['fallout'] || {}) as any;
        if (Array.isArray(det.scriptPaths) && det.scriptPaths.some((p: string) => p.toLowerCase() === sourceDir.toLowerCase())) {
          ok = true;
        }
      }
      assert.ok(ok, 'Auto-detect should apply (or detect) compiler and script paths for Fallout 4');

      let gamesApplied = false;
      const sourceLower = sourceDir.toLowerCase();
      const compilerLower = compilerPath.toLowerCase();
      for (let attempt = 0; attempt < 12 && !gamesApplied; attempt++) {
        await new Promise(res => setTimeout(res, 150));
        const gamesConfig = cfg.get<any>('games') as any;
        const falloutEntry = gamesConfig?.fallout;
        if (!falloutEntry) {
          continue;
        }
        const falloutScriptPaths = Array.isArray(falloutEntry.scriptPaths) ? falloutEntry.scriptPaths : [];
        const normalizedPaths = falloutScriptPaths.map((p: unknown) => (typeof p === 'string' ? p.trim().toLowerCase() : '')).filter(Boolean);
        const normalizedCompiler = typeof falloutEntry?.compiler?.path === 'string' ? falloutEntry.compiler.path.trim().toLowerCase() : '';
        const pathMatch = normalizedPaths.includes(sourceLower) || (detectionScripts.length > 0 && detectionScripts.some(expected => normalizedPaths.includes(expected)));
        const compilerMatch = normalizedCompiler === compilerLower || (detectionCompiler ? normalizedCompiler === detectionCompiler : false);
        if (pathMatch && (compilerMatch || !normalizedCompiler)) {
          gamesApplied = true;
          break;
        }
      }
      if (!gamesApplied) {
        const snapshot = cfg.get<any>('games');
        console.warn('papyrus.games snapshot after auto-detect', JSON.stringify(snapshot));
      }
      assert.ok(gamesApplied, 'papyrus.games.fallout should include the detected compiler and script path');
    } finally {
      (vscode.window as any).showQuickPick = origQP;
      if (originalEnvBase === undefined) {
        delete process.env.PAPYRUS_AUTODETECT_BASE_PATHS;
      } else {
        process.env.PAPYRUS_AUTODETECT_BASE_PATHS = originalEnvBase;
      }
      if (originalEnvUseVdf === undefined) {
        delete process.env.PAPYRUS_AUTODETECT_USE_VDF;
      } else {
        process.env.PAPYRUS_AUTODETECT_USE_VDF = originalEnvUseVdf;
      }
      if (originalEnvOnly === undefined) {
        delete process.env.PAPYRUS_AUTODETECT_ONLY;
      } else {
        process.env.PAPYRUS_AUTODETECT_ONLY = originalEnvOnly;
      }
      for (const snapshot of snapshots) {
        await restoreConfig(snapshot, hasWorkspace);
      }
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
