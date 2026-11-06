import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App.jsx';
createRoot(document.getElementById('root')).render(<App />);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', async () => {
    await navigator.serviceWorker.register('/sw.js');
    const reg = await navigator.serviceWorker.ready;
    const urls = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png',
      ...performance.getEntriesByType('resource').map(e => e.name).filter(n => n.startsWith(location.origin) && !n.includes('/api/') && !n.includes('/tiles/'))];
    reg.active.postMessage({ cache: urls });   // pre-cache everything the app needs to start offline
  });
}
