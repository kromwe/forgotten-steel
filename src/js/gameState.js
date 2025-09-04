// Game state management

export class GameState {
  constructor() {
    this.reset();
  }
  
  reset() {
    // Player information
    this.playerName = '';
    this.playerHealth = 100;
    this.playerMaxHealth = 100;
    
    // Game progress
    this.currentLocation = 'crossroads';
    this.visitedLocations = new Set(['crossroads']);
    this.completedObjectives = new Set();
    this.knownInformation = new Set();
    this.memoryRecovered = 0; // 0-100%
    
    // Inventory
    this.inventory = [];
    this.equippedWeapon = null;
    this.equippedArmor = null;
    
    // Game flags
    this.flags = {
      metChildren: false,
      savedChildren: false,
      visitedVillage: false,
      defeatedVillageMonster: false,
      rememberedKnight: false,
      rememberedWizard: false,
      rememberedQueen: false,
      foundTower: false
    };
  }
  
  newGame(playerName) {
    this.reset();
    this.playerName = playerName;
    this.saveGame();
  }
  
  saveGame() {
    const saveData = {
      playerName: this.playerName,
      playerHealth: this.playerHealth,
      playerMaxHealth: this.playerMaxHealth,
      currentLocation: this.currentLocation,
      visitedLocations: Array.from(this.visitedLocations),
      completedObjectives: Array.from(this.completedObjectives),
      knownInformation: Array.from(this.knownInformation),
      memoryRecovered: this.memoryRecovered,
      inventory: this.inventory,
      equippedWeapon: this.equippedWeapon,
      equippedArmor: this.equippedArmor,
      flags: this.flags
    };
    
    localStorage.setItem('questOfMemorySave', JSON.stringify(saveData));
    return true;
  }
  
  loadFromSave(saveData) {
    this.playerName = saveData.playerName || '';
    this.playerHealth = saveData.playerHealth || 100;
    this.playerMaxHealth = saveData.playerMaxHealth || 100;
    this.currentLocation = saveData.currentLocation || 'crossroads';
    this.visitedLocations = new Set(saveData.visitedLocations || ['crossroads']);
    this.completedObjectives = new Set(saveData.completedObjectives || []);
    this.knownInformation = new Set(saveData.knownInformation || []);
    this.memoryRecovered = saveData.memoryRecovered || 0;
    this.inventory = saveData.inventory || [];
    this.equippedWeapon = saveData.equippedWeapon || null;
    this.equippedArmor = saveData.equippedArmor || null;
    this.flags = saveData.flags || {
      metChildren: false,
      savedChildren: false,
      visitedVillage: false,
      defeatedVillageMonster: false,
      rememberedKnight: false,
      rememberedWizard: false,
      rememberedQueen: false,
      foundTower: false
    };
    
    return true;
  }
  
  changeLocation(newLocation) {
    this.currentLocation = newLocation;
    this.visitedLocations.add(newLocation);
    this.saveGame();
    return true;
  }
  
  addToInventory(item) {
    this.inventory.push(item);
    this.saveGame();
    return true;
  }
  
  removeFromInventory(itemId) {
    const index = this.inventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const item = this.inventory[index];
      this.inventory.splice(index, 1);
      this.saveGame();
      return item;
    }
    return null;
  }
  
  equipWeapon(weaponId) {
    const weapon = this.inventory.find(item => item.id === weaponId && item.type === 'weapon');
    if (weapon) {
      this.equippedWeapon = weapon;
      this.saveGame();
      return true;
    }
    return false;
  }
  
  equipArmor(armorId) {
    const armor = this.inventory.find(item => item.id === armorId && item.type === 'armor');
    if (armor) {
      this.equippedArmor = armor;
      this.saveGame();
      return true;
    }
    return false;
  }
  
  completeObjective(objectiveId) {
    this.completedObjectives.add(objectiveId);
    
    // Update memory recovered based on objectives
    this.updateMemoryRecovered();
    
    this.saveGame();
    return true;
  }
  
  updateMemoryRecovered() {
    // Calculate memory recovered based on completed objectives and flags
    let memoryPoints = 0;
    
    // Each memory-related flag adds to the memory recovered
    if (this.flags.rememberedKnight) memoryPoints += 25;
    if (this.flags.rememberedWizard) memoryPoints += 25;
    if (this.flags.rememberedQueen) memoryPoints += 25;
    
    // Additional memory points from completed objectives
    memoryPoints += this.completedObjectives.size * 5;
    
    // Cap at 100%
    this.memoryRecovered = Math.min(100, memoryPoints);
  }
  
  setFlag(flagName, value = true) {
    if (flagName in this.flags) {
      this.flags[flagName] = value;
      
      // If this is a memory-related flag, update memory recovered
      if (flagName.startsWith('remembered')) {
        this.updateMemoryRecovered();
      }
      
      this.saveGame();
      return true;
    }
    return false;
  }
  
  getFlag(flagName) {
    return this.flags[flagName] || false;
  }
  
  takeDamage(amount) {
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.saveGame();
    return this.playerHealth > 0;
  }
  
  heal(amount) {
    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
    this.saveGame();
    return true;
  }
  
  isObjectiveCompleted(objectiveId) {
    return this.completedObjectives.has(objectiveId);
  }
  
  hasVisitedLocation(location) {
    return this.visitedLocations.has(location);
  }
  
  hasItem(itemId) {
    return this.inventory.some(item => item.id === itemId);
  }
}