const r = require('express').Router(), db = require('../db'), auth = require('../middleware/auth');
r.use(auth);
const fmt = x => ({ id: x.region_id, name: x.region_name, latitude: x.center_lat, longitude: x.center_lng, radiusKm: x.radius_km, minZoom: x.min_zoom,
  maxZoom: x.max_zoom, tileCount: x.tile_count, sizeBytes: Number(x.size_bytes), placeCount: x.place_count, downloadedAt: x.downloaded_at, updatedAt: x.updated_at });
async function link(c, id, lat, lng, rad) { // fill many-to-many table region_places
  await c.query('DELETE FROM region_places WHERE region_id=?', [id]);
  const [res] = await c.query(`INSERT INTO region_places(region_id,place_id,distance_km) SELECT ?,place_id,d FROM (SELECT place_id,${db.HAV} d FROM tourist_places) t WHERE d<=?`, [id, lat, lng, lat, rad]);
  await c.query('UPDATE downloaded_regions SET place_count=? WHERE region_id=?', [res.affectedRows, id]);
}
const valid = b => b.name && isFinite(b.latitude) && isFinite(b.longitude) && b.radius_km >= 1 && b.radius_km <= 50;
r.get('/', async (q, s) => { const [rows] = await db.query('SELECT * FROM downloaded_regions WHERE user_id=? ORDER BY downloaded_at DESC', [q.user.id]); s.json(rows.map(fmt)); });
r.post('/', async (q, s) => {
  const b = q.body; if (!valid(b)) return s.status(400).json({ error: 'name, latitude, longitude and radius_km (1-50) required' });
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    const [i] = await c.query('INSERT INTO downloaded_regions(user_id,region_name,center_lat,center_lng,radius_km,min_zoom,max_zoom,tile_count,size_bytes) VALUES(?,?,?,?,?,?,?,?,?)',
      [q.user.id, b.name.slice(0, 150), b.latitude, b.longitude, b.radius_km, b.min_zoom || 9, b.max_zoom || 13, b.tile_count || 0, b.size_bytes || 0]);
    await link(c, i.insertId, b.latitude, b.longitude, b.radius_km); await c.commit();
    const [rows] = await db.query('SELECT * FROM downloaded_regions WHERE region_id=?', [i.insertId]); s.status(201).json(fmt(rows[0]));
  } catch (e) { await c.rollback(); console.error(e); s.status(500).json({ error: 'Server error' }); } finally { c.release(); }
});
r.put('/:id', async (q, s) => {
  const b = q.body, c = await db.getConnection();
  try {
    const [own] = await c.query('SELECT region_id FROM downloaded_regions WHERE region_id=? AND user_id=?', [q.params.id, q.user.id]);
    if (!own.length) return s.status(404).json({ error: 'Region not found' });
    await c.beginTransaction();
    await c.query('UPDATE downloaded_regions SET tile_count=?,size_bytes=?,min_zoom=?,max_zoom=? WHERE region_id=?', [b.tile_count || 0, b.size_bytes || 0, b.min_zoom || 9, b.max_zoom || 13, q.params.id]);
    await link(c, q.params.id, b.latitude, b.longitude, b.radius_km); await c.commit();
    const [rows] = await db.query('SELECT * FROM downloaded_regions WHERE region_id=?', [q.params.id]); s.json(fmt(rows[0]));
  } catch (e) { await c.rollback(); console.error(e); s.status(500).json({ error: 'Server error' }); } finally { c.release(); }
});
r.delete('/:id', async (q, s) => {
  const [res] = await db.query('DELETE FROM downloaded_regions WHERE region_id=? AND user_id=?', [q.params.id, q.user.id]);
  res.affectedRows ? s.json({ deleted: true }) : s.status(404).json({ error: 'Region not found' });
});
module.exports = r;
