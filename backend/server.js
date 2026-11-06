require('dotenv').config();
const express = require('express'), cors = require('cors'), path = require('path'), fs = require('fs');
const app = express();
app.use(cors()); app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/places', require('./routes/places'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/journeys', require('./routes/journeys'));
app.get('/api/health', (q, s) => s.json({ ok: true, time: new Date() }));
app.get('/api/config', (q, s) => s.json({ attribution: process.env.TILE_ATTRIBUTION || '© OpenStreetMap contributors' }));

// Tile endpoint: 1) local folder backend/tiles/z/x/y.png  2) TILE_UPSTREAM (a source whose licence allows offline download)
app.get('/tiles/:z/:x/:y.png', async (q, s) => {
  const { z, x, y } = q.params;
  if (![z, x, y].every(v => /^\d{1,8}$/.test(v))) return s.sendStatus(400);
  const local = path.join(__dirname, 'tiles', z, x, y + '.png');
  if (fs.existsSync(local)) return s.set('Cache-Control', 'public,max-age=86400').sendFile(local);
  const up = process.env.TILE_UPSTREAM; if (!up) return s.sendStatus(404);
  try {
    const r = await fetch(up.replace('{z}', z).replace('{x}', x).replace('{y}', y), { headers: { 'User-Agent': 'RoamOffline/1.0' } });
    if (!r.ok) return s.sendStatus(r.status);
    s.set('Content-Type', r.headers.get('content-type') || 'image/png').set('Cache-Control', 'public,max-age=86400').send(Buffer.from(await r.arrayBuffer()));
  } catch { s.sendStatus(502); }
});

const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.get('*', (q, s) => s.sendFile(path.join(dist, 'index.html'))); }
else app.get('/', (q, s) => s.send('API running. Build the frontend (cd frontend && npm run build) or use npm run dev on port 5173.'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`RoamOffline running at http://localhost:${PORT}`));
