import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

const LazyAppContent = React.lazy(() => import('./AppContent'));

const useFallbackStyles = makeStyles({
  loading: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, sans-serif',
    color: tokens.colorNeutralForeground3
  }
});

export const App: React.FC = () => {
  const styles = useFallbackStyles();

  return (
    <React.Suspense
      fallback={(
        <div className={styles.loading}>
          Loading Papyrus Control Center…
        </div>
      )}
    >
      <LazyAppContent />
    </React.Suspense>
  );
};
