import { api } from './api.js';
import { tileList, maxZoomFor } from './geo.js';
import * as db from './db.js';

export const MIN_Z = 9;
export const AVG_TILE = 18000;
export const CACHE = 'roam-tiles';

export function plan(lat, lng, km) {
  const maxZ = maxZoomFor(km);
  const tiles = tileList(lat, lng, km, MIN_Z, maxZ);

  return {
    tiles,
    maxZ,
    estBytes: tiles.length * AVG_TILE
  };
}

// Download tourist places and map tiles.
export async function download({
  user,
  name,
  lat,
  lng,
  km,
  existing,
  onProgress = () => {},
  signal
}) {
  if (!user?.id) {
    throw new Error('Please sign in before downloading a map.');
  }

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Please select a valid destination.');
  }

  if (!Number.isFinite(km) || km < 1 || km > 50) {
    throw new Error('Select a radius between 1 and 50 km.');
  }

  if (!window.caches) {
    throw new Error('Your browser does not support offline map storage.');
  }

  const isCancelled = () => signal?.aborted === true;

  await db.put('meta', {
    k: 'pending:' + user.id,
    v: { name, lat, lng, km, existing: existing?.id || null }
  });

  try {
    onProgress({ phase: 'places', done: 0, total: 1 });

    const placeData = await api(
      `/places/nearby?lat=${lat}&lng=${lng}&radius=${km}&import=1`
    );

    const places = placeData.places || [];

    if (isCancelled()) {
      throw new Error('Download cancelled.');
    }

    const { tiles, maxZ } = plan(lat, lng, km);
    const cache = await caches.open(CACHE);

    let done = 0;
    let size = 0;
    let failed = 0;
    let index = 0;

    const worker = async () => {
      while (index < tiles.length && !isCancelled()) {
        const tile = tiles[index++];

        const url = `/tiles/${tile.z}/${tile.x}/${tile.y}.png`;

        try {
          const cached = await cache.match(url);

          if (cached) {
            size += (await cached.clone().blob()).size;
          } else {
            const response = await fetch(url, {
              signal
            });

            if (!response.ok) {
              throw new Error(`Tile request failed: ${response.status}`);
            }

            const blob = await response.blob();

            if (!blob.size || !blob.type.startsWith('image/')) {
              throw new Error('Invalid map tile received.');
            }

            size += blob.size;

            await cache.put(
              url,
              new Response(blob, {
                headers: {
                  'Content-Type': blob.type
                }
              })
            );
          }
        } catch (error) {
          if (isCancelled()) return;
          failed++;
        }

        done++;

        onProgress({
          phase: 'tiles',
          done,
          total: tiles.length,
          failed,
          size
        });
      }
    };

    await Promise.all(
      Array.from({ length: 6 }, () => worker())
    );

    if (isCancelled()) {
      throw new Error('Download cancelled. You can retry it.');
    }

    if (failed > 0) {
      throw new Error(
        `${failed} map tiles could not be downloaded. Check your map connection and try again.`
      );
    }

    const body = {
      name,
      latitude: lat,
      longitude: lng,
      radius_km: km,
      tile_count: tiles.length,
      size_bytes: size,
      min_zoom: MIN_Z,
      max_zoom: maxZ
    };

    const region = existing
      ? await api('/regions/' + existing.id, {
          method: 'PUT',
          body
        })
      : await api('/regions', {
          method: 'POST',
          body
        });

    const regionId = region.id ?? region.region_id;

    if (!regionId) {
      throw new Error('Backend did not return a valid region ID.');
    }

    await db.delPlacesOfRegion(regionId);

    await db.putMany(
      'places',
      places.map(place => {
        const placeId = place.id ?? place.place_id;

        return {
          ...place,
          id: placeId,
          key: regionId + ':' + placeId,
          regionId
        };
      })
    );

    const savedRegion = {
      ...region,
      id: regionId,
      latitude: lat,
      longitude: lng,
      radiusKm: km,
      minZoom: MIN_Z,
      maxZoom,
      userId: user.id,
      failedTiles: 0,
      osm: placeData.osm
    };

    await db.put('regions', savedRegion);

    await db.del('meta', 'pending:' + user.id);

    onProgress({
      phase: 'complete',
      done: tiles.length,
      total: tiles.length,
      failed: 0,
      size
    });

    return savedRegion;

  } catch (error) {
    throw error;
  }
}

// Remove unused cached map tiles.
export async function cleanTiles() {
  const keep = new Set();

  const regions = await db.all('regions');

  regions.forEach(region => {
    const tiles = tileList(
      region.latitude,
      region.longitude,
      region.radiusKm ?? region.radius_km,
      region.minZoom ?? region.min_zoom,
      region.maxZoom ?? region.max_zoom
    );

    tiles.forEach(tile => {
      keep.add(`/tiles/${tile.z}/${tile.x}/${tile.y}.png`);
    });
  });

  const cache = await caches.open(CACHE);
  let removed = 0;

  for (const request of await cache.keys()) {
    const pathname = new URL(request.url).pathname;

    if (!keep.has(pathname)) {
      await cache.delete(request);
      removed++;
    }
  }

  return removed;
}

// Delete a downloaded region.
export async function removeRegion(region) {
  try {
    if (navigator.onLine) {
      await api('/regions/' + region.id, {
        method: 'DELETE'
      });
    }
  } catch (error) {
    console.warn('Server region deletion failed:', error);
  }

  await db.del('regions', region.id);
  await db.delPlacesOfRegion(region.id);

  return cleanTiles();
}