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
    };
    this.terminalHistory = [];
    
    // WebGL renderer
    this.webglRenderer = null;
    this.terminal = null;
    this.storyEngine = null;
    this.combatSystem = null;
    this.memorySystem = null;
    this.gameState = new GameState();
    this.gameState.playerName = '';
    this.gameState.currentLocation = 'crossroads';
    this.gameState.inventory = [];
    this.gameState.health = 100;
    this.gameState.maxHealth = 100;
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
  
  init() {
    // Initialize DOM elements
    this.titleScreen = document.getElementById('title-screen');
    this.characterCreation = document.getElementById('character-creation-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.loadGameBtn = document.getElementById('load-game-btn');
    this.startAdventureBtn = document.getElementById('start-game-btn');
    this.characterNameInput = document.getElementById('player-name');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show title screen
    this.showScreen('title-screen');
  }
  
  setupEventListeners() {
    if (this.newGameBtn) {
      this.newGameBtn.addEventListener('click', () => this.showCharacterCreation());
    }
    if (this.loadGameBtn) {
      this.loadGameBtn.addEventListener('click', () => this.loadGame());
    }
    if (this.startAdventureBtn) {
      this.startAdventureBtn.addEventListener('click', () => this.startNewGame());
    }
  }
  
  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Show requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
  }
  
  showCharacterCreation() {
    this.showScreen('character-creation-screen');
  }
  
  loadGame() {
    const savedGame = localStorage.getItem('forgottenSteel_saveGame');
    
    if (!savedGame) {
      alert('No saved game found!');
      return;
    }
    
    try {
      const saveData = JSON.parse(savedGame);
      
      // Restore comprehensive game state
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
      
      // Update gameState object with loaded data
      this.gameState.playerName = saveData.playerName || '';
      this.gameState.currentLocation = saveData.currentLocation || 'crossroads';
      this.gameState.inventory = saveData.inventory || [];
      this.gameState.health = saveData.health || 100;
      this.gameState.maxHealth = saveData.maxHealth || 100;
      this.gameState.experience = saveData.experience || 0;
      this.gameState.level = saveData.level || 1;
      this.gameState.equipment = saveData.equipment || { weapon: null, armor: null };
      this.gameState.flags = saveData.flags || {};
      this.gameState.memoryFragments = saveData.memoryFragments || [];
      this.gameState.memoryRecovered = saveData.memoryRecovered || 0;
      this.gameState.knownInformation = saveData.knownInformation || [];
      
      // Transition to game screen
      this.showScreen('game-screen');
      
      // Restore the game world
      this.restoreGame();
      
      alert(`Game loaded! Welcome back, ${this.playerName}!`);
    } catch (error) {
      alert('Error loading saved game. The save file may be corrupted.');
      console.error('Load game error:', error);
    }
  }
  
  saveGame() {
    try {
      const saveData = {
        playerName: this.gameState.playerName,
        currentLocation: this.gameState.currentLocation,
        inventory: this.gameState.inventory,
        health: this.gameState.health,
        maxHealth: this.gameState.maxHealth,
        experience: this.gameState.experience,
        level: this.gameState.level,
        equipment: this.gameState.equipment,
        flags: this.gameState.flags,
        memoryFragments: this.gameState.memoryFragments,
        memoryRecovered: this.gameState.memoryRecovered,
        knownInformation: this.gameState.knownInformation,
        gameProgress: this.gameProgress,
        terminalHistory: this.terminal ? this.terminal.getHistory() : this.terminalHistory,
        saveDate: new Date().toISOString()
      };
      
      localStorage.setItem('forgottenSteel_saveGame', JSON.stringify(saveData));
      
      if (this.terminal) {
        this.terminal.print('Game saved successfully.', 'system-message');
      } else {
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
          terminalOutput.innerHTML += `<p>Game saved successfully!</p>`;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      if (this.terminal) {
        this.terminal.print('Failed to save game.', 'error-message');
      } else {
        alert('Error saving game. Please try again.');
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
    
    // Restore current location description without triggering onFirstVisit
    this.storyEngine.describeCurrentLocation();
    
    // Start the game loop for memory effects
    this.startGameLoop();
    
    this.terminal.print('Game loaded successfully. Welcome back!', 'system-message');
  }
  
  startNewGame() {
    const characterName = this.characterNameInput?.value.trim();
    
    if (!characterName) {
      alert('Please enter a name for your character.');
      return;
    }
    
    // Store the character name for use in the game
    this.playerName = characterName;
    
    // Transition to the game screen
    this.showScreen('game-screen');
    
    // Initialize the game world
    this.initializeGame();
  }
  
  initializeGame() {
    // Reset game state for new game
    this.currentLocation = 'crossroads';
    this.inventory = [];
    this.gameProgress = {
      memoryFragments: [],
      questFlags: {},
      visitedLocations: [],
      defeatedEnemies: [],
      discoveredItems: []
    };
    this.terminalHistory = [];

    // Create new GameState instance
    this.gameState = new GameState();
    this.gameState.playerName = this.playerName;
    this.gameState.currentLocation = 'crossroads';
    this.gameState.inventory = [];
    this.gameState.health = 100;
    this.gameState.maxHealth = 100;
    this.gameState.experience = 0;
    this.gameState.level = 1;
    this.gameState.equipment = { weapon: null, armor: null };
    this.gameState.flags = {};
    this.gameState.memoryFragments = [];
    this.gameState.memoryRecovered = 0;
    this.gameState.knownInformation = [];

    // Initialize WebGL renderer
    const canvas = document.getElementById('webgl-canvas');
    if (canvas) {
      this.webglRenderer = initWebGL(canvas);
      this.renderCurrentScene();
    }

    // Initialize Terminal
    this.terminal = new Terminal('terminal-output', 'terminal-input');
    
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