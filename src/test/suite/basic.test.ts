import * as assert from 'assert';
import * as vscode from 'vscode';

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
});
