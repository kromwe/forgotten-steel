// Main entry point for the game
import '../css/style.css';
import { initWebGL } from './webgl.js';
import { StoryEngine } from './storyEngine.js';
import { gameData } from './gameData.js';
import { CombatSystem } from './combatSystem.js';
import { Terminal } from './terminal.js';
import { MemorySystem } from './memorySystem.js';
import { initializeMemorySystem } from './memoryData.js';
import { GameState } from './gameState.js';
import { AudioManager } from './audioManager.js';
import { imagePreloader } from './imagePreloader.js';
import { imageValidator } from './imageValidator.js';
import { imageHelpers } from './imageHelpers.js';

class Game {
  constructor() {
    // DOM elements
    this.titleScreen = null;
    this.characterCreation = null;
    this.gameScreen = null;
    this.newGameBtn = null;
    this.loadGameBtn = null;
    this.startAdventureBtn = null;
    this.characterNameInput = null;
    
    // Game state
    this.playerName = '';
    this.currentLocation = 'crossroads';
    this.inventory = [];
    this.gameProgress = {
      memoryFragments: [],
      questFlags: {},
      visitedLocations: [],
      defeatedEnemies: [],
      discoveredItems: []
    }
    this.terminalHistory = [];
    
    // WebGL renderer
    this.webglRenderer = null;
    this.terminal = null;
    this.storyEngine = null;
    this.combatSystem = null;
    this.memorySystem = null;
    this.audioManager = new AudioManager();
    this.titleMusicPlaying = false;
    this.gameState = new GameState();
    this.gameState.playerName = '';
    this.gameState.currentLocation = 'crossroads';
    this.gameState.inventory = [];
    // Health properties are managed by GameState class internally
    this.gameState.experience = 0;
    this.gameState.level = 1;
    this.gameState.equipment = {
      weapon: null,
      armor: null
    };
    this.gameState.flags = {};
    this.gameState.memoryFragments = [];
    this.gameState.memoryRecovered = 0;
    this.gameState.knownInformation = [];
    
    this.init();
  }
  
  // Check if localStorage is available and working
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  init() {
    // Initialize DOM elements
    this.titleScreen = document.getElementById('title-screen');
    this.characterCreation = document.getElementById('character-creation-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.loadGameBtn = document.getElementById('load-game-btn');
    this.startAdventureBtn = document.getElementById('start-game-btn');
    this.characterNameInput = document.getElementById('player-name');
    this.musicToggleBtn = document.getElementById('music-toggle-btn');
    
    // Game over screen elements
    this.loadGameBtnGameOver = document.getElementById('load-game-btn-gameover');
    this.newGameBtnGameOver = document.getElementById('new-game-btn-gameover');
    this.titleBtnGameOver = document.getElementById('title-btn-gameover');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show title screen
    this.showScreen('title-screen');
  }
  
  setupEventListeners() {
    if (this.newGameBtn) {
      this.newGameBtn.addEventListener('click', () => {
        this.showCharacterCreation();
      });
    }
    if (this.loadGameBtn) {
      this.loadGameBtn.addEventListener('click', () => {
        this.stopTitleMusic(); // Stop music when loading game
        this.loadGame();
      });
    }
    if (this.startAdventureBtn) {
      this.startAdventureBtn.addEventListener('click', () => this.startNewGame());
    }
    if (this.musicToggleBtn) {
      this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
    }
    
    // Game over screen event listeners
    if (this.loadGameBtnGameOver) {
      this.loadGameBtnGameOver.addEventListener('click', () => this.loadGame());
    }
    if (this.newGameBtnGameOver) {
      this.newGameBtnGameOver.addEventListener('click', () => this.showCharacterCreation());
    }
    if (this.titleBtnGameOver) {
      this.titleBtnGameOver.addEventListener('click', () => this.showScreen('title-screen'));
    }
  }
  
  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Handle music based on screen
    if (screenId === 'title-screen') {
      // Don't auto-start music - wait for user interaction
      // this.startTitleMusic();
    } else if (screenId === 'character-creation-screen') {
      // Keep music playing during character creation
    } else {
      this.stopTitleMusic();
    }
    
    // Show requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
  }
  
