# Papyrus Tools for VS Code

<div style="display: flex; align-items: flex-start; gap: 20px;">
<img src="./Assets/Images/PapyrusTools-LogoColour.png" alt="Papyrus Tools logo" style="width: 80px; height: auto;">
<p>Papyrus Tools delivers a modern authoring environment for Bethesda Creation Engine mods inside Visual Studio Code. Whether you are building Starfield quests, Fallout 4 gameplay tweaks, or Skyrim SE automation, the extension combines rich language intelligence with project automation so you can stay focused on your scripts.</p>
</div>

## Feature overview

### Language intelligence

- Papyrus grammar, bracket rules, and snippets tuned for Bethesda scripting.
- IntelliSense that blends the bundled Papyrus Index (vanilla + extender APIs) with your workspace sources for Skyrim, Fallout 4/76, and Starfield.
- Rich hovers, document symbols, workspace symbols, cross-script definition fallbacks, and control-flow diagnostics for `If/EndIf` and `While/EndWhile`.

### Workflow automation

- Per-game profiles with defaults, status bar switching, export/import, auto-detect, and the workspace setup wizard that scaffolds `.vscode/settings.json` for each mod.
- Commands to configure script folders, rebuild the script index, and clear stored settings.

### Control Center & project explorers

- Fluent UI Control Center webview with quick access to diagnostics, and project management forms.
- Dedicated "Project Folder" and "Output Folder" explorers featuring drag & drop, fragment-aware templates, and refresh/actions per view.

### Desktop-only helpers vs. vscode.dev mode

- Desktop: full project automation, auto-detect prompts, file system explorers, fragment templates, and the Control Center dashboard.
- Web: lightweight bundle delivering syntax, snippets, completions, hovers, symbols, definitions, and diagnostics directly in [vscode.dev](https://vscode.dev/), with desktop-only commands showing a friendly redirect message.

### Chat & integrations

- GitHub Copilot Chat participant for Papyrus-specific help inside VS Code (desktop only).
- Optional Model Context Protocol server (`src/mcpServer.ts`) to surface Papyrus utilities outside the editor.

## Highlights

- **Complete language tooling** – TextMate grammar, bracket matching, snippets, document symbols, and balanced control-flow diagnostics tailored to Papyrus.
- **Context-aware IntelliSense** – Completions and hovers fuse the built-in Papyrus Index (extender APIs coming soon) with your workspace sources for Skyrim, Fallout 4/76, and Starfield.
- **One-click compile wizard** – Launch PapyrusCompiler.exe with an interactive flow that confirms the game profile, include folders, working directory, and popular flags like `-optimize`, `-release`, or Starfield mode.
- **Control Center dashboard** – Configure compiler paths, script folders, diagnostics, and per-game profiles through a Fluent UI webview without leaving VS Code.
## Highlights

- **Complete language tooling** – TextMate grammar, bracket matching, snippets, document symbols, and balanced control-flow diagnostics tailored to Papyrus.
- **Context-aware IntelliSense** – Completions and hovers fuse the built-in Papyrus Index (extender APIs coming soon) with your workspace sources for Skyrim, Fallout 4/76, and Starfield.
- **Control Center dashboard** – Configure script folders, diagnostics, and per-game profiles through a Fluent UI webview without leaving VS Code.
- **Project-aware explorer** – Manage mod assets from dedicated "Project Folder" and "Output Folder" views with drag & drop, quick create/delete, fragment templates, and automatic active-project detection.
- **Game profile automation** – Auto-detect Steam/GOG/Epic installs, seed per-game defaults, export/import profiles, and switch between titles from the status bar.
- **Game profile automation** – Auto-detect Steam/GOG/Epic installs, seed per-game defaults, export/import profiles, and switch between titles from the status bar.

## Quick start

1. **Install the extension** from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=MrTrilB.papyrus-tools) or sideload the packaged `.vsix`.
2. **Open your mod workspace** (or the provided `examples/` folder) and let Papyrus Tools activate automatically when a `.psc` file loads.
3. **Run the Control Center** via `Papyrus: Open Control Center` to set script folders, namespace/output folders, and optional fragment directories. The wizard can scaffold `.vscode/settings.json` with the correct per-game configuration.

> Tip: First-time users can run `Papyrus: Auto-Detect Game Paths` to populate script directories from common Steam, GOG, or Epic installs.

