import * as React from 'react';
import {
  Button,
  Divider,
  Dropdown,
  Field,
  FluentProvider,
  Input,
  Label,
  Option,
  Tab,
  TabList,
  Text,
  Textarea,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
  webLightTheme
} from '@fluentui/react-components';

type SectionKey = 'overview' | 'workspace' | 'compiler' | 'diagnostics';

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
  buttonRow: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end'
  }
});

const OverviewContent: React.FC = () => (
  <div>
    <div>
      <Text weight="semibold" size={500}>Welcome to Papyrus Control Center</Text>
      <Text size={300}>
        Use the navigation to configure your mod workspace, compiler preferences, and diagnostic tooling using Fluent UI
        powered forms.
      </Text>
    </div>
    <Divider style={{ marginTop: tokens.spacingVerticalXL }} />
    <div style={{ marginTop: tokens.spacingVerticalXL, display: 'grid', gap: tokens.spacingVerticalXL }}>
      <div>
        <Text weight="semibold">Quick Actions</Text>
  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Jump straight into common automation helpers.</Text>
      </div>
      <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' }}>
        <Tooltip content="Setup workspace profile" relationship="label">
          <Button appearance="primary" iconPosition="before">Workspace Wizard</Button>
        </Tooltip>
        <Tooltip content="Launch auto-detect" relationship="label">
          <Button appearance="outline">Detect Game Installations</Button>
        </Tooltip>
        <Tooltip content="Review compiled diagnostics" relationship="label">
          <Button>Diagnostics Report</Button>
        </Tooltip>
      </div>
    </div>
  </div>
);

const WorkspaceContent: React.FC = () => {
  const [modName, setModName] = React.useState('');
  const [workspacePath, setWorkspacePath] = React.useState('');
  const [gameProfile, setGameProfile] = React.useState('Starfield');
  const [notes, setNotes] = React.useState('');

  return (
    <div style={{ display: 'grid', gap: tokens.spacingVerticalXL }}>
      <div>
        <Text weight="semibold">Workspace Details</Text>
  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Capture high-level information about this mod workspace.</Text>
      </div>
      <div style={{ display: 'grid', gap: tokens.spacingVerticalL }}>
        <Field label="Mod Name" required>
          <Input value={modName} onChange={(_, data) => setModName(data.value)} placeholder="Project Codename" />
        </Field>
        <Field label="Workspace Root" required hint="Absolute path to your mod workspace">
          <Input value={workspacePath} onChange={(_, data) => setWorkspacePath(data.value)} placeholder="C:/Mods/MyProject" />
        </Field>
        <Field label="Target Game">
          <Dropdown selectedOptions={[gameProfile]} onOptionSelect={(_, data) => setGameProfile(data.optionValue as string)}>
            <Option value="Starfield">Starfield</Option>
            <Option value="Fallout">Fallout 4</Option>
            <Option value="Skyrim">Skyrim SE / AE</Option>
          </Dropdown>
        </Field>
        <Field label="Notes">
          <Textarea value={notes} onChange={(_, data) => setNotes(data.value)} placeholder="Add build steps, reminders, or TODOs." rows={4} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalM }}>
        <Button appearance="secondary">Reset</Button>
        <Button appearance="primary">Save Workspace Profile</Button>
      </div>
    </div>
  );
};

const CompilerContent: React.FC = () => {
  const [compilerPath, setCompilerPath] = React.useState('');
  const [scriptPath, setScriptPath] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [outputPath, setOutputPath] = React.useState('');

  return (
    <div style={{ display: 'grid', gap: tokens.spacingVerticalXL }}>
      <div>
        <Text weight="semibold">Compiler Configuration</Text>
  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Configure Papyrus compiler inputs and output locations.</Text>
      </div>
      <div style={{ display: 'grid', gap: tokens.spacingVerticalL }}>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalM }}>
        <Button appearance="secondary">Clear</Button>
        <Button appearance="primary">Apply Compiler Settings</Button>
      </div>
    </div>
  );
};

const DiagnosticsContent: React.FC = () => (
  <div style={{ display: 'grid', gap: tokens.spacingVerticalXL }}>
    <div>
      <Text weight="semibold">Diagnostics Automation</Text>
  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Review scan settings and trigger index updates.</Text>
    </div>
    <div style={{ display: 'grid', gap: tokens.spacingVerticalL }}>
      <Field label="On Save Actions">
        <Label>Select which diagnostics to run after saving Papyrus files.</Label>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap', marginTop: tokens.spacingVerticalS }}>
          <Button appearance="outline">Lint Scripts</Button>
          <Button appearance="outline">Rebuild Index</Button>
          <Button appearance="outline">Validate Includes</Button>
        </div>
      </Field>
      <Field label="Notifications">
        <Label>Control how Papyrus Tools surfaces compile issues.</Label>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap', marginTop: tokens.spacingVerticalS }}>
          <Button appearance="secondary">Info Messages</Button>
          <Button appearance="secondary">Status Bar</Button>
          <Button appearance="secondary">Pop-up Alerts</Button>
        </div>
      </Field>
    </div>
    <Divider />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalM }}>
      <Button appearance="primary">Run Full Diagnostics</Button>
    </div>
  </div>
);

const renderSection = (section: SectionKey): React.ReactNode => {
  switch (section) {
    case 'overview':
      return <OverviewContent />;
    case 'workspace':
      return <WorkspaceContent />;
    case 'compiler':
      return <CompilerContent />;
    case 'diagnostics':
      return <DiagnosticsContent />;
    default:
      return null;
  }
};

export const App: React.FC = () => {
  const styles = useStyles();
  const [selected, setSelected] = React.useState<SectionKey>('overview');

  return (
    <FluentProvider theme={webLightTheme} className={styles.root}>
      <nav className={styles.sidebar}>
        <Text className={styles.sidebarHeader} size={400}>Control Center</Text>
        <TabList
          vertical
          selectedValue={selected}
          onTabSelect={(_, data) => setSelected(data.value as SectionKey)}
          style={{ width: '100%' }}
        >
          <Tab value="overview">Overview</Tab>
          <Tab value="workspace">Workspace</Tab>
          <Tab value="compiler">Compiler</Tab>
          <Tab value="diagnostics">Diagnostics</Tab>
        </TabList>
      </nav>
      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <Text weight="semibold" size={500}>
            {selected === 'overview' && 'Overview'}
            {selected === 'workspace' && 'Workspace Setup'}
            {selected === 'compiler' && 'Compiler Settings'}
            {selected === 'diagnostics' && 'Diagnostics Automation'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {selected === 'overview' && 'Review key actions and quick shortcuts for Papyrus Tools.'}
            {selected === 'workspace' && 'Provide workspace metadata to tailor Papyrus helpers to this mod.'}
            {selected === 'compiler' && 'Manage compiler inputs, outputs, and namespaces for Papyrus builds.'}
            {selected === 'diagnostics' && 'Configure how Papyrus Tools scans and reports issues across scripts.'}
          </Text>
        </div>
        {renderSection(selected)}
      </main>
    </FluentProvider>
  );
};
