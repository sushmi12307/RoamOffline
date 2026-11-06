const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), db = require('../db');
const sign = (id, email) => jwt.sign({ id, email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });
r.post('/register', async (q, s) => {
  try {
    const { fullName, password } = q.body, email = (q.body.email || '').toLowerCase().trim();
    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || (password || '').length < 6)
      return s.status(400).json({ error: 'Name, valid email and a password of at least 6 characters are required' });
    const [ex] = await db.query('SELECT user_id FROM users WHERE email=?', [email]);
    if (ex.length) return s.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const [i] = await db.query('INSERT INTO users(full_name,email,password_hash) VALUES(?,?,?)', [fullName.trim(), email, hash]);
    s.status(201).json({ token: sign(i.insertId, email), user: { id: i.insertId, fullName: fullName.trim(), email } });
  } catch (e) { console.error(e); s.status(500).json({ error: 'Server error' }); }
});
r.post('/login', async (q, s) => {
  try {
    const email = (q.body.email || '').toLowerCase().trim();
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length || !(await bcrypt.compare(q.body.password || '', rows[0].password_hash)))
      return s.status(401).json({ error: 'Wrong email or password' });
    const u = rows[0];
    s.json({ token: sign(u.user_id, u.email), user: { id: u.user_id, fullName: u.full_name, email: u.email } });
  } catch (e) { console.error(e); s.status(500).json({ error: 'Server error' }); }
});
module.exports = r;
