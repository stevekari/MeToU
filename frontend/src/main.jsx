import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { registerServiceWorker } from './utils/registerServiceWorker';

registerServiceWorker();

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

// Map legacy 'unload' event listeners to 'pagehide' to prevent browser permissions policy violations
if (typeof window !== 'undefined' && window.addEventListener) {
  const originalAddEventListener = window.addEventListener.bind(window);
  window.addEventListener = (type, listener, options) => {
    if (type === 'unload') {
      return originalAddEventListener('pagehide', listener, options);
    }
    return originalAddEventListener(type, listener, options);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