  showCharacterCreation() {
    this.showScreen('character-creation-screen');
  }
  
  async startTitleMusic() {
    try {
      if (!this.audioManager) {
        this.audioManager = new AudioManager();
      }
      
      // Initialize audio system (requires user interaction)
      this.audioManager.init();
      
      // Check if music is already playing
      if (this.titleMusicPlaying) {
        return;
      }
      
      // Load and play title music
      const musicPath = 'assets/audio/title_theme.m4a';
      
      await this.audioManager.loadMusic('title', musicPath);
      this.audioManager.playMusic('title', { loop: true, volume: 0.3 });
      
      this.titleMusicPlaying = true;
      console.log('Title music started successfully');
    } catch (error) {
      console.info('Title music unavailable:', error.message);
    }
  }
  
  stopTitleMusic() {
    if (this.audioManager && this.audioManager.currentMusic) {
      this.audioManager.stopMusic();
      this.titleMusicPlaying = false;
    }
  }
  
  toggleMusic() {
    if (!this.audioManager) {
      this.audioManager = new AudioManager();
      this.audioManager.init();
    }
    
    if (this.titleMusicPlaying) {
      this.stopTitleMusic();
      if (this.musicToggleBtn) {
        this.musicToggleBtn.textContent = '🎵 Enable Music';
      }
    } else {
      this.startTitleMusic();
      if (this.musicToggleBtn) {
        this.musicToggleBtn.textContent = '🔇 Disable Music';
      }
    }
  }
  
  loadGame() {
    // Check if localStorage is available
    if (!this.isLocalStorageAvailable()) {
      alert('Save/Load functionality is not available in this browser or is disabled.');
      return;
    }

    const savedGame = localStorage.getItem('forgottenSteel_saveGame');

    if (!savedGame) {
      alert('No saved game found! Start a new game to begin your adventure.');
      return;
    }

    try {
      const saveData = JSON.parse(savedGame);
      
      // Initialize GameState and load from save data using proper method
      this.gameState = new GameState();
      this.gameState.loadFromSave(saveData);
      
      // Restore main game properties
      this.playerName = saveData.playerName || '';
      this.currentLocation = saveData.currentLocation || 'crossroads';
      this.inventory = saveData.inventory || [];
      this.gameProgress = saveData.gameProgress || {
        memoryFragments: [],
        questFlags: {},
        visitedLocations: [],
        defeatedEnemies: [],
        discoveredItems: []
      };
      this.terminalHistory = saveData.terminalHistory || [];
      
      // Stop title music when loading into game
      this.stopTitleMusic();
      
      // Transition to game screen
      this.showScreen('game-screen');
      
      // Restore the game world
      this.restoreGame();
      
      // Show success message with better formatting
      const welcomeMsg = `Game loaded successfully! Welcome back, ${this.playerName}!`;
      if (this.terminal) {
        this.terminal.print(welcomeMsg, 'system-message');
      } else {
        alert(welcomeMsg);
      }
    } catch (error) {
      const errorMsg = 'Error loading saved game. The save file may be corrupted or incompatible. Please start a new game.';
      alert(errorMsg);
      console.error('Load game error:', error);
      
      // Optionally clear the corrupted save
      try {
        localStorage.removeItem('forgottenSteel_saveGame');
      } catch (e) {
        console.error('Failed to clear corrupted save:', e);
      }
    }
  }
  
