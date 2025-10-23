import * as React from 'react';
import { Button, Text, makeStyles, tokens, FluentProvider } from '@fluentui/react-components';
import { Settings20Regular, Folder20Regular, Bug20Regular, FolderSwap20Regular } from '@fluentui/react-icons';
import { getPapyrusTheme, PapyrusThemeMode } from './PapyrusFluentUITheme';

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'flex-start',
    paddingTop: '20%',
    maxWidth: '280px'
  },
  header: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalL
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    alignItems: 'center'
  },
  actionButton: {
    minWidth: '180px',
    justifyContent: 'center'
  }
});

declare global {
  interface Window {
    __papyrusInitialState?: { theme?: PapyrusThemeMode };
  }
}

export const MainSidebar: React.FC = () => {
  const styles = useStyles();
  const [themeMode, setThemeMode] = React.useState<PapyrusThemeMode>(() => window.__papyrusInitialState?.theme ?? 'light');
  const persistedState = React.useMemo(() => window.__papyrusVsCodeApi?.getState?.() as { wizardCompleted?: boolean } | undefined, []);
  const [wizardCompleted, setWizardCompleted] = React.useState<boolean>(persistedState?.wizardCompleted ?? false);

  // const handleCompileCurrent = React.useCallback(() => {
  //   if (window.__papyrusVsCodeApi?.postMessage) {
  //     window.__papyrusVsCodeApi.postMessage({
  //       command: 'compileFile'
  //     });
  //   }
  // }, []);

  const handleSwitchGame = React.useCallback(() => {
    if (window.__papyrusVsCodeApi?.postMessage) {
      window.__papyrusVsCodeApi.postMessage({
        command: 'switchGame'
      });
    }
  }, []);

  // const handleCompileAllProjectFiles = React.useCallback(() => {
  //   if (window.__papyrusVsCodeApi?.postMessage) {
  //     window.__papyrusVsCodeApi.postMessage({
  //       command: 'compileAllProjectFiles'
  //     });
  //   }
  // }, []);

  const handleDebugActiveProject = React.useCallback(() => {
    if (window.__papyrusVsCodeApi?.postMessage) {
      window.__papyrusVsCodeApi.postMessage({
        command: 'debugActiveProject'
      });
    }
  }, []);

  const handleSwitchActiveProject = React.useCallback(() => {
    if (window.__papyrusVsCodeApi?.postMessage) {
      window.__papyrusVsCodeApi.postMessage({
        command: 'switchActiveProject'
      });
    }
  }, []);

  const handleStartSetupWizard = React.useCallback(() => {
    if (window.__papyrusVsCodeApi?.postMessage) {
      window.__papyrusVsCodeApi.postMessage({
        command: 'openControlCenter'
      });
    }
  }, []);

  React.useEffect(() => {
    const listener = (event: MessageEvent<{ type?: string; theme?: PapyrusThemeMode; payload?: unknown }>) => {
      if (event.data?.type === 'theme' && event.data.theme) {
        setThemeMode(event.data.theme);
      }
      if (event.data?.type === 'papyrusTools.setSetupWizardCompleted') {
        const message = event.data as { type: string; payload: { completed: boolean } };
        setWizardCompleted(message.payload.completed);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  React.useEffect(() => {
    window.__papyrusVsCodeApi?.postMessage?.({ command: 'getSetupStatus' });
  }, []);

  const theme = React.useMemo(() => getPapyrusTheme(themeMode), [themeMode]);

  return (
    <FluentProvider theme={theme}>
      <div className={styles.root}>
        <div className={styles.header}>
          <Text weight="semibold" size={400}>Papyrus Tools</Text>
          <br />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Quick access to Papyrus development tools
          </Text>
        </div>

        <div className={styles.actions}>
          {!wizardCompleted ? (
            <Button
              appearance="primary"
              icon={<Settings20Regular />}
              className={styles.actionButton}
              onClick={handleStartSetupWizard}
            >
              Start Setup Wizard
            </Button>
          ) : (
            <>
              {/* <Button
                appearance="primary"
                icon={<Play20Regular />}
                className={styles.actionButton}
                onClick={handleCompileCurrent}
              >
                Compile Current File
              </Button> */}

              <Button
                appearance="secondary"
                icon={<Folder20Regular />}
                className={styles.actionButton}
                onClick={handleSwitchGame}
              >
                Switch Game Profile
              </Button>

              {/* <Button
                appearance="secondary"
                icon={<DocumentMultiple20Regular />}
                className={styles.actionButton}
                onClick={handleCompileAllProjectFiles}
              >
                Compile All Project Files
              </Button> */}

              <Button
                appearance="secondary"
                icon={<Bug20Regular />}
                className={styles.actionButton}
                onClick={handleDebugActiveProject}
              >
                Debug Active Project
              </Button>

              <Button
                appearance="secondary"
                icon={<FolderSwap20Regular />}
                className={styles.actionButton}
                onClick={handleSwitchActiveProject}
              >
                Switch Active Project
              </Button>
            </>
          )}
        </div>
      </div>
    </FluentProvider>
  );
};