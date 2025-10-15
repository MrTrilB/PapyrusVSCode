import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Button,
  Divider,
  Field,
  FluentProvider,
  Input,
  Checkbox,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tab,
  TabList,
  Text,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { Add20Regular, ArrowExport20Regular, ArrowImport20Regular, ArrowSync20Regular, CheckmarkCircle20Regular, Clock20Regular, Delete20Regular, Folder20Regular, Info20Regular, Link20Regular, Open16Regular, Search20Regular, Search24Regular, Settings20Regular, Target20Regular, Warning20Regular } from '@fluentui/react-icons';
import type { CheckboxOnChangeData, SelectOnChangeData } from '@fluentui/react-components';
import { getPapyrusTheme, PapyrusThemeMode } from './PapyrusFluentUITheme';
import logoSvg from './images/Papyrus Tools - Logo Colour.svg';

type SectionKey = 'overview' | 'setupWizard' | 'workspace' | 'compiler' | 'debugging' | 'projects';

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
    flex: '0 0 240px',
    minWidth: '240px',
    flexShrink: 0,
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
  overviewTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalM
  },
  projectsToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalS
  },
  projectsTableWrapper: {
    overflowX: 'auto'
  },
  projectsTable: {
    minWidth: '720px'
  },
  projectsActions: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXS
  },
  projectsFragmentGroup: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXS
  },
  projectsFragmentItem: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXXS
  },
  pathCell: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXXS
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
  projectsEmptyState: {
    display: 'grid',
    rowGap: tokens.spacingVerticalS,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL)
  },
  dialogContentGrid: {
    display: 'grid',
    rowGap: tokens.spacingVerticalM
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
  },
  activeProjectLabel: {
    color: tokens.colorNeutralForeground2
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalS
  },
  statusItem: {
    display: 'grid',
    rowGap: tokens.spacingVerticalXXS
  },
  statusLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    display: 'block'
  }
});

type OverviewContentProps = {
  wizardCompleted: boolean;
  onNavigate: (section: SectionKey) => void;
};

type OverviewProject = {
  name: string;
  namespace: string;
  namespaceFolder: string;
  namespaceExists: boolean;
  outputDir: string;
  outputExists: boolean;
  namespaceFragmentsDir: string;
  namespaceFragmentsExists: boolean;
  outputFragmentsDir: string;
  outputFragmentsExists: boolean;
  game?: GameKey;
};

type ActiveProjectSummary = {
  name: string;
  namespaceDir: string;
  outputDir: string;
  namespaceFragmentsDir: string;
  outputFragmentsDir: string;
  game?: GameKey;
};

type ProjectsOverviewProps = {
  projects: OverviewProject[];
  onNavigateWorkspace: () => void;
  activeProject?: ActiveProjectSummary;
};

const OverviewContent: React.FC<OverviewContentProps> = ({ wizardCompleted, onNavigate }) => {
  const styles = useStyles();

  const summaryContent = (
    <div>
      <div>
        <Text weight="semibold" size={500}>Welcome to Papyrus Control Centre</Text>
        <Text size={300}>
          Use the navigation to configure your mod workspace, compiler preferences, and diagnostic tooling using our GUI.
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
              Project Wizard
            </Button>
          ) : (
            <Button appearance="primary" onClick={() => onNavigate('setupWizard')}>
              Setup Wizard
            </Button>
          )}
          <Button appearance="secondary" onClick={() => onNavigate('debugging')}>
            Diagnostics Report
          </Button>
        </div>
        <Text size={200} className={styles.mutedText}>
          
        </Text>
      </div>
    </div>
  );

  return (
    <div className={styles.sectionGrid}>
      {summaryContent}
    </div>
  );
};

