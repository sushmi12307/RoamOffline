const r = require('express').Router(), db = require('../db'), auth = require('../middleware/auth');
// GET /api/destinations/search?q=jog  -> local tourist DB + OpenStreetMap Nominatim (low-volume search only)
r.get('/search', auth, async (q, s) => {
  const t = (q.query.q || '').trim(); if (t.length < 2) return s.json([]);
  const out = [];
  try {
    const [rows] = await db.query('SELECT name,category,latitude lat,longitude lng FROM tourist_places WHERE name LIKE ? LIMIT 6', ['%' + t + '%']);
    rows.forEach(x => out.push({ ...x, source: 'RoamOffline places' }));
  } catch (e) { console.error(e); }
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(t), { headers: { 'User-Agent': 'RoamOffline-MiniProject/1.0' } });
    (await res.json()).forEach(p => out.push({ name: p.display_name, category: p.type, lat: +p.lat, lng: +p.lon, source: 'OpenStreetMap Nominatim' }));
  } catch (e) { /* geocoder unreachable: local results still returned */ }
  s.json(out);
});
module.exports = r;
