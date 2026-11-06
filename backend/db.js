require('dotenv').config();
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'roamoffline', waitForConnections: true, connectionLimit: 10, decimalNumbers: true
});
// Haversine distance in km. Placeholders order: (lat, lng, lat)
pool.HAV = '(6371*ACOS(LEAST(1,COS(RADIANS(?))*COS(RADIANS(latitude))*COS(RADIANS(longitude)-RADIANS(?))+SIN(RADIANS(?))*SIN(RADIANS(latitude)))))';
module.exports = pool;
