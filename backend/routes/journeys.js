const r = require('express').Router(), db = require('../db'), auth = require('../middleware/auth');
r.use(auth);
// Cloud backup of journeys recorded offline (client_uuid makes the upload idempotent)
r.post('/', async (q, s) => {
  const b = q.body, pts = Array.isArray(b.points) ? b.points : [];
  if (!b.client_uuid || !pts.length) return s.status(400).json({ error: 'client_uuid and points required' });
  const c = await db.getConnection();
  try {
    const [ex] = await c.query('SELECT journey_id FROM journeys WHERE user_id=? AND client_uuid=?', [q.user.id, b.client_uuid]);
    if (ex.length) return s.json({ id: ex[0].journey_id, duplicate: true });
    await c.beginTransaction();
    const [i] = await c.query('INSERT INTO journeys(user_id,client_uuid,title,started_at,ended_at,distance_m,point_count) VALUES(?,?,?,?,?,?,?)',
      [q.user.id, b.client_uuid, (b.title || 'Journey').slice(0, 120), new Date(b.started_at), new Date(b.ended_at || Date.now()), b.distance_m || 0, pts.length]);
    await c.query('INSERT INTO track_points(journey_id,seq,latitude,longitude,accuracy_m,recorded_at) VALUES ?',
      [pts.map((p, n) => [i.insertId, n, p.lat, p.lng, p.acc, new Date(p.t)])]);
    await c.commit(); s.status(201).json({ id: i.insertId });
  } catch (e) { await c.rollback(); console.error(e); s.status(500).json({ error: 'Server error' }); } finally { c.release(); }
});
r.get('/', async (q, s) => { const [rows] = await db.query('SELECT journey_id id,client_uuid,title,started_at,ended_at,distance_m,point_count FROM journeys WHERE user_id=? ORDER BY started_at DESC', [q.user.id]); s.json(rows); });
r.get('/:uuid', async (q, s) => {
  const [j] = await db.query('SELECT * FROM journeys WHERE user_id=? AND client_uuid=?', [q.user.id, q.params.uuid]);
  if (!j.length) return s.status(404).json({ error: 'Not found' });
  const [p] = await db.query('SELECT latitude lat,longitude lng,accuracy_m acc,recorded_at t FROM track_points WHERE journey_id=? ORDER BY seq', [j[0].journey_id]);
  s.json({ ...j[0], points: p });
});
r.delete('/all', async (q, s) => { const [x] = await db.query('DELETE FROM journeys WHERE user_id=?', [q.user.id]); s.json({ deleted: x.affectedRows }); });
r.delete('/:uuid', async (q, s) => { const [x] = await db.query('DELETE FROM journeys WHERE user_id=? AND client_uuid=?', [q.user.id, q.params.uuid]); s.json({ deleted: x.affectedRows }); });
module.exports = r;
