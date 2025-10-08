# Papyrus Tools

Papyrus scripting support for Bethesda Creation Engine (Skyrim/FO4) scripts.

Features:
- Syntax highlighting (TextMate grammar)
- Language configuration (comments/brackets)
- Snippets for common constructs
- Basic completions and hovers for keywords and types
- Document symbols (Outline) for functions/events/properties
- Go to Definition within a file for functions/events
- Basic diagnostics for If/EndIf and While/EndWhile balance
- Command: "Papyrus: Compile Current File" (configurable compiler path)
 - Multi-game profiles (Skyrim/SE/AE, Fallout 4/76, Starfield)
 - Status bar profile selector and command "Papyrus: Switch Game Profile"
 - Per-game script folders and automatic include args for compiler
 - Script indexer powering Workspace Symbols and cross-script Go to Definition (best-effort)

## Getting started

- Open this folder in VS Code
- Run `npm install` to get dev dependencies
- Press F5 to launch an Extension Development Host
- Open an example `.psc` file and try snippets like `scriptname`, `func`, `event`

### Configure compiler (optional)

Set the compiler path and args in settings:

- `papyrus.compiler.path`: Full path to PapyrusCompiler.exe
- `papyrus.compiler.args`: Array of additional arguments (e.g. output folder)
- `papyrus.compiler.cwd`: Working directory for the compiler (optional)

Per-game overrides (recommended):

- `papyrus.game`: Active game profile (Skyrim, SkyrimSE, SkyrimAE, Fallout4, Fallout76, Starfield)
- `papyrus.games.<profile>.compiler.path|args|cwd`: Per-game compiler config where `<profile>` is one of `skyrim|skyrimse|skyrimae|fallout4|fallout76|starfield`.

Switch profiles via the status bar or command "Papyrus: Switch Game Profile".

Then run the command "Papyrus: Compile Current File" from the Command Palette or editor title.

### Quick setup (Starfield / Fallout 4)

Use the command "Papyrus: Configure Compiler Paths" to quickly set the per-game compiler paths.
Defaults used (you can edit them if your paths differ):

- Starfield: `C:\\SteamLibrary\\steamapps\\common\\Starfield\\Tools\\Papyrus Compiler\\PapyrusCompiler.exe`
- Fallout 4: `C:\\SteamLibrary\\steamapps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe`

### Script folders and indexing

Set script folders to enable includes and richer IntelliSense:

- Per-game paths (recommended): `papyrus.games.<profile>.scriptPaths`
- Include flag and separator: `papyrus.compiler.includeFlag` (default `-i`), `papyrus.compiler.pathSeparator` (default `;`)

Commands:

- Papyrus: Configure Script Folders – prompts for Starfield/FO4 script directories
- Papyrus: Add Script Folder – pick any folder to add to the active game profile
- Papyrus: Rebuild Script Index – re-scan script folders to refresh symbols/definitions
 - Papyrus: Auto-Detect Game Paths – scans common Steam library locations for Skyrim/SE/AE/FO4/FO76/Starfield and offers to apply detected compiler/script paths

### Commands

- Papyrus: Compile Current File
- Papyrus: Switch Game Profile
- Papyrus: Configure Compiler Paths
- Papyrus: Configure Script Folders
- Papyrus: Add Script Folder
- Papyrus: Rebuild Script Index
 - Papyrus: Auto-Detect Game Paths

## Contributing
PRs welcome for expanded grammar, LSP features, and integration with Papyrus compiler.

## License
MIT