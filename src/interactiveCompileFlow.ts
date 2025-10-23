import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GameProfile } from './gameTypes';
import { CompilerSettingsSnapshot } from './papyrusConfigTypes';

interface InteractiveCompileOptions {
  document: vscode.TextDocument;
  defaultGame: GameProfile;
  supportedGames: GameProfile[];
  getSettingsForGame: (game: GameProfile) => CompilerSettingsSnapshot;
  includeFlag: string;
  pathSeparator: string;
}

export async function runDirectCompile(options: InteractiveCompileOptions): Promise<void> {
  const selectedGame = options.defaultGame;
  const settings = options.getSettingsForGame(selectedGame);

  if (!settings.compiler.path || !fs.existsSync(settings.compiler.path)) {
    vscode.window.showErrorMessage(`Papyrus: Compiler not configured or not found for ${selectedGame}. Run the interactive compile or configure paths first.`);
    return;
  }

  if (settings.scriptPaths.length === 0) {
    vscode.window.showErrorMessage(`Papyrus: No script paths configured for ${selectedGame}. Run the interactive compile or configure paths first.`);
    return;
  }

  await options.document.save();

  const finalArgs = [...settings.compiler.args, ...settings.compiler.includeFlags];
  const includeArgument = buildIncludeArgument(options.includeFlag, settings.scriptPaths, options.pathSeparator);
  if (includeArgument) {
    finalArgs.push(includeArgument);
  }

  const cwdValue = settings.compiler.cwd || path.dirname(options.document.uri.fsPath);

  const startProcessArgs = finalArgs.concat([options.document.uri.fsPath]).map(arg => `"${arg.replace(/"/g, '""')}"`).join(', ');
  const powershellCommand = `Start-Process -FilePath "${settings.compiler.path.replace(/"/g, '""')}" -ArgumentList ${startProcessArgs} -NoNewWindow -Wait`;

  const terminal = vscode.window.createTerminal({ name: `Papyrus Compile (${selectedGame})`, cwd: cwdValue });
  terminal.sendText(powershellCommand);
  terminal.show();

  vscode.window.showInformationMessage(`Papyrus: compiling ${path.basename(options.document.uri.fsPath)} using ${selectedGame} profile.`);
}

function buildIncludeArgument(includeFlag: string, scriptPaths: string[], pathSeparator: string): string | undefined {
  if (!scriptPaths.length) {
    return undefined;
  }
  const joined = scriptPaths.join(pathSeparator);
  if (includeFlag.includes('=')) {
    return `${includeFlag}"${joined}"`;
  }
  return `${includeFlag}="${joined}"`;
}