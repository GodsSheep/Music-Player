/**
 * Aurora Music - Library Module
 * Handles track importing, duplicate detection, search, and filtering
 */

class Library {
  constructor(db, metadataEngine) {
    this.db = db;
    this.metadata = metadataEngine;
    this.tracks = [];
    this.isImporting = false;
  }

  async importFiles(files) {
    if (this.isImporting) {
      throw new Error('Import already in progress');
    }

    this.isImporting = true;
    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0
    };

    try {
      const audioFiles = Array.from(files).filter(file =>
        this.isAudioFile(file)
      );

      if (audioFiles.length === 0) {
        return results;
      }

      // Get existing tracks for duplicate detection
      const existingTracks = await this.db.getTracks();
      const existingHashes = new Map();
      for (const track of existingTracks) {
        existingHashes.set(track.hash, track);
      }

      const newTracks = [];
      const batchSize = 50;

      for (let i = 0; i < audioFiles.length; i += batchSize) {
        const batch = audioFiles.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch, existingHashes, newTracks);
        results.imported += batchResults.imported;
        results.duplicates += batchResults.duplicates;
        results.errors += batchResults.errors;

        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Save new tracks to database
      if (newTracks.length > 0) {
        await this.db.addTracks(newTracks);
        this.tracks = await this.db.getTracks();
      }

      return results;
    } finally {
      this.isImporting = false;
    }
  }

  async processBatch(files, existingHashes, newTracks) {
    const results = { imported: 0, duplicates: 0, errors: 0 };

    for (const file of files) {
      try {
        // Generate file hash for duplicate detection
        const hash = await this.generateFileHash(file);

        if (existingHashes.has(hash)) {
          results.duplicates++;
          continue;
        }

        // Parse metadata
        const meta = await this.metadata.parseFile(file);

        const track = {
          id: this.generateId(file.name, file.size, hash),
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          format: meta.format,
          bitrate: meta.bitrate,
          size: file.size,
          artwork: meta.artwork,
          favorite: false,
          playCount: 0,
          lastPlayed: null,
          hash: hash,
          file: file,
          path: file.name,
          addedAt: Date.now()
        };

        newTracks.push(track);
        existingHashes.set(hash, track);
        results.imported++;
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        results.errors++;
      }
    }

    return results;
  }

  async generateFileHash(file) {
    try {
      const buffer = await this.readFileSlice(file, 0, Math.min(file.size, 65536));
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback to size + name
      return `${file.size}-${file.name}`;
    }
  }

  generateId(name, size, hash) {
    return `${hash}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isAudioFile(file) {
    const audioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg',
      'audio/opus', 'audio/wav', 'audio/webm', 'audio/x-m4a',
      'audio/aac', 'audio/mp4', 'audio/wma'
    ];
    const audioExtensions = ['.mp3', '.flac', '.ogg', '.opus', '.wav', '.webm', '.m4a', '.aac', '.mp4', '.wma'];

    return audioTypes.includes(file.type) ||
           audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  readFileSlice(file, start, length) {
    return new Promise((resolve, reject) => {
      const blob = file.slice(start, start + length);
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);

      reader.readAsArrayBuffer(blob);
    });
  }

  async loadLibrary() {
    this.tracks = await this.db.getTracks();
    return this.tracks;
  }

  async refreshLibrary() {
    this.tracks = await this.db.getTracks();
    return this.tracks;
  }

  async search(query) {
    if (!query || query.trim().length === 0) {
      return this.tracks;
    }

    const lowerQuery = query.toLowerCase().trim();
    return this.tracks.filter(track =>
      (track.title && track.title.toLowerCase().includes(lowerQuery)) ||
      (track.artist && track.artist.toLowerCase().includes(lowerQuery)) ||
      (track.album && track.album.toLowerCase().includes(lowerQuery))
    );
  }

  async getFavorites() {
    return this.tracks.filter(t => t.favorite);
  }

  async getPlaylists() {
    return this.db.getPlaylists();
  }

  async getRecentlyPlayed(limit = 50) {
    return this.tracks
      .filter(t => t.lastPlayed)
      .sort((a, b) => b.lastPlayed - a.lastPlayed)
      .slice(0, limit);
  }

  async getAlbums() {
    const albums = new Map();
    for (const track of this.tracks) {
      const key = track.album || 'Unknown Album';
      if (!albums.has(key)) {
        albums.set(key, {
          name: key,
          artist: track.artist,
          tracks: [],
          artwork: null
        });
      }
      albums.get(key).tracks.push(track);
      if (!albums.get(key).artwork && track.artwork) {
        albums.get(key).artwork = track.artwork;
      }
    }
    return Array.from(albums.values());
  }

  async getArtists() {
    const artists = new Map();
    for (const track of this.tracks) {
      const key = track.artist || 'Unknown Artist';
      if (!artists.has(key)) {
        artists.set(key, {
          name: key,
          tracks: [],
          artwork: null
        });
      }
      artists.get(key).tracks.push(track);
      if (!artists.get(key).artwork && track.artwork) {
        artists.get(key).artwork = track.artwork;
      }
    }
    return Array.from(artists.values());
  }

  async deleteTrack(id) {
    await this.db.deleteTrack(id);
    this.tracks = this.tracks.filter(t => t.id !== id);
  }

  async deleteTracks(ids) {
    await this.db.deleteTracks(ids);
    this.tracks = this.tracks.filter(t => !ids.includes(t.id));
  }

  async incrementPlayCount(trackId) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.playCount = (track.playCount || 0) + 1;
      track.lastPlayed = Date.now();
      await this.db.addTrack(track);
    }
  }

  sortTracks(tracks, field, direction = 'asc') {
    return [...tracks].sort((a, b) => {
      let aVal = a[field] || '';
      let bVal = b[field] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  async createPlaylist(name) {
    const playlist = {
      id: 'playlist-' + Date.now(),
      name: name,
      tracks: [],
      createdAt: Date.now()
    };
    await this.db.savePlaylist(playlist);
    return playlist;
  }

  async deletePlaylist(id) {
    await this.db.deletePlaylist(id);
  }

  async addTrackToPlaylist(playlistId, track) {
    const playlist = await this.db.getPlaylist(playlistId);
    if (playlist) {
      if (!playlist.tracks) playlist.tracks = [];
      if (!playlist.tracks.find(t => t.id === track.id)) {
        playlist.tracks.push(track);
        await this.db.savePlaylist(playlist);
      }
    }
  }

  getTracks() {
    return this.tracks;
  }
}

// Library ready for use
