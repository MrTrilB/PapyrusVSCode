import * as React from 'react';
import {
  Button,
  Divider,
  Field,
  FluentProvider,
  Input,
  Label,
  Checkbox,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Select,
  Spinner,
  Tab,
  TabList,
  Text,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { CheckmarkCircle20Regular, Folder20Regular, Search24Regular, Warning20Regular } from '@fluentui/react-icons';
import type { CheckboxOnChangeData, SelectOnChangeData } from '@fluentui/react-components';
import { getPapyrusTheme, PapyrusThemeMode } from './PapyrusFluentUITheme';
import logoSvg from './images/Papyrus Tools - Logo Colour.svg';

type SectionKey = 'overview' | 'setupWizard' | 'workspace' | 'compiler' | 'debugging';

declare global {
  interface Window {
    __papyrusInitialState?: { theme?: PapyrusThemeMode };
  }
}

const useStyles = makeStyles({
  root: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    backgroundColor: tokens.colorNeutralBackground2
  },
  sidebar: {
    width: '240px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalL)
  },
  sidebarHeader: {
    marginBottom: tokens.spacingVerticalL,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  main: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    overflowY: 'auto',
    rowGap: tokens.spacingVerticalXL
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalXL
  },
  sectionGrid: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXL
  },
  sectionGridWithMargin: {
    marginTop: tokens.spacingVerticalXL,
    display: 'grid',
    rowGap: tokens.spacingVerticalXL
  },
  sectionGridTight: {
    display: 'grid',
    rowGap: tokens.spacingVerticalL
  },
  quickActionRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  flexRowWrap: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalS
  },
  buttonRow: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end'
  },
  mutedText: {
    color: tokens.colorNeutralForeground3
  },
  dividerSpacing: {
    marginTop: tokens.spacingVerticalXL
  },
  tabListFullWidth: {
    width: '100%'
  },
  wizardStep: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXL
  },
  autoDiscoverHeader: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM
  },
  autoDiscoverIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  autoDiscoverIcon: {
    color: tokens.colorBrandForeground1
  },
  autoDiscoverActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  wizardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    columnGap: tokens.spacingHorizontalM
  },
  resultList: {
    display: 'grid',
    rowGap: tokens.spacingVerticalS
  },
  statusMessage: {
    fontSize: tokens.fontSizeBase200
  },
  sidebarBrand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center'
  },
  brandImage: {
    width: '120px',
    height: 'auto'
  },
  brandTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2
  },
  sidebarGroup: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalL
  },
  sidebarGroupLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground4,
    letterSpacing: '0.08em'
  },
  gameCard: {
    display: 'grid',
    rowGap: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL)
  },
  gameFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalM
  },
  statusPositive: {
    color: tokens.colorStatusSuccessForeground1
  },
  statusWarning: {
    color: tokens.colorStatusWarningForeground1
  },
  statusNeutral: {
    color: tokens.colorNeutralForeground3
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS
  },
  cardHeaderIcon: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS
  },
  statusIconPositive: {
    color: tokens.colorStatusSuccessForeground1
  },
  statusIconWarning: {
    color: tokens.colorStatusWarningForeground1
  },
  summaryGrid: {
    display: 'grid',
    rowGap: tokens.spacingVerticalM
  },
  summaryCard: {
    display: 'grid',
    rowGap: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL)
  },
  summaryRow: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXXS
  },
  summaryLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    display: 'block'
  },
  summaryValue: {
    color: tokens.colorNeutralForeground2,
    wordBreak: 'break-word',
    display: 'block'
  },
  projectList: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXS
  },
  summaryMessage: {
    marginTop: tokens.spacingVerticalS
  },
  summaryStatus: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL
  },
  completedNotice: {
    display: 'grid',
    rowGap: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL)
  }
});

type OverviewContentProps = {
  wizardCompleted: boolean;
  onNavigate: (section: SectionKey) => void;
};

const OverviewContent: React.FC<OverviewContentProps> = ({ wizardCompleted, onNavigate }) => {
  const styles = useStyles();

  return (
    <div>
      <div>
        <Text weight="semibold" size={500}>Welcome to Papyrus Control Center</Text>
        <Text size={300}>
          Use the navigation to configure your mod workspace, compiler preferences, and diagnostic tooling using Fluent UI
          powered forms.
        </Text>
      </div>
      <Divider className={styles.dividerSpacing} />
      <div className={styles.sectionGridWithMargin}>
        <div>
          <Text weight="semibold">Quick Actions</Text>
          <Text size={200} className={styles.mutedText}>Jump straight into common automation helpers.</Text>
        </div>
        <div className={styles.quickActionRow}>
          {wizardCompleted ? (
            <Button appearance="primary" onClick={() => onNavigate('workspace')}>
              Workspace Wizard
            </Button>
          ) : (
            <Button appearance="primary" onClick={() => onNavigate('setupWizard')}>
              Setup Wizard
            </Button>
          )}
          <Button appearance="secondary" onClick={() => onNavigate('compiler')}>
            Compiler Settings
          </Button>
          <Button appearance="secondary" onClick={() => onNavigate('debugging')}>
            Diagnostics Report
          </Button>
        </div>
      </div>
    </div>
  );
};

const PROFILE_LABELS: Record<string, string> = {
  fallout: 'Fallout 4',
  skyrim: 'Skyrim SE / AE',
  starfield: 'Starfield'
};

type GameKey = 'starfield' | 'fallout' | 'skyrim';

const GAME_ORDER: Array<{ key: GameKey; label: string }> = [
  { key: 'starfield', label: PROFILE_LABELS.starfield },
  { key: 'fallout', label: PROFILE_LABELS.fallout },
  { key: 'skyrim', label: PROFILE_LABELS.skyrim }
];

