import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const STARFIELD_KEYS = {
  compilerPath: 'papyrus.starfield.compiler.path',
  namespaceDir: 'papyrus.starfield.compiler.Namespace',
  namespaceFragmentsDir: 'papyrus.starfield.compiler.NamespaceFragments',
  outputDir: 'papyrus.starfield.compiler.outputDirectory',
  outputFragmentsDir: 'papyrus.starfield.compiler.outputDirectoryFragments'
} as const;

type PathAction = 'use' | 'browse' | 'manual' | 'clear';

type QuickPickItemWithAction = vscode.QuickPickItem & { action: PathAction };

const formatIconLabel = (icon: string, label: string): string => `$(${icon}) ${label}`;

const ensureDirectoryExists = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const validateCompilerPath = (filePath: string): string | undefined => {
  const trimmed = filePath.trim();
  if (!trimmed) {
    return 'Enter a path to PapyrusCompiler.exe.';
  }
  if (!fs.existsSync(trimmed)) {
    return 'The specified compiler path does not exist.';
  }
  if (!fs.statSync(trimmed).isFile()) {
    return 'The selected path is not a file.';
  }
  if (!trimmed.toLowerCase().endsWith('.exe')) {
    return 'PapyrusCompiler.exe must be a Windows executable (.exe).';
  }
  return undefined;
};

const validateDirectoryPath = (folderPath: string): string | undefined => {
  const trimmed = folderPath.trim();
  if (!trimmed) {
    return 'Select or enter a directory path.';
  }
  if (!fs.existsSync(trimmed)) {
    return 'The specified directory does not exist.';
  }
  if (!fs.statSync(trimmed).isDirectory()) {
    return 'The selected path is not a directory.';
  }
  return undefined;
};

const pickWorkspaceFolder = async (): Promise<vscode.WorkspaceFolder | undefined> => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('Papyrus workspace setup requires an open folder. Open a Papyrus project workspace and try again.');
    return undefined;
  }
  if (folders.length === 1) {
    return folders[0];
  }
  return vscode.window.showWorkspaceFolderPick({ placeHolder: 'Select the workspace to configure Papyrus settings for.' });
};

const promptForCompilerPath = async (currentValue: string | undefined): Promise<string | undefined> => {
  let remembered = (currentValue || '').trim();
  while (true) {
    const options: QuickPickItemWithAction[] = [];
    if (remembered) {
      options.push({
        label: formatIconLabel('check', `Use existing (${remembered})`),
        description: fs.existsSync(remembered) ? 'File exists' : 'File not found',
        action: 'use'
      });
    }
    options.push({ label: formatIconLabel('file-binary', 'Browse for PapyrusCompiler.exe'), action: 'browse' });
    options.push({ label: formatIconLabel('pencil', 'Enter path manually'), action: 'manual' });

    const selection = await vscode.window.showQuickPick(options, {
      title: 'Papyrus Workspace Setup: Compiler executable',
      placeHolder: 'Select how you would like to provide PapyrusCompiler.exe.'
    });
    if (!selection) {
      return undefined;
    }

    if (selection.action === 'use') {
      const validation = validateCompilerPath(remembered);
      if (validation) {
        await vscode.window.showErrorMessage(validation);
        continue;
      }
      return path.normalize(remembered);
    }

    if (selection.action === 'browse') {
      const files = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: 'Select PapyrusCompiler.exe'
      });
      if (!files || files.length === 0) {
        continue;
      }
      const chosen = files[0].fsPath;
      const validation = validateCompilerPath(chosen);
      if (validation) {
        await vscode.window.showErrorMessage(validation);
        continue;
      }
      remembered = chosen.trim();
      return path.normalize(chosen);
    }

    if (selection.action === 'manual') {
      const manual = await vscode.window.showInputBox({
        title: 'Papyrus Workspace Setup: Compiler executable',
        prompt: 'Enter the full path to PapyrusCompiler.exe.',
        value: remembered,
        validateInput: value => validateCompilerPath(value) ?? undefined
      });
      if (!manual) {
        continue;
      }
      remembered = manual.trim();
      return path.normalize(remembered);
    }
  }
};

