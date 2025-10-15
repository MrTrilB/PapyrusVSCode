import { createRoot } from 'react-dom/client';
import type { PapyrusThemeMode } from './PapyrusFluentUITheme';
import { App } from './App';

declare let __webpack_public_path__: string; // eslint-disable-line @typescript-eslint/no-unused-vars

const setWebpackPublicPath = () => {
  const currentScript = document.currentScript as HTMLScriptElement | null;
  const scriptEl = currentScript ?? (() => {
    const scripts = document.getElementsByTagName('script');
    return scripts.length ? scripts[scripts.length - 1] : undefined;
  })();

  if (scriptEl?.src) {
    const lastSlashIndex = scriptEl.src.lastIndexOf('/') + 1;
    __webpack_public_path__ = scriptEl.src.substring(0, lastSlashIndex);
  }
};

setWebpackPublicPath();

declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
    __papyrusInitialState?: { theme?: PapyrusThemeMode };
    __papyrusVsCodeApi?: {
      postMessage: (message: unknown) => void;
      getState?: () => unknown;
      setState?: (newState: unknown) => void;
    };
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
