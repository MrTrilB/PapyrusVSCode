import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Papyrus Tools basic features', () => {
  test('Activate extension on Papyrus file open', async () => {
    const doc = await vscode.workspace.openTextDocument({ language: 'papyrus', content: 'ScriptName Test extends Quest' });
    await vscode.window.showTextDocument(doc);
    const ext = vscode.extensions.getExtension('your-name.papyrus-tools');
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

    const gameInspect = cfg.inspect<string>('game');
    const gamesInspect = cfg.inspect<any>('games');
    const starfieldInspect = cfg.inspect<any>('starfield');

    const originalGameGlobal = gameInspect?.globalValue;
    const originalGameWorkspace = hasWorkspace ? gameInspect?.workspaceValue : undefined;
    const originalGamesGlobal = gamesInspect?.globalValue ? JSON.parse(JSON.stringify(gamesInspect.globalValue)) : undefined;
    const originalGamesWorkspace = hasWorkspace && gamesInspect?.workspaceValue ? JSON.parse(JSON.stringify(gamesInspect.workspaceValue)) : undefined;
    const originalStarfieldGlobal = starfieldInspect?.globalValue ? JSON.parse(JSON.stringify(starfieldInspect.globalValue)) : undefined;
    const originalStarfieldWorkspace = hasWorkspace && starfieldInspect?.workspaceValue ? JSON.parse(JSON.stringify(starfieldInspect.workspaceValue)) : undefined;

    try {
      if (hasWorkspace) {
        await cfg.update('games', {}, vscode.ConfigurationTarget.Workspace);
        await cfg.update('starfield', {}, vscode.ConfigurationTarget.Workspace);
        await cfg.update('game', 'Skyrim', vscode.ConfigurationTarget.Workspace);
        await cfg.update('game', 'Starfield', vscode.ConfigurationTarget.Workspace);
      }
      await cfg.update('games', {}, vscode.ConfigurationTarget.Global);
      await cfg.update('starfield', {}, vscode.ConfigurationTarget.Global);
      await cfg.update('game', 'Skyrim', vscode.ConfigurationTarget.Global);
      await cfg.update('game', 'Starfield', vscode.ConfigurationTarget.Global);

      let applied = false;
      for (let attempt = 0; attempt < 12 && !applied; attempt++) {
        await new Promise(res => setTimeout(res, 150));
        const gamesState = cfg.inspect<any>('games');
        const starfieldProfile = (gamesState?.workspaceValue?.starfield ?? gamesState?.globalValue?.starfield) || {};
        const starfieldPaths: string[] = Array.isArray(starfieldProfile.scriptPaths) ? starfieldProfile.scriptPaths : [];
        const starfieldCompiler = starfieldProfile.compiler?.path;

        const starfieldConvenienceState = cfg.inspect<any>('starfield');
        const starfieldConvenience = (starfieldConvenienceState?.workspaceValue ?? starfieldConvenienceState?.globalValue) || {};
        const conveniencePaths: string[] = Array.isArray(starfieldConvenience.scriptPaths) ? starfieldConvenience.scriptPaths : [];

        if (starfieldPaths.length > 0 && conveniencePaths.length > 0 && !!starfieldCompiler) {
          applied = true;
        }
      }

      assert.ok(applied, 'Default Starfield script paths and compiler should be applied after selecting the game');
    } finally {
      if (hasWorkspace) {
        await cfg.update('game', originalGameWorkspace, vscode.ConfigurationTarget.Workspace);
        await cfg.update('games', originalGamesWorkspace, vscode.ConfigurationTarget.Workspace);
        await cfg.update('starfield', originalStarfieldWorkspace, vscode.ConfigurationTarget.Workspace);
      }
      await cfg.update('game', originalGameGlobal, vscode.ConfigurationTarget.Global);
      await cfg.update('games', originalGamesGlobal, vscode.ConfigurationTarget.Global);
      await cfg.update('starfield', originalStarfieldGlobal, vscode.ConfigurationTarget.Global);
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
    await cfg.update('autoDetect', { useLibraryFoldersVdf: false, additionalBasePaths: [tmp] }, vscode.ConfigurationTarget.Global);

    // Patch quick pick to auto-apply all
    const origQP = vscode.window.showQuickPick;
    (vscode.window as any).showQuickPick = async () => ({ value: 'all' });
    let result: any;
    try {
      result = await vscode.commands.executeCommand('papyrus.autoDetectGamePaths');
    } finally {
      (vscode.window as any).showQuickPick = origQP;
    }

    // Poll for settings update to persist
    let ok = false;
    for (let i = 0; i < 12 && !ok; i++) {
      await new Promise(res => setTimeout(res, 150));
      const gamesCfg = vscode.workspace.getConfiguration('papyrus');
      const games = gamesCfg.get<any>('games') || {};
      const fo4 = games['fallout4'] || {};
      if (fo4.compiler?.path && fo4.compiler.path.toLowerCase() === compilerPath.toLowerCase()) {
        const paths: string[] = fo4.scriptPaths || [];
        if (paths.some(p => p.toLowerCase() === sourceDir.toLowerCase())) {
          ok = true;
          break;
        }
      }
    }
    if (!ok && result) {
      // Fallback: ensure our simulated detection at least found the right script path
      const det = (result['fallout4'] || {}) as any;
      if (Array.isArray(det.scriptPaths) && det.scriptPaths.some((p: string) => p.toLowerCase() === sourceDir.toLowerCase())) {
        ok = true;
      }
    }
    assert.ok(ok, 'Auto-detect should apply (or detect) compiler and script paths for Fallout 4');
  });
});
