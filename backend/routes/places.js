
const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const EARTH_RADIUS_KM = 6371;

// Classify tourist places using OpenStreetMap tags.
function classify(t) {
  if (t.waterway === 'waterfall' || t.natural === 'waterfall') return 'Waterfall';
  if (t.natural === 'peak') return 'Peak';
  if (t.natural === 'beach') return 'Beach';

  if (
    t.natural === 'hot_spring' ||
    t.natural === 'cave_entrance'
  ) return 'Nature';

  if (t.tourism === 'viewpoint') return 'Viewpoint';

  if (
    t.tourism === 'museum' ||
    t.tourism === 'gallery'
  ) return 'Museum';

  if (
    t.tourism === 'camp_site' ||
    t.tourism === 'picnic_site'
  ) return 'Camping';

  if (
    t.tourism === 'zoo' ||
    t.tourism === 'theme_park' ||
    t.tourism === 'attraction'
  ) return 'Attraction';

  if (t.historic) return 'Heritage';

  if (t.leisure === 'nature_reserve') return 'Nature reserve';

  if (
    t.leisure === 'park' ||
    t.leisure === 'garden'
  ) return 'Park';

  if (t.amenity === 'place_of_worship') return 'Temple / Worship';

  if (
    ['cliff', 'volcano', 'bay', 'spring'].includes(t.natural)
  ) return 'Nature';

  if (
    t.waterway === 'dam' ||
    t.natural === 'water' ||
    t.man_made === 'lighthouse' ||
    t.man_made === 'tower'
  ) return 'Landmark';

  if (
    t.tourism &&
    !/^(hotel|motel|guest_house|hostel|apartment|chalet|information|yes)$/.test(t.tourism)
  ) return 'Attraction';

  return null;
}

// Validate coordinates.
function validCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Import tourist places from OpenStreetMap Overpass.
async function importOsm(lat, lng, km) {
  const around = `(around:${Math.round(km * 1000)},${lat},${lng})`;

  const query = `
    [out:json][timeout:60];
    (
      nwr["tourism"]["name"]${around};
      nwr["natural"~"^(waterfall|peak|beach|hot_spring|cave_entrance|cliff|volcano|bay|spring)$"]["name"]${around};
      nwr["waterway"~"^(waterfall|dam)$"]["name"]${around};
      nwr["historic"]["name"]${around};
      nwr["leisure"~"^(nature_reserve|park|garden)$"]["name"]${around};
      nwr["amenity"="place_of_worship"]["name"]${around};
      nwr["man_made"~"^(lighthouse|tower)$"]["name"]${around};
    );
    out center tags;
  `;

  for (const endpoint of ENDPOINTS) {
    try {
      console.log('Requesting tourist places from:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'User-Agent': 'RoamOffline-MiniProject/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(70000)
      });

      if (!response.ok) {
        console.log('Overpass response:', response.status);
        continue;
      }

      const data = await response.json();
      const rows = [];
      const seen = new Set();

      for (const element of data.elements || []) {
        const tags = element.tags || {};
        const category = classify(tags);

        const latitude =
          element.lat ??
          element.center?.lat;

        const longitude =
          element.lon ??
          element.center?.lon;

        if (
          !category ||
          !tags.name ||
          latitude == null ||
          longitude == null ||
          !validCoordinates(Number(latitude), Number(longitude))
        ) {
          continue;
        }

        const osmId = `${element.type}/${element.id}`;

        if (seen.has(osmId)) continue;
        seen.add(osmId);

        rows.push([
          String(tags.name).slice(0, 150),
          category,
          Number(latitude),
          Number(longitude),
          String(tags.description || '').slice(0, 500) || null,
          'OpenStreetMap',
          osmId
        ]);
      }

      // Keep the closest 2000 places.
      const distanceApprox = (a, b) => {
        const dLat = a[2] - lat;
        const dLng = (b[3] - lng) *
          Math.cos(lat * Math.PI / 180);

        return Math.hypot(dLat, dLng);
      };

      rows.sort(
        (a, b) => distanceApprox(a, b) - distanceApprox(b, a)
      );

      rows.length = Math.min(rows.length, 2000);

      if (rows.length > 0) {
        await db.query(
          `INSERT INTO tourist_places
          (name, category, latitude, longitude, description, source, osm_id)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            category = VALUES(category),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            description = VALUES(description),
            source = VALUES(source)`,
          [rows]
        );
      }

      console.log('OSM places imported:', rows.length);

      return rows.length;

    } catch (error) {
      console.error('Overpass error:', error.message);
    }
  }

  return -1;
}

// GET /api/places/nearby?lat=13.34&lng=74.74&radius=5&import=1
router.get('/nearby', auth, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 50);

    if (!validCoordinates(lat, lng)) {
      return res.status(400).json({
        error: 'Valid latitude and longitude are required.'
      });
    }

    if (
      !Number.isFinite(radius) ||
      radius < 1 ||
      radius > 50
    ) {
      return res.status(400).json({
        error: 'Radius must be between 1 and 50 km.'
      });
    }

    let osm = null;

    // Import fresh places when requested.
    if (req.query.import === '1') {
      osm = await importOsm(lat, lng, radius);
    }

    // Haversine distance calculation in MySQL.
    const distanceExpression = `
      (
        ${EARTH_RADIUS_KM} * ACOS(
          LEAST(1, GREATEST(-1,
            COS(RADIANS(?)) *
            COS(RADIANS(latitude)) *
            COS(RADIANS(longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) *
            SIN(RADIANS(latitude))
          ))
        )
      )
    `;

    const sql = `
      SELECT
        place_id AS id,
        name,
        category,
        latitude,
        longitude,
        description,
        source,
        updated_at,
        ${distanceExpression} AS distance_km
      FROM tourist_places
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
      LIMIT 2000
    `;

    const [places] = await db.query(sql, [
      lat,
      lng,
      lat,
      radius
    ]);

    return res.json({
      count: places.length,
      osm,
      places
    });

  } catch (error) {
    console.error('Nearby places error:', error);

    return res.status(500).json({
      error: 'Unable to retrieve nearby tourist places.',
      details: process.env.NODE_ENV === 'development'
        ? error.message
        : undefined
    });
  }
});

module.exports = router;