const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({ projects, onNavigateWorkspace, activeProject }) => {
  const styles = useStyles();
  const [selectedGameFilter, setSelectedGameFilter] = React.useState<'all' | GameKey>('all');
  const [dialogState, setDialogState] = React.useState<{ mode: 'load' | 'edit' | 'delete' | null; project?: OverviewProject }>({ mode: null });
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ intent: 'success' | 'error'; message: string } | null>(null);
  const [editForm, setEditForm] = React.useState<{
    name: string;
    game: GameKey;
    namespaceDir: string;
    outputDir: string;
    namespaceFragmentsDir: string;
    outputFragmentsDir: string;
  }>({
    name: '',
    game: 'starfield',
    namespaceDir: '',
    outputDir: '',
    namespaceFragmentsDir: '',
    outputFragmentsDir: ''
  });

  const sortedProjects = React.useMemo(() => {
    const copy = [...projects];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    if (selectedGameFilter === 'all') {
      return sortedProjects;
    }
    return sortedProjects.filter(project => project.game === selectedGameFilter);
  }, [selectedGameFilter, sortedProjects]);

  const hasProjects = sortedProjects.length > 0;

  const handleReveal = React.useCallback((pathValue: string) => {
    if (!pathValue) {
      return;
    }
    window.__papyrusVsCodeApi?.postMessage?.({
      type: 'papyrusTools.revealPath',
      payload: { target: pathValue }
    });
  }, []);

  const handleOpenDialog = (mode: 'load' | 'edit' | 'delete', project: OverviewProject) => {
    setDialogState({ mode, project });
    setPending(false);
    if (mode === 'edit') {
      setEditForm({
        name: project.name,
        game: project.game ?? 'starfield',
        namespaceDir: project.namespace,
        outputDir: project.outputDir,
        namespaceFragmentsDir: project.namespaceFragmentsDir,
        outputFragmentsDir: project.outputFragmentsDir
      });
    }
  };

  const resetDialog = () => {
    setDialogState({ mode: null });
    setPending(false);
    setEditForm({
      name: '',
      game: 'starfield',
      namespaceDir: '',
      outputDir: '',
      namespaceFragmentsDir: '',
      outputFragmentsDir: ''
    });
  };

  React.useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }
      if (data.type === 'papyrusTools.loadWorkspaceProjectResult') {
        setPending(false);
        if (data.status === 'success') {
          setFeedback({ intent: 'success', message: `Loaded project${data.project?.name ? ` ${data.project.name}` : ''}.` });
          resetDialog();
        } else {
          setFeedback({ intent: 'error', message: typeof data.message === 'string' ? data.message : 'Failed to load the project.' });
        }
      }
      if (data.type === 'papyrusTools.updateWorkspaceProjectResult') {
        setPending(false);
        if (data.status === 'success') {
          setFeedback({ intent: 'success', message: 'Project updated.' });
          resetDialog();
        } else {
          setFeedback({ intent: 'error', message: typeof data.message === 'string' ? data.message : 'Failed to update the project.' });
        }
      }
      if (data.type === 'papyrusTools.deleteWorkspaceProjectResult') {
        setPending(false);
        if (data.status === 'success') {
          setFeedback({ intent: 'success', message: 'Project deleted.' });
          resetDialog();
        } else {
          setFeedback({ intent: 'error', message: typeof data.message === 'string' ? data.message : 'Failed to delete the project.' });
        }
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const handleLoadConfirm = () => {
    if (!dialogState.project) {
      return;
    }
    setPending(true);
    window.__papyrusVsCodeApi?.postMessage?.({
      type: 'papyrusTools.loadWorkspaceProject',
      payload: {
        name: dialogState.project.name,
        game: dialogState.project.game,
        namespaceDir: dialogState.project.namespace,
        outputDir: dialogState.project.outputDir,
        namespaceFragmentsDir: dialogState.project.namespaceFragmentsDir,
        outputFragmentsDir: dialogState.project.outputFragmentsDir
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!dialogState.project) {
      return;
    }
    setPending(true);
    window.__papyrusVsCodeApi?.postMessage?.({
      type: 'papyrusTools.deleteWorkspaceProject',
      payload: {
        name: dialogState.project.name,
        namespaceDir: dialogState.project.namespace
      }
    });
  };

  const handleEditSubmit = () => {
    if (!dialogState.project) {
      return;
    }
    if (!editForm.name || !editForm.namespaceDir || !editForm.outputDir) {
      setFeedback({ intent: 'error', message: 'Project name, namespace, and output folders are required.' });
      return;
    }
    setPending(true);
    window.__papyrusVsCodeApi?.postMessage?.({
      type: 'papyrusTools.updateWorkspaceProject',
      payload: {
        originalName: dialogState.project.name,
        originalNamespaceDir: dialogState.project.namespace,
        name: editForm.name,
        game: editForm.game,
        namespaceDir: editForm.namespaceDir,
        outputDir: editForm.outputDir,
        namespaceFragmentsDir: editForm.namespaceFragmentsDir,
        outputFragmentsDir: editForm.outputFragmentsDir
      }
    });
  };

  const renderPathCell = (pathValue: string, exists: boolean) => {
    if (!pathValue) {
      return <Text size={200} className={styles.mutedText}>Not configured</Text>;
    }
    return (
      <div className={styles.pathCell}>
        <Link
          href="#"
          title={pathValue}
          onClick={event => {
            event.preventDefault();
            handleReveal(pathValue);
          }}
        >
          Link <Open16Regular />
        </Link>
        <Text size={200} className={exists ? styles.statusPositive : styles.statusWarning}>
          {exists ? 'Available' : 'Missing'}
        </Text>
      </div>
    );
  };

  const dialogOpen = dialogState.mode !== null;
  const dialogProject = dialogState.project;

  return (
    <div className={styles.sectionGrid}>
      <div className={styles.projectsToolbar}>
        <Field label="Filter by Game">
          <Select
            value={selectedGameFilter}
            onChange={(_, data) => setSelectedGameFilter((data.value as 'all' | GameKey) ?? 'all')}
            aria-label="Filter projects by game"
          >
            <option value="all">All games</option>
            <option value="starfield">Starfield</option>
            <option value="fallout">Fallout 4</option>
            <option value="skyrim">Skyrim SE / AE</option>
          </Select>
        </Field>
        <Button appearance="primary" onClick={onNavigateWorkspace}>
          New Project
        </Button>
      </div>

      {feedback && (
        <MessageBar intent={feedback.intent === 'success' ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>{feedback.intent === 'success' ? 'Success' : 'Action failed'}</MessageBarTitle>
            <Text size={200}>{feedback.message}</Text>
          </MessageBarBody>
        </MessageBar>
      )}

      {filteredProjects.length === 0 ? (
        <div className={styles.projectsEmptyState}>
          {hasProjects ? (
            <>
              <Text size={300} weight="semibold">No projects for this filter</Text>
              <Text size={200} className={styles.mutedText}>Select a different game filter to view your saved projects.</Text>
              <Button appearance="secondary" onClick={() => setSelectedGameFilter('all')}>Show All Projects</Button>
            </>
          ) : (
            <>
              <Text size={300} weight="semibold">No projects yet</Text>
              <Text size={200} className={styles.mutedText}>
                Create a workspace project to quickly switch between mod configurations.
              </Text>
              <Button appearance="secondary" onClick={onNavigateWorkspace}>Create Project</Button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.projectsTableWrapper}>
          <Table className={styles.projectsTable} aria-label="Workspace projects">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Project</TableHeaderCell>
                <TableHeaderCell>Game</TableHeaderCell>
                <TableHeaderCell>Source Namespace</TableHeaderCell>
                <TableHeaderCell>Compiled Output</TableHeaderCell>
                <TableHeaderCell>Fragments</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => (
                <TableRow key={`${project.name}::${project.namespace}`}>
                  <TableCell>
                    <Text weight="semibold">{project.name}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{project.game ? PROFILE_LABELS[project.game] : 'Unknown'}</Text>
                  </TableCell>
                  <TableCell>{renderPathCell(project.namespace, project.namespaceExists)}</TableCell>
                  <TableCell>{renderPathCell(project.outputDir, project.outputExists)}</TableCell>
                  <TableCell>
                    {project.namespaceFragmentsDir || project.outputFragmentsDir ? (
                      <div className={styles.projectsFragmentGroup}>
                        <div className={styles.projectsFragmentItem}>
                          <Text size={200} weight="semibold">Namespace</Text>
                          {project.namespaceFragmentsDir
                            ? renderPathCell(project.namespaceFragmentsDir, project.namespaceFragmentsExists)
                            : <Text size={200} className={styles.mutedText}>Not configured</Text>}
                        </div>
                        <div className={styles.projectsFragmentItem}>
                          <Text size={200} weight="semibold">Output</Text>
                          {project.outputFragmentsDir
                            ? renderPathCell(project.outputFragmentsDir, project.outputFragmentsExists)
                            : <Text size={200} className={styles.mutedText}>Not configured</Text>}
                        </div>
                      </div>
                    ) : (
                      <Text size={200} className={styles.mutedText}>Not configured</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={styles.projectsActions}>
                      <Button appearance="secondary" disabled={activeProject && project.name === activeProject.name && project.namespace === activeProject.namespaceDir} onClick={() => handleOpenDialog('load', project)}>Load</Button>
                      <Button appearance="secondary" onClick={() => handleOpenDialog('edit', project)}>Edit</Button>
                      <Button appearance="secondary" onClick={() => handleOpenDialog('delete', project)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        modalType={dialogState.mode === 'delete' ? 'alert' : 'modal'}
        onOpenChange={(_, data) => {
          if (!data.open) {
            resetDialog();
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {dialogState.mode === 'load' && `Load ${dialogProject?.name ?? 'project'}`}
              {dialogState.mode === 'edit' && `Edit ${dialogProject?.name ?? 'project'}`}
              {dialogState.mode === 'delete' && `Delete ${dialogProject?.name ?? 'project'}`}
            </DialogTitle>
            <DialogContent>
              {dialogState.mode === 'load' && dialogProject && (
                <div className={styles.dialogContentGrid}>
                  <Text size={200}>Set {dialogProject.name} as the active project for {dialogProject.game ? PROFILE_LABELS[dialogProject.game] : 'the selected game'}.</Text>
                  <Text size={200}>Source: {dialogProject.namespace || 'Not configured'}</Text>
                  <Text size={200}>Output: {dialogProject.outputDir || 'Not configured'}</Text>
                </div>
              )}
              {dialogState.mode === 'delete' && dialogProject && (
                <div className={styles.dialogContentGrid}>
                  <Text size={200}>This removes the saved definition but leaves files on disk untouched.</Text>
                  <Text size={200}>Project: {dialogProject.name}</Text>
                </div>
              )}
              {dialogState.mode === 'edit' && (
                <div className={styles.dialogContentGrid}>
                  <Field label="Project Name" required>
                    <Input value={editForm.name} onChange={(_, data) => setEditForm(prev => ({ ...prev, name: data.value }))} />
                  </Field>
                  <Field label="Game" required>
                    <Select value={editForm.game} onChange={(_, data) => setEditForm(prev => ({ ...prev, game: (data.value as GameKey) ?? prev.game }))}>
                      <option value="starfield">Starfield</option>
                      <option value="fallout">Fallout 4</option>
                      <option value="skyrim">Skyrim SE / AE</option>
                    </Select>
                  </Field>
                  <Field label="Source Namespace" required>
                    <Input value={editForm.namespaceDir} onChange={(_, data) => setEditForm(prev => ({ ...prev, namespaceDir: data.value }))} />
                  </Field>
                  <Field label="Compiled Output" required>
                    <Input value={editForm.outputDir} onChange={(_, data) => setEditForm(prev => ({ ...prev, outputDir: data.value }))} />
                  </Field>
                  <Field label="Fragment Namespace">
                    <Input value={editForm.namespaceFragmentsDir} onChange={(_, data) => setEditForm(prev => ({ ...prev, namespaceFragmentsDir: data.value }))} />
                  </Field>
                  <Field label="Fragment Output">
                    <Input value={editForm.outputFragmentsDir} onChange={(_, data) => setEditForm(prev => ({ ...prev, outputFragmentsDir: data.value }))} />
                  </Field>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={resetDialog} disabled={pending}>Cancel</Button>
              {dialogState.mode === 'load' && (
                <Button appearance="primary" onClick={handleLoadConfirm} disabled={pending}>
                  {pending ? 'Loading…' : 'Load Project'}
                </Button>
              )}
              {dialogState.mode === 'delete' && (
                <Button appearance="primary" onClick={handleDeleteConfirm} disabled={pending}>
                  {pending ? 'Deleting…' : 'Delete Project'}
                </Button>
              )}
              {dialogState.mode === 'edit' && (
                <Button appearance="primary" onClick={handleEditSubmit} disabled={pending}>
                  {pending ? 'Saving…' : 'Save Changes'}
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
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
  type: 'papyrusTools.autoDetectResult';
  status: 'success' | 'empty' | 'error';
  detected?: Record<string, { compilerPath?: string; scriptPaths?: string[] }>;
  message?: string;
};

type SetupStateMessage = {
  type: 'papyrusTools.setupState';
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
  type: 'papyrusTools.saveWizardSettingsResult';
  status: 'success' | 'error';
  message?: string;
};

type PathCheckResultMessage = {
  type: 'papyrusTools.pathCheckResult';
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
      type: 'papyrusTools.autoDetect',
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
      type: 'papyrusTools.pathCheck',
      payload
    });
  }, []);

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage({ type: 'papyrusTools.requestSetupState' });
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if ((data as SetupStateMessage).type === 'papyrusTools.setupState') {
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

      if ((data as AutoDetectResultMessage).type === 'papyrusTools.autoDetectResult') {
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

      if ((data as PathCheckResultMessage).type === 'papyrusTools.pathCheckResult') {
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

      if ((data as SaveWizardSettingsResultMessage).type === 'papyrusTools.saveWizardSettingsResult') {
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
      type: 'papyrusTools.saveWizardSettings',
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
                    <Link onClick={() => window.__papyrusVsCodeApi?.postMessage?.({ type: 'papyrusTools.openSettings', payload: { query: '@ext:MrTrilB.papyrus-tools papyrusTools.games' } })}>here</Link>.
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

type WorkspaceContentProps = {
  activeProject?: ActiveProjectSummary;
};

const WorkspaceContent: React.FC<WorkspaceContentProps> = ({ activeProject }) => {
  const styles = useStyles();
  const [gameProfile, setGameProfile] = React.useState<GameKey>(() => activeProject?.game ?? 'starfield');
  const [projectName, setProjectName] = React.useState(() => activeProject ? sanitizeNamespaceFolder(activeProject.name) : '');
  const [namespaceFolder, setNamespaceFolder] = React.useState('');
  const [useFragments, setUseFragments] = React.useState(() => !!(activeProject?.namespaceFragmentsDir || activeProject?.outputFragmentsDir));
  const [namespaceStatus, setNamespaceStatus] = React.useState<boolean | null>(null);
  const [outputStatus, setOutputStatus] = React.useState<boolean | null>(null);
  const [fragmentNamespaceStatus, setFragmentNamespaceStatus] = React.useState<boolean | null>(null);
  const [fragmentOutputStatus, setFragmentOutputStatus] = React.useState<boolean | null>(null);
  const [fragmentNamespacePath, setFragmentNamespacePath] = React.useState(activeProject?.namespaceFragmentsDir ?? '');
  const [fragmentOutputPath, setFragmentOutputPath] = React.useState(activeProject?.outputFragmentsDir ?? '');
  const [fragmentNamespaceDirty, setFragmentNamespaceDirty] = React.useState(false);
  const [fragmentOutputDirty, setFragmentOutputDirty] = React.useState(false);
  const [existingProjects, setExistingProjects] = React.useState<WorkspaceProject[]>([]);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = React.useState('');
  const [showProjectWizard, setShowProjectWizard] = React.useState(!activeProject);
  const pathRequestTypeRef = React.useRef<Map<string, 'primary' | 'fragments'>>(new Map());
  const prevActiveProjectKeyRef = React.useRef<string>('');

  const extractNamespaceFolder = React.useCallback((value: string) => {
    if (!value) {
      return '';
    }
    const segments = normalizeWindowsPath(value).split('\\').filter(Boolean);
    return segments[segments.length - 1] ?? '';
  }, []);

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
      type: 'papyrusTools.requestWorkspaceProjects',
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
        type: 'papyrusTools.pathCheck',
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
          type: 'papyrusTools.pathCheck',
          payload: fragmentPayload
        });
      }
    } else {
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
    }
  }, []);

  React.useEffect(() => {
    if (!activeProject) {
      prevActiveProjectKeyRef.current = '';
      setShowProjectWizard(true);
      setProjectName('');
      setNamespaceFolder('');
      setUseFragments(false);
      setFragmentNamespacePath('');
      setFragmentOutputPath('');
      setFragmentNamespaceDirty(false);
      setFragmentOutputDirty(false);
      setNamespaceStatus(null);
      setOutputStatus(null);
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
      return;
    }

    const key = `${activeProject.game ?? 'any'}::${normalizeWindowsPath(activeProject.namespaceDir).toLowerCase()}`;
    if (prevActiveProjectKeyRef.current !== key) {
      prevActiveProjectKeyRef.current = key;
      setShowProjectWizard(false);
      setGameProfile(activeProject.game ?? 'starfield');
      setProjectName(sanitizeNamespaceFolder(activeProject.name));
      setNamespaceFolder(sanitizeNamespaceFolder(extractNamespaceFolder(activeProject.namespaceDir)));
      const hasFragments = !!(activeProject.namespaceFragmentsDir || activeProject.outputFragmentsDir);
      setUseFragments(hasFragments);
      setFragmentNamespacePath(activeProject.namespaceFragmentsDir || '');
      setFragmentOutputPath(activeProject.outputFragmentsDir || '');
      setFragmentNamespaceDirty(false);
      setFragmentOutputDirty(false);
      setSaveState('idle');
      setSaveMessage('');
      setNamespaceStatus(null);
      setOutputStatus(null);
      setFragmentNamespaceStatus(null);
      setFragmentOutputStatus(null);
    }
  }, [activeProject, extractNamespaceFolder]);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if (data.type === 'papyrusTools.setupState' && data.payload) {
        const rawPayload = data.payload as { games?: Record<string, any>; setupWizardCompleted?: boolean } | Record<string, any>;
        const gamesPayload = rawPayload && typeof (rawPayload as any).games === 'object' && !Array.isArray((rawPayload as any).games)
          ? (rawPayload as { games: Record<string, any> }).games
          : (rawPayload as Record<string, any>);
        const payload = gamesPayload;
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
        setFragmentNamespaceDirty(false);
        setFragmentOutputDirty(false);
        const derivedFragmentNamespace = useFragments
          ? (selected.namespaceFragmentsDir && namespaceFolder
            ? joinWindowsPath(selected.namespaceFragmentsDir, namespaceFolder)
            : fragmentNamespacePath)
          : '';
        const derivedFragmentOutput = useFragments
          ? (selected.outputFragmentsDir && namespaceFolder
            ? joinWindowsPath(selected.outputFragmentsDir, namespaceFolder)
            : fragmentOutputPath)
          : '';
        const fragmentNamespaceDir = derivedFragmentNamespace ? normalizeWindowsPath(derivedFragmentNamespace) : undefined;
        const fragmentOutputDir = derivedFragmentOutput ? normalizeWindowsPath(derivedFragmentOutput) : undefined;
        requestFolderStatus(
          selected.namespaceDir,
          selected.outputDir,
          fragmentNamespaceDir,
          fragmentOutputDir
        );
      }

      if (data.type === 'papyrusTools.pathCheckResult') {
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

      if (data.type === 'papyrusTools.workspaceProjects') {
        const projects = Array.isArray(data.projects) ? data.projects : [];
        setExistingProjects(projects.filter((entry: any) => typeof entry?.code === 'string' && entry.code).map((entry: any) => ({
          code: entry.code,
          game: typeof entry?.game === 'string' ? entry.game.toLowerCase() : ''
        })));
      }

      if (data.type === 'papyrusTools.saveWorkspaceProjectResult') {
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
  }, [folderState, gameProfile, requestFolderStatus, requestProjectList, useFragments, namespaceFolder, fragmentNamespacePath, fragmentOutputPath]);

  const handleGameChange = (_: React.ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
    const value = (data.value as GameKey | undefined) ?? 'starfield';
    if (value === gameProfile) {
      return;
    }
    setGameProfile(value);
    setProjectName('');
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
    setFragmentNamespaceDirty(false);
    setFragmentOutputDirty(false);
  };

  if (!showProjectWizard && activeProject) {
    const gameLabel = activeProject.game ? PROFILE_LABELS[activeProject.game] : 'Not assigned';
    return (
      <div className={styles.sectionGrid}>
        <div>
          <Text weight="semibold">Workspace Project Saved</Text>
          <Text size={200} className={styles.mutedText}>
            Saved data for {activeProject.namespaceDir} is ready to use.
          </Text>
        </div>
        <div className={styles.summaryCard}>
          <Text weight="semibold">{activeProject.name}</Text>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Game</Text>
            <Text className={styles.summaryValue}>{gameLabel}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Source Namespace</Text>
            <Text className={styles.summaryValue}>{activeProject.namespaceDir}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Compiled Output</Text>
            <Text className={styles.summaryValue}>{activeProject.outputDir || 'Not configured'}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Fragment Namespace</Text>
            <Text className={styles.summaryValue}>{activeProject.namespaceFragmentsDir || 'Not configured'}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Fragment Output</Text>
            <Text className={styles.summaryValue}>{activeProject.outputFragmentsDir || 'Not configured'}</Text>
          </div>
        </div>
        <div className={styles.buttonRow}>
          <Button
            appearance="primary"
            onClick={() => {
              setShowProjectWizard(true);
              setNamespaceStatus(null);
              setOutputStatus(null);
              setFragmentNamespaceStatus(null);
              setFragmentOutputStatus(null);
              setProjectName(sanitizeNamespaceFolder(activeProject.name));
              setNamespaceFolder(sanitizeNamespaceFolder(extractNamespaceFolder(activeProject.namespaceDir)));
              const hasFragments = !!(activeProject.namespaceFragmentsDir || activeProject.outputFragmentsDir);
              setUseFragments(hasFragments);
              setFragmentNamespacePath(activeProject.namespaceFragmentsDir || '');
              setFragmentOutputPath(activeProject.outputFragmentsDir || '');
              setFragmentNamespaceDirty(false);
              setFragmentOutputDirty(false);
            }}
          >
            Run Project Wizard Again
          </Button>
        </div>
      </div>
    );
  }

  const selectedFolders = folderState[gameProfile];
  const resolvedNamespaceDir = selectedFolders.namespaceDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.namespaceDir, namespaceFolder)
    : '';
  const resolvedOutputDir = selectedFolders.outputDir && namespaceFolder
    ? joinWindowsPath(selectedFolders.outputDir, namespaceFolder)
    : '';
  React.useEffect(() => {
    if (!useFragments) {
      if (fragmentNamespacePath) {
        setFragmentNamespacePath('');
      }
      if (fragmentOutputPath) {
        setFragmentOutputPath('');
      }
      setFragmentNamespaceDirty(false);
      setFragmentOutputDirty(false);
      return;
    }

    if (!fragmentNamespaceDirty) {
      const nextNamespaceFragments = resolvedNamespaceDir
        ? joinWindowsPath(resolvedNamespaceDir, 'Fragments')
        : '';
      if (nextNamespaceFragments !== fragmentNamespacePath) {
        setFragmentNamespacePath(nextNamespaceFragments);
      }
    }

    if (!fragmentOutputDirty) {
      const nextOutputFragments = resolvedOutputDir
        ? joinWindowsPath(resolvedOutputDir, 'Fragments')
        : '';
      if (nextOutputFragments !== fragmentOutputPath) {
        setFragmentOutputPath(nextOutputFragments);
      }
    }
  }, [useFragments, resolvedNamespaceDir, resolvedOutputDir, fragmentNamespaceDirty, fragmentOutputDirty, fragmentNamespacePath, fragmentOutputPath]);

  const resolvedNamespaceFragmentsDir = fragmentNamespacePath ? normalizeWindowsPath(fragmentNamespacePath) : '';
  const resolvedOutputFragmentsDir = fragmentOutputPath ? normalizeWindowsPath(fragmentOutputPath) : '';

  const fragmentNamespaceCheck = useFragments && resolvedNamespaceFragmentsDir ? resolvedNamespaceFragmentsDir : undefined;
  const fragmentOutputCheck = useFragments && resolvedOutputFragmentsDir ? resolvedOutputFragmentsDir : undefined;

  React.useEffect(() => {
    const selected = folderState[gameProfile];
    requestProjectList(selected.namespaceDir);
    requestFolderStatus(
      selected.namespaceDir,
      selected.outputDir,
      fragmentNamespaceCheck,
      fragmentOutputCheck
    );
  }, [folderState, gameProfile, requestProjectList, requestFolderStatus, fragmentNamespaceCheck, fragmentOutputCheck]);

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
    if (!projectName || !namespaceFolder) {
      setSaveState('error');
      setSaveMessage('Provide a project name and namespace folder.');
      return;
    }
    if (useFragments && (!resolvedNamespaceFragmentsDir || !resolvedOutputFragmentsDir)) {
      setSaveState('error');
      setSaveMessage('Provide fragment namespace and output folders or disable fragments.');
      return;
    }
    setSaveState('saving');
    setSaveMessage('Saving workspace project...');
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.saveWorkspaceProject',
      payload: {
        game: gameProfile,
  projectName,
  code: projectName,
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
    if (enabled) {
      setFragmentNamespaceDirty(false);
      setFragmentOutputDirty(false);
    } else {
      setFragmentNamespacePath('');
      setFragmentOutputPath('');
      setFragmentNamespaceDirty(false);
      setFragmentOutputDirty(false);
    }
    setFragmentNamespaceStatus(null);
    setFragmentOutputStatus(null);
  };

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage?.({ type: 'papyrusTools.requestSetupState' });
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
        <Field label="Project Name" required hint="Used to reference this project when switching between workspaces.">
          <Input value={projectName} onChange={(_, data) => setProjectName(sanitizeNamespaceFolder(data.value))} placeholder="MyMod" />
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
            <Field label="Fragment Namespace Path" hint="Full path to the folder that stores fragment source scripts.">
              <Input
                value={fragmentNamespacePath}
                onChange={(_, data) => {
                  const next = normalizeWindowsPath(data.value);
                  setFragmentNamespacePath(next);
                  setFragmentNamespaceDirty(true);
                }}
                placeholder="C:/Game/Data/Scripts/Source/Fragments/Quests"
              />
            </Field>
            <Field label="Fragment Output Path" hint="Full path where compiled fragment scripts should be emitted.">
              <Input
                value={fragmentOutputPath}
                onChange={(_, data) => {
                  const next = normalizeWindowsPath(data.value);
                  setFragmentOutputPath(next);
                  setFragmentOutputDirty(true);
                }}
                placeholder="C:/Game/Data/Scripts/Fragments/Quests"
              />
            </Field>
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
                Provide fragment namespace and output paths to enable status checks for these folders.
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
      setProjectName('');
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
  const [scanStatus, setScanStatus] = React.useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = React.useState('');
  const [diagnosticCount, setDiagnosticCount] = React.useState<number | null>(null);
  const [lastScanTime, setLastScanTime] = React.useState<Date | null>(null);
  const [indexStatus, setIndexStatus] = React.useState<'unknown' | 'building' | 'ready' | 'error'>('unknown');
  const [autoDetectStatus, setAutoDetectStatus] = React.useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [autoDetectMessage, setAutoDetectMessage] = React.useState('');
  const [rebuildStatus, setRebuildStatus] = React.useState<'idle' | 'rebuilding' | 'success' | 'error'>('idle');
  const [rebuildMessage, setRebuildMessage] = React.useState('');

  const handleScanScripts = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      setScanStatus('error');
      setScanMessage('VS Code API unavailable');
      return;
    }
    setScanStatus('scanning');
    setScanMessage('Scanning scripts for diagnostics...');
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.scanScripts'
    });
  }, []);

  const handleRebuildIndex = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      setRebuildStatus('error');
      setRebuildMessage('VS Code API unavailable');
      return;
    }
    setRebuildStatus('rebuilding');
    setRebuildMessage('Rebuilding script index...');
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.rebuildIndex'
    });
  }, []);

  const handleAutoDetect = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      setAutoDetectStatus('error');
      setAutoDetectMessage('VS Code API unavailable');
      return;
    }
    setAutoDetectStatus('detecting');
    setAutoDetectMessage('Auto-detecting game paths...');
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrus.autoDetect',
      payload: { applyAll: true }
    });
  }, []);

  const handleExportProfile = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.exportProfile'
    });
  }, []);

  const handleImportProfile = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.importProfile'
    });
  }, []);

  const handleClearSettings = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.clearSettings'
    });
  }, []);

  const handleCreateDefaults = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.createDefaults'
    });
  }, []);

  const handleOpenSettings = React.useCallback(() => {
    if (!window.__papyrusVsCodeApi?.postMessage) {
      return;
    }
    window.__papyrusVsCodeApi.postMessage({
      type: 'papyrusTools.openSettings',
      payload: { query: '@ext:MrTrilB.papyrus-tools papyrus' }
    });
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if (data.type === 'papyrusTools.scanResult') {
        if (data.status === 'success') {
          setScanStatus('success');
          setScanMessage('Script scan completed successfully');
          setDiagnosticCount(typeof data.diagnosticCount === 'number' ? data.diagnosticCount : null);
          setLastScanTime(new Date());
        } else {
          setScanStatus('error');
          setScanMessage(typeof data.message === 'string' ? data.message : 'Scan failed');
        }
      } else if (data.type === 'papyrusTools.rebuildResult') {
        if (data.status === 'success') {
          setRebuildStatus('success');
          setRebuildMessage('Index rebuilt successfully');
          setIndexStatus('ready');
        } else {
          setRebuildStatus('error');
          setRebuildMessage(typeof data.message === 'string' ? data.message : 'Rebuild failed');
          setIndexStatus('error');
        }
      } else if (data.type === 'papyrusTools.autoDetectResult') {
        if (data.status === 'success') {
          setAutoDetectStatus('success');
          setAutoDetectMessage('Auto-detection completed successfully');
        } else {
          setAutoDetectStatus('error');
          setAutoDetectMessage(typeof data.message === 'string' ? data.message : 'Auto-detection failed');
        }
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <div className={styles.sectionGrid}>
      <div>
        <Text weight="semibold">Debugging & Diagnostics</Text>
        <Text size={200} className={styles.mutedText}>
          Comprehensive tools for troubleshooting Papyrus script issues, managing configurations, and maintaining project health.
        </Text>
      </div>

      {/* Status Overview */}
      <div className={styles.sectionGridTight}>
        <div className={styles.cardHeaderIcon}>
          <Info20Regular />
          <Text weight="semibold">System Status</Text>
        </div>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <Text size={200} className={styles.statusLabel}>Diagnostics</Text>
            <div className={styles.statusRow}>
              {diagnosticCount !== null ? (
                <>
                  <Warning20Regular className={diagnosticCount > 0 ? styles.statusIconWarning : styles.statusIconPositive} />
                  <Text size={200} className={styles.mutedText}>
                    {diagnosticCount} issues found
                  </Text>
                </>
              ) : (
                <>
                  <Spinner size="tiny" />
                  <Text size={200} className={styles.mutedText}>Unknown</Text>
                </>
              )}
            </div>
          </div>
          <div className={styles.statusItem}>
            <Text size={200} className={styles.statusLabel}>Last Scan</Text>
            <div className={styles.statusRow}>
              <Clock20Regular />
              <Text size={200} className={styles.mutedText}>
                {lastScanTime ? lastScanTime.toLocaleTimeString() : 'Never'}
              </Text>
            </div>
          </div>
          <div className={styles.statusItem}>
            <Text size={200} className={styles.statusLabel}>Index Status</Text>
            <div className={styles.statusRow}>
              {indexStatus === 'building' && <Spinner size="tiny" />}
              {indexStatus === 'ready' && <CheckmarkCircle20Regular className={styles.statusIconPositive} />}
              {indexStatus === 'error' && <Warning20Regular className={styles.statusIconWarning} />}
              {indexStatus === 'unknown' && <Info20Regular />}
              <Text size={200} className={styles.mutedText}>
                {indexStatus === 'building' && 'Building...'}
                {indexStatus === 'ready' && 'Ready'}
                {indexStatus === 'error' && 'Error'}
                {indexStatus === 'unknown' && 'Unknown'}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Core Diagnostics */}
      <div className={styles.sectionGridTight}>
        <div className={styles.cardHeaderIcon}>
          <Search20Regular />
          <Text weight="semibold">Core Diagnostics</Text>
        </div>
        <div className={styles.sectionGridTight}>
          <div className={styles.buttonRow}>
            <Button
              appearance="primary"
              onClick={handleScanScripts}
              disabled={scanStatus === 'scanning'}
              icon={scanStatus === 'scanning' ? <Spinner size="tiny" /> : <Search20Regular />}
            >
              {scanStatus === 'scanning' ? 'Scanning...' : 'Scan Scripts for Diagnostics'}
            </Button>
            <Button
              appearance="secondary"
              onClick={handleRebuildIndex}
              disabled={rebuildStatus === 'rebuilding'}
              icon={rebuildStatus === 'rebuilding' ? <Spinner size="tiny" /> : <ArrowSync20Regular />}
            >
              {rebuildStatus === 'rebuilding' ? 'Rebuilding...' : 'Rebuild Index'}
            </Button>
          </div>
          {(scanStatus !== 'idle' || rebuildStatus !== 'idle') && (
            <div className={styles.sectionGridTight}>
              {scanStatus !== 'idle' && (
                <MessageBar intent={scanStatus === 'success' ? 'success' : scanStatus === 'error' ? 'error' : 'info'}>
                  <MessageBarBody>
                    <MessageBarTitle>
                      {scanStatus === 'scanning' && 'Scanning Scripts'}
                      {scanStatus === 'success' && 'Scan Complete'}
                      {scanStatus === 'error' && 'Scan Failed'}
                    </MessageBarTitle>
                    <Text size={200} block>{scanMessage}</Text>
                  </MessageBarBody>
                </MessageBar>
              )}
              {rebuildStatus !== 'idle' && (
                <MessageBar intent={rebuildStatus === 'success' ? 'success' : rebuildStatus === 'error' ? 'error' : 'info'}>
                  <MessageBarBody>
                    <MessageBarTitle>
                      {rebuildStatus === 'rebuilding' && 'Rebuilding Index'}
                      {rebuildStatus === 'success' && 'Index Rebuilt'}
                      {rebuildStatus === 'error' && 'Rebuild Failed'}
                    </MessageBarTitle>
                    <Text size={200} block>{rebuildMessage}</Text>
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Detection */}
      <div className={styles.sectionGridTight}>
        <div className={styles.cardHeaderIcon}>
          <Target20Regular />
          <Text weight="semibold">Auto-Detection</Text>
        </div>
        <Text size={200} className={styles.mutedText}>
          Automatically detect and configure game installations and compiler paths from common Steam library locations.
        </Text>
        <div className={styles.buttonRow}>
          <Button
            appearance="secondary"
            onClick={handleAutoDetect}
            disabled={autoDetectStatus === 'detecting'}
            icon={autoDetectStatus === 'detecting' ? <Spinner size="tiny" /> : <Target20Regular />}
          >
            {autoDetectStatus === 'detecting' ? 'Detecting...' : 'Auto-Detect Game Paths'}
          </Button>
        </div>
        {autoDetectStatus !== 'idle' && (
          <MessageBar intent={autoDetectStatus === 'success' ? 'success' : autoDetectStatus === 'error' ? 'error' : 'info'}>
            <MessageBarBody>
              <MessageBarTitle>
                {autoDetectStatus === 'detecting' && 'Auto-Detecting'}
                {autoDetectStatus === 'success' && 'Auto-Detection Complete'}
                {autoDetectStatus === 'error' && 'Auto-Detection Failed'}
              </MessageBarTitle>
              <Text size={200} block>{autoDetectMessage}</Text>
            </MessageBarBody>
          </MessageBar>
        )}
      </div>

      {/* Configuration Management */}
      <div className={styles.sectionGridTight}>
        <div className={styles.cardHeaderIcon}>
          <Settings20Regular />
          <Text weight="semibold">Configuration Management</Text>
        </div>
        <Text size={200} className={styles.mutedText}>
          Import/export profiles, reset settings, or create default configurations.
        </Text>
        <div className={styles.sectionGridTight}>
          <div className={styles.buttonRow}>
            <Button appearance="outline" onClick={handleExportProfile} icon={<ArrowExport20Regular />}>
              Export Current Profile
            </Button>
            <Button appearance="outline" onClick={handleImportProfile} icon={<ArrowImport20Regular />}>
              Import Profile
            </Button>
          </div>
          <div className={styles.buttonRow}>
            <Button appearance="outline" onClick={handleCreateDefaults} icon={<Add20Regular />}>
              Create Default Profiles
            </Button>
            <Button appearance="outline" onClick={handleClearSettings} icon={<Delete20Regular />}>
              Clear Stored Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className={styles.sectionGridTight}>
        <div className={styles.cardHeaderIcon}>
          <Link20Regular />
          <Text weight="semibold">Quick Access</Text>
        </div>
        <Text size={200} className={styles.mutedText}>
          Direct access to Papyrus settings and configuration files.
        </Text>
        <div className={styles.buttonRow}>
          <Button appearance="subtle" onClick={handleOpenSettings} icon={<Settings20Regular />}>
            Open Papyrus Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const styles = useStyles();
  const [selected, setSelected] = React.useState<SectionKey>('overview');
  const [themeMode, setThemeMode] = React.useState<PapyrusThemeMode>(() => window.__papyrusInitialState?.theme ?? 'light');
  const [projects, setProjects] = React.useState<OverviewProject[]>([]);
  const [activeProject, setActiveProject] = React.useState<ActiveProjectSummary | undefined>(undefined);

  const persistedState = React.useMemo(() => window.__papyrusVsCodeApi?.getState?.() as { wizardCompleted?: boolean } | undefined, []);
  const [wizardCompleted, setWizardCompleted] = React.useState<boolean>(persistedState?.wizardCompleted ?? false);
  const [wizardInstanceKey, setWizardInstanceKey] = React.useState(0);

  const handleNavigate = React.useCallback((section: SectionKey) => {
    setSelected(section);
  }, []);

  const postWizardCompletion = React.useCallback((completed: boolean) => {
    window.__papyrusVsCodeApi?.postMessage?.({
      type: 'papyrusTools.setSetupWizardCompleted',
      payload: { completed }
    });
  }, []);

  const normalizeGameKey = React.useCallback((value: unknown): GameKey | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'starfield') {
      return 'starfield';
    }
    if (normalized === 'fallout' || normalized === 'fallout4') {
      return 'fallout';
    }
    if (normalized === 'skyrim' || normalized === 'skyrimse' || normalized === 'skyrimae') {
      return 'skyrim';
    }
    return undefined;
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
    postWizardCompletion(true);
  }, [postWizardCompletion]);

  const handleRestartWizard = React.useCallback(() => {
    setWizardCompleted(false);
    postWizardCompletion(false);
    setWizardInstanceKey(prev => prev + 1);
    setSelected('setupWizard');
  }, [postWizardCompletion]);

  React.useEffect(() => {
    const listener = (event: MessageEvent<{ type?: string; theme?: PapyrusThemeMode; payload?: unknown }>) => {
      if (event.data?.type === 'theme' && event.data.theme) {
        setThemeMode(event.data.theme);
      }
      if (event.data?.type === 'papyrusTools.setupState' && event.data.payload && typeof event.data.payload === 'object') {
        const payload = event.data.payload as { setupWizardCompleted?: boolean; projects?: unknown; activeProject?: unknown };
        if (typeof payload.setupWizardCompleted === 'boolean') {
          setWizardCompleted(payload.setupWizardCompleted);
        }
        const rawProjects = Array.isArray(payload.projects) ? payload.projects : [];
        const normalizedProjects: OverviewProject[] = rawProjects
          .map(entry => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }
            const obj = entry as Record<string, unknown>;
            const name = typeof obj.name === 'string' ? obj.name.trim() : '';
            const namespace = typeof obj.namespace === 'string' ? obj.namespace.trim() : '';
            if (!name || !namespace) {
              return null;
            }
            const namespaceFolder = typeof obj.namespaceFolder === 'string' ? obj.namespaceFolder.trim() : name;
            const project: OverviewProject = {
              name,
              namespace,
              namespaceFolder,
              namespaceExists: obj.namespaceExists === true,
              outputDir: typeof obj.outputDir === 'string' ? obj.outputDir.trim() : '',
              outputExists: obj.outputExists === true,
              namespaceFragmentsDir: typeof obj.namespaceFragmentsDir === 'string' ? obj.namespaceFragmentsDir.trim() : '',
              namespaceFragmentsExists: obj.namespaceFragmentsExists === true,
              outputFragmentsDir: typeof obj.outputFragmentsDir === 'string' ? obj.outputFragmentsDir.trim() : '',
              outputFragmentsExists: obj.outputFragmentsExists === true,
              game: normalizeGameKey(obj.game)
            };
            return project;
          })
          .filter((entry): entry is OverviewProject => entry !== null);
        setProjects(normalizedProjects);

        const rawActiveProject = payload.activeProject;
        let nextActiveProject: ActiveProjectSummary | undefined;
        if (rawActiveProject && typeof rawActiveProject === 'object') {
          const obj = rawActiveProject as Record<string, unknown>;
          const namespaceDir = typeof obj.namespaceDir === 'string' ? obj.namespaceDir.trim() : '';
          if (namespaceDir) {
            const nameValue = typeof obj.name === 'string' ? obj.name.trim() : '';
            const normalizedNamespace = normalizeWindowsPath(namespaceDir);
            const segments = normalizedNamespace.split('\\').filter(Boolean);
            const fallbackName = segments[segments.length - 1] ?? normalizedNamespace;
            nextActiveProject = {
              name: nameValue || fallbackName,
              namespaceDir,
              outputDir: typeof obj.outputDir === 'string' ? obj.outputDir.trim() : '',
              namespaceFragmentsDir: typeof obj.namespaceFragmentsDir === 'string' ? obj.namespaceFragmentsDir.trim() : '',
              outputFragmentsDir: typeof obj.outputFragmentsDir === 'string' ? obj.outputFragmentsDir.trim() : '',
              game: normalizeGameKey(obj.game)
            };
          }
        }

        setActiveProject(prev => {
          if (!prev && !nextActiveProject) {
            return prev;
          }
          if (prev && nextActiveProject) {
            if (
              prev.name === nextActiveProject.name &&
              prev.namespaceDir === nextActiveProject.namespaceDir &&
              prev.outputDir === nextActiveProject.outputDir &&
              prev.namespaceFragmentsDir === nextActiveProject.namespaceFragmentsDir &&
              prev.outputFragmentsDir === nextActiveProject.outputFragmentsDir &&
              prev.game === nextActiveProject.game
            ) {
              return prev;
            }
          }
          return nextActiveProject;
        });
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [normalizeGameKey]);

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage?.({ type: 'papyrusTools.requestSetupState' });
  }, []);

  const theme = React.useMemo(() => getPapyrusTheme(themeMode), [themeMode]);
  const activeProjectDisplay = React.useMemo(() => {
    if (!activeProject) {
      return 'None configured';
    }
    if (activeProject.game && PROFILE_LABELS[activeProject.game]) {
      return `${activeProject.name} (${PROFILE_LABELS[activeProject.game]})`;
    }
    return activeProject.name;
  }, [activeProject]);

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
      mainContent = <WorkspaceContent activeProject={activeProject} />;
      break;
    case 'compiler':
      mainContent = <CompilerContent />;
      break;
    case 'debugging':
      mainContent = <DebuggingContent />;
      break;
    case 'projects':
      mainContent = <ProjectsOverview projects={projects} onNavigateWorkspace={() => handleNavigate('workspace')} activeProject={activeProject} />;
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
          tabs: [{ value: 'overview', label: 'Control Centre' as const }]
        }, {
          label: undefined,
          tabs: [{ value: 'projects', label: 'Projects' as const }]
        }, {
          label: 'Settings',
          tabs: [
            { value: 'setupWizard', label: 'Setup Wizard' as const }
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
            {selected === 'overview' && 'Control Centre'}
            {selected === 'setupWizard' && 'Setup Wizard'}
            {selected === 'workspace' && 'Workspace Setup'}
            {selected === 'compiler' && 'Compiler Settings'}
            {selected === 'debugging' && 'Troubleshooting & Debugging'}
            {selected === 'projects' && 'Projects'}
          </Text>
          <Text size={200} className={styles.mutedText}>
            {selected === 'overview' && 'Access quick actions, workspace status, and project shortcuts.'}
            {selected === 'setupWizard' && 'Run the guided setup to establish paths and profiles for your modding tools.'}
            {selected === 'workspace' && 'Provide workspace metadata to tailor Papyrus helpers to this mod.'}
            {selected === 'compiler' && 'Manage compiler inputs, outputs, and namespaces for Papyrus builds.'}
            {selected === 'debugging' && 'Configure how Papyrus Tools scans and reports issues across scripts.'}
            {selected === 'projects' && 'Manage and switch between saved workspace project configurations.'}
          </Text>
          {selected === 'overview' && (
            <Text size={300} weight="semibold" className={styles.activeProjectLabel}>
              Active Project: {activeProjectDisplay}
            </Text>
          )}
        </div>
        {mainContent}
      </main>
    </FluentProvider>
  );
};

export default AppContent;
