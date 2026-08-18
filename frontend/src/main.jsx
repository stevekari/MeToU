import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { Provider } from 'react-redux';
import { store } from './store/store.js';

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    
    <Provider store={store}>
      <BrowserRouter>
    <ThemeProvider>
        <App />
    </ThemeProvider>
    </BrowserRouter>
    </Provider>
    
  </React.StrictMode>
);
