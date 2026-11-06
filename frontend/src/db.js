let _db;

const open = () => {
  if (_db) return _db;

  _db = new Promise((resolve, reject) => {
    const request = indexedDB.open('roamoffline', 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains('regions')) {
        database.createObjectStore('regions', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('places')) {
        database.createObjectStore('places', { keyPath: 'key' })
          .createIndex('regionId', 'regionId');
      }

      if (!database.objectStoreNames.contains('journeys')) {
        database.createObjectStore('journeys', { keyPath: 'uuid' });
      }

      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'k' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return _db;
};

const tx = async (storeName, mode, operation) => {
  const database = await open();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));

    let result;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
    }

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const put = (store, value) =>
  tx(store, 'readwrite', objectStore => objectStore.put(value));

export const get = (store, key) =>
  tx(store, 'readonly', objectStore => objectStore.get(key));

export const all = store =>
  tx(store, 'readonly', objectStore => objectStore.getAll());

export const del = (store, key) =>
  tx(store, 'readwrite', objectStore => objectStore.delete(key));

export const clear = store =>
  tx(store, 'readwrite', objectStore => objectStore.clear());

export const putMany = (store, values) =>
  tx(store, 'readwrite', objectStore => {
    values.forEach(value => objectStore.put(value));
    return null;
  });

export async function delPlacesOfRegion(id) {
  const database = await open();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('places', 'readwrite');
    const store = transaction.objectStore('places');
    const cursor = store.index('regionId').openKeyCursor(
      IDBKeyRange.only(id)
    );

    cursor.onsuccess = () => {
      const current = cursor.result;

      if (current) {
        store.delete(current.primaryKey);
        current.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}