import * as fs from 'fs';
import * as path from 'path';
import { GameProfileKey } from './gameTypes';

export type GameSettingKeys = {
  scriptDirectory?: string;
  compilerDirectory?: string;
  compilerArgs?: string;
  compilerIncludeFlags?: string;
  namespaceDirectory?: string;
  namespaceFragmentsDirectory?: string;
  outputDirectory?: string;
  outputFragmentsDirectory?: string;
  autoDetect?: string;
};

const makeLegacyGameKeys = (scriptRoot: string, compilerRoot?: string): GameSettingKeys => {
  const compRoot = compilerRoot ?? scriptRoot;
  return {
    scriptDirectory: `${scriptRoot}.ScriptSourceDirectory`,
    compilerDirectory: `${scriptRoot}.CompilerDirectory`,
    compilerArgs: `${compRoot}.compiler.args`,
    compilerIncludeFlags: `${compRoot}.compiler.includeFlags`,
    namespaceDirectory: `${compRoot}.compiler.namespaceworkingdirectory`,
    namespaceFragmentsDirectory: `${compRoot}.compiler.namespaceworkingdirectoryfragments`,
    outputDirectory: `${compRoot}.compiler.outputDirectory`,
    outputFragmentsDirectory: `${compRoot}.compiler.outputDirectoryFragments`,
    autoDetect: `${scriptRoot}.autoDetect`
  };
};

export const LEGACY_GAME_SETTING_KEYS: Record<GameProfileKey, GameSettingKeys> = {
  skyrim: makeLegacyGameKeys('Skyrim.skyrim'),
  skyrimse: makeLegacyGameKeys('Skyrim.skyrimse'),
  skyrimae: makeLegacyGameKeys('Skyrim.skyrimae'),
  fallout4: makeLegacyGameKeys('Fallout.fallout4', 'fallout.fallout4'),
  fallout76: makeLegacyGameKeys('Fallout.fallout76', 'fallout.fallout76'),
  starfield: makeLegacyGameKeys('starfield')
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
  { field: 'namespaceDirectory', suffixes: ['.compiler.namespaceworkingdirectory'] },
  { field: 'namespaceFragmentsDirectory', suffixes: ['.compiler.namespaceworkingdirectoryfragments'] },
  { field: 'outputDirectory', suffixes: ['.compiler.outputdirectory'] },
  { field: 'outputFragmentsDirectory', suffixes: ['.compiler.outputdirectoryfragments'] },
  { field: 'autoDetect', suffixes: ['.autodetect'] }
];

const GAME_MARKERS: Record<GameProfileKey, string[]> = {
  skyrim: ['.skyrim.', 'skyrim.'],
  skyrimse: ['.skyrimse.', 'skyrimse.'],
  skyrimae: ['.skyrimae.', 'skyrimae.'],
  fallout4: ['.fallout4.', 'fallout4.'],
  fallout76: ['.fallout76.', 'fallout76.'],
  starfield: ['.starfield.', 'starfield.']
};

const stripPrefix = (key: string): string => (key.startsWith('papyrus.') ? key.slice('papyrus.'.length) : key);

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
    skyrimse: {},
    skyrimae: {},
    fallout4: {},
    fallout76: {},
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
    skyrimse: { ...LEGACY_GAME_SETTING_KEYS.skyrimse, ...resolved.skyrimse },
    skyrimae: { ...LEGACY_GAME_SETTING_KEYS.skyrimae, ...resolved.skyrimae },
    fallout4: { ...LEGACY_GAME_SETTING_KEYS.fallout4, ...resolved.fallout4 },
    fallout76: { ...LEGACY_GAME_SETTING_KEYS.fallout76, ...resolved.fallout76 },
    starfield: { ...LEGACY_GAME_SETTING_KEYS.starfield, ...resolved.starfield }
  };

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
    console.warn('[Papyrus] Failed to load configuration keys from package.json:', error);
    return { ...LEGACY_GAME_SETTING_KEYS };
  }
};
