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

## Contributing
PRs welcome for expanded grammar, LSP features, and integration with Papyrus compiler.

## License
MIT