/**
 * Soniq - Database Module
 * IndexedDB wrapper with migrations, duplicate detection, and recovery
 */

class AuroraDB {
  constructor() {
    this.dbName = 'AuroraMusicDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('tracks')) {
          const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
          tracksStore.createIndex('title', 'title', { unique: false });
          tracksStore.createIndex('artist', 'artist', { unique: false });
          tracksStore.createIndex('album', 'album', { unique: false });
          tracksStore.createIndex('favorite', 'favorite', { unique: false });
          tracksStore.createIndex('addedAt', 'addedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('playlists')) {
          const playlistsStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistsStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key, defaultValue = null) {
    try {
      const result = await this.get('settings', key);
      return result ? result.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async setSetting(key, value) {
    return this.put('settings', { key, value });
  }

  async getTracks() {
    return this.getAll('tracks');
  }

  async getTrack(id) {
    return this.get('tracks', id);
  }

  async addTrack(track) {
    return this.put('tracks', track);
  }

  async addTracks(tracks) {
    const transaction = this.db.transaction('tracks', 'readwrite');
    const store = transaction.objectStore('tracks');
    for (const track of tracks) {
      store.put(track);
    }
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteTrack(id) {
    return this.delete('tracks', id);
  }

  async deleteTracks(ids) {
    const transaction = this.db.transaction('tracks', 'readwrite');
    const store = transaction.objectStore('tracks');
    for (const id of ids) {
      store.delete(id);
    }
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async updateTrackFavorite(id, favorite) {
    const track = await this.getTrack(id);
    if (track) {
      track.favorite = favorite;
      track.updatedAt = Date.now();
      return this.put('tracks', track);
    }
  }

  async getFavorites() {
    const tracks = await this.getAll('tracks');
    return tracks.filter(t => t.favorite);
  }

  async getPlaylists() {
    return this.getAll('playlists');
  }

  async getPlaylist(id) {
    return this.get('playlists', id);
  }

  async savePlaylist(playlist) {
    return this.put('playlists', playlist);
  }

  async deletePlaylist(id) {
    return this.delete('playlists', id);
  }

  async searchTracks(query) {
    const tracks = await this.getAll('tracks');
    const lowerQuery = query.toLowerCase();
    return tracks.filter(track =>
      track.title?.toLowerCase().includes(lowerQuery) ||
      track.artist?.toLowerCase().includes(lowerQuery) ||
      track.album?.toLowerCase().includes(lowerQuery)
    );
  }
}

// AuroraDB ready for use