const normalizeWindowsPath = (value: string): string => value.replace(/\//g, '\\');

const joinWindowsPath = (...segments: string[]): string => {
  if (!segments.length) {
    return '';
  }
  const filtered: string[] = [];
  segments.forEach((segment, index) => {
    if (!segment) {
      return;
    }
    let normalized = segment.replace(/\\/g, '/');
    if (index === 0) {
      normalized = normalized.replace(/\/+$|\/$/g, '');
    } else {
      normalized = normalized.replace(/^\/+/g, '').replace(/\/+$|\/$/g, '');
    }
    if (normalized) {
      filtered.push(normalized);
    }
  });
  if (!filtered.length) {
    return '';
  }
  return filtered.join('\\').replace(/\//g, '\\');
};

const sanitizeScriptPaths = (input?: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of input) {
    if (typeof value !== 'string') {
      continue;
    }
    const normalized = normalizeWindowsPath(value.trim());
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(normalized);
  }
  return out;
};

const deriveGameRootFromData = (scriptPaths: string[], compilerPath: string, gameKey: GameKey): string => {
  for (const candidate of scriptPaths) {
    const normalized = candidate.replace(/\\/g, '/');
    const idx = normalized.toLowerCase().indexOf('/data/scripts');
    if (idx > 0) {
      return normalizeWindowsPath(normalized.slice(0, idx));
    }
  }
  if (compilerPath) {
    const normalized = compilerPath.replace(/\\/g, '/');
    const suffix = gameKey === 'starfield' ? '/tools/papyrus compiler' : '/papyrus compiler';
    const idx = normalized.toLowerCase().indexOf(suffix);
    if (idx > 0) {
      return normalizeWindowsPath(normalized.slice(0, idx));
    }
  }
  return '';
};

const deriveDefaultScriptPaths = (gameKey: GameKey, root: string): string[] => {
  if (!root) {
    return [];
  }
  const source = joinWindowsPath(root, 'Data', 'Scripts', 'Source');
  const scripts = joinWindowsPath(root, 'Data', 'Scripts');
  return gameKey === 'starfield' ? [source, scripts] : [source, scripts];
};

const deriveDefaultCompiler = (gameKey: GameKey, root: string): string => {
  if (!root) {
    return '';
  }
  return gameKey === 'starfield'
    ? joinWindowsPath(root, 'Tools', 'Papyrus Compiler', 'PapyrusCompiler.exe')
    : joinWindowsPath(root, 'Papyrus Compiler', 'PapyrusCompiler.exe');
};

const getNamespaceBase = (root: string): string => {
  if (!root) {
    return '';
  }
  return joinWindowsPath(root, 'Data', 'Scripts', 'Source');
};

const deriveNamespaceFolderName = (namespaceDir: string, root: string): string => {
  if (!namespaceDir) {
    return '';
  }
  const base = getNamespaceBase(root);
  const normalizedNamespace = normalizeWindowsPath(namespaceDir);
  const normalizedBase = normalizeWindowsPath(base);
  if (normalizedBase && normalizedNamespace.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
    const remainder = normalizedNamespace.slice(normalizedBase.length).replace(/^\\+/, '');
    if (!remainder) {
      return '';
    }
    return remainder.split(/\\+/)[0] ?? '';
  }
  const parts = normalizedNamespace.split(/\\+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
};

const sanitizeNamespaceFolder = (value: string): string => value.replace(/[\\/:]/g, '').trim();

const deriveNamespaceDir = (root: string, folder: string): string => {
  const base = getNamespaceBase(root);
  if (!base) {
    return '';
  }
  if (!folder) {
    return base;
  }
  return joinWindowsPath(base, folder);
};

const deriveOutputDir = (root: string, folder: string): string => {
  if (!root) {
    return '';
  }
  const scriptsBase = joinWindowsPath(root, 'Data', 'Scripts');
  if (!folder) {
    return scriptsBase;
  }
  return joinWindowsPath(scriptsBase, folder);
};

type WizardGameState = {
  rootPath: string;
  scriptPaths: string[];
  compilerPath: string;
  namespaceDir: string;
  namespaceFolder: string;
  namespaceFragmentsDir: string;
  outputDir: string;
  outputFragmentsDir: string;
  createNamespaceDirs: boolean;
  createOutputDirs: boolean;
  allowAutoRoot: boolean;
  compilerEdited: boolean;
  namespaceEdited: boolean;
  namespaceFragmentsEdited: boolean;
  outputEdited: boolean;
  outputFragmentsEdited: boolean;
};

const createEmptyWizardGameState = (): WizardGameState => ({
  rootPath: '',
  scriptPaths: [],
  compilerPath: '',
  namespaceDir: '',
  namespaceFolder: '',
  namespaceFragmentsDir: '',
  outputDir: '',
  outputFragmentsDir: '',
  createNamespaceDirs: false,
  createOutputDirs: false,
  allowAutoRoot: true,
  compilerEdited: false,
  namespaceEdited: false,
  namespaceFragmentsEdited: false,
  outputEdited: false,
  outputFragmentsEdited: false
});

const buildInitialWizardState = (): Record<GameKey, WizardGameState> => ({
  starfield: createEmptyWizardGameState(),
  fallout: createEmptyWizardGameState(),
  skyrim: createEmptyWizardGameState()
});

type AutoDetectResultMessage = {
  type: 'papyrus.autoDetectResult';
  status: 'success' | 'empty' | 'error';
  detected?: Record<string, { compilerPath?: string; scriptPaths?: string[] }>;
  message?: string;
};

type SetupStateMessage = {
  type: 'papyrus.setupState';
  payload?: Record<string, {
    scriptPaths?: string[];
    compilerPath?: string;
    namespaceDir?: string;
    namespaceFragmentsDir?: string;
    outputDir?: string;
    outputFragmentsDir?: string;
    rootPath?: string;
  }>;
};

type SaveWizardSettingsResultMessage = {
  type: 'papyrus.saveWizardSettingsResult';
  status: 'success' | 'error';
  message?: string;
};

type PathCheckResultMessage = {
  type: 'papyrus.pathCheckResult';
  requestId?: string;
  namespaceExists?: boolean;
  outputExists?: boolean;
};

type SetupWizardContentProps = {
  onNavigate?: (section: SectionKey) => void;
  onCompleted?: () => void;
};

const SetupWizardContent: React.FC<SetupWizardContentProps> = ({ onNavigate, onCompleted }) => {
  const styles = useStyles();
  const [wizardStep, setWizardStep] = React.useState<'auto' | 'roots' | 'namespace' | 'summary'>('auto');
  const [autoState, setAutoState] = React.useState<'idle' | 'running' | 'success' | 'empty' | 'error'>('idle');
  const [autoStatuses, setAutoStatuses] = React.useState<Record<GameKey, 'pending' | 'detected' | 'missing'>>({
    starfield: 'pending',
    fallout: 'pending',
    skyrim: 'pending'
  });
  const [autoMessage, setAutoMessage] = React.useState<string | undefined>();
  const [gameStates, setGameStates] = React.useState<Record<GameKey, WizardGameState>>(() => buildInitialWizardState());
  const [autoDerivedRoots, setAutoDerivedRoots] = React.useState<Record<GameKey, string>>({
    starfield: '',
    fallout: '',
    skyrim: ''
  });
  const [autoDetectedScripts, setAutoDetectedScripts] = React.useState<Record<GameKey, string[]>>({
    starfield: [],
    fallout: [],
    skyrim: []
  });
  const [saveFeedback, setSaveFeedback] = React.useState<{ state: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({ state: 'idle' });
  const [pathStatus, setPathStatus] = React.useState<Record<GameKey, { namespace: boolean | null; output: boolean | null }>>({
    starfield: { namespace: null, output: null },
    fallout: { namespace: null, output: null },
    skyrim: { namespace: null, output: null }
  });
  const pathRequestMapRef = React.useRef<Map<string, GameKey>>(new Map());
  const previousPathsRef = React.useRef<Record<GameKey, { namespace: string; output: string }>>({
    starfield: { namespace: '', output: '' },
    fallout: { namespace: '', output: '' },
    skyrim: { namespace: '', output: '' }
  });

  const handleAutoDiscover = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      setAutoState('error');
      setAutoMessage('Papyrus Control Center could not access the VS Code API.');
      return;
    }
    setAutoState('running');
    setAutoMessage(undefined);
    setAutoStatuses({ starfield: 'pending', fallout: 'pending', skyrim: 'pending' });
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.autoDetect',
      payload: { applyAll: true }
    });
  }, []);

  const requestPathStatus = React.useCallback((gameKey: GameKey, namespacePath: string, outputPath: string) => {
    const trimmedNamespace = namespacePath.trim();
    const trimmedOutput = outputPath.trim();
    setPathStatus(prev => ({
      ...prev,
      [gameKey]: {
        namespace: trimmedNamespace ? null : false,
        output: trimmedOutput ? null : false
      }
    }));

    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }

    if (!trimmedNamespace && !trimmedOutput) {
      return;
    }

    const requestId = `${gameKey}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    pathRequestMapRef.current.set(requestId, gameKey);
    const payload: { requestId: string; namespace?: string; output?: string } = { requestId };
    if (trimmedNamespace) {
      payload.namespace = trimmedNamespace;
    }
    if (trimmedOutput) {
      payload.output = trimmedOutput;
    }

    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.pathCheck',
      payload
    });
  }, []);

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage({ type: 'papyrus.requestSetupState' });
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if ((data as SetupStateMessage).type === 'papyrus.setupState') {
        const payload = (data as SetupStateMessage).payload || {};
        const nextStates = buildInitialWizardState();
        const nextRoots: Record<GameKey, string> = { starfield: '', fallout: '', skyrim: '' };
        const nextScripts: Record<GameKey, string[]> = { starfield: [], fallout: [], skyrim: [] };

        GAME_ORDER.forEach(({ key }) => {
          const entry = payload[key] || {};
          const scriptPaths = sanitizeScriptPaths(entry.scriptPaths);
          const compilerPath = typeof entry.compilerPath === 'string' ? normalizeWindowsPath(entry.compilerPath) : '';
          const namespaceDir = typeof entry.namespaceDir === 'string' ? normalizeWindowsPath(entry.namespaceDir) : '';
          const rootPath = entry.rootPath ? normalizeWindowsPath(entry.rootPath) : deriveGameRootFromData(scriptPaths, compilerPath, key);
          const namespaceFolder = deriveNamespaceFolderName(namespaceDir, rootPath);
          const resolvedNamespaceDir = deriveNamespaceDir(rootPath, namespaceFolder);
          const resolvedOutputDir = deriveOutputDir(rootPath, namespaceFolder);
          nextRoots[key] = rootPath;
          nextScripts[key] = scriptPaths;
          nextStates[key] = {
            rootPath,
            scriptPaths: scriptPaths.length ? scriptPaths : (rootPath ? deriveDefaultScriptPaths(key, rootPath) : []),
            compilerPath,
            namespaceDir: resolvedNamespaceDir,
            namespaceFolder,
            namespaceFragmentsDir: '',
            outputDir: resolvedOutputDir,
            outputFragmentsDir: '',
            createNamespaceDirs: false,
            createOutputDirs: false,
            allowAutoRoot: !rootPath,
            compilerEdited: !!compilerPath,
            namespaceEdited: namespaceFolder.length > 0,
            namespaceFragmentsEdited: false,
            outputEdited: namespaceFolder.length > 0,
            outputFragmentsEdited: false
          };
        });

        setGameStates(nextStates);
        setAutoDerivedRoots(nextRoots);
        setAutoDetectedScripts(nextScripts);
        return;
      }

      if ((data as AutoDetectResultMessage).type === 'papyrus.autoDetectResult') {
        const result = data as AutoDetectResultMessage;
        const detected = result.detected || {};
        const nextRoots: Record<GameKey, string> = { starfield: '', fallout: '', skyrim: '' };
        const nextScripts: Record<GameKey, string[]> = { starfield: [], fallout: [], skyrim: [] };
        const nextStatuses: Record<GameKey, 'pending' | 'detected' | 'missing'> = { starfield: 'missing', fallout: 'missing', skyrim: 'missing' };

        GAME_ORDER.forEach(({ key }) => {
          const info = detected[key];
          const scriptPaths = sanitizeScriptPaths(info?.scriptPaths);
          const compilerPath = typeof info?.compilerPath === 'string' ? normalizeWindowsPath(info.compilerPath) : '';
          const root = deriveGameRootFromData(scriptPaths, compilerPath, key);
          nextRoots[key] = root;
          nextScripts[key] = scriptPaths;
          const hasData = scriptPaths.length > 0 || !!compilerPath;
          nextStatuses[key] = hasData ? 'detected' : 'missing';
        });

        setAutoDerivedRoots(nextRoots);
        setAutoDetectedScripts(nextScripts);
        setAutoStatuses(nextStatuses);

        if (result.status === 'success') {
          setAutoState('success');
          setAutoMessage(undefined);
        } else if (result.status === 'empty') {
          setAutoState('empty');
          setAutoMessage('No supported game installations found in common Steam library locations.');
        } else {
          setAutoState('error');
          setAutoMessage(result.message ?? 'Auto-discover failed.');
        }

        setGameStates(prev => {
          const next: Record<GameKey, WizardGameState> = { ...prev };
          GAME_ORDER.forEach(({ key }) => {
            const info = detected[key];
            if (!info) {
              return;
            }
            const scriptPaths = sanitizeScriptPaths(info.scriptPaths);
            const compilerPath = typeof info.compilerPath === 'string' ? normalizeWindowsPath(info.compilerPath) : '';
            const root = nextRoots[key];
            const current = prev[key];
            const shouldUpdateRoot = (current.allowAutoRoot || !current.rootPath) && !!root;
            const updated: WizardGameState = { ...current };

            if (shouldUpdateRoot) {
              updated.rootPath = root;
              updated.scriptPaths = scriptPaths.length ? scriptPaths : deriveDefaultScriptPaths(key, root);
              if (!current.compilerEdited || !current.compilerPath) {
                updated.compilerPath = compilerPath || deriveDefaultCompiler(key, root);
              }
            } else {
              if (scriptPaths.length && current.scriptPaths.length === 0) {
                updated.scriptPaths = scriptPaths;
              }
              if (compilerPath && (!current.compilerEdited || !current.compilerPath)) {
                updated.compilerPath = compilerPath;
              }
            }

            next[key] = updated;
          });
          return next;
        });

        return;
      }

      if ((data as PathCheckResultMessage).type === 'papyrus.pathCheckResult') {
        const result = data as PathCheckResultMessage;
        const requestId = typeof result.requestId === 'string' ? result.requestId : undefined;
        if (!requestId) {
          return;
        }
        const key = pathRequestMapRef.current.get(requestId);
        if (!key) {
          return;
        }
        pathRequestMapRef.current.delete(requestId);
        setPathStatus(prev => {
          const current = prev[key] ?? { namespace: false, output: false };
          return {
            ...prev,
            [key]: {
              namespace: typeof result.namespaceExists === 'boolean' ? result.namespaceExists : current.namespace,
              output: typeof result.outputExists === 'boolean' ? result.outputExists : current.output
            }
          };
        });
        return;
      }

      if ((data as SaveWizardSettingsResultMessage).type === 'papyrus.saveWizardSettingsResult') {
        const message = data as SaveWizardSettingsResultMessage;
        if (message.status === 'success') {
          setSaveFeedback({ state: 'success', message: 'Papyrus settings saved.' });
        } else {
          setSaveFeedback({ state: 'error', message: message.message ?? 'Failed to save Papyrus settings.' });
        }
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  React.useEffect(() => {
    if (wizardStep !== 'summary' && saveFeedback.state !== 'idle') {
      setSaveFeedback({ state: 'idle' });
    }
  }, [wizardStep, saveFeedback.state]);

  React.useEffect(() => {
    setGameStates(prev => {
      let updated = false;
      const next: Record<GameKey, WizardGameState> = { ...prev };
      GAME_ORDER.forEach(({ key }) => {
        const status = pathStatus[key];
        if (!status) {
          return;
        }
        const entry = next[key];
        let newEntry = entry;
        if (status.namespace && entry.createNamespaceDirs) {
          newEntry = { ...newEntry, createNamespaceDirs: false };
        }
        if (status.output && newEntry.createOutputDirs) {
          newEntry = { ...newEntry, createOutputDirs: false };
        }
        if (newEntry !== entry) {
          next[key] = newEntry;
          updated = true;
        }
      });
      return updated ? next : prev;
    });
  }, [pathStatus]);

  React.useEffect(() => {
    const nextPrev = { ...previousPathsRef.current } as Record<GameKey, { namespace: string; output: string }>;
    GAME_ORDER.forEach(({ key }) => {
      const namespacePath = (gameStates[key].namespaceDir || '').trim();
      const outputPath = (gameStates[key].outputDir || '').trim();
      const previous = previousPathsRef.current[key];
      if (previous.namespace === namespacePath && previous.output === outputPath) {
        return;
      }
      nextPrev[key] = { namespace: namespacePath, output: outputPath };
      requestPathStatus(key, namespacePath, outputPath);
    });
    previousPathsRef.current = nextPrev;
  }, [gameStates, requestPathStatus]);

  const handleRootChange = React.useCallback((key: GameKey, value: string) => {
    const normalized = normalizeWindowsPath(value);
    setGameStates(prev => {
      const next = { ...prev };
      const current = prev[key];
      const derivedScripts = normalized ? deriveDefaultScriptPaths(key, normalized) : [];
      const derivedCompiler = normalized ? deriveDefaultCompiler(key, normalized) : '';
      const namespaceDir = normalized ? deriveNamespaceDir(normalized, current.namespaceFolder) : '';
      const outputDir = normalized ? deriveOutputDir(normalized, current.namespaceFolder) : '';
      next[key] = {
        ...current,
        rootPath: normalized,
        scriptPaths: derivedScripts,
        allowAutoRoot: false,
        compilerPath: current.compilerEdited ? current.compilerPath : derivedCompiler,
        namespaceDir,
        namespaceFolder: current.namespaceFolder,
        namespaceFragmentsDir: '',
        namespaceFragmentsEdited: false,
        outputDir,
        outputFragmentsDir: '',
        outputEdited: normalized ? current.namespaceFolder.length > 0 : false,
        outputFragmentsEdited: false
      };
      return next;
    });
  }, []);

  const handleCompilerChange = React.useCallback((key: GameKey, value: string) => {
    const normalized = normalizeWindowsPath(value);
    setGameStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        compilerPath: normalized,
        compilerEdited: normalized.length > 0
      }
    }));
  }, []);

  const handleNamespaceFolderChange = React.useCallback((key: GameKey, value: string) => {
    const sanitized = sanitizeNamespaceFolder(value);
    setGameStates(prev => {
      const next = { ...prev };
      const current = prev[key];
      const namespaceDir = deriveNamespaceDir(current.rootPath, sanitized);
      const outputDir = deriveOutputDir(current.rootPath, sanitized);
      next[key] = {
        ...current,
        namespaceFolder: sanitized,
        namespaceDir,
        namespaceFragmentsDir: '',
        namespaceEdited: sanitized.length > 0,
        namespaceFragmentsEdited: false,
        outputDir,
        outputFragmentsDir: '',
        outputEdited: sanitized.length > 0 && !!current.rootPath,
        outputFragmentsEdited: false
      };
      return next;
    });
  }, []);

  const applyAutoRoot = React.useCallback((key: GameKey) => {
    const autoRoot = autoDerivedRoots[key];
    if (!autoRoot) {
      return;
    }
    setGameStates(prev => {
      const scripts = autoDetectedScripts[key];
      const next = { ...prev };
      const current = prev[key];
      const namespaceDir = deriveNamespaceDir(autoRoot, current.namespaceFolder);
      const outputDir = deriveOutputDir(autoRoot, current.namespaceFolder);
      next[key] = {
        ...current,
        rootPath: autoRoot,
        scriptPaths: scripts.length ? scripts : deriveDefaultScriptPaths(key, autoRoot),
        allowAutoRoot: true,
        compilerPath: current.compilerEdited && current.compilerPath
          ? current.compilerPath
          : deriveDefaultCompiler(key, autoRoot),
        namespaceDir,
        namespaceFragmentsDir: '',
        namespaceFragmentsEdited: false,
        outputDir,
        outputFragmentsDir: '',
        outputEdited: current.namespaceFolder.length > 0,
        outputFragmentsEdited: false
      };
      return next;
    });
  }, [autoDerivedRoots, autoDetectedScripts]);

  const handleToggleCreate = React.useCallback((key: GameKey, kind: 'namespace' | 'output', checked: boolean) => {
    setGameStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        createNamespaceDirs: kind === 'namespace' ? checked : prev[key].createNamespaceDirs,
        createOutputDirs: kind === 'output' ? checked : prev[key].createOutputDirs
      }
    }));
  }, []);

  const handleSave = React.useCallback(() => {
    const gamesPayload = GAME_ORDER.map(({ key }) => {
      const state = gameStates[key];
      const scriptPaths = state.scriptPaths.map(p => normalizeWindowsPath(p).trim()).filter(Boolean);
      const compilerPath = normalizeWindowsPath(state.compilerPath).trim();
      const namespaceDir = normalizeWindowsPath(state.namespaceDir).trim();
      const namespaceFragmentsDir = normalizeWindowsPath(state.namespaceFragmentsDir).trim();
      const outputDir = normalizeWindowsPath(state.outputDir).trim();
      const outputFragmentsDir = normalizeWindowsPath(state.outputFragmentsDir).trim();
      const ensure: string[] = [];
      if (state.createNamespaceDirs) {
        if (namespaceDir) ensure.push(namespaceDir);
        if (namespaceFragmentsDir) ensure.push(namespaceFragmentsDir);
      }
      if (state.createOutputDirs) {
        if (outputDir) ensure.push(outputDir);
        if (outputFragmentsDir) ensure.push(outputFragmentsDir);
      }

      if (
        scriptPaths.length === 0 &&
        !compilerPath &&
        !namespaceDir &&
        !namespaceFragmentsDir &&
        !outputDir &&
        !outputFragmentsDir
      ) {
        return null;
      }

      return {
        key,
        scriptPaths,
        compilerPath,
        namespaceDir,
        namespaceFragmentsDir,
        outputDir,
        outputFragmentsDir,
        ensure
      };
    }).filter((value): value is {
      key: GameKey;
      scriptPaths: string[];
      compilerPath: string;
      namespaceDir: string;
      namespaceFragmentsDir: string;
      outputDir: string;
      outputFragmentsDir: string;
      ensure: string[];
    } => value !== null);

    if (gamesPayload.length === 0) {
      setSaveFeedback({ state: 'error', message: 'Nothing to save yet. Provide at least one game path.' });
      return;
    }

    if (!window.__papyrusVsCodeApi?.postMessage) {
      setSaveFeedback({ state: 'error', message: 'Papyrus Control Center could not access the VS Code API.' });
      return;
    }

    setSaveFeedback({ state: 'saving' });
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.saveWizardSettings',
      payload: { games: gamesPayload }
    });
  }, [gameStates]);

  const detectionComplete = autoState === 'success' || autoState === 'empty' || autoState === 'error';
  const isRunning = autoState === 'running';

  const AutoDiscoverStep = (
    <div className={styles.wizardStep}>
      <div className={styles.autoDiscoverHeader}>
        <div className={styles.autoDiscoverIconWrap}>
          <Search24Regular className={styles.autoDiscoverIcon} />
        </div>
        <div>
          <Text weight="semibold">Auto-Discover Game Installations</Text>
          <Text size={200} className={styles.mutedText}>
            Scan known library folders for Creation Kit tools and apply the defaults automatically.
          </Text>
        </div>
      </div>
      <div className={styles.autoDiscoverActions}>
        <Button appearance="primary" disabled={isRunning} onClick={handleAutoDiscover}>
          {isRunning ? 'Scanning Steam Libraries…' : 'Auto-Discover Now'}
        </Button>
        {isRunning && <Spinner size="tiny" label="Working" />}
      </div>
      {detectionComplete && (
        <div className={styles.resultList}>
          {GAME_ORDER.map(({ key, label }) => {
            const status = autoStatuses[key];
            const root = autoDerivedRoots[key];
            if (status === 'detected') {
              return (
                <MessageBar key={key} intent="success">
                  <MessageBarBody>
                    <MessageBarTitle>
                      <span>{label}: {root || 'Defaults Applied'}</span>
                    </MessageBarTitle>
                    <Text size={200}>Defaults saved to settings.</Text>
                  </MessageBarBody>
                </MessageBar>
              );
            }
            return (
              <MessageBar key={key} intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>
                    <span>{label}: {root || 'Not Detected'}</span>
                  </MessageBarTitle>
                  <Text size={200}>
                    Run auto-detect again or configure the paths manually in the next step. View current settings{' '}
                    <Link onClick={() => window.__papyrusVsCodeApi?.postMessage?.({ type: 'papyrus.openSettings', payload: { query: '@ext:MrTrilB.papyrus-tools papyrus.games' } })}>here</Link>.
                  </Text>
                </MessageBarBody>
              </MessageBar>
            );
          })}
        </div>
      )}
      {autoMessage && (
        <Text size={200} className={styles.statusMessage}>{autoMessage}</Text>
      )}
      {!detectionComplete && (
        <Text size={200} className={styles.mutedText}>
          Run Auto-Discover to continue to the next step.
        </Text>
      )}
      {detectionComplete && (
        <div className={styles.wizardActions}>
          <Button appearance="primary" disabled={isRunning} onClick={() => setWizardStep('roots')}>
            Next
          </Button>
        </div>
      )}
    </div>
  );

  const RootsStep = (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Creation Kit Roots</Text>
        <Text size={200} className={styles.mutedText}>
          Verify or provide the installation directory for each game. We derive compiler paths and script folders automatically.
        </Text>
      </div>
      <div className={styles.sectionGridTight}>
        {GAME_ORDER.map(({ key, label }) => {
          const state = gameStates[key];
          const autoRoot = autoDerivedRoots[key];
          const status = autoStatuses[key];
          const statusText = status === 'detected'
            ? 'Auto-detect found this game.'
            : status === 'missing'
              ? 'Not detected yet. Provide the root manually.'
              : 'Run auto-detect or enter the path manually.';
          const statusClass = status === 'detected'
            ? styles.statusPositive
            : status === 'missing'
              ? styles.statusWarning
              : styles.statusNeutral;
          return (
            <div key={key} className={styles.gameCard}>
              <Text weight="semibold">{label}</Text>
              <Field label="Creation Kit Root" hint="Base installation folder that contains the Data directory.">
                <Input
                  value={state.rootPath}
                  onChange={(_, data) => handleRootChange(key, data.value)}
                  placeholder={autoRoot || 'C:/Program Files/Steam/steamapps/common/...'}
                />
              </Field>
              <div className={styles.gameFooter}>
                <Text size={200} className={statusClass}>{statusText}</Text>
                <Button appearance="secondary" disabled={!autoRoot} onClick={() => applyAutoRoot(key)}>
                  Use Auto-Detected Path
                </Button>
              </div>
              <Field label="Papyrus Compiler" hint="Full path to PapyrusCompiler.exe.">
                <Input
                  value={state.compilerPath}
                  onChange={(_, data) => handleCompilerChange(key, data.value)}
                  placeholder={deriveDefaultCompiler(key, state.rootPath)}
                />
              </Field>
              <div>
                <Text size={200} className={styles.mutedText}>Script directories:</Text>
                <div className={styles.sectionGridTight}>
                  {state.scriptPaths.length ? (
                    state.scriptPaths.map(pathValue => (
                      <Text key={pathValue} size={200} className={styles.summaryValue}>{pathValue}</Text>
                    ))
                  ) : (
                    <Text size={200} className={styles.summaryValue}>None configured yet.</Text>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.wizardActions}>
        <Button appearance="secondary" onClick={() => setWizardStep('auto')}>Back</Button>
        <Button appearance="primary" onClick={() => setWizardStep('namespace')}>Next</Button>
      </div>
    </div>
  );

  const NamespaceStep = (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Namespace & Output Paths</Text>
        <Text size={200} className={styles.mutedText}>
          Configure where your source scripts live and where compiled scripts should be emitted for each game.
        </Text>
      </div>
      <div className={styles.sectionGridTight}>
        {GAME_ORDER.map(({ key, label }) => {
          const state = gameStates[key];
          const hasRoot = !!state.rootPath;
          const namespaceBase = getNamespaceBase(state.rootPath);
          const namespaceResolved = hasRoot ? (state.namespaceDir || namespaceBase || '') : '';
          const outputResolved = hasRoot ? (state.outputDir || deriveOutputDir(state.rootPath, state.namespaceFolder) || '') : '';
          const namespaceDisplay = hasRoot
            ? (namespaceResolved || 'Namespace path could not be derived.')
            : (state.namespaceFolder
              ? `Scripts/Source/${state.namespaceFolder}`
              : 'Set a Creation Kit root to resolve the namespace path.');
          const outputDisplay = hasRoot
            ? (outputResolved || 'Output path could not be derived.')
            : (state.namespaceFolder
              ? `Scripts/${state.namespaceFolder}`
              : 'Set a Creation Kit root to resolve the output path.');
          const namespaceStatus = pathStatus[key]?.namespace ?? (namespaceResolved ? false : null);
          const outputStatus = pathStatus[key]?.output ?? (outputResolved ? false : null);
          const showNamespaceCreate = hasRoot && namespaceStatus !== true;
          const showOutputCreate = hasRoot && outputStatus !== true;
          return (
            <div key={key} className={styles.gameCard}>
              <Text weight="semibold">{label}</Text>
              <Text size={200} className={styles.mutedText}>
                Configure the base namespace folder inside <code>Scripts/Source</code>. This establishes the default location; per-mod overrides remain available after the wizard.
              </Text>
              <Field label="Namespace" hint="Folder name created under Scripts/Source.">
                <Input
                  value={state.namespaceFolder}
                  onChange={(_, data) => handleNamespaceFolderChange(key, data.value)}
                  placeholder="MyMod"
                />
              </Field>
              <div className={styles.sectionGridTight}>
                <Text size={200} className={styles.summaryValue}>Namespace path: {namespaceDisplay}</Text>
                {hasRoot && namespaceResolved ? (
                  <div className={styles.statusRow}>
                    {namespaceStatus === null ? (
                      <Spinner size="tiny" />
                    ) : namespaceStatus ? (
                      <CheckmarkCircle20Regular className={styles.statusIconPositive} />
                    ) : (
                      <Warning20Regular className={styles.statusIconWarning} />
                    )}
                    <Text size={200} className={styles.mutedText}>
                      {namespaceStatus === null
                        ? 'Checking namespace folder...'
                        : namespaceStatus
                          ? 'Namespace folder already exists.'
                          : 'Namespace folder is missing; enable creation to scaffold it during save.'}
                    </Text>
                  </div>
                ) : hasRoot ? (
                  <Text size={200} className={styles.mutedText}>Provide a namespace folder name to build your Scripts/Source path.</Text>
                ) : null}
                <Text size={200} className={styles.summaryValue}>Output path: {outputDisplay}</Text>
                {hasRoot && outputResolved ? (
                  <div className={styles.statusRow}>
                    {outputStatus === null ? (
                      <Spinner size="tiny" />
                    ) : outputStatus ? (
                      <CheckmarkCircle20Regular className={styles.statusIconPositive} />
                    ) : (
                      <Warning20Regular className={styles.statusIconWarning} />
                    )}
                    <Text size={200} className={styles.mutedText}>
                      {outputStatus === null
                        ? 'Checking output folder...'
                        : outputStatus
                          ? 'Output folder already exists.'
                          : 'Output folder is missing; enable creation to scaffold it during save.'}
                    </Text>
                  </div>
                ) : hasRoot ? (
                  <Text size={200} className={styles.mutedText}>Output path will follow the namespace folder when provided.</Text>
                ) : null}
                <Text size={200} className={styles.mutedText}>Fragments can be configured per project after finishing the wizard.</Text>
              </div>
              <div className={styles.flexRowWrap}>
                {showNamespaceCreate && (
                  <Checkbox
                    label="Create namespace folder"
                    checked={state.createNamespaceDirs}
                    disabled={!hasRoot}
                    onChange={(_, data) => handleToggleCreate(key, 'namespace', !!data.checked)}
                  />
                )}
                {showOutputCreate && (
                  <Checkbox
                    label="Create output folder"
                    checked={state.createOutputDirs}
                    disabled={!hasRoot}
                    onChange={(_, data) => handleToggleCreate(key, 'output', !!data.checked)}
                  />
                )}
                {hasRoot && !showNamespaceCreate && !showOutputCreate && (
                  <Text size={200} className={styles.mutedText}>All required folders already exist.</Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.wizardActions}>
        <Button appearance="secondary" onClick={() => setWizardStep('roots')}>Back</Button>
        <Button appearance="primary" onClick={() => setWizardStep('summary')}>Next</Button>
      </div>
    </div>
  );

  const gamesForSummary = GAME_ORDER.filter(({ key }) => {
    const state = gameStates[key];
    return (
      state.scriptPaths.length > 0 ||
      !!state.compilerPath ||
      !!state.namespaceDir ||
      !!state.outputDir
    );
  });

  const SummaryStep = (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Review & Save</Text>
        <Text size={200} className={styles.mutedText}>
          Confirm the detected and manual values, then persist them to Papyrus workspace settings.
        </Text>
      </div>
      <div className={styles.summaryGrid}>
        {gamesForSummary.length === 0 ? (
          <MessageBar intent="info">
            <MessageBarBody>
              <MessageBarTitle>No game data ready</MessageBarTitle>
              <Text size={200}>Provide at least one game root or namespace path before saving.</Text>
            </MessageBarBody>
          </MessageBar>
        ) : (
          gamesForSummary.map(({ key, label }) => {
            const state = gameStates[key];
            const ensureSummary = [
              state.createNamespaceDirs ? 'Namespace folders' : null,
              state.createOutputDirs ? 'Output folders' : null
            ].filter(Boolean).join(', ') || 'No additional folders';
            return (
              <div key={key} className={styles.summaryCard}>
                <Text weight="semibold">{label}</Text>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Creation Kit Root</Text>
                  <Text className={styles.summaryValue}>{state.rootPath || 'Not set'}</Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Papyrus Compiler</Text>
                  <Text className={styles.summaryValue}>{state.compilerPath || 'Not set'}</Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Script Paths</Text>
                  <Text className={styles.summaryValue}>
                    {state.scriptPaths.length ? state.scriptPaths.join(', ') : 'None'}
                  </Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Namespace Directories</Text>
                  <Text className={styles.summaryValue}>
                    {state.namespaceDir || 'Not set'}
                  </Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Output Directories</Text>
                  <Text className={styles.summaryValue}>
                    {state.outputDir || 'Not set'}
                  </Text>
                </div>
                <div className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>Folders to create</Text>
                  <Text className={styles.summaryValue}>{ensureSummary}</Text>
                </div>
              </div>
            );
          })
        )}
      </div>
      {saveFeedback.state === 'saving' && (
        <div className={styles.summaryStatus}>
          <Spinner size="medium" label="Saving settings…" />
        </div>
      )}
      {saveFeedback.state === 'success' && (
        <MessageBar intent="success" className={styles.summaryMessage}>
          <MessageBarBody>
            <MessageBarTitle>Settings saved</MessageBarTitle>
            <Text size={200}>
              {saveFeedback.message || 'Papyrus workspace settings updated successfully.'}
            </Text>
          </MessageBarBody>
        </MessageBar>
      )}
      {saveFeedback.state === 'error' && (
        <MessageBar intent="error" className={styles.summaryMessage}>
          <MessageBarBody>
            <MessageBarTitle>Failed to save settings</MessageBarTitle>
            <Text size={200}>
              {saveFeedback.message || 'An unknown error occurred while saving the configuration.'}
            </Text>
          </MessageBarBody>
        </MessageBar>
      )}
      {saveFeedback.state === 'success' ? (
        <div className={styles.wizardActions}>
          <Button
            appearance="primary"
            onClick={() => {
              onCompleted?.();
              onNavigate?.('overview');
              setWizardStep('auto');
            }}
          >
            Return to Overview
          </Button>
        </div>
      ) : saveFeedback.state === 'error' ? (
        <div className={styles.wizardActions}>
          <Button appearance="secondary" onClick={() => setWizardStep('namespace')}>
            Back
          </Button>
          <Button
            appearance="primary"
            disabled={gamesForSummary.length === 0}
            onClick={handleSave}
          >
            Retry Save
          </Button>
        </div>
      ) : (
        <div className={styles.wizardActions}>
          <Button appearance="secondary" disabled={saveFeedback.state === 'saving'} onClick={() => setWizardStep('namespace')}>
            Back
          </Button>
          <Button
            appearance="primary"
            disabled={saveFeedback.state === 'saving' || gamesForSummary.length === 0}
            onClick={handleSave}
          >
            {saveFeedback.state === 'saving' ? 'Saving…' : 'Save to Settings'}
          </Button>
        </div>
      )}
    </div>
  );

  switch (wizardStep) {
    case 'auto':
      return AutoDiscoverStep;
    case 'roots':
      return RootsStep;
    case 'namespace':
      return NamespaceStep;
    case 'summary':
      return SummaryStep;
    default:
      return AutoDiscoverStep;
  }
};

type SetupWizardCompletedViewProps = {
  onRestart: () => void;
};

const SetupWizardCompletedView: React.FC<SetupWizardCompletedViewProps> = ({ onRestart }) => {
  const styles = useStyles();

  return (
    <div className={styles.sectionGrid}>
      <div className={styles.completedNotice}>
        <Text weight="semibold">Setup Wizard has already been completed.</Text>
        <Text size={200} className={styles.mutedText}>
          If you wish to run the wizard again, use the button below.
        </Text>
        <div className={styles.wizardActions}>
          <Button appearance="primary" onClick={onRestart}>Restart Setup Wizard</Button>
        </div>
      </div>
    </div>
  );
};

type WorkspaceProject = {
  code: string;
  game: string;
};

const WorkspaceContent: React.FC = () => {
  const styles = useStyles();
  const [gameProfile, setGameProfile] = React.useState<GameKey>('starfield');
  const [codeName, setCodeName] = React.useState('');
  const [namespaceFolder, setNamespaceFolder] = React.useState('');
  const [useFragments, setUseFragments] = React.useState(false);
  const [namespaceStatus, setNamespaceStatus] = React.useState<boolean | null>(null);
  const [outputStatus, setOutputStatus] = React.useState<boolean | null>(null);
  const [fragmentNamespaceStatus, setFragmentNamespaceStatus] = React.useState<boolean | null>(null);
  const [fragmentOutputStatus, setFragmentOutputStatus] = React.useState<boolean | null>(null);
  const [existingProjects, setExistingProjects] = React.useState<WorkspaceProject[]>([]);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = React.useState('');
  const pathRequestTypeRef = React.useRef<Map<string, 'primary' | 'fragments'>>(new Map());

  type FolderState = {
    root: string;
    namespaceDir: string;
    namespaceFragmentsDir: string;
    outputDir: string;
    outputFragmentsDir: string;
  };

  const [folderState, setFolderState] = React.useState<Record<GameKey, FolderState>>({
    starfield: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' },
    fallout: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' },
    skyrim: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' }
  });

  const requestProjectList = React.useCallback((namespaceDir: string) => {
    if (!namespaceDir || !window.__papyrusVsCodeApi?.postMessage) {
      setExistingProjects([]);
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.requestWorkspaceProjects',
      payload: { namespace: namespaceDir, game: gameProfile }
    });
  }, [gameProfile]);

  const requestFolderStatus = React.useCallback((nsDir: string, outDir: string, fragmentNamespaceDir?: string, fragmentOutputDir?: string) => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    const requestId = `workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload: { requestId: string; namespace?: string; output?: string } = { requestId };
    let hasRequest = false;
    if (nsDir) {
      payload.namespace = nsDir;
      hasRequest = true;
      setNamespaceStatus(null);
    }
    if (outDir) {
      payload.output = outDir;
      hasRequest = true;
      setOutputStatus(null);
    }
    if (hasRequest) {
      pathRequestTypeRef.current.set(requestId, 'primary');
      window.__papyrusVsCodeApi.postMessage({
        type: 'papyrus.pathCheck',
        payload
      });
    } else {
      setNamespaceStatus(false);
      setOutputStatus(false);
    }

    if (fragmentNamespaceDir || fragmentOutputDir) {
      const fragmentRequestId = `workspace-fragments-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const fragmentPayload: { requestId: string; namespace?: string; output?: string } = { requestId: fragmentRequestId };
      let fragmentHasRequest = false;
      if (fragmentNamespaceDir) {
        fragmentPayload.namespace = fragmentNamespaceDir;
        fragmentHasRequest = true;
        setFragmentNamespaceStatus(null);
      } else {
        setFragmentNamespaceStatus(null);
      }
      if (fragmentOutputDir) {
        fragmentPayload.output = fragmentOutputDir;
        fragmentHasRequest = true;
        setFragmentOutputStatus(null);
      } else {
        setFragmentOutputStatus(null);
      }
      if (fragmentHasRequest) {
        pathRequestTypeRef.current.set(fragmentRequestId, 'fragments');
        window.__papyrusVsCodeApi.postMessage({
          type: 'papyrus.pathCheck',
          payload: fragmentPayload
        });
      }
    } else {
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
    }
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if (data.type === 'papyrus.setupState' && data.payload) {
        const payload = data.payload as Record<string, { namespaceDir?: string; outputDir?: string; namespaceFragmentsDir?: string; outputFragmentsDir?: string; rootPath?: string }>;
        const next: Record<GameKey, FolderState> = {
          starfield: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' },
          fallout: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' },
          skyrim: { root: '', namespaceDir: '', namespaceFragmentsDir: '', outputDir: '', outputFragmentsDir: '' }
        };
        for (const key of Object.keys(payload) as GameKey[]) {
          const entry = payload[key];
          if (!entry) {
            continue;
          }
          next[key] = {
            root: entry.rootPath ?? '',
            namespaceDir: entry.namespaceDir ?? '',
            namespaceFragmentsDir: entry.namespaceFragmentsDir ?? '',
            outputDir: entry.outputDir ?? '',
            outputFragmentsDir: entry.outputFragmentsDir ?? ''
          };
        }
        setFolderState(next);
        const selected = next[gameProfile];
        requestProjectList(selected.namespaceDir);
        const fragmentNamespaceDir = useFragments && selected.namespaceFragmentsDir ? selected.namespaceFragmentsDir : undefined;
        const fragmentOutputDir = useFragments && selected.outputFragmentsDir ? selected.outputFragmentsDir : undefined;
        requestFolderStatus(
          selected.namespaceDir,
          selected.outputDir,
          fragmentNamespaceDir,
          fragmentOutputDir
        );
      }

      if (data.type === 'papyrus.pathCheckResult') {
        const requestId = typeof data.requestId === 'string' ? data.requestId : undefined;
        if (!requestId) {
          return;
        }
        const requestType = pathRequestTypeRef.current.get(requestId);
        if (!requestType) {
          return;
        }
        pathRequestTypeRef.current.delete(requestId);
        if (requestType === 'primary') {
          if (typeof data.namespaceExists === 'boolean') {
            setNamespaceStatus(data.namespaceExists);
          }
          if (typeof data.outputExists === 'boolean') {
            setOutputStatus(data.outputExists);
          }
        } else {
          if (typeof data.namespaceExists === 'boolean') {
            setFragmentNamespaceStatus(data.namespaceExists);
          }
          if (typeof data.outputExists === 'boolean') {
            setFragmentOutputStatus(data.outputExists);
          }
        }
      }

      if (data.type === 'papyrus.workspaceProjects') {
        const projects = Array.isArray(data.projects) ? data.projects : [];
        setExistingProjects(projects.filter((entry: any) => typeof entry?.code === 'string' && entry.code).map((entry: any) => ({
          code: entry.code,
          game: typeof entry?.game === 'string' ? entry.game.toLowerCase() : ''
        })));
      }

      if (data.type === 'papyrus.saveWorkspaceProjectResult') {
        if (data.status === 'success') {
          setSaveState('success');
          setSaveMessage('Workspace project saved.');
          const selected = folderState[gameProfile];
          requestProjectList(selected.namespaceDir);
        } else {
          setSaveState('error');
          setSaveMessage(typeof data.message === 'string' ? data.message : 'Failed to save workspace project.');
        }
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [folderState, gameProfile, requestFolderStatus, requestProjectList, useFragments]);

  React.useEffect(() => {
    const selected = folderState[gameProfile];
    requestProjectList(selected.namespaceDir);
    requestFolderStatus(
      selected.namespaceDir,
      selected.outputDir,
      useFragments && selected.namespaceFragmentsDir ? selected.namespaceFragmentsDir : undefined,
      useFragments && selected.outputFragmentsDir ? selected.outputFragmentsDir : undefined
    );
  }, [folderState, gameProfile, requestProjectList, requestFolderStatus, useFragments]);

  const handleGameChange = (_: React.ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
    const value = (data.value as GameKey | undefined) ?? 'starfield';
    if (value === gameProfile) {
      return;
    }
    setGameProfile(value);
    setCodeName('');
    setNamespaceFolder('');
    setUseFragments(false);
    setNamespaceStatus(null);
    setOutputStatus(null);
    setFragmentNamespaceStatus(null);
    setFragmentOutputStatus(null);
    setExistingProjects([]);
    setSaveState('idle');
    setSaveMessage('');
    pathRequestTypeRef.current.clear();
  };

  const handleNamespaceChange = (_: unknown, data: { value: string }) => {
    const sanitized = sanitizeNamespaceFolder(data.value);
    setNamespaceFolder(sanitized);
  };

  const selectedFolders = folderState[gameProfile];
  const resolvedNamespaceDir = selectedFolders.namespaceDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.namespaceDir, namespaceFolder)
    : '';
  const resolvedOutputDir = selectedFolders.outputDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.outputDir, namespaceFolder)
    : '';
  const resolvedNamespaceFragmentsDir = selectedFolders.namespaceFragmentsDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.namespaceFragmentsDir, namespaceFolder)
    : '';
  const resolvedOutputFragmentsDir = selectedFolders.outputFragmentsDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.outputFragmentsDir, namespaceFolder)
    : '';

  const fragmentNamespaceCheck = useFragments && resolvedNamespaceFragmentsDir ? resolvedNamespaceFragmentsDir : undefined;
  const fragmentOutputCheck = useFragments && resolvedOutputFragmentsDir ? resolvedOutputFragmentsDir : undefined;

  React.useEffect(() => {
    if (!namespaceFolder) {
      setNamespaceStatus(false);
      setOutputStatus(false);
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
      return;
    }
    requestFolderStatus(
      resolvedNamespaceDir,
      resolvedOutputDir,
      fragmentNamespaceCheck,
      fragmentOutputCheck
    );
  }, [
    namespaceFolder,
    resolvedNamespaceDir,
    resolvedOutputDir,
    resolvedNamespaceFragmentsDir,
    resolvedOutputFragmentsDir,
    useFragments,
    fragmentNamespaceCheck,
    fragmentOutputCheck,
    requestFolderStatus
  ]);

  const ensureTargets: string[] = [];
  if (namespaceFolder) {
    if (!namespaceStatus && resolvedNamespaceDir) {
      ensureTargets.push(resolvedNamespaceDir);
    }
    if (!outputStatus && resolvedOutputDir) {
      ensureTargets.push(resolvedOutputDir);
    }
    if (useFragments) {
      if (!fragmentNamespaceStatus && fragmentNamespaceCheck) {
        ensureTargets.push(fragmentNamespaceCheck);
      }
      if (!fragmentOutputStatus && fragmentOutputCheck) {
        ensureTargets.push(fragmentOutputCheck);
      }
    }
  }

  const handleSaveProject = () => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      setSaveState('error');
      setSaveMessage('VS Code API unavailable.');
      return;
    }
    if (!codeName || !namespaceFolder) {
      setSaveState('error');
      setSaveMessage('Provide a project code name and namespace folder.');
      return;
    }
    setSaveState('saving');
    setSaveMessage('Saving workspace project...');
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.saveWorkspaceProject',
      payload: {
        game: gameProfile,
        code: codeName,
        namespaceDir: resolvedNamespaceDir,
        outputDir: resolvedOutputDir,
        namespaceFragmentsDir: useFragments ? resolvedNamespaceFragmentsDir : '',
        outputFragmentsDir: useFragments ? resolvedOutputFragmentsDir : '',
        ensure: ensureTargets
      }
    });
  };

  const handleToggleFragments = (_: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
    const enabled = data.checked === true;
    setUseFragments(enabled);
    if (!enabled) {
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
    }
  };

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage?.({ type: 'papyrus.requestSetupState' });
  }, []);

  React.useEffect(() => {
    if (saveState !== 'idle' && saveState !== 'saving') {
      const timer = setTimeout(() => {
        setSaveState('idle');
        setSaveMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  const namespaceExists = namespaceStatus === true;
  const outputExists = outputStatus === true;
  const fragmentNamespaceExists = fragmentNamespaceStatus === true;
  const fragmentOutputExists = fragmentOutputStatus === true;

  const namespaceDisplay = resolvedNamespaceDir || 'Namespace path unavailable. Run the setup wizard to configure it.';
  const outputDisplay = resolvedOutputDir || 'Output path unavailable. Run the setup wizard to configure it.';
  const fragmentNamespaceDisplay = resolvedNamespaceFragmentsDir || 'Fragment namespace path unavailable. Run the setup wizard to configure fragment folders.';
  const fragmentOutputDisplay = resolvedOutputFragmentsDir || 'Fragment output path unavailable. Run the setup wizard to configure fragment folders.';

  const existingForGame = existingProjects.filter(entry => entry.game === gameProfile);
  const hasNamespaceBasePath = !!resolvedNamespaceDir;
  const hasOutputBasePath = !!resolvedOutputDir;
  const showPrimaryStatus = hasNamespaceBasePath || hasOutputBasePath;
  const hasFragmentNamespacePath = !!fragmentNamespaceCheck;
  const hasFragmentOutputPath = !!fragmentOutputCheck;
  const showFragmentStatus = hasFragmentNamespacePath || hasFragmentOutputPath;

  return (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Workspace Projects</Text>
        <Text size={200} className={styles.mutedText}>
          Create project definitions tied to your configured namespace folders. Switch between projects quickly when working across multiple mods.
        </Text>
      </div>
      <div className={styles.sectionGridTight}>
        <Field label="Target Game" required>
          <Select value={gameProfile} onChange={handleGameChange} aria-label="Target game">
            <option value="starfield">Starfield</option>
            <option value="fallout">Fallout 4</option>
            <option value="skyrim">Skyrim SE / AE</option>
          </Select>
        </Field>
        <Field label="Project Code Name" required hint="Used to reference this project when switching between workspaces.">
          <Input value={codeName} onChange={(_, data) => setCodeName(sanitizeNamespaceFolder(data.value))} placeholder="MyMod" />
        </Field>
        <Field label="Mod Namespace" required hint="Creates a folder under your configured namespace/output directories.">
          <Input value={namespaceFolder} onChange={handleNamespaceChange} placeholder="ProjectFolder" />
        </Field>
        <div>
          <div className={styles.cardHeaderIcon}>
            <Folder20Regular />
            <Text weight="semibold">Namespace Paths</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text weight="semibold" size={200} className={styles.summaryLabel}>Source namespace</Text>
            <Text size={200} className={styles.summaryValue}>{namespaceDisplay}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text weight="semibold" size={200} className={styles.summaryLabel}>Compiled output</Text>
            <Text size={200} className={styles.summaryValue}>{outputDisplay}</Text>
          </div>
          {namespaceFolder && (
            showPrimaryStatus ? (
              <div className={styles.sectionGridTight}>
                {hasNamespaceBasePath && (
                  <div className={styles.statusRow}>
                    {namespaceStatus === null ? <Spinner size="tiny" /> : namespaceExists ? <CheckmarkCircle20Regular className={styles.statusIconPositive} /> : <Warning20Regular className={styles.statusIconWarning} />}
                    <Text size={200} className={styles.mutedText}>
                      {namespaceStatus === null && 'Checking namespace folder...'}
                      {namespaceExists && 'Namespace folder exists.'}
                      {namespaceStatus === false && 'Namespace folder missing; it will be created when you save this project.'}
                    </Text>
                  </div>
                )}
                {hasOutputBasePath && (
                  <div className={styles.statusRow}>
                    {outputStatus === null ? <Spinner size="tiny" /> : outputExists ? <CheckmarkCircle20Regular className={styles.statusIconPositive} /> : <Warning20Regular className={styles.statusIconWarning} />}
                    <Text size={200} className={styles.mutedText}>
                      {outputStatus === null && 'Checking output folder...'}
                      {outputExists && 'Output folder exists.'}
                      {outputStatus === false && 'Output folder missing; it will be created when you save this project.'}
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <Text size={200} className={styles.mutedText}>
                Configure namespace and output folders in the setup wizard to enable status checks for these paths.
              </Text>
            )
          )}
        </div>
        <Checkbox
          label="(Optional) This project requires script fragments"
          checked={useFragments}
          onChange={handleToggleFragments}
        />
        {useFragments && (
          <div className={styles.sectionGridTight}>
            <div className={styles.summaryRow}>
              <Text weight="semibold" size={200} className={styles.summaryLabel}>Fragment namespace</Text>
              <Text size={200} className={styles.summaryValue}>{fragmentNamespaceDisplay}</Text>
            </div>
            <div className={styles.summaryRow}>
              <Text weight="semibold" size={200} className={styles.summaryLabel}>Fragment output</Text>
              <Text size={200} className={styles.summaryValue}>{fragmentOutputDisplay}</Text>
            </div>
            {showFragmentStatus ? (
              <div className={styles.sectionGridTight}>
                {hasFragmentNamespacePath && (
                  <div className={styles.statusRow}>
                    {fragmentNamespaceStatus === null ? <Spinner size="tiny" /> : fragmentNamespaceExists ? <CheckmarkCircle20Regular className={styles.statusIconPositive} /> : <Warning20Regular className={styles.statusIconWarning} />}
                    <Text size={200} className={styles.mutedText}>
                      {fragmentNamespaceStatus === null && 'Checking fragment namespace folder...'}
                      {fragmentNamespaceExists && 'Fragment namespace folder exists.'}
                      {fragmentNamespaceStatus === false && 'Fragment namespace folder missing; it will be created when you save this project.'}
                    </Text>
                  </div>
                )}
                {hasFragmentOutputPath && (
                  <div className={styles.statusRow}>
                    {fragmentOutputStatus === null ? <Spinner size="tiny" /> : fragmentOutputExists ? <CheckmarkCircle20Regular className={styles.statusIconPositive} /> : <Warning20Regular className={styles.statusIconWarning} />}
                    <Text size={200} className={styles.mutedText}>
                      {fragmentOutputStatus === null && 'Checking fragment output folder...'}
                      {fragmentOutputExists && 'Fragment output folder exists.'}
                      {fragmentOutputStatus === false && 'Fragment output folder missing; it will be created when you save this project.'}
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <Text size={200} className={styles.mutedText}>
                Configure fragment folders in the setup wizard to enable status checks for these paths.
              </Text>
            )}
          </div>
        )}
        {existingForGame.length > 0 && (
          <div>
            <Text weight="semibold">Existing Projects</Text>
            <div className={styles.projectList}>
              {existingForGame.map(entry => (
                <Text key={entry.code} size={200} className={styles.summaryValue}>
                  {entry.code}
                </Text>
              ))}
            </div>
          </div>
        )}
      </div>
      {saveState !== 'idle' && (
        <MessageBar intent={saveState === 'success' ? 'success' : saveState === 'saving' ? 'warning' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>
              {saveState === 'saving' && 'Saving workspace project...'}
              {saveState === 'success' && 'Workspace project saved'}
              {saveState === 'error' && 'Failed to save workspace project'}
            </MessageBarTitle>
            <Text size={200} block>{saveMessage}</Text>
          </MessageBarBody>
        </MessageBar>
      )}
      <div className={styles.buttonRow}>
        <Button
          appearance="secondary"
          onClick={() => {
            setCodeName('');
            setNamespaceFolder('');
            setUseFragments(false);
            setSaveState('idle');
            setSaveMessage('');
            setNamespaceStatus(null);
            setOutputStatus(null);
            setFragmentNamespaceStatus(null);
            setFragmentOutputStatus(null);
          }}
        >
          Reset
        </Button>
        <Button appearance="primary" onClick={handleSaveProject} disabled={saveState === 'saving'}>
          {saveState === 'saving' ? 'Saving…' : 'Save Workspace Project'}
        </Button>
      </div>
    </div>
  );
};

const CompilerContent: React.FC = () => {
  const [compilerPath, setCompilerPath] = React.useState('');
  const [scriptPath, setScriptPath] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [outputPath, setOutputPath] = React.useState('');

  const styles = useStyles();

  return (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Compiler Configuration</Text>
        <Text size={200} className={styles.mutedText}>Configure Papyrus compiler inputs and output locations.</Text>
      </div>
      <div className={styles.sectionGridTight}>
        <Field label="Compiler Executable" required>
          <Input value={compilerPath} onChange={(_, data) => setCompilerPath(data.value)} placeholder="C:/Program Files/Starfield/Tools/Papyrus Compiler/PapyrusCompiler.exe" />
        </Field>
        <Field label="Script Source Directory" required>
          <Input value={scriptPath} onChange={(_, data) => setScriptPath(data.value)} placeholder="C:/Program Files/Starfield/Data/Scripts/Source" />
        </Field>
        <Field label="Namespace / Working Directory">
          <Input value={namespace} onChange={(_, data) => setNamespace(data.value)} placeholder="Data/Scripts/Source/MyMod" />
        </Field>
        <Field label="Output Directory">
          <Input value={outputPath} onChange={(_, data) => setOutputPath(data.value)} placeholder="Data/Scripts/Compiled" />
        </Field>
      </div>
      <div className={styles.buttonRow}>
        <Button appearance="secondary">Clear</Button>
        <Button appearance="primary">Apply Compiler Settings</Button>
      </div>
    </div>
  );
};

const DebuggingContent: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Debugging Automation</Text>
        <Text size={200} className={styles.mutedText}>Review scan settings and trigger index updates.</Text>
      </div>
      <div className={styles.sectionGridTight}>
        <Field label="On Save Actions">
          <Label>Select which diagnostics to run after saving Papyrus files.</Label>
          <div className={styles.flexRowWrap}>
            <Button appearance="outline">Lint Scripts</Button>
            <Button appearance="outline">Rebuild Index</Button>
            <Button appearance="outline">Validate Includes</Button>
          </div>
        </Field>
        <Field label="Notifications">
          <Label>Control how Papyrus Tools surfaces compile issues.</Label>
          <div className={styles.flexRowWrap}>
            <Button appearance="secondary">Info Messages</Button>
            <Button appearance="secondary">Status Bar</Button>
            <Button appearance="secondary">Pop-up Alerts</Button>
          </div>
        </Field>
      </div>
      <Divider />
      <div className={styles.buttonRow}>
        <Button appearance="primary">Run Full Diagnostics</Button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const styles = useStyles();
  const [selected, setSelected] = React.useState<SectionKey>('overview');
  const [themeMode, setThemeMode] = React.useState<PapyrusThemeMode>(() => window.__papyrusInitialState?.theme ?? 'light');

  const persistedState = React.useMemo(() => window.__papyrusVsCodeApi?.getState?.() as { wizardCompleted?: boolean } | undefined, []);
  const [wizardCompleted, setWizardCompleted] = React.useState<boolean>(persistedState?.wizardCompleted ?? false);
  const [wizardInstanceKey, setWizardInstanceKey] = React.useState(0);

  const handleNavigate = React.useCallback((section: SectionKey) => {
    setSelected(section);
  }, []);

  React.useEffect(() => {
    const existingState = window.__papyrusVsCodeApi?.getState?.() as Record<string, unknown> | undefined;
    window.__papyrusVsCodeApi?.setState?.({
      ...(existingState || {}),
      wizardCompleted
    });
  }, [wizardCompleted]);

  const handleWizardCompleted = React.useCallback(() => {
    setWizardCompleted(true);
  }, []);

  const handleRestartWizard = React.useCallback(() => {
    setWizardCompleted(false);
    setWizardInstanceKey(prev => prev + 1);
    setSelected('setupWizard');
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<{ type?: string; theme?: PapyrusThemeMode }>) => {
      if (event.data?.type === 'theme' && event.data.theme) {
        setThemeMode(event.data.theme);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const theme = React.useMemo(() => getPapyrusTheme(themeMode), [themeMode]);

  let mainContent: React.ReactNode;
  switch (selected) {
    case 'overview':
      mainContent = (
        <OverviewContent
          wizardCompleted={wizardCompleted}
          onNavigate={handleNavigate}
        />
      );
      break;
    case 'setupWizard':
      mainContent = wizardCompleted ? (
        <SetupWizardCompletedView onRestart={handleRestartWizard} />
      ) : (
        <SetupWizardContent
          key={wizardInstanceKey}
          onNavigate={handleNavigate}
          onCompleted={handleWizardCompleted}
        />
      );
      break;
    case 'workspace':
      mainContent = <WorkspaceContent />;
      break;
    case 'compiler':
      mainContent = <CompilerContent />;
      break;
    case 'debugging':
      mainContent = <DebuggingContent />;
      break;
    default:
      mainContent = null;
  }

  return (
    <FluentProvider theme={theme} className={styles.root}>
      <nav className={styles.sidebar}>
        <Text className={styles.sidebarHeader} size={400}>Control Center</Text>
        <div className={styles.sidebarBrand}>
          <img className={styles.brandImage} src={logoSvg} alt="Papyrus Tools" />
          <Text size={200} className={styles.brandTitle}>Papyrus Control Center</Text>
        </div>
        {[{
          label: undefined,
          tabs: [{ value: 'overview', label: 'Overview' as const }]
        }, {
          label: 'Settings',
          tabs: [
            { value: 'setupWizard', label: 'Setup Wizard' as const },
            { value: 'compiler', label: 'Compiler' as const },
            { value: 'workspace', label: 'Workspace' as const }
          ]
        }, {
          label: 'Troubleshooting',
          tabs: [{ value: 'debugging', label: 'Debugging' as const }]
        }].map(group => {
          const active = group.tabs.some(tab => tab.value === selected) ? selected : undefined;

          return (
            <div key={group.label ?? 'overview'} className={styles.sidebarGroup}>
              {group.label && (
                <Text className={styles.sidebarGroupLabel} role="presentation">
                  {group.label}
                </Text>
              )}
              <TabList
                vertical
                selectedValue={active}
                onTabSelect={(_, data) => setSelected(data.value as SectionKey)}
                className={styles.tabListFullWidth}
              >
                {group.tabs.map(tab => (
                  <Tab key={tab.value} value={tab.value}>{tab.label}</Tab>
                ))}
              </TabList>
            </div>
          );
        })}
      </nav>
      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <Text weight="semibold" size={500}>
            {selected === 'overview' && 'Overview'}
            {selected === 'setupWizard' && 'Setup Wizard'}
            {selected === 'workspace' && 'Workspace Setup'}
            {selected === 'compiler' && 'Compiler Settings'}
            {selected === 'debugging' && 'Troubleshooting & Debugging'}
          </Text>
          <Text size={200} className={styles.mutedText}>
            {selected === 'overview' && 'Review key actions and quick shortcuts for Papyrus Tools.'}
            {selected === 'setupWizard' && 'Run the guided setup to establish paths and profiles for your modding tools.'}
            {selected === 'workspace' && 'Provide workspace metadata to tailor Papyrus helpers to this mod.'}
            {selected === 'compiler' && 'Manage compiler inputs, outputs, and namespaces for Papyrus builds.'}
            {selected === 'debugging' && 'Configure how Papyrus Tools scans and reports issues across scripts.'}
          </Text>
        </div>
        {mainContent}
      </main>
    </FluentProvider>
  );
};

export default AppContent;
