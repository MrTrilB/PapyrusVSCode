import * as vscode from 'vscode';

type PapyrusCommandDefinition = {
  id: string;
  title: string;
  description?: string;
  iconId?: string;
};

type PapyrusCommandCategory = {
  label: string;
  iconId: string;
  commands: PapyrusCommandDefinition[];
};

const COMMAND_CATEGORIES: PapyrusCommandCategory[] = [
  {
    label: 'Build & Diagnostics',
    iconId: 'run',
    commands: [
      {
        id: 'papyrus.compileFile',
        title: 'Compile Current File',
        description: 'Compile the active Papyrus script with the configured compiler.',
        iconId: 'rocket'
      },
      {
        id: 'papyrus.rebuildIndex',
        title: 'Rebuild Script Index',
        description: 'Regenerate the Papyrus script symbol index from configured folders.',
        iconId: 'sync'
      },
      {
        id: 'papyrus.scanScriptsForDiagnostics',
        title: 'Scan Scripts for Diagnostics',
        description: 'Validate all configured script folders for basic Papyrus diagnostics.',
        iconId: 'beaker'
      }
    ]
  },
  {
    label: 'Profiles & Automation',
    iconId: 'library',
    commands: [
      {
        id: 'papyrus.openControlCenter',
        title: 'Open Control Center',
        description: 'Launch the Fluent UI control center for Papyrus tools.',
        iconId: 'layout'
      },
      {
        id: 'papyrus.switchGame',
        title: 'Switch Game Profile',
        description: 'Change the active Papyrus game profile for language features and settings.',
        iconId: 'globe'
      },
      {
        id: 'papyrus.autoDetectGamePaths',
        title: 'Auto-Detect Game Paths',
        description: 'Locate installed games and apply detected compiler/script paths.',
        iconId: 'wand'
      },
      {
        id: 'papyrus.exportCurrentProfile',
        title: 'Export Current Game Profile',
        description: 'Export the merged settings for the active game to a JSON profile.',
        iconId: 'arrow-up'
      },
      {
        id: 'papyrus.importProfile',
        title: 'Import Game Profile',
        description: 'Import Papyrus profile settings from a JSON file and optionally activate it.',
        iconId: 'arrow-down'
      },
      {
        id: 'papyrus.createDefaultProfiles',
        title: 'Create Default Game Profiles',
        description: 'Seed compiler and script paths with typical defaults for each supported game.',
        iconId: 'star-full'
      }
    ]
  },
  {
    label: 'Configuration',
    iconId: 'gear',
    commands: [
      {
        id: 'papyrus.openCurrentGameSettings',
        title: 'Open Current Game Settings',
        description: 'Open the settings view filtered to the active Papyrus game profile.',
        iconId: 'gear'
      },
      {
        id: 'papyrus.openWorkspaceSettingsJson',
        title: 'Open Workspace Settings (JSON)',
        description: 'Open settings.json for direct editing of Papyrus configuration.',
        iconId: 'file-code'
      },
      {
        id: 'papyrus.configureScriptFolders',
        title: 'Configure Script Folders',
        description: 'Prompt for Papyrus script source folders per supported game.',
        iconId: 'folder'
      },
      {
        id: 'papyrus.configureCompilers',
        title: 'Configure Compiler Paths',
        description: 'Prompt for Papyrus compiler executable paths per supported game.',
        iconId: 'tools'
      },
      {
        id: 'papyrus.addScriptFolder',
        title: 'Add Script Folder',
        description: 'Select a script source directory and apply it to the active game profile.',
        iconId: 'diff-added'
      },
      {
        id: 'papyrus.setupWorkspaceProfile',
        title: 'Setup Workspace Profile',
        description: 'Create a .vscode/settings.json tailored for this mod workspace.',
        iconId: 'briefcase'
      }
    ]
  }
];

class PapyrusCategoryItem extends vscode.TreeItem {
  constructor(public readonly category: PapyrusCommandCategory) {
    super(category.label, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon(category.iconId);
    this.contextValue = 'papyrusCommandCategory';
  }
}

class PapyrusCommandItem extends vscode.TreeItem {
  constructor(public readonly definition: PapyrusCommandDefinition) {
    super(definition.title, vscode.TreeItemCollapsibleState.None);
    this.description = definition.id;
    if (definition.description) {
      this.tooltip = definition.description;
    } else {
      this.tooltip = `Run ${definition.title}`;
    }
    this.command = {
      command: definition.id,
      title: definition.title
    };
    this.iconPath = new vscode.ThemeIcon(definition.iconId ?? 'terminal');
    this.contextValue = 'papyrusCommand';
  }
}

type PapyrusTreeItem = PapyrusCategoryItem | PapyrusCommandItem;

class PapyrusCommandsProvider implements vscode.TreeDataProvider<PapyrusTreeItem> {
  private readonly emitter = new vscode.EventEmitter<PapyrusTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this.emitter.event;

  getTreeItem(element: PapyrusTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PapyrusTreeItem): PapyrusTreeItem[] {
    if (!element) {
      return COMMAND_CATEGORIES.map(category => new PapyrusCategoryItem(category));
    }
    if (element instanceof PapyrusCategoryItem) {
      return element.category.commands.map(def => new PapyrusCommandItem(def));
    }
    return [];
  }
}

export const registerPapyrusCommandsView = (context: vscode.ExtensionContext) => {
  const provider = new PapyrusCommandsProvider();
  const registration = vscode.window.registerTreeDataProvider('papyrusCommandsView', provider);
  context.subscriptions.push(registration);
  return provider;
};
