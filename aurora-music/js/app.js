/**
 * Aurora Music - Main Application
 * Initializes all modules and orchestrates the app lifecycle
 */

class AuroraMusicApp {
  constructor() {
    this.db = null;
    this.metadata = null;
    this.audio = null;
    this.player = null;
    this.library = null;
    this.ui = null;
    this.settings = {
      crossfade: 0,
      normalize: false,
      gapless: true,
      eq: [0, 0, 0, 0, 0],
      wallpaper: 'gradient',
      visualization: 'bars',
      showLyrics: false,
      theme: 'dark',
      accentColor: '#0a84ff',
      blur: 60,
      outputDevice: 'default',
      sampleRate: 44100
    };
  }

  async init() {
    try {
      // Global error handling - prevent crashes
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (this.ui) {
          this.ui.showToast('An unexpected error occurred', 'error');
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', event.reason);
        if (this.ui) {
          this.ui.showToast('An unexpected error occurred', 'error');
        }
      });

      // Initialize database
      this.db = new AuroraDB();
      await this.db.init();
      console.log('Database initialized');

      // Load settings
      await this.loadSettings();

      // Initialize metadata engine
      this.metadata = new MetadataEngine();

      // Initialize audio engine
      this.audio = new AudioEngine();

      // Apply EQ
      this.applyEQ();

      // Initialize library
      this.library = new Library(this.db, this.metadata);

      // Initialize player
      this.player = new Player(this.audio, this.db, this.library);

      // Initialize UI
      this.ui = new UIController(this.player, this.library, this);

      // Load library
      await this.library.loadLibrary();

      // Render initial view
      this.ui.switchView('library');

      // Restore playback state
      await this.restorePlayback();

      // Register service worker
      await this.registerServiceWorker();

      // Set initial volume
      this.player.setVolume(0.8);
      this.ui.elements.volumeSlider.value = 0.8;

      console.log('Aurora Music initialized');

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showFallbackError(error);
    }
  }

  async loadSettings() {
    try {
      const saved = await this.db.getSetting('appSettings');
      if (saved) {
        this.settings = { ...this.settings, ...saved };
      }
    } catch (error) {
      console.warn('Could not load settings:', error);
    }

    this.applyUrlPreviewSettings();
  }

  applyUrlPreviewSettings() {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('preview');
    if (!preview) return;

    const map = {
      theme: 'theme',
      wallpaper: 'wallpaper',
      visualization: 'visualization',
      accent: 'accentColor',
      blur: 'blur',
      lyrics: 'showLyrics',
      eq: 'eq'
    };

    const updates = {};
    for (const [key, setting] of Object.entries(map)) {
      const val = params.get(key);
      if (val !== null) {
        if (setting === 'blur') {
          updates[setting] = parseInt(val, 10);
        } else if (setting === 'showLyrics') {
          updates[setting] = val === '1';
        } else if (setting === 'eq') {
          updates[setting] = val.split(',').map(Number);
        } else if (setting === 'accentColor') {
          updates[setting] = val.startsWith('#') ? val : `#${val}`;
        } else {
          updates[setting] = val;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      this.settings = { ...this.settings, ...updates };
    }
  }

  async saveSettings() {
    try {
      await this.db.setSetting('appSettings', this.settings);
    } catch (error) {
      console.warn('Could not save settings:', error);
    }
  }

  scheduleSaveSettings() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.saveSettings(), 600);
  }

  applyEQ() {
    if (!this.audio || !this.audio.audioContext) return;

    try {
      // Remove existing filters
      if (this.eqFilters) {
        this.eqFilters.forEach(filter => {
          try {
            this.audio.audioContext.disconnect(filter);
          } catch (e) {}
        });
      }

      // Create new EQ filters
      this.eqFilters = [];
      const frequencies = [60, 230, 1000, 4000, 12000];
      const types = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

      frequencies.forEach((freq, i) => {
        const filter = this.audio.audioContext.createBiquadFilter();
        filter.type = types[i];
        filter.frequency.value = freq;
        filter.gain.value = this.settings.eq[i] || 0;
        this.eqFilters.push(filter);
      });

      // Connect EQ chain
      if (this.eqFilters.length > 0) {
        this.audio.audioContext.disconnect();
        this.audio.audioContext.connect(this.eqFilters[0]);
        for (let i = 0; i < this.eqFilters.length - 1; i++) {
          this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }
        this.eqFilters[this.eqFilters.length - 1].connect(this.audio.audioContext.destination);
      }
    } catch (error) {
      console.error('EQ setup error:', error);
    }
  }

  showFallbackError(error) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `<strong>Initialization Error</strong><br><small>${this.escapeHtml(error.message)}</small>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async restorePlayback() {
    try {
      const state = await this.player.restorePlaybackState();
      if (state && state.track) {
        this.ui.updatePlayerBar(state.track);
      }
    } catch (error) {
      console.warn('Could not restore playback state:', error);
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AuroraMusicApp();
    app.init();
  });
} else {
  const app = new AuroraMusicApp();
  app.init();
}
