/**
 * Aurora Music - Metadata Engine
 * Handles ID3, Vorbis, MP4 metadata and artwork extraction
 */

class MetadataEngine {
  constructor() {
    this.supportedFormats = [
      'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg',
      'audio/opus', 'audio/wav', 'audio/webm', 'audio/x-m4a',
      'audio/aac', 'audio/mp4'
    ];
  }

  async parseFile(file) {
    try {
      const extension = this.getExtension(file.name);
      let metadata = {
        title: this.getFilenameWithoutExtension(file.name),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 0,
        artwork: null,
        format: extension.toUpperCase(),
        bitrate: 0,
        size: file.size
      };

      // Get duration from audio element
      const duration = await this.getDuration(file);
      metadata.duration = duration;

      // Parse metadata based on format
      if (extension === 'mp3') {
        await this.parseID3(file, metadata);
      } else if (['flac', 'ogg', 'opus'].includes(extension)) {
        await this.parseVorbis(file, metadata);
      } else if (['m4a', 'mp4', 'aac'].includes(extension)) {
        await this.parseMP4(file, metadata);
      }

      return metadata;
    } catch (error) {
      console.error('Metadata parse error:', error);
      return this.createBasicMetadata(file);
    }
  }

  getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  getFilenameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
  }

  createBasicMetadata(file) {
    return {
      title: this.getFilenameWithoutExtension(file.name),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      artwork: null,
      format: this.getExtension(file.name).toUpperCase(),
      bitrate: 0,
      size: file.size
    };
  }

  async getDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(url);
      });

      audio.addEventListener('error', () => {
        resolve(0);
        URL.revokeObjectURL(url);
      });

      audio.src = url;
    });
  }

  async parseID3(file, metadata) {
    try {
      const buffer = await this.readFileSlice(file, 0, Math.min(file.size, 1024 * 1024));
      const view = new DataView(buffer);

      // Check for ID3v2 header
      if (this.getString(view, 0, 3) === 'ID3') {
        const version = view.getUint8(3);
        const size = this.decodeSyncSafeInteger(view, 6, 10);

        // Parse frames
        let offset = 10;
        const end = Math.min(size, buffer.byteLength);

        while (offset < end - 10) {
          const frameId = this.getString(view, offset, 4);
          if (!frameId || frameId === '\x00\x00\x00\x00') break;

          const frameSize = version === 4
            ? this.decodeSyncSafeInteger(view, offset + 4, 8)
            : view.getUint32(offset + 4);

          if (frameSize <= 0 || frameSize > buffer.byteLength) break;

          if (frameId.startsWith('T') && frameId !== 'TXXX') {
            const encoding = view.getUint8(offset + 10);
            const text = this.decodeText(view, offset + 11, frameSize - 1, encoding);
            this.applyMetadata(metadata, frameId, text);
          } else if (frameId === 'APIC' || frameId === 'PIC') {
            const artwork = this.extractAPIC(view, offset, frameSize);
            if (artwork) metadata.artwork = artwork;
          }

          offset += 10 + frameSize;
        }
      }

      // Try ID3v1
      if (file.size >= 128) {
        await this.parseID3v1(file, metadata);
      }
    } catch (error) {
      console.warn('ID3 parse warning:', error);
    }
  }

  async parseID3v1(file, metadata) {
    try {
      const buffer = await this.readFileSlice(file, file.size - 128, 128);
      const view = new DataView(buffer);
      const tag = this.getString(view, 0, 3);

      if (tag === 'TAG') {
        const title = this.getString(view, 3, 30).trim();
        const artist = this.getString(view, 33, 30).trim();
        const album = this.getString(view, 63, 30).trim();

        if (title) metadata.title = title;
        if (artist) metadata.artist = artist;
        if (album) metadata.album = album;
      }
    } catch (error) {
      console.warn('ID3v1 parse warning:', error);
    }
  }

  async parseVorbis(file, metadata) {
    try {
      const buffer = await this.readFileSlice(file, 0, Math.min(file.size, 1024 * 1024));
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);

      // Parse Vorbis comments
      const commentPattern = /([A-Z]+)=([^\r\n]*)/g;
      let match;

      while ((match = commentPattern.exec(text)) !== null) {
        const [, key, value] = match;
        this.applyVorbisMetadata(metadata, key, value);
      }

      // Extract FLAC metadata blocks if present
      if (file.name.toLowerCase().endsWith('.flac')) {
        await this.parseFLACBlocks(file, metadata);
      }
    } catch (error) {
      console.warn('Vorbis parse warning:', error);
    }
  }

  async parseFLACBlocks(file, metadata) {
    try {
      const buffer = await this.readFileSlice(file, 4, Math.min(file.size, 1024 * 1024));
      const view = new DataView(buffer);
      let offset = 0;

      while (offset < buffer.byteLength - 4) {
        const blockType = view.getUint8(offset);
        const size = (view.getUint8(offset + 1) << 16) |
                     (view.getUint8(offset + 2) << 8) |
                     view.getUint8(offset + 3);
        const isLast = (blockType & 0x80) !== 0;
        const type = blockType & 0x7F;

        if (type === 6) { // PICTURE block
          const picture = this.extractFLACPicture(view, offset + 4, size);
          if (picture) metadata.artwork = picture;
        }

        offset += 4 + size;
        if (isLast) break;
      }
    } catch (error) {
      console.warn('FLAC block parse warning:', error);
    }
  }

  async parseMP4(file, metadata) {
    try {
      const buffer = await this.readFileSlice(file, 0, Math.min(file.size, 1024 * 1024));
      const view = new DataView(buffer);

      // Look for metadata atoms
      let offset = 4; // Skip ftyp atom
      while (offset < buffer.byteLength - 8) {
        const atomSize = (view.getUint8(offset) << 24) |
                         (view.getUint8(offset + 1) << 16) |
                         (view.getUint8(offset + 2) << 8) |
                         view.getUint8(offset + 3);
        const atomType = this.getString(view, offset + 4, 4);

        if (atomType === 'moov' || atomType === 'udta') {
          this.parseMP4Atoms(view, offset + 8, atomSize - 8, metadata);
        }

        offset += atomSize;
        if (atomSize === 0) break;
      }
    } catch (error) {
      console.warn('MP4 parse warning:', error);
    }
  }

  parseMP4Atoms(view, offset, size, metadata) {
    const end = offset + size;
    while (offset < end - 8) {
      const atomSize = (view.getUint8(offset) << 24) |
                       (view.getUint8(offset + 1) << 16) |
                       (view.getUint8(offset + 2) << 8) |
                       view.getUint8(offset + 3);
      const atomType = this.getString(view, offset + 4, 4);

      if (atomType === 'meta' && offset + 12 < end) {
        // iTunes metadata
        this.parseMP4Meta(view, offset + 12, atomSize - 12, metadata);
      }

      offset += atomSize;
      if (atomSize === 0) break;
    }
  }

  parseMP4Meta(view, offset, size, metadata) {
    // Simplified MP4 metadata parsing
    const decoder = new TextDecoder('utf-8');
    const data = new Uint8Array(view.buffer, offset, size);

    // Look for common tags
    const tags = {
      '©nam': 'title',
      '©ART': 'artist',
      '©alb': 'album'
    };

    for (const [tag, field] of Object.entries(tags)) {
      const tagBytes = new TextEncoder().encode(tag);
      const index = this.findBytes(data, tagBytes);
      if (index !== -1 && index + 4 < data.length) {
        const valueStart = index + 4;
        const nullIndex = this.findBytes(data, [0], valueStart);
        if (nullIndex !== -1) {
          const value = decoder.decode(data.slice(valueStart, nullIndex));
          if (value) metadata[field] = value;
        }
      }
    }
  }

  applyMetadata(metadata, frameId, value) {
    const mappings = {
      'TIT2': 'title',
      'TPE1': 'artist',
      'TALB': 'album',
      'TRCK': 'track',
      'TYER': 'year',
      'TDRC': 'year',
      'TCON': 'genre',
      'COMM': 'comments'
    };

    const field = mappings[frameId];
    if (field && value) {
      metadata[field] = value;
    }
  }

  applyVorbisMetadata(metadata, key, value) {
    const mappings = {
      'TITLE': 'title',
      'ARTIST': 'artist',
      'ALBUM': 'album',
      'TRACKNUMBER': 'track',
      'DATE': 'year',
      'YEAR': 'year',
      'GENRE': 'genre',
      'COMMENT': 'comments'
    };

    const field = mappings[key.toUpperCase()];
    if (field && value) {
      metadata[field] = value;
    }
  }

  extractAPIC(view, offset, size) {
    try {
      const encoding = view.getUint8(offset);
      let pos = offset + 1;

      // Skip MIME type
      while (pos < offset + size && view.getUint8(pos) !== 0) pos++;
      pos++;

      // Skip picture type
      pos++;

      // Skip description
      while (pos < offset + size && view.getUint8(pos) !== 0) pos++;
      pos++;

      // Get image data
      const imageSize = size - (pos - offset);
      if (imageSize > 0 && imageSize < 10 * 1024 * 1024) {
        const imageData = new Uint8Array(view.buffer, pos, imageSize);
        const blob = new Blob([imageData], { type: 'image/jpeg' });
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn('APIC extraction warning:', error);
    }
    return null;
  }

  extractFLACPicture(view, offset, size) {
    try {
      const type = (view.getUint8(offset) << 24) |
                   (view.getUint8(offset + 1) << 16) |
                   (view.getUint8(offset + 2) << 8) |
                   view.getUint8(offset + 3);

      const mimeLength = (view.getUint8(offset + 4) << 24) |
                         (view.getUint8(offset + 5) << 16) |
                         (view.getUint8(offset + 6) << 8) |
                         view.getUint8(offset + 7);

      const imageStart = offset + 8 + mimeLength + 4; // Skip description length
      const imageSize = size - (imageStart - offset);

      if (imageSize > 0 && imageSize < 10 * 1024 * 1024) {
        const imageData = new Uint8Array(view.buffer, imageStart, imageSize);
        const blob = new Blob([imageData], { type: 'image/jpeg' });
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn('FLAC picture extraction warning:', error);
    }
    return null;
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

  getString(view, offset, length) {
    const bytes = new Uint8Array(view.buffer, offset, length);
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== 0) {
        result += String.fromCharCode(bytes[i]);
      }
    }
    return result;
  }

  decodeSyncSafeInteger(view, offset, length) {
    let value = 0;
    for (let i = 0; i < length; i++) {
      value = (value << 7) | (view.getUint8(offset + i) & 0x7F);
    }
    return value;
  }

  decodeText(view, offset, length, encoding) {
    const decoder = encoding === 1 ? new TextDecoder('utf-16') : new TextDecoder('utf-8');
    const bytes = new Uint8Array(view.buffer, offset, length);
    const text = decoder.decode(bytes);
    // Remove null terminators
    return text.replace(/\0/g, '').trim();
  }

  findBytes(data, pattern, start = 0) {
    for (let i = start; i < data.length - pattern.length; i++) {
      let found = true;
      for (let j = 0; j < pattern.length; j++) {
        if (data[i + j] !== pattern[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }
}

export default MetadataEngine;
