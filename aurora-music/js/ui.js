/**
 * Soniq - UI Controller
 * Handles all DOM interactions, view switching, rendering, and animations
 */

class UIController {
  constructor(player, library, app) {
    this.player = player;
    this.library = library;
    this.app = app;
    this.currentView = 'library';
    this.sortField = 'title';
    this.sortDirection = 'asc';
    this.searchQuery = '';
    this.contextTrackId = null;
    this.selectedPlaylistId = null;

    this.elements = {};
    this.cacheElements();
    this.setupEventListeners();
    this.setupPlayerListeners();
    this.setupSwipeGestures();
  }

  cacheElements() {
    this.elements = {
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      sidebarClose: document.getElementById('sidebar-close'),
      mainContent: document.getElementById('main-content'),
      viewsContainer: document.getElementById('views-container'),
      libraryView: document.getElementById('library-view'),
      favoritesView: document.getElementById('favorites-view'),
      playlistsView: document.getElementById('playlists-view'),
      settingsView: document.getElementById('settings-view'),
      libraryList: document.getElementById('library-list'),
      favoritesList: document.getElementById('favorites-list'),
      playlistsGrid: document.getElementById('playlists-grid'),
      libraryEmpty: document.getElementById('library-empty'),
      favoritesEmpty: document.getElementById('favorites-empty'),
      playlistsEmpty: document.getElementById('playlists-empty'),
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),
      folderInput: document.getElementById('folder-input'),
      importFilesBtn: document.getElementById('import-files-btn'),
      importFolderBtn: document.getElementById('import-folder-btn'),
      searchInput: document.getElementById('search-input'),
      addToQueueBtn: document.getElementById('add-to-queue-btn'),
      sortBtn: document.getElementById('sort-btn'),
      createPlaylistBtn: document.getElementById('create-playlist-btn'),
      queuePanel: document.getElementById('queue-panel'),
      queueToggle: document.getElementById('queue-toggle'),
      queueClose: document.getElementById('queue-close'),
      queueList: document.getElementById('queue-list'),
      queueEmpty: document.getElementById('queue-empty'),
      queueCount: document.getElementById('queue-count'),
      playerBar: document.getElementById('player-bar'),
      playerArtwork: document.getElementById('player-artwork'),
      playerTitle: document.getElementById('player-title'),
      playerArtist: document.getElementById('player-artist'),
      favoriteBtn: document.getElementById('favorite-btn'),
      nowPlayingBtn: document.getElementById('now-playing-btn'),
      playBtn: document.getElementById('play-btn'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      shuffleBtn: document.getElementById('shuffle-btn'),
      repeatBtn: document.getElementById('repeat-btn'),
      currentTime: document.getElementById('current-time'),
      duration: document.getElementById('duration'),
      progressBar: document.getElementById('progress-bar'),
      progressFill: document.getElementById('progress-fill'),
      progressHandle: document.getElementById('progress-handle'),
      volumeSlider: document.getElementById('volume-slider'),
      visualizerToggle: document.getElementById('visualizer-toggle'),
      visualizer: document.getElementById('visualizer'),
      nowPlaying: document.getElementById('now-playing'),
      npBackground: document.getElementById('np-background'),
      npCanvas: document.getElementById('np-canvas'),
      npArtwork: document.getElementById('np-artwork'),
      npTitle: document.getElementById('np-title'),
      npArtist: document.getElementById('np-artist'),
      npFavorite: document.getElementById('np-favorite'),
      npClose: document.getElementById('np-close'),
      npPlayBtn: document.getElementById('np-play-btn'),
      npPrevBtn: document.getElementById('np-prev-btn'),
      npNextBtn: document.getElementById('np-next-btn'),
      npShuffleBtn: document.getElementById('np-shuffle-btn'),
      npRepeatBtn: document.getElementById('np-repeat-btn'),
      npMixBtn: document.getElementById('np-mix-btn'),
      npVolume: document.getElementById('np-volume'),
      npProgressBar: document.getElementById('np-progress-bar'),
      npProgressFill: document.getElementById('np-progress-fill'),
      npProgressHandle: document.getElementById('np-progress-handle'),
      npCurrentTime: document.getElementById('np-current-time'),
      npDuration: document.getElementById('np-duration'),
      modalOverlay: document.getElementById('modal-overlay'),
      modalContent: document.getElementById('modal-content'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalClose: document.getElementById('modal-close'),
      contextMenu: document.getElementById('context-menu'),
      contextMenuItems: document.querySelector('.context-menu-items'),
      toastContainer: document.getElementById('toast-container'),
      navItems: document.querySelectorAll('.nav-item'),
      settingsElements: {
        crossfadeSlider: document.getElementById('crossfade-slider'),
        crossfadeValue: document.getElementById('crossfade-value'),
        normalizeToggle: document.getElementById('normalize-toggle'),
        gaplessToggle: document.getElementById('gapless-toggle'),
        autoNextToggle: document.getElementById('auto-next-toggle'),
        repeatModeSelect: document.getElementById('repeat-mode-select'),
        shuffleToggle: document.getElementById('shuffle-toggle'),
        wallpaperSelect: document.getElementById('wallpaper-select'),
        visualizationSelect: document.getElementById('visualization-select'),
        lyricsToggle: document.getElementById('lyrics-toggle'),
        lyricsSizeSlider: document.getElementById('lyrics-size-slider'),
        lyricsSizeValue: document.getElementById('lyrics-size-value'),
        themeSelect: document.getElementById('theme-select'),
        blurSlider: document.getElementById('blur-slider'),
        blurValue: document.getElementById('blur-value'),
        showQueueToggle: document.getElementById('show-queue-toggle'),
        showTrackNumberToggle: document.getElementById('show-track-number-toggle'),
        showAlbumArtToggle: document.getElementById('show-album-art-toggle'),
        showNotificationToggle: document.getElementById('show-notification-toggle'),
        notificationTimeoutSlider: document.getElementById('notification-timeout-slider'),
        notificationTimeoutValue: document.getElementById('notification-timeout-value'),
        outputSelect: document.getElementById('output-select'),
        sampleRateSelect: document.getElementById('sample-rate-select')
      },
      quickWallpaper: document.getElementById('quick-wallpaper'),
      quickTheme: document.getElementById('quick-theme'),
      previewUrlBtn: document.getElementById('preview-url-btn'),
      saveSettingsBtn: document.getElementById('save-settings-btn'),
      restoreDefaultsBtn: document.getElementById('restore-defaults-btn')
    };
  }

  setupEventListeners() {
    // Sidebar toggle
    this.elements.sidebarToggle.addEventListener('click', () => {
      this.elements.sidebar.classList.add('open');
    });

    this.elements.sidebarClose.addEventListener('click', () => {
      this.elements.sidebar.classList.remove('open');
    });

    // Navigation
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
        this.elements.sidebar.classList.remove('open');
      });
    });

    // Import - file input
    this.elements.importFilesBtn.addEventListener('click', (e) => {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        setTimeout(() => this.elements.folderInput.click(), 50);
      } else {
        setTimeout(() => this.elements.fileInput.click(), 50);
      }
    });

    this.elements.importFolderBtn?.addEventListener('click', () => {
      setTimeout(() => this.elements.folderInput.click(), 50);
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImport(e.target.files);
        e.target.value = '';
      }
    });

    this.elements.folderInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImport(e.target.files);
        e.target.value = '';
      }
    });

    // Drop zone
    this.elements.dropZone.addEventListener('click', (e) => {
      if (e.target === this.elements.dropZone || this.elements.dropZone.contains(e.target)) {
        this.elements.fileInput.click();
      }
    });

    this.elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.dropZone.classList.add('dragover');
    });

    this.elements.dropZone.addEventListener('dragleave', () => {
      this.elements.dropZone.classList.remove('dragover');
    });

    this.elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleImport(e.dataTransfer.files);
      }
    });

    // Search
    this.elements.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.refreshCurrentView();
    });

    // Sort
    this.elements.sortBtn.addEventListener('click', () => {
      this.showSortModal();
    });

    this.elements.addToQueueBtn.addEventListener('click', () => {
      const currentQueue = this.player.getQueue();
      const allTracks = this.library.getTracks();
      const notInQueue = allTracks.filter(t => !currentQueue.some(q => q.id === t.id));
      
      if (notInQueue.length === 0) {
        this.showToast('All tracks are already in queue', 'info');
        return;
      }
      
      notInQueue.forEach(track => {
        currentQueue.push(track);
      });
      
      this.updateQueue();
      this.showToast(`Added ${notInQueue.length} tracks to queue`, 'success');
    });
    this.elements.queueToggle.addEventListener('click', () => {
      this.toggleQueuePanel();
    });

    this.elements.queueClose.addEventListener('click', () => {
      this.toggleQueuePanel(false);
    });

    // Modal close
    this.elements.modalClose.addEventListener('click', () => {
      this.hideModal();
    });

    this.elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.hideModal();
      }
    });

    // Context menu
    this.elements.contextMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (item) {
        this.handleContextMenuAction(item.dataset.action);
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.elements.contextMenu.contains(e.target)) {
        this.elements.contextMenu.classList.add('hidden');
      }
    });

    document.addEventListener('contextmenu', (e) => {
      const trackItem = e.target.closest('.track-item');
      if (trackItem) {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY, trackItem.dataset.id);
      }
    });

    // Long press for mobile context menu
    let longPressTimer;
    document.addEventListener('touchstart', (e) => {
      const trackItem = e.target.closest('.track-item');
      if (trackItem) {
        longPressTimer = setTimeout(() => {
          const touch = e.touches[0];
          this.showContextMenu(touch.clientX, touch.clientY, trackItem.dataset.id);
        }, 600);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    });

    document.addEventListener('touchmove', () => {
      clearTimeout(longPressTimer);
    });

    // Visualizer
    this.elements.visualizerToggle.addEventListener('click', () => {
      this.toggleVisualizer();
    });

    // Player controls
    this.elements.playBtn.addEventListener('click', () => {
      this.player.togglePlay();
    });

    this.elements.prevBtn.addEventListener('click', () => {
      this.player.prev();
    });

    this.elements.nextBtn.addEventListener('click', () => {
      this.player.next();
    });

    this.elements.shuffleBtn.addEventListener('click', () => {
      this.player.toggleShuffle();
    });

    this.elements.repeatBtn.addEventListener('click', () => {
      this.player.toggleRepeat();
    });

    this.elements.favoriteBtn.addEventListener('click', () => {
      this.player.toggleFavorite();
    });

    // Now Playing
    this.elements.nowPlayingBtn?.addEventListener('click', () => {
      this.showNowPlaying();
    });

    this.elements.npClose?.addEventListener('click', () => {
      this.hideNowPlaying();
    });

    this.elements.npPlayBtn?.addEventListener('click', () => {
      this.player.togglePlay();
    });

    this.elements.npPrevBtn?.addEventListener('click', () => {
      this.player.prev();
    });

    this.elements.npNextBtn?.addEventListener('click', () => {
      this.player.next();
    });

    this.elements.npShuffleBtn?.addEventListener('click', () => {
      this.player.toggleShuffle();
    });

    this.elements.npRepeatBtn?.addEventListener('click', () => {
      this.player.toggleRepeat();
    });

    this.elements.npFavorite?.addEventListener('click', () => {
      this.player.toggleFavorite();
    });

    this.elements.npMixBtn?.addEventListener('click', () => {
      this.toggleMix();
    });

    this.elements.npVolume?.addEventListener('input', (e) => {
      this.player.setVolume(parseFloat(e.target.value));
    });

    // Progress bars
    this.elements.progressBar.addEventListener('click', (e) => {
      const rect = this.elements.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = this.player.getProgress().duration;
      this.player.seek(percent * duration);
    });

    this.elements.npProgressBar?.addEventListener('click', (e) => {
      const rect = this.elements.npProgressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = this.player.getProgress().duration;
      this.player.seek(percent * duration);
    });

    // Volume
    this.elements.volumeSlider.addEventListener('input', (e) => {
      this.player.setVolume(parseFloat(e.target.value));
      if (this.elements.npVolume) {
        this.elements.npVolume.value = e.target.value;
      }
    });

    // Settings
    this.setupSettingsListeners();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.player.togglePlay();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        this.player.next();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        this.player.prev();
      }
    });

    // Touch swipe for progress bar
    let isDragging = false;
    this.elements.progressBar.addEventListener('touchstart', (e) => {
      isDragging = true;
      this.updateProgressFromTouch(e);
    }, { passive: false });

    this.elements.progressBar.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      this.updateProgressFromTouch(e);
    }, { passive: false });

    this.elements.progressBar.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  setupSettingsListeners() {
    const s = this.elements.settingsElements;

    const save = () => { if (this.app) this.app.scheduleSaveSettings(); };

    s.crossfadeSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      s.crossfadeValue.textContent = val + 's';
      if (this.app) this.app.settings.crossfade = val;
      save();
    });

    s.normalizeToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.normalize = e.target.checked;
      save();
    });

    s.gaplessToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.gapless = e.target.checked;
      save();
    });

    s.wallpaperSelect?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.wallpaper = e.target.value;
      this.updateNowPlayingBackground();
      save();
    });

    s.visualizationSelect?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.visualization = e.target.value;
      save();
    });

    s.lyricsToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.showLyrics = e.target.checked;
      save();
    });

    s.lyricsSizeSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (s.lyricsSizeValue) s.lyricsSizeValue.textContent = val + 'px';
      if (this.app) this.app.settings.lyricsFontSize = val;
      save();
    });

    s.autoNextToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.autoNext = e.target.checked;
      save();
    });

    s.repeatModeSelect?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.repeatMode = e.target.value;
      save();
    });

    s.shuffleToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.shuffleOnPlay = e.target.checked;
      save();
    });

    s.showQueueToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.showQueue = e.target.checked;
      save();
    });

    s.showTrackNumberToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.showTrackNumber = e.target.checked;
      save();
    });

    s.showAlbumArtToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.showAlbumArt = e.target.checked;
      save();
    });

    s.showNotificationToggle?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.showNotification = e.target.checked;
      save();
    });

    s.notificationTimeoutSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (s.notificationTimeoutValue) s.notificationTimeoutValue.textContent = (val / 1000) + 's';
      if (this.app) this.app.settings.notificationTimeout = val;
      save();
    });

    s.themeSelect?.addEventListener('change', (e) => {
      if (this.app) this.app.settings.theme = e.target.value;
      save();
    });

    s.blurSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      s.blurValue.textContent = val + '%';
      if (this.app) this.app.settings.blur = val;
      save();
    });

    document.querySelectorAll('.eq-slider').forEach((slider, i) => {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.app) {
          this.app.settings.eq[i] = val;
          this.app.applyEQ();
        }
        save();
      });
    });

    document.querySelectorAll('.eq-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.applyEQPreset(preset);
        save();
      });
    });

    document.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.app) this.app.settings.accentColor = btn.dataset.color;
        save();
      });
    });

    document.getElementById('quick-wallpaper')?.addEventListener('click', () => {
      const wallpapers = ['gradient', 'artwork', 'waveform', 'solid', 'particles'];
      const current = this.app?.settings.wallpaper || 'gradient';
      const next = wallpapers[(wallpapers.indexOf(current) + 1) % wallpapers.length];
      if (this.app) {
        this.app.settings.wallpaper = next;
        const select = document.getElementById('wallpaper-select');
        if (select) select.value = next;
        this.updateNowPlayingBackground();
        this.showToast(`Wallpaper: ${next}`, 'info');
        save();
      }
    });

    document.getElementById('quick-theme')?.addEventListener('click', () => {
      const themes = ['dark', 'light', 'auto'];
      const current = this.app?.settings.theme || 'dark';
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      if (this.app) {
        this.app.settings.theme = next;
        const select = document.getElementById('theme-select');
        if (select) select.value = next;
        this.showToast(`Theme: ${next}`, 'info');
        save();
      }
    });

    document.getElementById('preview-url-btn')?.addEventListener('click', () => {
      if (!this.app) return;
      const s = this.app.settings;
      const url = new URL(window.location.href);
      url.searchParams.set('preview', '1');
      url.searchParams.set('theme', s.theme);
      url.searchParams.set('wallpaper', s.wallpaper);
      url.searchParams.set('visualization', s.visualization);
      url.searchParams.set('accent', s.accentColor.replace('#', ''));
      url.searchParams.set('blur', String(s.blur));
      url.searchParams.set('lyrics', s.showLyrics ? '1' : '0');
      url.searchParams.set('lyricsSize', String(s.lyricsFontSize));
      url.searchParams.set('repeat', s.repeatMode);
      url.searchParams.set('autoNext', s.autoNext ? '1' : '0');
      url.searchParams.set('shuffle', s.shuffleOnPlay ? '1' : '0');
      url.searchParams.set('eq', s.eq.join(','));
      window.open(url.toString(), '_blank');
      this.showToast('Preview URL opened', 'success');
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
      if (this.app) {
        await this.app.saveSettings();
        this.showToast('Settings saved', 'success');
      }
    });

    document.getElementById('restore-defaults-btn')?.addEventListener('click', async () => {
      if (!this.app) return;
      this.app.settings = {
        crossfade: 0,
        normalize: false,
        gapless: true,
        autoNext: true,
        repeatMode: 'none',
        shuffleOnPlay: false,
        eq: [0, 0, 0, 0, 0],
        wallpaper: 'gradient',
        visualization: 'bars',
        showLyrics: false,
        lyricsFontSize: 18,
        theme: 'dark',
        accentColor: '#0a84ff',
        blur: 60,
        showQueue: true,
        showTrackNumber: true,
        showAlbumArt: true,
        showNotification: true,
        notificationTimeout: 5000,
        outputDevice: 'default',
        sampleRate: 44100
      };
      await this.app.saveSettings();
      this.renderSettings();
      this.app.applyEQ();
      this.updateNowPlayingBackground();
      this.showToast('Defaults restored', 'success');
    });
  }

  applyEQPreset(preset) {
    const presets = {
      flat: [0, 0, 0, 0, 0],
      bass: [6, 4, 0, -2, -4],
      treble: [-4, -2, 0, 4, 6],
      vocal: [-2, -1, 2, 3, 1],
      electronic: [4, 2, -2, 3, 4]
    };

    const values = presets[preset] || presets.flat;
    if (this.app) {
      this.app.settings.eq = values;
      this.app.applyEQ();
    }

    document.querySelectorAll('.eq-slider').forEach((slider, i) => {
      slider.value = values[i];
    });
  }

  setupPlayerListeners() {
    this.player.onTimeUpdate = (currentTime, duration) => {
      this.updateProgress(currentTime, duration);
    };

    this.player.onLoadedMetadata = (duration) => {
      this.elements.duration.textContent = this.formatTime(duration);
      if (this.elements.npDuration) {
        this.elements.npDuration.textContent = this.formatTime(duration);
      }
    };

    this.player.onPlayStateChange = (isPlaying) => {
      this.updatePlayButton(isPlaying);
    };

    this.player.onTrackChange = (track, index) => {
      this.updatePlayerBar(track);
      this.updateQueue();
      this.updateNowPlaying(track);
      this.refreshCurrentView();
    };

    this.player.onShuffleChange = (isShuffle) => {
      this.elements.shuffleBtn.classList.toggle('active', isShuffle);
      this.elements.npShuffleBtn?.classList.toggle('active', isShuffle);
    };

    this.player.onRepeatChange = (repeatMode) => {
      this.elements.repeatBtn.classList.toggle('active', repeatMode !== 'none');
      this.elements.npRepeatBtn?.classList.toggle('active', repeatMode !== 'none');
    };

    this.player.onFavoriteChange = (isFavorite) => {
      this.elements.favoriteBtn.classList.toggle('active', isFavorite);
      this.elements.npFavorite?.classList.toggle('active', isFavorite);
      this.refreshCurrentView();
    };
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const container = document.getElementById('main-content');

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      touchStartTime = Date.now();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60 && elapsed < 500) {
        if (diffX > 0 && this.player.getCurrentTrack()) {
          this.player.prev();
        } else if (diffX < 0 && this.player.getCurrentTrack()) {
          this.player.next();
        }
      }
    }, { passive: true });

    document.addEventListener('touchstart', (e) => {
      if (e.touches[0].clientX < 40 && !this.elements.sidebar.classList.contains('open')) {
        this.elements.sidebar.classList.add('open');
      }
    }, { passive: true });
  }

  async switchView(view) {
    this.currentView = view;

    this.elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    switch (view) {
      case 'library':
        this.elements.libraryView.classList.add('active');
        this.renderLibrary();
        break;
      case 'favorites':
        this.elements.favoritesView.classList.add('active');
        await this.renderFavorites();
        break;
      case 'playlists':
        this.elements.playlistsView.classList.add('active');
        await this.renderPlaylists();
        break;
      case 'settings':
        this.elements.settingsView.classList.add('active');
        this.renderSettings();
        break;
    }
  }

  async refreshCurrentView() {
    await this.library.refreshLibrary();

    switch (this.currentView) {
      case 'library':
        this.renderLibrary();
        break;
      case 'favorites':
        await this.renderFavorites();
        break;
      case 'playlists':
        await this.renderPlaylists();
        break;
    }
  }

  renderLibrary() {
    const tracks = this.library.getTracks();
    const filtered = this.searchQuery
      ? tracks.filter(t =>
          (t.title && t.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (t.artist && t.artist.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (t.album && t.album.toLowerCase().includes(this.searchQuery.toLowerCase()))
        )
      : tracks;

    const sorted = this.library.sortTracks(filtered, this.sortField, this.sortDirection);

    if (sorted.length === 0) {
      this.elements.libraryList.innerHTML = '';
      this.elements.libraryEmpty.classList.remove('hidden');
      this.elements.dropZone.style.display = this.searchQuery ? 'none' : 'block';
      return;
    }

    this.elements.libraryEmpty.classList.add('hidden');
    this.elements.dropZone.style.display = this.searchQuery ? 'none' : 'block';
    this.elements.libraryList.innerHTML = sorted.map(track => this.createTrackHTML(track)).join('');
    this.attachTrackListeners(this.elements.libraryList);
  }

  async renderFavorites() {
    const favorites = await this.library.getFavorites();

    if (favorites.length === 0) {
      this.elements.favoritesList.innerHTML = '';
      this.elements.favoritesEmpty.classList.remove('hidden');
      return;
    }

    this.elements.favoritesEmpty.classList.add('hidden');
    this.elements.favoritesList.innerHTML = favorites.map(track => this.createTrackHTML(track)).join('');
    this.attachTrackListeners(this.elements.favoritesList);
  }

  async renderPlaylists() {
    const playlists = await this.library.getPlaylists();

    if (playlists.length === 0) {
      this.elements.playlistsGrid.innerHTML = '';
      this.elements.playlistsEmpty.classList.remove('hidden');
      return;
    }

    this.elements.playlistsEmpty.classList.add('hidden');
    this.elements.playlistsGrid.innerHTML = playlists.map(playlist => `
      <div class="playlist-card" data-id="${playlist.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15V6"/>
          <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
          <path d="M12 12H3"/>
          <path d="M16 6H3"/>
          <path d="M12 18H3"/>
        </svg>
        <h3>${this.escapeHtml(playlist.name)}</h3>
        <p>${playlist.tracks?.length || 0} tracks</p>
      </div>
    `).join('');

    this.elements.playlistsGrid.querySelectorAll('.playlist-card').forEach(card => {
      card.addEventListener('click', () => {
        this.openPlaylist(card.dataset.id);
      });

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showPlaylistContextMenu(e.clientX, e.clientY, card.dataset.id);
      });
    });
  }

  renderSettings() {
    if (!this.app) return;

    const s = this.app.settings;
    const els = this.elements.settingsElements;

    if (els.crossfadeSlider) els.crossfadeSlider.value = s.crossfade;
    if (els.crossfadeValue) els.crossfadeValue.textContent = s.crossfade + 's';
    if (els.normalizeToggle) els.normalizeToggle.checked = s.normalize;
    if (els.gaplessToggle) els.gaplessToggle.checked = s.gapless;
    if (els.autoNextToggle) els.autoNextToggle.checked = s.autoNext;
    if (els.repeatModeSelect) els.repeatModeSelect.value = s.repeatMode;
    if (els.shuffleToggle) els.shuffleToggle.checked = s.shuffleOnPlay;
    if (els.wallpaperSelect) els.wallpaperSelect.value = s.wallpaper;
    if (els.visualizationSelect) els.visualizationSelect.value = s.visualization;
    if (els.lyricsToggle) els.lyricsToggle.checked = s.showLyrics;
    if (els.lyricsSizeSlider) els.lyricsSizeSlider.value = s.lyricsFontSize;
    if (els.lyricsSizeValue) els.lyricsSizeValue.textContent = s.lyricsFontSize + 'px';
    if (els.themeSelect) els.themeSelect.value = s.theme;
    if (els.blurSlider) els.blurSlider.value = s.blur;
    if (els.blurValue) els.blurValue.textContent = s.blur + '%';
    if (els.showQueueToggle) els.showQueueToggle.checked = s.showQueue;
    if (els.showTrackNumberToggle) els.showTrackNumberToggle.checked = s.showTrackNumber;
    if (els.showAlbumArtToggle) els.showAlbumArtToggle.checked = s.showAlbumArt;
    if (els.showNotificationToggle) els.showNotificationToggle.checked = s.showNotification;
    if (els.notificationTimeoutSlider) els.notificationTimeoutSlider.value = s.notificationTimeout;
    if (els.notificationTimeoutValue) els.notificationTimeoutValue.textContent = (s.notificationTimeout / 1000) + 's';

    document.querySelectorAll('.eq-slider').forEach((slider, i) => {
      slider.value = s.eq[i] || 0;
    });

    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === s.accentColor);
    });
  }

  createTrackHTML(track) {
    const isPlaying = this.player.getCurrentTrack()?.id === track.id;
    const artworkHTML = track.artwork
      ? `<img src="${track.artwork}" alt="">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>`;

    return `
      <div class="track-item ${isPlaying ? 'playing' : ''}" data-id="${track.id}" data-track="${this.escapeHtml(JSON.stringify(track))}">
        <div class="track-artwork">${artworkHTML}</div>
        <div class="track-info">
          <div class="track-title">${this.escapeHtml(track.title)}</div>
          <div class="track-artist">${this.escapeHtml(track.artist || 'Unknown Artist')}</div>
        </div>
        <div class="track-duration">${this.formatTime(track.duration)}</div>
        <div class="track-actions">
          <button class="icon-btn play-track-btn" aria-label="Play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <button class="icon-btn favorite-track-btn" aria-label="Favorite">
            <svg viewBox="0 0 24 24" fill="${track.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  attachTrackListeners(container) {
    container.querySelectorAll('.track-item').forEach(item => {
      const trackId = item.dataset.id;
      const track = this.library.getTracks().find(t => t.id === trackId);
      if (!track) return;

      item.addEventListener('click', (e) => {
        if (!e.target.closest('.icon-btn')) {
          this.playTrack(track);
        }
      });

      item.querySelector('.play-track-btn')?.addEventListener('click', () => {
        this.playTrack(track);
      });

      item.querySelector('.favorite-track-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newFavorite = !track.favorite;
        track.favorite = newFavorite;
        await this.library.db.updateTrackFavorite(track.id, newFavorite);
        await this.library.refreshLibrary();
        this.refreshCurrentView();
      });
    });
  }

  async playTrack(track) {
    const tracks = this.library.getTracks();
    this.player.playTrack(track, tracks);
    await this.library.incrementPlayCount(track.id);
  }

  updatePlayerBar(track) {
    if (!track) return;

    this.elements.playerTitle.textContent = track.title || 'Unknown';
    this.elements.playerArtist.textContent = track.artist || 'Unknown Artist';

    if (track.artwork) {
      this.elements.playerArtwork.innerHTML = `<img src="${track.artwork}" alt="">`;
    } else {
      this.elements.playerArtwork.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      `;
    }

    if (track.favorite) {
      this.elements.favoriteBtn.classList.add('active');
    } else {
      this.elements.favoriteBtn.classList.remove('active');
    }
  }

  updatePlayButton(isPlaying) {
    const playIcon = this.elements.playBtn.querySelector('.play-icon');
    const pauseIcon = this.elements.playBtn.querySelector('.pause-icon');

    if (playIcon && pauseIcon) {
      playIcon.classList.toggle('hidden', isPlaying);
      pauseIcon.classList.toggle('hidden', !isPlaying);
    }

    if (this.elements.npPlayBtn) {
      const npPlayIcon = this.elements.npPlayBtn.querySelector('.play-icon');
      const npPauseIcon = this.elements.npPlayBtn.querySelector('.pause-icon');
      if (npPlayIcon && npPauseIcon) {
        npPlayIcon.classList.toggle('hidden', isPlaying);
        npPauseIcon.classList.toggle('hidden', !isPlaying);
      }
    }
  }

  updateProgress(currentTime, duration) {
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressHandle.style.left = `${percent}%`;
    this.elements.currentTime.textContent = this.formatTime(currentTime);

    if (this.elements.npProgressFill) {
      this.elements.npProgressFill.style.width = `${percent}%`;
    }
    if (this.elements.npProgressHandle) {
      this.elements.npProgressHandle.style.left = `${percent}%`;
    }
    if (this.elements.npCurrentTime) {
      this.elements.npCurrentTime.textContent = this.formatTime(currentTime);
    }
  }

  updateQueue() {
    const queue = this.player.getQueue();
    const currentIndex = this.player.getCurrentIndex();

    if (queue.length === 0) {
      this.elements.queueList.innerHTML = '';
      this.elements.queueEmpty.classList.remove('hidden');
      this.elements.queueCount.textContent = '0';
      return;
    }

    this.elements.queueEmpty.classList.add('hidden');
    this.elements.queueCount.textContent = queue.length.toString();

    this.elements.queueList.innerHTML = queue.map((track, index) => {
      const isActive = index === currentIndex;
      return `
        <div class="queue-item ${isActive ? 'active' : ''}" data-index="${index}">
          <div class="track-artwork">
            ${track.artwork ? `<img src="${track.artwork}" alt="">` : ''}
          </div>
          <div class="track-info">
            <div class="track-title">${this.escapeHtml(track.title)}</div>
            <div class="track-artist">${this.escapeHtml(track.artist || 'Unknown Artist')}</div>
          </div>
          <div class="track-duration">${this.formatTime(track.duration)}</div>
        </div>
      `;
    }).join('');

    this.elements.queueList.querySelectorAll('.queue-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.player.audio.loadTrack(index);
        this.player.play();
      });
    });
  }

  toggleQueuePanel(show = null) {
    const isOpen = this.elements.queuePanel.classList.contains('open');
    const shouldOpen = show !== null ? show : !isOpen;
    this.elements.queuePanel.classList.toggle('open', shouldOpen);
  }

  showContextMenu(x, y, trackId) {
    this.contextTrackId = trackId;
    const track = this.library.getTracks().find(t => t.id === trackId);
    if (!track) return;

    const isFavorite = track.favorite;

    this.elements.contextMenuItems.innerHTML = `
      <button class="context-menu-item" data-action="refresh">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>Refresh</span>
      </button>
      <button class="context-menu-item" data-action="play">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Play Next</span>
      </button>
      <button class="context-menu-item" data-action="queue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Add to Queue</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" data-action="favorite">
        <svg viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
      </button>
      <button class="context-menu-item" data-action="playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15V6"/>
          <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
          <path d="M12 12H3"/>
          <path d="M16 6H3"/>
          <path d="M12 18H3"/>
        </svg>
        <span>Add to Playlist</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" data-action="info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>Track Info</span>
      </button>
      <button class="context-menu-item danger" data-action="delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>Remove from Library</span>
      </button>
    `;

    this.elements.contextMenu.style.left = Math.min(x, window.innerWidth - 240) + 'px';
    this.elements.contextMenu.style.top = Math.min(y, window.innerHeight - 300) + 'px';
    this.elements.contextMenu.classList.remove('hidden');
  }

  async handleContextMenuAction(action) {
    this.elements.contextMenu.classList.add('hidden');
    if (!this.contextTrackId) return;

    const track = this.library.getTracks().find(t => t.id === this.contextTrackId);
    if (!track) return;

    try {
      switch (action) {
        case 'refresh':
          await this.library.refreshLibrary();
          this.refreshCurrentView();
          this.showToast('Library refreshed', 'success');
          break;
        case 'play':
          const currentIndex = this.player.getCurrentIndex();
          const queue = this.player.audio.queue;
          const trackId = this.contextTrackId;
          const trackIndex = queue.findIndex(t => t.id === trackId);
          
          if (trackIndex !== -1) {
            if (trackIndex === currentIndex) {
              this.player.play();
            } else if (trackIndex > currentIndex) {
              const removed = queue.splice(trackIndex, 1)[0];
              queue.splice(currentIndex + 1, 0, removed);
              this.player.audio.currentIndex = currentIndex;
              this.updateQueue();
              this.player.audio.loadTrack(currentIndex + 1);
              this.player.audio.play();
            } else {
              const removed = queue.splice(trackIndex, 1)[0];
              queue.splice(currentIndex + 1, 0, removed);
              this.player.audio.currentIndex = currentIndex;
              this.updateQueue();
              this.player.audio.loadTrack(currentIndex + 1);
              this.player.audio.play();
            }
          } else {
            this.player.playTrack(track, queue.length > 0 ? [...queue] : this.library.getTracks());
          }
          break;
        case 'queue':
          const exists = this.player.audio.queue.some(t => t.id === track.id);
          if (!exists) {
            this.player.audio.queue.push(track);
            this.updateQueue();
            this.showToast('Added to queue', 'success');
          } else {
            this.showToast('Track already in queue', 'info');
          }
          break;
        case 'favorite':
          track.favorite = !track.favorite;
          await this.library.db.updateTrackFavorite(track.id, track.favorite);
          await this.library.refreshLibrary();
          this.refreshCurrentView();
          break;
        case 'playlist':
          await this.showAddToPlaylistModal(track);
          break;
        case 'info':
          this.showTrackInfoModal(track);
          break;
        case 'delete':
          await this.library.deleteTrack(track.id);
          await this.library.refreshLibrary();
          this.refreshCurrentView();
          this.showToast('Track removed', 'success');
          break;
      }
    } catch (error) {
      console.error('Context menu action error:', error);
      this.showToast('Action failed', 'error');
    }
  }

  async showAddToPlaylistModal(track) {
    const playlists = await this.library.getPlaylists();

    if (playlists.length === 0) {
      this.showModal('Add to Playlist', `
        <p style="color: var(--text-2); margin-bottom: 16px;">No playlists yet. Create one first.</p>
        <div class="modal-actions">
          <button id="create-new-playlist" class="btn btn-primary">Create Playlist</button>
        </div>
      `);

      document.getElementById('create-new-playlist')?.addEventListener('click', () => {
        this.hideModal();
        this.createNewPlaylist();
      });
      return;
    }

    this.showModal('Add to Playlist', `
      <div class="sort-options">
        ${playlists.map(playlist => `
          <label class="sort-option">
            <input type="radio" name="playlist" value="${playlist.id}">
            <span>${this.escapeHtml(playlist.name)}</span>
          </label>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button id="add-to-playlist" class="btn btn-primary">Add</button>
      </div>
    `);

    document.getElementById('add-to-playlist')?.addEventListener('click', () => {
      const selected = this.elements.modalBody.querySelector('input[name="playlist"]:checked');
      if (selected) {
        this.addTrackToPlaylist(selected.value, track);
      }
      this.hideModal();
    });
  }

  async addTrackToPlaylist(playlistId, track) {
    try {
      const playlist = await this.library.getPlaylist(playlistId);
      if (playlist) {
        if (!playlist.tracks) playlist.tracks = [];
        if (!playlist.tracks.find(t => t.id === track.id)) {
          playlist.tracks.push(track);
          await this.library.savePlaylist(playlist);
          this.showToast('Added to playlist', 'success');
        } else {
          this.showToast('Track already in playlist', 'info');
        }
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      this.showToast('Failed to add to playlist', 'error');
    }
  }

  async createNewPlaylist() {
    this.showModal('Create Playlist', `
      <div class="form-group">
        <label class="form-label">Playlist Name</label>
        <input type="text" id="playlist-name-input" class="setting-select" placeholder="My Playlist" style="width: 100%;">
      </div>
      <div class="modal-actions">
        <button id="cancel-create" class="btn btn-ghost">Cancel</button>
        <button id="confirm-create" class="btn btn-primary">Create</button>
      </div>
    `);

    document.getElementById('cancel-create')?.addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('confirm-create')?.addEventListener('click', async () => {
      const nameInput = document.getElementById('playlist-name-input');
      const name = nameInput?.value.trim();
      if (!name) {
        this.showToast('Please enter a name', 'error');
        return;
      }

      try {
        const playlist = {
          id: 'playlist-' + Date.now(),
          name: name,
          tracks: [],
          createdAt: Date.now()
        };
        await this.library.savePlaylist(playlist);
        this.hideModal();
        this.showToast('Playlist created', 'success');
        this.refreshCurrentView();
      } catch (error) {
        console.error('Error creating playlist:', error);
        this.showToast('Failed to create playlist', 'error');
      }
    });
  }

  showTrackInfoModal(track) {
    this.showModal('Track Info', `
      <div class="sort-options">
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Title</div>
            <div class="setting-desc">${this.escapeHtml(track.title || 'Unknown')}</div>
          </div>
        </div>
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Artist</div>
            <div class="setting-desc">${this.escapeHtml(track.artist || 'Unknown Artist')}</div>
          </div>
        </div>
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Album</div>
            <div class="setting-desc">${this.escapeHtml(track.album || 'Unknown Album')}</div>
          </div>
        </div>
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Duration</div>
            <div class="setting-desc">${this.formatTime(track.duration)}</div>
          </div>
        </div>
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Format</div>
            <div class="setting-desc">${this.escapeHtml(track.format || 'Unknown')}</div>
          </div>
        </div>
        <div class="setting-item" style="border-bottom: 1px solid var(--border);">
          <div class="setting-info">
            <div class="setting-label">Size</div>
            <div class="setting-desc">${this.formatFileSize(track.size)}</div>
          </div>
        </div>
      </div>
    `);
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return `${size.toFixed(1)} ${units[unit]}`;
  }

  showPlaylistContextMenu(x, y, playlistId) {
    this.elements.contextMenuItems.innerHTML = `
      <button class="context-menu-item" data-action="play-playlist" data-id="${playlistId}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Play</span>
      </button>
      <button class="context-menu-item danger" data-action="delete-playlist" data-id="${playlistId}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>Delete Playlist</span>
      </button>
    `;

    this.elements.contextMenu.style.left = Math.min(x, window.innerWidth - 240) + 'px';
    this.elements.contextMenu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    this.elements.contextMenu.classList.remove('hidden');
  }

  async openPlaylist(playlistId) {
    try {
      const playlist = await this.library.getPlaylist(playlistId);
      if (!playlist) return;

      this.selectedPlaylistId = playlistId;
      this.showModal(playlist.name, `
        <div class="playlist-detail">
          <div class="playlist-detail-header">
            <div class="playlist-detail-artwork">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15V6"/>
                <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                <path d="M12 12H3"/>
                <path d="M16 6H3"/>
                <path d="M12 18H3"/>
              </svg>
            </div>
            <div class="playlist-detail-info">
              <div class="playlist-detail-title">${this.escapeHtml(playlist.name)}</div>
              <div class="playlist-detail-meta">${playlist.tracks?.length || 0} tracks</div>
              <div class="playlist-detail-actions">
                <button id="playlist-play" class="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Play All
                </button>
                <button id="playlist-shuffle" class="btn btn-ghost">Shuffle</button>
              </div>
            </div>
          </div>
          <div id="playlist-tracks" class="playlist-detail-tracks">
            ${playlist.tracks?.length > 0
              ? playlist.tracks.map(track => this.createTrackHTML(track)).join('')
              : '<div class="playlist-empty"><p>No tracks in this playlist</p></div>'
            }
          </div>
        </div>
      `);

      document.getElementById('playlist-play')?.addEventListener('click', () => {
        if (playlist.tracks?.length > 0) {
          this.player.setQueue(playlist.tracks, 0);
          this.player.play();
          this.hideModal();
        }
      });

      document.getElementById('playlist-shuffle')?.addEventListener('click', () => {
        if (playlist.tracks?.length > 0) {
          this.player.audio.isShuffle = true;
          this.player.setQueue(playlist.tracks, 0);
          this.player.play();
          this.hideModal();
        }
      });

      const tracksContainer = document.getElementById('playlist-tracks');
      if (tracksContainer) {
        this.attachTrackListeners(tracksContainer);
      }
    } catch (error) {
      console.error('Error opening playlist:', error);
      this.showToast('Failed to open playlist', 'error');
    }
  }

  showNowPlaying() {
    const track = this.player.getCurrentTrack();
    if (!track) return;

    this.updateNowPlaying(track);
    this.elements.nowPlaying.classList.remove('hidden');
    this.updateNowPlayingBackground();
  }

  hideNowPlaying() {
    this.elements.nowPlaying.classList.add('hidden');
  }

  updateNowPlaying(track) {
    if (!track) return;

    this.elements.npTitle.textContent = track.title || 'Unknown';
    this.elements.npArtist.textContent = track.artist || 'Unknown Artist';

    if (track.artwork) {
      this.elements.npArtwork.innerHTML = `<img src="${track.artwork}" alt="">`;
    } else {
      this.elements.npArtwork.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      `;
    }
  }

  updateNowPlayingBackground() {
    if (!this.app) return;
    const style = this.app.settings.wallpaper || 'gradient';
    const bg = this.elements.npBackground;
    if (!bg) return;

    bg.className = 'np-background';

    switch (style) {
      case 'gradient':
        bg.style.background = 'linear-gradient(135deg, #0a84ff 0%, #bf5af2 50%, #ff375f 100%)';
        break;
      case 'artwork':
        const track = this.player.getCurrentTrack();
        if (track?.artwork) {
          bg.style.background = `url(${track.artwork}) center/cover`;
        } else {
          bg.style.background = 'linear-gradient(135deg, #0a84ff 0%, #bf5af2 100%)';
        }
        break;
      case 'waveform':
        bg.style.background = 'var(--bg)';
        break;
      case 'solid':
        bg.style.background = 'var(--bg-2)';
        break;
      case 'particles':
        bg.style.background = 'var(--bg)';
        break;
    }
  }

  toggleMix() {
    const btn = this.elements.npMixBtn;
    btn.classList.toggle('mix-active');
    const isActive = btn.classList.contains('mix-active');
    this.showToast(isActive ? 'Auto-mix enabled' : 'Auto-mix disabled', 'info');
  }

  toggleVisualizer() {
    const visualizer = this.elements.visualizer;
    const isHidden = visualizer.hasAttribute('hidden');
    visualizer.toggleAttribute('hidden', !isHidden);

    if (!isHidden) {
      this.startVisualizer();
    }
  }

  async startVisualizer() {
    // Placeholder for visualizer
  }

  async handleImport(files) {
    this.showToast('Importing files...', 'info');

    try {
      const results = await this.library.importFiles(files);

      let message = `Import complete: ${results.imported} tracks`;
      if (results.duplicates > 0) message += ` (${results.duplicates} duplicates)`;
      if (results.errors > 0) message += ` (${results.errors} errors)`;

      this.showToast(message, 'success');
      this.refreshCurrentView();
    } catch (error) {
      console.error('Import error:', error);
      this.showToast('Import failed: ' + error.message, 'error');
    }
  }

  showSortModal() {
    const fields = [
      { value: 'title', label: 'Title' },
      { value: 'artist', label: 'Artist' },
      { value: 'album', label: 'Album' },
      { value: 'addedAt', label: 'Date Added' },
      { value: 'duration', label: 'Duration' }
    ];

    this.showModal('Sort by', `
      <div class="sort-options">
        ${fields.map(field => `
          <label class="sort-option">
            <input type="radio" name="sort" value="${field.value}" ${this.sortField === field.value ? 'checked' : ''}>
            <span>${field.label}</span>
          </label>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button id="sort-apply" class="btn btn-primary">Apply</button>
      </div>
    `);

    this.elements.modalBody.querySelector('#sort-apply')?.addEventListener('click', () => {
      const selected = this.elements.modalBody.querySelector('input[name="sort"]:checked');
      if (selected) {
        this.sortField = selected.value;
        this.refreshCurrentView();
      }
      this.hideModal();
    });
  }

  showSearch() {
    this.elements.searchInput.focus();
  }

  showToast(message, type = 'info') {
    if (this._activeToast) {
      this._activeToast.remove();
      clearTimeout(this._toastTimer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.elements.toastContainer.appendChild(toast);
    this._activeToast = toast;

    this._toastTimer = setTimeout(() => {
      toast.remove();
      if (this._activeToast === toast) {
        this._activeToast = null;
      }
    }, 3000);
  }

  showModal(title, bodyHTML) {
    this.elements.modalTitle.textContent = title;
    this.elements.modalBody.innerHTML = bodyHTML;
    this.elements.modalOverlay.classList.remove('hidden');
  }

  hideModal() {
    this.elements.modalOverlay.classList.add('hidden');
  }

  updateProgressFromTouch(e) {
    const touch = e.touches[0];
    const rect = this.elements.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const duration = this.player.getProgress().duration;
    this.player.seek(percent * duration);
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// UIController ready for use
