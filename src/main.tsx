import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store';
import { RestTimerProvider } from './components/RestTimer';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <RestTimerProvider>
        <App />
      </RestTimerProvider>
    </StoreProvider>
  </StrictMode>,
);