  saveGame() {
    // Check if localStorage is available
    if (!this.isLocalStorageAvailable()) {
      if (this.terminal) {
        this.terminal.print('Save functionality is not available in this browser.', 'error-message');
      } else {
        alert('Save functionality is not available in this browser.');
      }
      return false;
    }

    try {
      // Use GameState's proper save method
      const success = this.gameState.saveGame();
      
      if (success) {
        // Also save additional main game data
        const savedGame = localStorage.getItem('forgottenSteel_saveGame');
        if (savedGame) {
          const saveData = JSON.parse(savedGame);
          saveData.gameProgress = this.gameProgress;
          saveData.terminalHistory = this.terminal ? this.terminal.getHistory() : this.terminalHistory;
          saveData.saveDate = new Date().toISOString();
          localStorage.setItem('forgottenSteel_saveGame', JSON.stringify(saveData));
        }
      }
      
      const saveMsg = `Game saved successfully! (${new Date().toLocaleString()})`;
      if (this.terminal) {
        this.terminal.print(saveMsg, 'system-message');
      } else {
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
          terminalOutput.innerHTML += `<p class="system-message">${saveMsg}</p>`;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        } else {
          alert('Game saved successfully!');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      const errorMsg = 'Failed to save game. This may be due to insufficient storage space or browser restrictions. Please try again.';
      if (this.terminal) {
        this.terminal.print(errorMsg, 'error-message');
      } else {
        alert(errorMsg);
      }
      return false;
    }
  }
  
  restoreGame() {
    // Initialize WebGL renderer
    const canvas = document.getElementById('webgl-canvas');
    if (canvas) {
      this.webglRenderer = initWebGL(canvas);
      this.renderCurrentScene();
    }

    // Initialize Terminal
    this.terminal = new Terminal('terminal-output', 'terminal-input');
    
    // Restore terminal history
    if (this.terminalHistory.length > 0) {
      this.terminal.setHistory(this.terminalHistory);
    }
    
    
    // Initialize Memory System
    this.memorySystem = new MemorySystem(this.gameState, this.terminal, this.webglRenderer, this.audioManager);
    initializeMemorySystem(this.memorySystem);
    
    // Initialize Story Engine
    this.storyEngine = new StoryEngine(this.gameState, this.terminal, this.webglRenderer);
    
    // Initialize Combat System with story engine reference
    this.combatSystem = new CombatSystem(this.gameState, this.terminal, this.storyEngine);
    this.combatSystem.storyEngine = this.storyEngine;
    this.storyEngine.setCombatSystem(this.combatSystem);
    this.storyEngine.setMemorySystem(this.memorySystem);
    
    // Register all game data
    Object.entries(gameData.locations).forEach(([id, data]) => {
      this.storyEngine.registerLocation(id, data);
    });
    
    Object.entries(gameData.items).forEach(([id, data]) => {
      this.storyEngine.registerItem(id, data);
    });
    
    Object.entries(gameData.npcs).forEach(([id, data]) => {
      this.storyEngine.registerNPC(id, data);
    });
    
    // Restore current location description without triggering onFirstVisit
    this.storyEngine.describeCurrentLocation();
    
    // Start the game loop for memory effects
    this.startGameLoop();
    
    this.terminal.print('Game loaded successfully. Welcome back!', 'system-message');
  }
  
  async startNewGame() {
    const characterName = this.characterNameInput?.value.trim();
    
    if (!characterName) {
      alert('Please enter a name for your character.');
      return;
    }
    
    // Store the character name for use in the game
    this.playerName = characterName;
    
    // Stop title music when starting the actual game
    this.stopTitleMusic();
    
    // Clean up existing game systems before starting new game
    this.cleanupGameSystems();
    
    // Reset game state
    this.gameState.reset();
    this.gameState.playerName = characterName;
    
    // Transition to the game screen
    this.showScreen('game-screen');
    
    // Initialize the game world with image system
    try {
      await this.initializeGame();
      console.log('🎮 Game initialized successfully with image system');
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      // Continue anyway - basic game functionality should still work
    }
  }
  
  cleanupGameSystems() {
    // Clean up existing terminal if it exists
    if (this.terminal) {
      this.terminal.cleanup();
      this.terminal = null;
    }
    
    // Clean up other systems
    this.storyEngine = null;
    this.combatSystem = null;
    this.memorySystem = null;
  }
  
  async initializeGame() {
    // Initialize WebGL renderer
    const canvas = document.getElementById('webgl-canvas');
    if (canvas) {
      this.webglRenderer = initWebGL(canvas);
      
      // Make image preloader globally available for WebGL renderer
      window.imagePreloader = imagePreloader;
      window.imageValidator = imageValidator;
      window.imageHelpers = imageHelpers;
      
      this.renderCurrentScene();
    }

    // Initialize Terminal
    this.terminal = new Terminal('terminal-output', 'terminal-input');
    
    // Validate and preload images
    await this.initializeImageSystem();
    
    // Initialize Memory System
    this.memorySystem = new MemorySystem(this.gameState, this.terminal, this.webglRenderer, null);
    initializeMemorySystem(this.memorySystem);
    
    // Initialize Story Engine
    this.storyEngine = new StoryEngine(this.gameState, this.terminal, this.webglRenderer);
    
    // Initialize Combat System with story engine reference
    this.combatSystem = new CombatSystem(this.gameState, this.terminal, this.storyEngine);
    this.combatSystem.storyEngine = this.storyEngine;
    this.storyEngine.setCombatSystem(this.combatSystem);
    this.storyEngine.setMemorySystem(this.memorySystem);
    
    // Register all game data
    Object.entries(gameData.locations).forEach(([id, data]) => {
      this.storyEngine.registerLocation(id, data);
    });
    
    Object.entries(gameData.items).forEach(([id, data]) => {
      this.storyEngine.registerItem(id, data);
    });
    
    Object.entries(gameData.npcs).forEach(([id, data]) => {
      this.storyEngine.registerNPC(id, data);
    });
    
    // Start the story
    this.storyEngine.start();
    
    // Start the game loop for memory effects
    this.startGameLoop();
  }
  
  /**
   * Initialize the image system with validation and preloading
   */
  async initializeImageSystem() {
    try {
      // Validate all location images
      const validationReport = await imageValidator.validateAllLocationImages(gameData);
      
      if (validationReport.allMissingImages.length > 0) {
        console.warn('⚠️ Some location images are missing:', validationReport.allMissingImages);
        // Still continue - the system will use fallbacks
      } else {
        console.log('✅ All location images validated successfully');
      }
      
      // Preload critical images for smooth gameplay
      const preloadResults = await imagePreloader.smartPreload(gameData, this.gameState);
      
      console.log('🖼️ Image preloading completed:', {
        currentLocation: preloadResults.currentLocation.length,
        nearbyLocations: preloadResults.nearbyLocations.length,
        eventImages: preloadResults.eventImages.length,
        priorityImages: preloadResults.priorityImages.length
      });
      
      // Log cache statistics
      const cacheStats = imagePreloader.getCacheStats();
      console.log('📊 Image cache stats:', cacheStats);
      
    } catch (error) {
      console.error('❌ Error initializing image system:', error);
      // Continue anyway - the game should still work with fallbacks
    }
  }
  
  // Command handling is now managed by StoryEngine
  
  renderCurrentScene() {
    if (this.webglRenderer && this.gameState.currentLocation) {
      // Map story locations to scene names for WebGL renderer
      const locationSceneMap = {
        'crossroads': 'crossroads',
        'forest_path_north': 'forest_path',
        'forest_path_south': 'forest_path', 
        'forest_path_east': 'forest_path',
        'forest_path_west': 'forest_path',
        'village_outskirts': 'village_outskirts',
        'village_entrance': 'village_entrance',
        'village_square': 'village_square',
        'village_smithy': 'village_smithy',
        'village_inn': 'village_inn',
        'village_elder_house': 'village_elder_house',
        'village_market': 'village_market',
        'creature_den_entrance': 'cave_entrance',
        'creature_den_interior': 'cave_interior',
        'forest_clearing': 'forest_clearing',
        'deep_forest': 'deep_forest',
        'wizard_tower_base': 'wizard_tower_exterior',
        'hillside': 'hillside'
      };
      
      const sceneName = locationSceneMap[this.gameState.currentLocation] || 'chamber';
      this.webglRenderer.render(sceneName);
    }
  }
  
  startGameLoop() {
    const gameLoop = () => {
      // Update memory system for flash effects
      if (this.memorySystem) {
        this.memorySystem.update();
      }
      
      // Continue the loop
      requestAnimationFrame(gameLoop);
    };
    
    // Start the loop
    requestAnimationFrame(gameLoop);
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});