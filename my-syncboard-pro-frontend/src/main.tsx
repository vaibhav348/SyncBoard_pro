/**
 * Master Application Bootstrap Mount
 * Hydrates React DOM tree and wraps structural global Redux context providers
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './features/store';
import App from './App.tsx';
import './index.css'; // Tailwind CSS inclusion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 🛠️ Injecting the Central Redux Store into the entire React ecosystem */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);