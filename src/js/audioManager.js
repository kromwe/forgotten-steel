// Audio manager for handling game sounds and music

export class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = {};
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.soundVolume = 0.7;
    this.muted = false;
    this.initialized = false;
    
    // Audio context (will be initialized on first user interaction)
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.soundGain = null;
  }
  
  // Initialize the audio system (must be called after user interaction)
  init() {
    if (this.initialized) return;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.soundGain = this.audioContext.createGain();
      
      // Connect the gain nodes
      this.musicGain.connect(this.masterGain);
      this.soundGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.musicGain.gain.value = this.musicVolume;
      this.soundGain.gain.value = this.soundVolume;
      this.masterGain.gain.value = this.muted ? 0 : 1;
      
      this.initialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }
  
  // Load a sound effect
  loadSound(id, url) {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        if (!this.initialized) this.init();
        return this.audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        this.sounds[id] = audioBuffer;
        return audioBuffer;
      })
      .catch(error => {
        console.error(`Error loading sound ${id}:`, error);
      });
  }
  
  // Load a music track
  loadMusic(id, url) {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        if (!this.initialized) this.init();
        return this.audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        this.music[id] = audioBuffer;
        return audioBuffer;
      })
      .catch(error => {
        console.error(`Error loading music ${id}:`, error);
      });
  }
  
  // Play a sound effect
  playSound(id, options = {}) {
    if (!this.initialized) this.init();
    if (!this.sounds[id]) {
      console.warn(`Sound ${id} not loaded`);
      return null;
    }
    
    // Create a sound source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[id];
    
    // Create a gain node for this specific sound
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
    
    // Connect the source to the gain node and the gain node to the sound gain node
    source.connect(gainNode);
    gainNode.connect(this.soundGain);
    
    // Set playback options
    source.loop = options.loop || false;
    if (options.playbackRate) source.playbackRate.value = options.playbackRate;
    
    // Start playback
    const startTime = options.delay ? this.audioContext.currentTime + options.delay : this.audioContext.currentTime;
    source.start(startTime);
    
    // Return the source for later control
    return source;
  }
  
  // Play a music track
  playMusic(id, options = {}) {
    if (!this.initialized) this.init();
    if (!this.music[id]) {
      console.warn(`Music ${id} not loaded`);
      return;
    }
    
    // Stop current music if playing
    this.stopMusic();
    
    // Create a music source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.music[id];
    source.loop = options.loop !== undefined ? options.loop : true;
    
    // Create a gain node for this specific music track for fading
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.fadeIn ? 0 : 1.0;
    
    // Connect the source to the gain node and the gain node to the music gain node
    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    // Start playback
    source.start();
    
    // Fade in if requested
    if (options.fadeIn) {
      const fadeTime = options.fadeTime || 2.0;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + fadeTime);
    }
    
    // Store the current music for later control
    this.currentMusic = {
      source: source,
      gainNode: gainNode,
      id: id
    };
  }
  
  // Stop the current music track
  stopMusic(options = {}) {
    if (!this.currentMusic) return;
    
    if (options.fadeOut) {
      const fadeTime = options.fadeTime || 2.0;
      this.currentMusic.gainNode.gain.setValueAtTime(
        this.currentMusic.gainNode.gain.value, 
        this.audioContext.currentTime
      );
      this.currentMusic.gainNode.gain.linearRampToValueAtTime(
        0, 
        this.audioContext.currentTime + fadeTime
      );
      
      // Stop the source after the fade out
      setTimeout(() => {
        if (this.currentMusic && this.currentMusic.source) {
          this.currentMusic.source.stop();
          this.currentMusic = null;
        }
      }, fadeTime * 1000);
    } else {
      // Stop immediately
      this.currentMusic.source.stop();
      this.currentMusic = null;
    }
  }
  
  // Set the master volume
  setMasterVolume(volume) {
    if (!this.initialized) this.init();
    this.masterGain.gain.value = this.muted ? 0 : Math.max(0, Math.min(1, volume));
  }
  
  // Set the music volume
  setMusicVolume(volume) {
    if (!this.initialized) this.init();
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicGain.gain.value = this.musicVolume;
  }
  
  // Set the sound effects volume
  setSoundVolume(volume) {
    if (!this.initialized) this.init();
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this.soundGain.gain.value = this.soundVolume;
  }
  
  // Mute/unmute all audio
  setMuted(muted) {
    if (!this.initialized) this.init();
    this.muted = muted;
    this.masterGain.gain.value = this.muted ? 0 : 1;
  }
  
  // Toggle mute state
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
  
  // Preload common game sounds
  preloadCommonSounds() {
    const sounds = [
      { id: 'click', url: 'assets/audio/click.mp3' },
      { id: 'typing', url: 'assets/audio/typing.mp3' },
      { id: 'error', url: 'assets/audio/error.mp3' },
      { id: 'success', url: 'assets/audio/success.mp3' },
      { id: 'combat_start', url: 'assets/audio/combat_start.mp3' },
      { id: 'sword_swing', url: 'assets/audio/sword_swing.mp3' },
      { id: 'hit', url: 'assets/audio/hit.mp3' },
      { id: 'miss', url: 'assets/audio/miss.mp3' },
      { id: 'victory', url: 'assets/audio/victory.mp3' },
      { id: 'defeat', url: 'assets/audio/defeat.mp3' },
      { id: 'item_pickup', url: 'assets/audio/item_pickup.mp3' },
      { id: 'memory_flash', url: 'assets/audio/memory_flash.mp3' }
    ];
    
    const musicTracks = [
      { id: 'title', url: 'assets/audio/title_theme.mp3' },
      { id: 'village', url: 'assets/audio/village_theme.mp3' },
      { id: 'forest', url: 'assets/audio/forest_theme.mp3' },
      { id: 'combat', url: 'assets/audio/combat_theme.mp3' },
      { id: 'dungeon', url: 'assets/audio/dungeon_theme.mp3' },
      { id: 'boss', url: 'assets/audio/boss_theme.mp3' },
      { id: 'victory', url: 'assets/audio/victory_theme.mp3' }
    ];
    
    // Load all sounds
    const soundPromises = sounds.map(sound => this.loadSound(sound.id, sound.url));
    const musicPromises = musicTracks.map(track => this.loadMusic(track.id, track.url));
    
    return Promise.all([...soundPromises, ...musicPromises]);
  }
}