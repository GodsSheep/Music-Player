/**
 * Aurora Music - Audio Engine
 * Handles audio playback, queue management, shuffle, repeat, and Media Session API
 */

class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.queue = [];
    this.currentIndex = -1;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none' | 'one' | 'all'
    this.shuffleHistory = [];
    this.isPlaying = false;
    this.currentTrack = null;
    this.objectURLs = new Map(); // Track ID -> ObjectURL for cleanup

    this.setupAudioListeners();
  }

  setupAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnd();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.onLoadedMetadata) {
        this.onLoadedMetadata(this.audio.duration);
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      if (this.onError) {
        this.onError(e);
      }
      // Auto-advance on error
      this.next();
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(true);
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(false);
      }
    });
  }

  setQueue(tracks, startIndex = 0) {
    this.queue = [...tracks];
    this.currentIndex = startIndex;
    this.shuffleHistory = [];

    if (this.isShuffle && this.queue.length > 1) {
      this.shuffleHistory = [startIndex];
      const remaining = this.queue
        .map((_, i) => i)
        .filter(i => i !== startIndex);
      this.shuffleIndices = this.shuffleArray(remaining);
    }

    if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      this.loadTrack(this.currentIndex);
    }
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  loadTrack(index) {
    if (index < 0 || index >= this.queue.length) return;

    this.currentIndex = index;
    this.currentTrack = this.queue[index];

    // Clean up previous object URL
    if (this.currentTrack.objectURL) {
      URL.revokeObjectURL(this.currentTrack.objectURL);
    }

    // Create new object URL
    const objectURL = URL.createObjectURL(this.currentTrack.file);
    this.objectURLs.set(this.currentTrack.id, objectURL);

    this.audio.src = objectURL;
    this.currentTrack.objectURL = objectURL;

    // Update Media Session
    this.updateMediaSession();

    if (this.onTrackChange) {
      this.onTrackChange(this.currentTrack, index);
    }
  }

  play() {
    if (this.currentTrack && this.audio.src) {
      this.audio.play().catch(e => console.error('Play error:', e));
    }
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time) {
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  setVolume(value) {
    this.audio.volume = Math.max(0, Math.min(1, value));
  }

  next() {
    if (this.queue.length === 0) return;

    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.play();
      return;
    }

    let nextIndex;

    if (this.isShuffle) {
      if (this.shuffleHistory.length >= this.queue.length) {
        // Reshuffle when all tracks have been played
        this.shuffleHistory = [];
        const remaining = this.queue.map((_, i) => i);
        this.shuffleIndices = this.shuffleArray(remaining);
      }

      const historyLen = this.shuffleHistory.length;
      nextIndex = this.shuffleIndices[historyLen] || this.shuffleIndices[0];
      this.shuffleHistory.push(nextIndex);
    } else {
      nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.queue.length) {
        if (this.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }

    this.loadTrack(nextIndex);
    this.play();
  }

  prev() {
    if (this.queue.length === 0) return;

    // If more than 3 seconds into the song, restart it
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    let prevIndex;

    if (this.isShuffle && this.shuffleHistory.length > 1) {
      this.shuffleHistory.pop();
      prevIndex = this.shuffleHistory[this.shuffleHistory.length - 1];
    } else if (this.isShuffle) {
      prevIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
      this.shuffleHistory.push(prevIndex);
    } else {
      prevIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    }

    this.loadTrack(prevIndex);
    this.play();
  }

  handleTrackEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.play();
    } else {
      this.next();
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;

    if (this.isShuffle) {
      this.shuffleHistory = [this.currentIndex];
      const remaining = this.queue
        .map((_, i) => i)
        .filter(i => i !== this.currentIndex);
      this.shuffleIndices = this.shuffleArray(remaining);
    } else {
      this.shuffleHistory = [];
    }

    if (this.onShuffleChange) {
      this.onShuffleChange(this.isShuffle);
    }
  }

  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentModeIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentModeIndex + 1) % modes.length];

    if (this.onRepeatChange) {
      this.onRepeatChange(this.repeatMode);
    }
  }

  updateMediaSession() {
    if ('mediaSession' in navigator && this.currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentTrack.title || 'Unknown',
        artist: this.currentTrack.artist || 'Unknown Artist',
        album: this.currentTrack.album || '',
        artwork: this.currentTrack.artwork ? [
          { src: this.currentTrack.artwork, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  getQueue() {
    return this.queue;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getProgress() {
    return {
      current: this.audio.currentTime,
      duration: this.audio.duration || 0
    };
  }

  destroy() {
    // Clean up all object URLs
    for (const [id, url] of this.objectURLs) {
      URL.revokeObjectURL(url);
    }
    this.objectURLs.clear();
    this.audio.pause();
    this.audio.src = '';
  }
}

// AudioEngine ready for use