const promptForDirectory = async (title: string, currentValue: string | undefined, browseLabel: string): Promise<string | undefined> => {
  let remembered = (currentValue || '').trim();
  while (true) {
    const options: QuickPickItemWithAction[] = [];
    if (remembered) {
      options.push({
        label: formatIconLabel('check', `Use existing (${remembered})`),
        description: fs.existsSync(remembered) ? 'Directory exists' : 'Directory not found',
        action: 'use'
      });
    }
    options.push({ label: formatIconLabel('folder-opened', browseLabel), action: 'browse' });
    options.push({ label: formatIconLabel('pencil', 'Enter path manually'), action: 'manual' });
    options.push({ label: formatIconLabel('circle-slash', 'Leave blank'), action: 'clear' });

    const selection = await vscode.window.showQuickPick(options, {
      title,
      placeHolder: 'Choose a directory, type a path, or leave blank.'
    });
    if (!selection) {
      return undefined;
    }

    if (selection.action === 'use') {
      const validation = validateDirectoryPath(remembered);
      if (validation) {
        await vscode.window.showErrorMessage(validation);
        continue;
      }
      return path.normalize(remembered);
    }

    if (selection.action === 'browse') {
      const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: browseLabel
      });
      if (!folders || folders.length === 0) {
        continue;
      }
      const chosen = folders[0].fsPath;
      const validation = validateDirectoryPath(chosen);
      if (validation) {
        await vscode.window.showErrorMessage(validation);
        continue;
      }
      remembered = chosen.trim();
      return path.normalize(chosen);
    }

    if (selection.action === 'manual') {
      const manual = await vscode.window.showInputBox({
        title,
        prompt: 'Enter the full path to the directory.',
        value: remembered,
        validateInput: value => validateDirectoryPath(value) ?? undefined
      });
      if (!manual) {
        continue;
      }
      remembered = manual.trim();
      return path.normalize(remembered);
    }

    if (selection.action === 'clear') {
      return '';
    }
  }
};

export const runWorkspaceSetupWizard = async (): Promise<void> => {
  const workspaceFolder = await pickWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  const folderPath = workspaceFolder.uri.fsPath;
  ensureDirectoryExists(path.join(folderPath, '.vscode'));

  const scopedConfig = vscode.workspace.getConfiguration(undefined, workspaceFolder.uri);
  const currentCompiler = scopedConfig.get<string>(STARFIELD_KEYS.compilerPath) || '';
  const currentNamespace = scopedConfig.get<string>(STARFIELD_KEYS.namespaceDir) || '';
  const currentNamespaceFragments = scopedConfig.get<string>(STARFIELD_KEYS.namespaceFragmentsDir) || '';
  const currentOutputDir = scopedConfig.get<string>(STARFIELD_KEYS.outputDir) || '';
  const currentOutputFragmentsDir = scopedConfig.get<string>(STARFIELD_KEYS.outputFragmentsDir) || '';

  const compilerPath = await promptForCompilerPath(currentCompiler);
  if (compilerPath === undefined) {
    return;
  }

  const namespaceDir = await promptForDirectory('Papyrus Workspace Setup: Source namespace directory', currentNamespace, 'Select namespace directory');
  if (namespaceDir === undefined) {
    return;
  }

  const namespaceFragmentsDir = await promptForDirectory('Papyrus Workspace Setup: Source fragments directory', currentNamespaceFragments, 'Select fragments directory');
  if (namespaceFragmentsDir === undefined) {
    return;
  }

  const outputDir = await promptForDirectory('Papyrus Workspace Setup: Output directory', currentOutputDir, 'Select output directory');
  if (outputDir === undefined) {
    return;
  }

  const outputFragmentsDir = await promptForDirectory('Papyrus Workspace Setup: Output fragments directory', currentOutputFragmentsDir, 'Select fragments output directory');
  if (outputFragmentsDir === undefined) {
    return;
  }

  await scopedConfig.update(STARFIELD_KEYS.compilerPath, compilerPath, vscode.ConfigurationTarget.WorkspaceFolder);
  await scopedConfig.update(STARFIELD_KEYS.namespaceDir, namespaceDir, vscode.ConfigurationTarget.WorkspaceFolder);
  await scopedConfig.update(STARFIELD_KEYS.namespaceFragmentsDir, namespaceFragmentsDir, vscode.ConfigurationTarget.WorkspaceFolder);
  await scopedConfig.update(STARFIELD_KEYS.outputDir, outputDir, vscode.ConfigurationTarget.WorkspaceFolder);
  await scopedConfig.update(STARFIELD_KEYS.outputFragmentsDir, outputFragmentsDir, vscode.ConfigurationTarget.WorkspaceFolder);

  const summaryLines = [
    `Compiler: ${compilerPath}`,
    `Namespace: ${namespaceDir || '(blank)'}`,
    `Namespace Fragments: ${namespaceFragmentsDir || '(blank)'}`,
    `Output Directory: ${outputDir || '(blank)'}`,
    `Output Fragments Directory: ${outputFragmentsDir || '(blank)'}`
  ];

  vscode.window.showInformationMessage(
    'Papyrus workspace settings updated.',
    { modal: true, detail: summaryLines.join('\n') },
    'OK'
  );
};
