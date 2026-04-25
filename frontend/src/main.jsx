import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Add Google Fonts
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&family=Outfit:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap';
document.head.appendChild(link);

const isElectron = typeof window !== 'undefined' && (!!window.api || !!window.electron);
const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  </React.StrictMode>
)
