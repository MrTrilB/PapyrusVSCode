# Change Log

All notable changes to the "papyrus-tools" extension will be documented in this file.

## [Unreleased]

- Added a Projects tab to the Control Center overview with filtering, path shortcuts, and load/edit/delete actions for saved workspace projects.
- Enabled Control Center to apply workspace projects to Papyrus settings and keep manifests in sync when projects are edited or removed.
- Clarified fragment path messaging in the workspace wizard so authors know fragments are configured per project.
- Added a web worker bundle so Papyrus Tools offers syntax helpers on vscode.dev while surfacing desktop-only command reminders.
- Scoped web-only placeholder commands to vscode.dev so the desktop extension no longer logs duplicate registration warnings.
- Documented vscode.dev support, refreshed the README hero image, and embedded animated walkthroughs for the setup and project wizards.
- Declared the marketplace icon in package.json so the extension gallery displays the Papyrus Tools branding.

## [0.1.27] - 2025-10-12

- Added command "Papyrus: Clear Stored Settings" to remove Papyrus configuration from workspace and/or user scopes for quick debugging resets.

## [0.1.24] - 2025-10-11

- Added an interactive compile workflow that guides you through choosing the game profile, script folders, working directory, and compiler arguments before running PapyrusCompiler.
- Existing compiler arguments stored in settings can now be reviewed, kept, or discarded inside the new wizard.
- Flag presets include descriptions, incompatibility checks, and custom input prompts to help curate the final command line.
- Refreshed command palette and compile wizard prompts with codicon icons so the UX feels more lively.
- Introduced "Papyrus: Setup Workspace Profile" to walk mod authors through creating a per-mod `.vscode/settings.json` with Starfield compiler, namespace, and output folders.
- Added "Papyrus: Open Control Center", a Fluent UI powered webview with sidebar navigation for workspace, compiler, and diagnostics forms.
- Extended the webpack pipeline to bundle the React/Fluent UI control center so assets load in the VS Code webview securely.

## [0.1.23] - 2025-10-10

- Trimmed the extension to the Skyrim, Fallout, and Starfield profiles and removed legacy Skyrim SE/AE and Fallout 76 settings.
- Updated configuration helpers, auto-detect prompts, and docs to align with the new three-profile schema.
- Refreshed tests and default settings snapshots to cover the streamlined profile list.
- Added a dedicated Papyrus Tools activity bar view so the command palette is always one click away.
- Commands now mirror defaults and auto-detected paths into `papyrus.games.*`, keeping the new per-game profile structure in sync with convenience settings.
- Default profiles now populate user-scope settings and migrate away any lingering workspace overrides so per-project overrides can be added afterwards.
- Corrected the Fallout compiler namespace mapping to use `compiler.Namespace`, matching the latest configuration schema.

## [0.1.22] - 2025-10-10

- Aligned runtime configuration mapping with the `package.json` schema so the extension only reads/writes settings that are actually contributed.
- Updated integration tests to discover contributed keys dynamically, keeping assertions in sync with user-defined settings.
- Added shared helpers for game profile metadata and configuration keys to prevent future schema drift.

## [0.1.21] - 2025-10-09

- Fixed default profile normalization so compiler overrides persist inside the expected `compiler` object, keeping UI settings in sync and restoring Starfield defaults.
- Added Fallout 4 compiler path entry to the settings UI and corrected the Fallout 76 compiler description.
- Removed unsupported `title` keys and tightened schemas for Fallout settings so every field renders properly in Settings UI.
- Added a "Papyrus Commands" explorer view listing every Papyrus Tools command for quick execution.

## [0.1.17] - 2025-10-09

- Added human-friendly titles to every setting and nested profile so VS Code groups appear under clear labels across General, Fallout, Skyrim, and Starfield.
- Surfaced per-game advanced profile data inside each section, making script paths and compiler overrides accessible without editing JSON directly.

## [0.1.16] - 2025-10-09

- Reorganized the settings contribution into General, Fallout, Skyrim, and Starfield sections to mirror the Codie layout and improve discoverability.
- Added Fallout 76 convenience defaults so the per-game profile pre-populates script paths and compiler settings.

## [0.1.11] - 2025-10-09

- Bundled Papyrus Index vanilla and extender script snapshots inside `resources/` for Skyrim, Fallout 4, and Starfield.
- Load the bundled metadata on activation so IntelliSense works out of the box before configuring local script folders.
- Preserve workspace overrides by merging user script folders after loading the packaged dataset.
- Fixed Markdown escaping so function signatures render without stray backslashes around parentheses or square brackets in completions and hovers.
- Mark completions/hover parameter entries with an *(optional)* badge when a default value is present and format defaults as inline code blocks.

## [0.1.10] - 2025-10-09

- Enriched vanilla IntelliSense by extracting Papyrus Index metadata for function signatures, parameter types, and documentation.
- Starfield member completions now surface snippets, Markdown docs, and signature details drawn from vanilla scripts.
- Script hovers list vanilla documentation blocks along with refined function/event summaries.

## [0.1.9] - 2025-10-09

- Expanded hover tooltips to include script inheritance, source location, and Starfield function summaries.
- Added regression coverage for the enriched hover behaviour and documentation updates.

## [0.1.8] - 2025-10-09

- Added Starfield script function completions when invoking members like `Utility.*`.
- Added automated test coverage and documentation updates for the Starfield completion workflow.

## [0.1.7] - 2025-10-08

- Selecting a game profile now applies default script paths and compiler locations automatically.
- Reordered settings to surface per-game categories immediately after the game selector.
- Added regression test covering default profile application when changing games.

## [0.1.6] - 2025-10-08

- Improved: Settings command now opens Workspace settings, focuses the relevant section, and adds a shortcut to open workspace settings JSON directly.

## [0.1.5] - 2025-10-08

- Added command: Create Default Game Profiles (seeds typical paths and compiler locations per game).

## [0.1.4] - 2025-10-08

- Added command: Import Game Profile (JSON); merges into per-game settings and updates top-level convenience settings.

## [0.1.3] - 2025-10-08

- Added command: Export Current Game Profile (JSON) and documented the workflow in the README.

## [0.1.2] - 2025-10-08

- README updates with per-game settings examples and auto-detect per-game toggles.
- Added command: Open Current Game Settings (status bar gear).

## [0.1.1] - 2025-10-08

- Packaging fixes (added repository and LICENSE) and minor stability improvements.

## [0.1.0] - 2025-10-08

- Initial release with syntax, snippets, completions, and hovers.
- Added webpack bundling.
- Added document symbols and go-to definition.
- Added basic diagnostics (If/EndIf, While/EndWhile).
- Added compile command and settings.
- Added multi-game support (Skyrim/SE/AE, Fallout 4/76, Starfield).
- Added status bar game selector and switch command.
- Added configuration command to set per-game compiler paths.
- Added per-game script folders and include flag/separator settings.
- Added script indexer, workspace symbols, and cross-script definition fallback.
- Added commands to configure/add script folders and rebuild script index.
- Added auto-detect command to find common Steam installs and apply compiler/script paths.