/**
 * Aurora Music - UI Controller
 * Handles all DOM interactions, view switching, rendering, and animations
 */

class UIController {
  constructor(player, library) {
    this.player = player;
    this.library = library;
    this.currentView = 'library';
    this.sortField = 'title';
    this.sortDirection = 'asc';
    this.searchQuery = '';

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
      modalOverlay: document.getElementById('modal-overlay'),
      modalContent: document.getElementById('modal-content'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalClose: document.getElementById('modal-close'),
      toastContainer: document.getElementById('toast-container'),
      navItems: document.querySelectorAll('.nav-item')
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
          this.elements.folderInput.click();
        } else {
          this.elements.fileInput.click();
        }
      });

      this.elements.importFolderBtn = document.getElementById('import-folder-btn');
      if (this.elements.importFolderBtn) {
        this.elements.importFolderBtn.addEventListener('click', () => {
          this.elements.folderInput.click();
        });
      }

    this.elements.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImport(e.target.files);
        e.target.value = '';
      }
    });

    // Folder import via webkitdirectory
    this.elements.folderInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImport(e.target.files);
        e.target.value = '';
      }
    });

    // Drop zone - click to import
    this.elements.dropZone.addEventListener('click', (e) => {
      if (e.target === this.elements.dropZone || this.elements.dropZone.contains(e.target)) {
        this.elements.fileInput.click();
      }
    });
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

    // Queue
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

    // Progress bar
    this.elements.progressBar.addEventListener('click', (e) => {
      const rect = this.elements.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = this.player.getProgress().duration;
      this.player.seek(percent * duration);
    });

    // Volume
    this.elements.volumeSlider.addEventListener('input', (e) => {
      this.player.setVolume(parseFloat(e.target.value));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.player.togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            this.player.next();
          } else {
            this.player.seek(this.player.getProgress().current + 5);
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            this.player.prev();
          } else {
            this.player.seek(this.player.getProgress().current - 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.player.setVolume(Math.min(1, this.player.audio.audio.volume + 0.1));
          this.elements.volumeSlider.value = this.player.audio.audio.volume;
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.player.setVolume(Math.max(0, this.player.audio.audio.volume - 0.1));
          this.elements.volumeSlider.value = this.player.audio.audio.volume;
          break;
        case 'KeyM':
          this.player.setVolume(this.player.audio.audio.volume > 0 ? 0 : 0.8);
          this.elements.volumeSlider.value = this.player.audio.audio.volume;
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showSearch();
          }
          break;
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

  updateProgressFromTouch(e) {
    const touch = e.touches[0];
    const rect = this.elements.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const duration = this.player.getProgress().duration;
    this.player.seek(percent * duration);
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const container = document.getElementById('main-content');

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
  }

  handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
      if (diffX > 0) {
        // Swipe right - previous track
        if (this.player.getCurrentTrack()) {
          this.player.prev();
        }
      } else {
        // Swipe left - next track
        if (this.player.getCurrentTrack()) {
          this.player.next();
        }
      }
    }
  }

  setupPlayerListeners() {
    this.player.onTimeUpdate = (currentTime, duration) => {
      this.updateProgress(currentTime, duration);
    };

    this.player.onLoadedMetadata = (duration) => {
      this.elements.duration.textContent = this.formatTime(duration);
    };

    this.player.onPlayStateChange = (isPlaying) => {
      this.updatePlayButton(isPlaying);
    };

    this.player.onTrackChange = (track, index) => {
      this.updatePlayerBar(track);
      this.updateQueue();
    };

    this.player.onShuffleChange = (isShuffle) => {
      this.elements.shuffleBtn.classList.toggle('active', isShuffle);
    };

    this.player.onRepeatChange = (repeatMode) => {
      this.elements.repeatBtn.classList.toggle('active', repeatMode !== 'none');
      if (repeatMode === 'one') {
        this.elements.repeatBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            <text x="12" y="14" text-anchor="middle" font-size="8" fill="currentColor">1</text>
          </svg>
        `;
      } else {
        this.elements.repeatBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        `;
      }
    };

    this.player.onFavoriteChange = (isFavorite) => {
      this.elements.favoriteBtn.classList.toggle('active', isFavorite);
      if (isFavorite) {
        this.elements.favoriteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        `;
      } else {
        this.elements.favoriteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        `;
      }
    };
  }

  switchView(view) {
    this.currentView = view;

    // Update nav items
    this.elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    switch (view) {
      case 'library':
        this.elements.libraryView.classList.add('active');
        this.renderLibrary();
        break;
      case 'favorites':
        this.elements.favoritesView.classList.add('active');
        this.renderFavorites();
        break;
      case 'playlists':
        this.elements.playlistsView.classList.add('active');
        this.renderPlaylists();
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
        this.renderFavorites();
        break;
      case 'playlists':
        this.renderPlaylists();
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

  renderFavorites() {
    const favorites = this.library.getFavorites();

    if (favorites.length === 0) {
      this.elements.favoritesList.innerHTML = '';
      this.elements.favoritesEmpty.classList.remove('hidden');
      return;
    }

    this.elements.favoritesEmpty.classList.add('hidden');
    this.elements.favoritesList.innerHTML = favorites.map(track => this.createTrackHTML(track)).join('');
    this.attachTrackListeners(this.elements.favoritesList);
  }

  renderPlaylists() {
    this.elements.playlistsEmpty.classList.remove('hidden');
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
      <div class="track-item ${isPlaying ? 'playing' : ''}" data-id="${track.id}">
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

    // Update favorite button
    if (track.favorite) {
      this.elements.favoriteBtn.classList.add('active');
      this.elements.favoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      `;
    } else {
      this.elements.favoriteBtn.classList.remove('active');
      this.elements.favoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      `;
    }
  }

  updatePlayButton(isPlaying) {
    const playIcon = this.elements.playBtn.querySelector('.play-icon');
    const pauseIcon = this.elements.playBtn.querySelector('.pause-icon');

    playIcon.classList.toggle('hidden', isPlaying);
    pauseIcon.classList.toggle('hidden', !isPlaying);
  }

  updateProgress(currentTime, duration) {
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressHandle.style.left = `${percent}%`;
    this.elements.currentTime.textContent = this.formatTime(currentTime);
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

  toggleVisualizer() {
    const visualizer = this.elements.visualizer;
    const isHidden = visualizer.hasAttribute('hidden');
    visualizer.toggleAttribute('hidden', !isHidden);

    if (!isHidden && this.visualizerCanvas) {
      this.startVisualizer();
    }
  }

  async startVisualizer() {
    if (!this.visualizerCanvas) {
      this.visualizerCanvas = document.createElement('canvas');
      this.visualizerCanvas.width = this.elements.visualizer.width || window.innerWidth;
      this.visualizerCanvas.height = 200;
      this.elements.visualizer.appendChild(this.visualizerCanvas);
    }

    const canvas = this.visualizerCanvas;
    const ctx = canvas.getContext('2d');

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaElementSource(this.player.audio.audio);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.analyser.fftSize = 256;
      } catch (error) {
        console.error('Visualizer error:', error);
        return;
      }
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (this.elements.visualizer.hasAttribute('hidden')) {
        requestAnimationFrame(draw);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(124, 92, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 92, 172, 0.8)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      requestAnimationFrame(draw);
    };

    draw();
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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
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

export default UIController;
