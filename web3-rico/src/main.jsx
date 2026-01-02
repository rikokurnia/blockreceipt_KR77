import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Web3Provider } from './context/Web3Context';
import { NotificationProvider } from './context/NotificationSystem'; // ✅ BARIS BARU: Import Notifikasi
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <NotificationProvider> {/* ✅ WRAPPER BARU: Provider Notifikasi */}
          <App />
        </NotificationProvider>
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
);