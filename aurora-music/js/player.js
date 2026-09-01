/**
 * Aurora Music - Player Module
 * High-level player controller integrating audio engine and UI updates
 */

class Player {
  constructor(audioEngine, db, library = null) {
    this.audio = audioEngine;
    this.db = db;
    this.library = library;
    this.currentTrack = null;
    this.currentIndex = -1;
    this.isPlaying = false;

    this.setupListeners();
  }

  setupListeners() {
    this.audio.onTrackChange = (track, index) => {
      this.currentTrack = track;
      this.currentIndex = index;
      this.updateUI();
      this.savePlaybackState();
    };

    this.audio.onTimeUpdate = (currentTime, duration) => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(currentTime, duration);
      }
    };

    this.audio.onLoadedMetadata = (duration) => {
      if (this.onLoadedMetadata) {
        this.onLoadedMetadata(duration);
      }
    };

    this.audio.onPlayStateChange = (isPlaying) => {
      this.isPlaying = isPlaying;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(isPlaying);
      }
    };

    this.audio.onShuffleChange = (isShuffle) => {
      if (this.onShuffleChange) {
        this.onShuffleChange(isShuffle);
      }
    };

    this.audio.onRepeatChange = (repeatMode) => {
      if (this.onRepeatChange) {
        this.onRepeatChange(repeatMode);
      }
    };

    this.audio.onError = (error) => {
      console.error('Playback error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };
  }

  async playTrack(track, queue = null) {
    if (queue) {
      this.audio.setQueue(queue, queue.findIndex(t => t.id === track.id));
    } else {
      this.audio.loadTrack(this.audio.currentIndex);
    }

    this.audio.play();
    await this.updateFavoriteStatus();
  }

  async togglePlay() {
    if (!this.currentTrack && this.audio.queue.length > 0) {
      this.audio.loadTrack(0);
    }
    this.audio.togglePlay();
  }

  pause() {
    this.audio.pause();
  }

  play() {
    this.audio.play();
  }

  next() {
    this.audio.next();
  }

  prev() {
    this.audio.prev();
  }

  seek(time) {
    this.audio.seek(time);
  }

  setQueue(tracks, startIndex = 0) {
    this.audio.setQueue(tracks, startIndex);
  }

  setVolume(value) {
    this.audio.setVolume(value);
  }

  toggleShuffle() {
    this.audio.toggleShuffle();
  }

  toggleRepeat() {
    this.audio.toggleRepeat();
  }

  async toggleFavorite() {
    if (!this.currentTrack) return;

    const newFavorite = !this.currentTrack.favorite;
    this.currentTrack.favorite = newFavorite;
    await this.db.updateTrackFavorite(this.currentTrack.id, newFavorite);

    if (this.onFavoriteChange) {
      this.onFavoriteChange(newFavorite);
    }

    const queueIndex = this.audio.queue.findIndex(t => t.id === this.currentTrack.id);
    if (queueIndex !== -1) {
      this.audio.queue[queueIndex].favorite = newFavorite;
    }

    if (this.library) {
      const libraryTrack = this.library.getTracks().find(t => t.id === this.currentTrack.id);
      if (libraryTrack) {
        libraryTrack.favorite = newFavorite;
      }
    }
  }

  async updateFavoriteStatus() {
    if (!this.currentTrack) return;
    const track = await this.db.getTrack(this.currentTrack.id);
    if (track) {
      this.currentTrack.favorite = track.favorite;
      if (this.onFavoriteChange) {
        this.onFavoriteChange(track.favorite);
      }
    }
  }

  updateUI() {
    if (this.onTrackChange) {
      this.onTrackChange(this.currentTrack, this.currentIndex);
    }
  }

  async savePlaybackState() {
    try {
      await this.db.setSetting('lastPlayedTrack', {
        id: this.currentTrack?.id,
        index: this.currentIndex,
        time: this.audio.audio.currentTime,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Could not save playback state:', error);
    }
  }

  async restorePlaybackState() {
    try {
      const state = await this.db.getSetting('lastPlayedTrack');
      if (state && state.id) {
        const track = await this.db.getTrack(state.id);
        if (track) {
          return { track, index: state.index, time: state.time };
        }
      }
    } catch (error) {
      console.warn('Could not restore playback state:', error);
    }
    return null;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getProgress() {
    return this.audio.getProgress();
  }

  getQueue() {
    return this.audio.getQueue();
  }

  isShuffleActive() {
    return this.audio.isShuffle;
  }

  getRepeatMode() {
    return this.audio.repeatMode;
  }

  destroy() {
    this.savePlaybackState();
    this.audio.destroy();
  }
}

// Player ready for use
