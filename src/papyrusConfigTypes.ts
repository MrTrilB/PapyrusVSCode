export interface CompilerSettingsSnapshot {
  scriptPaths: string[];
  compiler: {
    path: string;
    args: string[];
    includeFlags: string[];
    cwd: string;
  };
}
