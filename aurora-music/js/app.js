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
  }

  async init() {
    try {
      // Global error handling
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        this.showToast('An unexpected error occurred', 'error');
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', event.reason);
        this.showToast('An unexpected error occurred', 'error');
      });

      // Initialize database
      this.db = new AuroraDB();
      await this.db.init();
      console.log('Database initialized');

      // Initialize metadata engine
      this.metadata = new MetadataEngine();

      // Initialize audio engine
      this.audio = new AudioEngine();

      // Initialize library
      this.library = new Library(this.db, this.metadata);

      // Initialize player
      this.player = new Player(this.audio, this.db);

      // Initialize UI
      this.ui = new UIController(this.player, this.library);

      // Load library
      await this.library.loadLibrary();

      // Render initial view
      this.ui.switchView('library');

      // Restore playback state
      await this.restorePlayback();

      // Register service worker
      this.registerServiceWorker();

      // Set initial volume
      this.player.setVolume(0.8);
      this.ui.elements.volumeSlider.value = 0.8;

      console.log('Aurora Music initialized');

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showToast('Failed to initialize app', 'error');
    }
  }

  async restorePlayback() {
    try {
      const state = await this.player.restorePlaybackState();
      if (state && state.track) {
        // Don't auto-play, just show the last track
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

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AuroraMusicApp();
  app.init();
});
