
const R = 6371000;
const TILE_LIMIT = 2 ** 30;

// Haversine: approximate straight-line distance in metres.
export function hav(lat1, lng1, lat2, lng2) {
  const rad = x => x * Math.PI / 180;

  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
    Math.cos(rad(lat2)) *
    Math.sin(rad(lng2 - lng1) / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(Math.min(1, a)));
}

// Format distance.
export const fmt = m =>
  m < 1000
    ? Math.round(m) + ' m'
    : (m / 1000).toFixed(m < 10000 ? 2 : 1) + ' km';

// Validate coordinates.
function validCoordinates(lat, lng) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -85.05112878 ||
    lat > 85.05112878 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error('Invalid map coordinates.');
  }
}

const lon2x = (lon, z) =>
  Math.floor(((lon + 180) / 360) * 2 ** z);

const lat2y = (lat, z) => {
  const safeLat = Math.max(
    -85.05112878,
    Math.min(85.05112878, lat)
  );

  const s = Math.sin(safeLat * Math.PI / 180);

  return Math.floor(
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) *
    2 ** z
  );
};

// Generate tiles covering the selected circular region.
// This uses a bounding box, so some tiles outside the circle
// are included to ensure the entire circle is covered.
export function tileList(lat, lng, km, minZ = 9, maxZ = 13) {
  validCoordinates(lat, lng);

  if (!Number.isFinite(km) || km < 1 || km > 50) {
    throw new Error('Map radius must be between 1 and 50 km.');
  }

  if (
    !Number.isInteger(minZ) ||
    !Number.isInteger(maxZ) ||
    minZ < 0 ||
    maxZ > 22 ||
    minZ > maxZ
  ) {
    throw new Error('Invalid map zoom levels.');
  }

  const dLat = km / 110.574;

  const cosLat = Math.max(
    0.01,
    Math.cos(lat * Math.PI / 180)
  );

  const dLng = km / (111.320 * cosLat);

  const south = Math.max(-85.05112878, lat - dLat);
  const north = Math.min(85.05112878, lat + dLat);

  const west = Math.max(-180, lng - dLng);
  const east = Math.min(180, lng + dLng);

  const output = [];
  const seen = new Set();

  for (let z = minZ; z <= maxZ; z++) {
    const n = 2 ** z;

    const x0 = Math.max(0, lon2x(west, z));
    const x1 = Math.min(n - 1, lon2x(east, z));

    const y0 = Math.max(0, lat2y(north, z));
    const y1 = Math.min(n - 1, lat2y(south, z));

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const key = `${z}/${x}/${y}`;

        if (!seen.has(key)) {
          seen.add(key);
          output.push({ z, x, y });
        }
      }
    }
  }

  return output;
}

// Higher detail for small radii and lower detail for large regions.
export const maxZoomFor = km => {
  if (!Number.isFinite(km) || km < 1 || km > 50) {
    throw new Error('Radius must be between 1 and 50 km.');
  }

  return km <= 10 ? 15 : km <= 20 ? 14 : 13;
};
