import * as fs from 'fs';
import * as path from 'path';
import { GameProfileKey } from './gameTypes';

export type GameSettingKeys = {
  scriptDirectory?: string;
  compilerDirectory?: string;
  compilerArgs?: string;
  compilerIncludeFlags?: string;
  namespaceDirectory?: string;
  outputDirectory?: string;
  autoDetect?: string;
};

export const LEGACY_GAME_SETTING_KEYS: Record<GameProfileKey, GameSettingKeys> = {
  skyrim: {
    scriptDirectory: 'Skyrim.ScriptSourceDirectory',
    compilerDirectory: 'Skyrim.CompilerDirectory',
    compilerArgs: 'Skyrim.compiler.args',
    compilerIncludeFlags: 'Skyrim.compiler.includeFlags',
    namespaceDirectory: 'Skyrim.compiler.Namespace',
    outputDirectory: 'Skyrim.compiler.outputDirectory',
    autoDetect: 'Skyrim.autoDetect'
  },
  fallout: {
    scriptDirectory: 'Fallout.ScriptSourceDirectory',
    compilerDirectory: 'Fallout.CompilerDirectory',
    compilerArgs: 'Fallout.compiler.args',
    compilerIncludeFlags: 'Fallout.compiler.includeFlags',
    namespaceDirectory: 'Fallout.compiler.Namespace',
    outputDirectory: 'Fallout.compiler.outputDirectory',
    autoDetect: 'Fallout.autoDetect'
  },
  starfield: {
    scriptDirectory: 'starfield.ScriptSourceDirectory',
    compilerDirectory: 'starfield.CompilerDirectory',
    compilerArgs: 'starfield.compiler.args',
    compilerIncludeFlags: 'starfield.compiler.includeFlags',
    namespaceDirectory: 'starfield.compiler.Namespace',
    outputDirectory: 'starfield.compiler.outputDirectory',
    autoDetect: 'starfield.autoDetect'
  }
};

type SuffixMapping = {
  field: keyof GameSettingKeys;
  suffixes: string[];
};

const SUFFIX_MAPPINGS: SuffixMapping[] = [
  { field: 'scriptDirectory', suffixes: ['.scriptsourcedirectory', '.scriptdirectory'] },
  { field: 'compilerDirectory', suffixes: ['.compilerdirectory'] },
  { field: 'compilerArgs', suffixes: ['.compiler.args'] },
  { field: 'compilerIncludeFlags', suffixes: ['.compiler.includeflags'] },
  { field: 'namespaceDirectory', suffixes: ['.compiler.namespaceworkingdirectory', '.compiler.namespace'] },
  { field: 'outputDirectory', suffixes: ['.compiler.outputdirectory'] },
  { field: 'autoDetect', suffixes: ['.autodetect'] }
];

const GAME_MARKERS: Record<GameProfileKey, string[]> = {
  skyrim: ['.papyrusTools.skyrim.', 'papyrusTools.skyrim.'],
  fallout: ['.papyrusTools.fallout.', 'papyrusTools.fallout.'],
  starfield: ['.papyrusTools.starfield.', 'papyrusTools.starfield.']
};

const stripPrefix = (key: string): string => (key.startsWith('papyrusTools.') ? key.slice('papyrusTools.'.length) : key);

const collectConfigurationPropertyNames = (configurationContribution: any): string[] => {
  const names = new Set<string>();
  const visit = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;
    const properties = (node as any).properties;
    if (properties && typeof properties === 'object') {
      for (const [key, value] of Object.entries(properties)) {
        if (typeof key === 'string' && key) {
          names.add(key);
        }
        visit(value);
      }
    }
  };
  visit(configurationContribution);
  return Array.from(names);
};

export const resolveGameConfigurationKeys = (propertyNames: string[]): Record<GameProfileKey, GameSettingKeys> => {
  const resolved: Record<GameProfileKey, GameSettingKeys> = {
    skyrim: {},
    fallout: {},
    starfield: {}
  };

  for (const rawName of propertyNames) {
    if (typeof rawName !== 'string' || !rawName) continue;
    const withoutPrefix = stripPrefix(rawName.trim());
    if (!withoutPrefix) continue;
    const lower = withoutPrefix.toLowerCase();

    for (const gameKey of Object.keys(GAME_MARKERS) as GameProfileKey[]) {
      const markers = GAME_MARKERS[gameKey];
      if (!markers.some(marker => lower.includes(marker))) continue;
      for (const mapping of SUFFIX_MAPPINGS) {
        if (!mapping.suffixes.some(suffix => lower.endsWith(suffix))) continue;
        if (!resolved[gameKey][mapping.field]) {
          resolved[gameKey][mapping.field] = withoutPrefix;
        }
      }
    }
  }

  const final: Record<GameProfileKey, GameSettingKeys> = {
    skyrim: { ...LEGACY_GAME_SETTING_KEYS.skyrim, ...resolved.skyrim },
    fallout: { ...LEGACY_GAME_SETTING_KEYS.fallout, ...resolved.fallout },
    starfield: { ...LEGACY_GAME_SETTING_KEYS.starfield, ...resolved.starfield }
  };

  const pruneIfMissing: (keyof GameSettingKeys)[] = ['compilerArgs', 'compilerIncludeFlags'];
  for (const profileKey of Object.keys(final) as GameProfileKey[]) {
    for (const field of pruneIfMissing) {
      if (!resolved[profileKey][field]) {
        delete final[profileKey][field];
      }
    }
  }

  return final;
};

export const loadGameConfigurationKeys = (extensionPath: string): Record<GameProfileKey, GameSettingKeys> => {
  try {
    const packageJsonPath = path.join(extensionPath, 'package.json');
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    const propertyNames = collectConfigurationPropertyNames(packageJson?.contributes?.configuration);
    return resolveGameConfigurationKeys(propertyNames);
  } catch (error) {
    console.warn('[Papyrus Tools] Failed to load configuration keys from package.json:', error);
    return { ...LEGACY_GAME_SETTING_KEYS };
  }
};
