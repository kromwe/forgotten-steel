  initiateCombat(enemy) {
    this.inCombat = true;
    this.currentEnemy = enemy;
    this.playerTurn = true;
    
    // Display combat start message
    this.terminal.print(`\n--- COMBAT STARTED ---`, 'combat-header');
    this.terminal.print(`You are fighting ${enemy.name}!`, 'combat-start');
    this.terminal.print(enemy.combatDescription || enemy.description, 'combat-description');
    
    // Check if player has no weapon but has weapons in inventory
    if (!this.gameState.equippedWeapon) {
      const availableWeapons = this.getAvailableWeapons();
      if (availableWeapons.length > 0) {
        this.promptWeaponEquip(availableWeapons);
        return; // Wait for player response before continuing
      }
    }
    
    // Continue with normal combat initialization
    this.continueCombatInit();
  }
  
  continueCombatInit() {
    // Display enemy stats
    this.terminal.print(`${this.currentEnemy.name}'s Health: ${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`, 'enemy-stats');
    
    // Display player stats
    this.terminal.print(`Your Health: ${this.gameState.health}/${this.gameState.maxHealth}`, 'player-stats');
    
    // Display available combat actions
    this.showCombatActions();
  }
  
  getAvailableWeapons() {
    return this.gameState.inventory.filter(item => item.type === 'weapon');
  }
  
  promptWeaponEquip(availableWeapons) {
    this.terminal.print("\nYou have no weapon equipped, but you have weapons in your inventory:", 'combat-warning');
    
    availableWeapons.forEach((weapon, index) => {
      this.terminal.print(`${index + 1}. ${weapon.name} (Damage: ${weapon.damage})`, 'weapon-option');
    });
    
    this.terminal.print("\nWould you like to equip a weapon before fighting?", 'combat-prompt');
    this.terminal.print("Type the number of the weapon to equip it, or 'no' to fight unarmed:", 'combat-prompt');
    
    // Set up temporary command handlers for weapon selection
    this.setupWeaponSelectionHandlers(availableWeapons);
  }
  
  setupWeaponSelectionHandlers(availableWeapons) {
    // Store original command handlers to restore later
    this.originalHandlers = this.terminal.commandHandlers.slice();
    
    // Clear existing handlers
    this.terminal.commandHandlers = [];
    
    // Add weapon selection handlers
    for (let i = 0; i < availableWeapons.length; i++) {
      const weaponIndex = i;
      this.terminal.registerCommand(`^${i + 1}$`, () => {
        const weapon = availableWeapons[weaponIndex];
        if (this.gameState.equipWeapon(weapon.id)) {
          this.terminal.print(`You equip the ${weapon.name}.`, 'combat-equip');
          this.restoreCommandHandlers();
          this.continueCombatInit();
        }
      });
    }
    
    // Add 'no' option
    this.terminal.registerCommand('^(no|n)$', () => {
      this.terminal.print("You decide to fight unarmed.", 'combat-choice');
      this.restoreCommandHandlers();
      this.continueCombatInit();
    });
  }
  
  restoreCommandHandlers() {
    // Restore original command handlers
    this.terminal.commandHandlers = this.originalHandlers;
    this.originalHandlers = null;
  }
