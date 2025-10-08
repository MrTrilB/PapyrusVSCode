# Copilot Instructions for PapyrusVSCode

These guidelines shape how AI assistants contribute to this repository. Follow them for every suggestion, edit, or code generation task.

## Repository Purpose
- This project is a VS Code extension named **Papyrus Tools** providing Papyrus language support (syntax, snippets, completions, diagnostics, compiler helpers) across Bethesda games (Skyrim/SE/AE, Fallout 4/76, Starfield).
- Core language features live in `src/extension.ts`; tests reside in `src/test` and execute through the VS Code extension test harness.

## Coding Standards
- Use TypeScript for extension logic; keep files ASCII unless existing content justifies Unicode.
- Preserve existing command registrations and activation events—update `package.json`, `README.md`, and `CHANGELOG.md` when adding commands or features.
- Keep configuration files valid JSON (double-quoted strings) and align with VS Code schema expectations.
- Add concise comments only when code is non-obvious; avoid redundant narration.
- When creating new workspace docs, prefer Markdown with fenced PowerShell blocks for commands.

## Build & Test Expectations
- Always run `npm run test` after meaningful code changes. This triggers bundling and executes the Mocha suite under the VS Code test runner.
- For manual verification, `npm run webpack-dev` builds the extension bundle, and `npm run watch` supports iterative development.
- Do not recommend publishing flows without ensuring `npm run webpack-prod` and `npm run package` are available.

## Documentation & Instructions
- Keep `INSTRUCTIONS.md` as the primary contributor guide; reflect workflow updates there when behavior changes.
- Summaries provided to users should reference relevant files (e.g., `src/extension.ts`, `README.md`, `CHANGELOG.md`) instead of pasting large snippets verbatim.
- When describing configuration changes for users, call out the related commands (`Papyrus: Export Current Game Profile`, etc.) and settings keys.

## Pull Request & Commit Guidance
- Stage and commit only repository-related files; respect existing user edits and never revert unrelated changes.
- Reference new features in `CHANGELOG.md` with semantic version bumps when appropriate.
- Ensure tests pass locally before committing or proposing merges.

## Interaction Style
- Responses should be concise, task-focused, and friendly—mirror the user's tone where possible.
- When providing terminal commands, format them in fenced blocks with the `powershell` language tag.
- Suggest logical next steps (running tests, verifying settings, packaging) whenever helpful.

Adhering to these instructions keeps AI assistance consistent with the maintainer’s workflow and reduces rework. Update this file when processes evolve.