## Guided setup walkthroughs

![Papyrus Tools setup wizard walkthrough](./Assets/Animations/PapyrusToolsSetupWizard.gif?raw=true)

![Papyrus Tools project wizard walkthrough](./Assets/Animations/PapyrusToolsProjectWizard.gif?raw=true)

## Workspace automation

- **Setup wizard** – `Papyrus: Setup Workspace Profile` captures namespace/output folders per project and persists them to `.vscode/settings.json` plus the `papyrusTools.Projects` setting for quick switching.
- **Profile management** – Export/import JSON profiles, create default profiles for all supported games, or mark a project as active so the tree views always target the right mod.
- **Drag & drop project view** – Move, rename, or delete files/folders inside the "Project Folder" tree. New files created within a `Fragments` directory receive fragment-friendly boilerplate.

## vscode.dev support

Papyrus Tools now ships with a lightweight web extension so you can browse and review Papyrus scripts directly in [vscode.dev](https://vscode.dev/):

- ✅ Syntax highlighting, snippets, keywords, basic completions, hovers, document symbols, and in-file go-to-definition.
- ✅ Control-flow diagnostics (If/EndIf, While/EndWhile) surfaced directly in the Problems panel.
- ❌ Desktop-only helpers such as the Control Center, auto-detect prompts, and project/file explorers. These commands display a friendly reminder to reopen the workspace in the desktop app when invoked online.

When you're ready to manage mod assets, open the same repository in the desktop version of VS Code and Papyrus Tools will unlock the full toolchain automatically.

## Explorer views

Papyrus Tools adds two activity-bar views:

- **Project Folder** – Shows the active project namespace directory (hiding `.vscode`). Supports drag & drop, context menus for new files/folders, fragment-aware templates, and quick refresh.
- **Output Folder** – Mirrors the configured output directory so you can inspect generated artifacts without leaving VS Code.

Toggle these views from the Papyrus Tools activity icon or the standard Explorer pane.

## Commands reference

| Command | Purpose |
| --- | --- |
| `Papyrus: Switch Game Profile` | Swap between Skyrim, Fallout, and Starfield profiles and update script settings. |
| `Papyrus: Configure Script Folders` | Guided pickers that update per-game script search paths. |
| `Papyrus: Setup Workspace Profile` | Wizard that records namespace/output directories and marks the active mod project. |
| `Papyrus: Auto-Detect Game Paths` | Scans Steam/GOG/Epic libraries for supported games and offers to apply detected paths. |
| `Papyrus: Rebuild Script Index` | Re-scan local sources and bundled APIs for improved completions, hovers, and Go to Definition. |
| `Papyrus: Open Control Center` | Launch the Fluent UI dashboard for workspace, diagnostics, and chat integrations. |
| Project tree commands (`Add File`, `Add Folder`, `Delete File/Folder`) | Create or remove Papyrus assets directly from the explorer views with fragments-aware templates. |

> A full list of commands appears under **Papyrus Tools** in the VS Code Command Palette (`Ctrl+Shift+P`).

## Requirements

- Visual Studio Code **1.91.0 or newer** (stable or Insiders).
- Syntax intelligence and the Papyrus Index work on Windows, macOS, and Linux for reading and editing scripts.

## Marketplace assets

- **Extension icon:** `Assets/Images/PapyrusTools.png` (square PNG, optimized for marketplace listing & VS Code activity bar). The same artwork powers the activity icon via `Assets/Images/PapyrusTools.svg`.
- **Optional hero imagery:** capture screenshots of the Control Center or project tree and place them under `Assets/Images/` for inclusion in the marketplace gallery.

## Troubleshooting & feedback

- File an issue or feature request on [GitHub Issues](https://github.com/MrTrilB/PapyrusVSCode/issues).
- Review the built-in `Papyrus: Scan Scripts for Diagnostics` command to surface syntax problems.

## Acknowledgements

Huge thanks to [BellCubeDev](https://github.com/BellCubeDev/papyrus-index) for the Papyrus Index dataset powering Papyrus Tools IntelliSense.

## Contributing

Pull requests are welcome! Popular areas include grammar improvements, new diagnostics, LSP features, and deeper integration with modding toolchains. Run the test suite before submitting:

```powershell
npm install
npm run test
```

## License

Papyrus Tools is released under the [MIT License](LICENSE).