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
	 - Settings:
		 - `papyrus.autoDetect.useLibraryFoldersVdf` (default true): parse Steam libraryfolders.vdf for extra libraries
		 - `papyrus.autoDetect.additionalBasePaths`: add more library roots (provide library root, `steamapps`, or `steamapps/common`)
		 - `papyrus.autoDetect.includeBothScriptPaths` (default false): when enabled, include both `Data\Scripts\Source` and `Data\Scripts` if both exist
	 - Per-game checkboxes (default true):
		 - `papyrus.autoDetect.enableSkyrim`, `papyrus.autoDetect.enableSkyrimSE`, `papyrus.autoDetect.enableSkyrimAE`
		 - `papyrus.autoDetect.enableFallout4`, `papyrus.autoDetect.enableFallout76`, `papyrus.autoDetect.enableStarfield`
	 - Also probes typical GOG/Epic paths (games under these roots):
		 - GOG: `C:\Program Files (x86)\GOG Galaxy\Games`, `C:\GOG Games`, `D:\GOG Games`, `E:\GOG Games`, `F:\GOG Games`
		 - Epic: `C:\Program Files\Epic Games` (plus D/E/F variants)

### Commands

- Papyrus: Compile Current File
- Papyrus: Switch Game Profile
- Papyrus: Configure Compiler Paths
- Papyrus: Configure Script Folders
- Papyrus: Add Script Folder
- Papyrus: Rebuild Script Index
 - Papyrus: Auto-Detect Game Paths
 - Papyrus: Open Current Game Settings
 - Papyrus: Export Current Game Profile
 - Papyrus: Import Game Profile
 - Papyrus: Create Default Game Profiles

## Per-game settings examples

### Exporting and importing profiles

You can export your current game profile to JSON and re-import later or on another machine.

- Export: "Papyrus: Export Current Game Profile" creates a file like `papyrus-profile-<Game>.json` containing:
	- `game`, `scriptPaths`, `compiler` (path|args|cwd), `includeFlag`, `pathSeparator`
- Import: "Papyrus: Import Game Profile" merges that JSON into `papyrus.games.<profile>` and updates top-level convenience settings when applicable (Starfield/Fallout 4/Skyrim).
	- Optionally sets the imported game as the active profile.
	- Rebuilds the index after applying changes.

	### Default profiles

	Use "Papyrus: Create Default Game Profiles" to seed sensible starting paths and compiler locations for all supported games. These are typical Steam-based defaults (they may not exist on your machine), and are merged with your current settings and top-level per-game convenience settings.

The following convenience settings are merged with `papyrus.games.*` and global defaults.

Example: Starfield

```
{
	"papyrus.starfield": {
		"scriptPaths": [
			"C:\\SteamLibrary\\steamapps\\common\\Starfield\\Data\\Scripts\\Source"
		],
		"compiler": {
			"path": "C:\\SteamLibrary\\steamapps\\common\\Starfield\\Tools\\Papyrus Compiler\\PapyrusCompiler.exe",
			"args": [],
			"cwd": ""
		}
	}
}
```

Example: Fallout 4

```
{
	"papyrus.fallout4": {
		"scriptPaths": [
			"C:\\SteamLibrary\\steamapps\\common\\Fallout 4\\Data\\Scripts\\Source"
		],
		"compiler": {
			"path": "C:\\SteamLibrary\\steamapps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe",
			"args": [],
			"cwd": ""
		}
	}
}
```

Example: Skyrim/SE/AE

```
{
	"papyrus.skyrim": {
		"scriptPaths": [
			"C:\\SteamLibrary\\steamapps\\common\\Skyrim Special Edition\\Data\\Scripts\\Source"
		],
		"compiler": {
			"path": "C:\\SteamLibrary\\steamapps\\common\\Skyrim Special Edition\\Papyrus Compiler\\PapyrusCompiler.exe",
			"args": [],
			"cwd": ""
		}
	}
}
```

## Contributing
PRs welcome for expanded grammar, LSP features, and integration with Papyrus compiler.

## License
MIT