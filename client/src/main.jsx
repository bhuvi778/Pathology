import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
          success: { style: { background: '#166534', color: '#f0fdf4' } },
          error: { style: { background: '#991b1b', color: '#fef2f2' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
