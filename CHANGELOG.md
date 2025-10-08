# Change Log

All notable changes to the "papyrus-tools" extension will be documented in this file.

## [0.1.6] - 2025-10-08
- Improved: Settings command now opens Workspace settings then focuses the relevant section; added command to open workspace settings JSON directly

## [0.1.5] - 2025-10-08
- Added command: Create Default Game Profiles (seeds typical paths and compiler locations per game)

## [0.1.4] - 2025-10-08
- Added command: Import Game Profile (JSON); merges into per-game settings and updates top-level convenience

## [0.1.3] - 2025-10-08
- Added command: Export Current Game Profile (JSON) and documented in README

## [0.1.2] - 2025-10-08
- README updates with per-game settings examples and auto-detect per-game toggles
- Added command: Open Current Game Settings (status bar gear)

## [0.1.1] - 2025-10-08
- Packaging fixes (added repository and LICENSE) and minor stability improvements

## [0.1.0] - 2025-10-08
- Initial release with syntax, snippets, completions, and hovers
- Added webpack bundling
- Added document symbols, go-to definition
- Added basic diagnostics (If/EndIf, While/EndWhile)
- Added compile command and settings
- Added multi-game support (Skyrim/SE/AE, Fallout 4/76, Starfield)
- Added status bar game selector and switch command
 - Added configuration command to set per-game compiler paths
 - Added per-game script folders and include flag/separator settings
 - Added script indexer, workspace symbols, and cross-script definition fallback
 - Added commands to configure/add script folders and rebuild script index
 - Added auto-detect command to find common Steam installs and apply compiler/script paths