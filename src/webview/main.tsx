import { createRoot } from 'react-dom/client';
import { App } from './App';

declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
