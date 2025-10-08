# Papyrus Tools Workspace Instructions

## Prerequisites
- Install Node.js 18 or newer.
- Use VS Code 1.91+ with the GitHub Copilot Chat extension (optional but helpful).
- Ensure you have access to the Papyrus compiler binaries for the games you target (e.g., `PapyrusCompiler.exe`).
- Place game script sources locally if you plan to use indexing, diagnostics, or compiler include paths.

## Initial Setup
1. Clone or open this repository in VS Code.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Build the extension bundle (outputs to `out/`):
   ```powershell
   npm run webpack-dev
   ```
4. Press `F5` in VS Code to launch an Extension Development Host and experiment with `.psc` files.

## Daily Development Loop
- Use `npm run watch` to rebuild on file changes while developing.
- Run the automated test suite often:
  ```powershell
  npm run test
  ```
  This compiles the sources, bundles them, and executes the Mocha tests in `src/test` via the VS Code Test Runner harness.
- Before publishing, produce an optimized bundle:
  ```powershell
  npm run webpack-prod
  ```

## Configuring Game Profiles
The extension supports Skyrim, SkyrimSE, SkyrimAE, Fallout4, Fallout76, and Starfield.

1. Select the active profile via the status-bar picker or the command palette (`Papyrus: Switch Game Profile`).
2. Configure compiler settings:
   - `Papyrus: Configure Compiler Paths` to set per-game compiler executables and args.
   - `Papyrus: Configure Script Folders` or `Papyrus: Add Script Folder` to manage include paths.
3. Auto-detect installations:
   - `Papyrus: Auto-Detect Game Paths` scans Steam/GOG/Epic locations and offers detected compilers/script folders.
4. Manage profile data:
   - `Papyrus: Open Current Game Settings` shows settings UI for the active profile.
   - `Papyrus: Open Workspace Settings (JSON)` jumps directly to `settings.json` for manual edits.
   - `Papyrus: Export Current Game Profile` saves the merged profile (script paths, compiler info, flags) as JSON.
   - `Papyrus: Import Game Profile` loads a JSON profile, merges settings, optionally switches the active profile, and rebuilds the index.
   - `Papyrus: Create Default Game Profiles` seeds typical Steam-based paths for every supported game and refreshes convenience settings.

## Working With Scripts
- Let the indexer build on startup or trigger manually with `Papyrus: Rebuild Script Index`.
- Use `Go to Definition`, `Workspace Symbols`, and hover info inside Papyrus scripts for quick navigation.
- Run `Papyrus: Scan Scripts for Diagnostics` to validate entire script trees for control-flow balance issues.
- Compile the active script via `Papyrus: Compile Current File`; the command assembles include flags based on your profile settings and runs the compiler in a dedicated terminal.

## Packaging and Publishing
- Update `package.json` metadata (version, publisher) before packaging.
- Produce a VSIX for distribution:
  ```powershell
  npm run package
  ```
- Test the VSIX in a fresh environment (VS Code Extension Development Host or `code --install-extension <vsix>`).

## Troubleshooting Tips
- If commands seem inactive, confirm the extension activated in the Extension Development Host.
- Rebuild the script index when adding or removing script folders.
- Ensure compiler paths are valid and accessible; the compile command will fail fast otherwise.
- Delete cached settings or re-run `Papyrus: Create Default Game Profiles` if imports or auto-detect leave inconsistent paths.
- Use `npm run test` after significant changes to guard against regressions in keywords, symbols, and diagnostics.

Keep this document updated as workflows evolve so contributors can ramp up quickly.
