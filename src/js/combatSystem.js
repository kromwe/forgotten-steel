// Combat system for handling enemy encounters

export class CombatSystem {
  constructor(gameState, terminal, storyEngine) {
    this.gameState = gameState;
    this.terminal = terminal;
    this.storyEngine = storyEngine;
    
    this.inCombat = false;
    this.currentEnemy = null;
    this.playerTurn = true;
    
    this.initializeCommandHandlers();
  }

  continueCombatInit() {
    // Set up combat command handlers
    this.setupCombatHandlers();
    
    // Display current weapon status
    this.displayWeaponStatus();
    
    // Display enemy stats
    this.terminal.print(`${this.currentEnemy.name}'s Health: ${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`, "enemy-stats");
    
    // Display player stats
    this.terminal.print(`Your Health: ${this.gameState.health}/${this.gameState.maxHealth}`, "player-stats");
    
    // Display available combat actions
    this.showCombatActions();
  }

  setupCombatHandlers() {
    // Store original command handlers to restore later
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Attack command during combat
    this.terminal.registerCommand('^(attack|fight|hit|strike)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.playerAttack();
      } else if (!this.inCombat) {
        this.terminal.print("There's nothing to attack right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to attack.", 'error-message');
      }
    });
    
    // Defend command during combat
    this.terminal.registerCommand('^(defend|block|parry)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.playerDefend();
      } else if (!this.inCombat) {
        this.terminal.print("There's no need to defend right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to defend.", 'error-message');
      }
    });
    
    // Use item during combat
    this.terminal.registerCommand('^(use) (.+)$', (input) => {
      if (this.inCombat && this.playerTurn) {
        const itemName = input.match(/^use\s+(.+)$/i)[1].toLowerCase();
        this.useItemInCombat(itemName);
      } else if (!this.inCombat) {
        // Let the story engine handle normal item use
        return false; // Don't handle the command here
      } else {
        this.terminal.print("It's not your turn to use an item.", 'error-message');
      }
    });
    
    // Flee command during combat
    this.terminal.registerCommand('^(flee|escape|run)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.attemptFlee();
      } else if (!this.inCombat) {
        this.terminal.print("There's nothing to flee from right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to flee.", 'error-message');
      }
    });
    
    // Switch weapon command during combat
    this.terminal.registerCommand('^(switch|change) weapon$', () => {
      if (this.inCombat && this.playerTurn) {
        this.showWeaponSwitchOptions();
      } else if (!this.inCombat) {
        this.terminal.print("You can switch weapons outside of combat using 'equip [weapon name]'.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to switch weapons.", 'error-message');
      }
    });
  }

  displayWeaponStatus() {
    this.terminal.print("\n--- WEAPON STATUS ---", "combat-header");
    
    if (this.gameState.equippedWeapon) {
      this.terminal.print(`Currently equipped: ${this.gameState.equippedWeapon.name} (Damage: ${this.gameState.equippedWeapon.damage})`, "weapon-equipped");
    } else {
      this.terminal.print("Currently equipped: Bare hands (Damage: 5)", "weapon-equipped");
    }
    
    const availableWeapons = this.getAvailableWeapons();
    if (availableWeapons.length > 0) {
      this.terminal.print("\nWeapons in inventory:", "weapon-list-header");
      availableWeapons.forEach((weapon, index) => {
        const equippedIndicator = this.gameState.equippedWeapon && this.gameState.equippedWeapon.id === weapon.id ? " (equipped)" : "";
        this.terminal.print(`- ${weapon.name} (Damage: ${weapon.damage})${equippedIndicator}`, "weapon-option");
      });
      this.terminal.print("Type 'switch weapon' to change weapons during combat.", "combat-hint");
    }
  }

  showWeaponSwitchOptions() {
    const availableWeapons = this.getAvailableWeapons();
    
    if (availableWeapons.length === 0) {
      this.terminal.print("You have no weapons in your inventory to switch to.", "error-message");
      return;
    }
    
    this.terminal.print("\nSelect a weapon to switch to:", "combat-prompt");
    availableWeapons.forEach((weapon, index) => {
      const equippedIndicator = this.gameState.equippedWeapon && this.gameState.equippedWeapon.id === weapon.id ? " (currently equipped)" : "";
      this.terminal.print(`${index + 1}. ${weapon.name} (Damage: ${weapon.damage})${equippedIndicator}`, "weapon-option");
    });
    this.terminal.print("\nType the number of the weapon to switch to it, or 'cancel' to return to combat:", "combat-prompt");
    
    // Set up temporary command handlers for weapon switching
    this.setupWeaponSwitchHandlers(availableWeapons);
  }

  setupWeaponSwitchHandlers(availableWeapons) {
    // Store current combat handlers to restore later
    this.combatHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Add weapon switch handlers
    for (let i = 0; i < availableWeapons.length; i++) {
      const weaponIndex = i;
      this.terminal.registerCommand(`^${i + 1}$`, () => {
        const weapon = availableWeapons[weaponIndex];
        if (this.gameState.equippedWeapon && this.gameState.equippedWeapon.id === weapon.id) {
          this.terminal.print(`You already have the ${weapon.name} equipped.`, "combat-info");
        } else if (this.gameState.equipWeapon(weapon.id)) {
          this.terminal.print(`You switch to your ${weapon.name}.`, "combat-equip");
        } else {
          this.terminal.print(`Failed to equip the ${weapon.name}.`, "error-message");
        }
        this.restoreCombatHandlers();
      });
    }
    
    // Add 'cancel' option
    this.terminal.registerCommand("^(cancel|back|return)$", () => {
      this.terminal.print("You decide to keep your current weapon.", "combat-choice");
      this.restoreCombatHandlers();
    });
  }

  restoreCombatHandlers() {
    // Restore combat command handlers
    this.terminal.commandHandlers = this.combatHandlers;
    this.combatHandlers = null;
  }

  promptBranchChoice() {
    this.terminal.print(`\nYou're about to fight with your bare hands!`, 'combat-warning');
    this.terminal.print(`You notice a branch nearby that could serve as a weapon.`, 'combat-suggestion');
    this.terminal.print(`\nWhat would you like to do?`, 'combat-prompt');
    this.terminal.print(`1. Take the branch and equip it`, 'combat-option');
    this.terminal.print(`2. Fight with bare hands`, 'combat-option');
    this.terminal.print(`\nType '1' or '2' to choose:`, 'combat-prompt');
    
    this.setupBranchChoiceHandlers();
  }
  
  setupBranchChoiceHandlers() {
    // Store original handlers
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Handler for choice 1 - take branch
    this.terminal.registerCommand('^1$', () => {
      this.restoreCommandHandlers();
      this.takeBranchAndEquip();
    });
    
    // Handler for choice 2 - fight bare handed
    this.terminal.registerCommand('^2$', () => {
      this.restoreCommandHandlers();
      this.terminal.print(`You decide to fight with your bare hands. Brave, but dangerous!`, 'combat-choice');
      this.continueCombatInit();
    });
    
    // Handler for invalid input
    this.terminal.registerCommand('.*', () => {
      this.terminal.print(`Please type '1' to take the branch or '2' to fight bare handed.`, 'error-message');
    });
  }
  
  takeBranchAndEquip() {
    const currentLocation = this.storyEngine.locations[this.gameState.currentLocation];
    const branchItem = this.storyEngine.items['branch'];
    
    // Remove branch from location
    const branchIndex = currentLocation.items.indexOf('branch');
    if (branchIndex > -1) {
      currentLocation.items.splice(branchIndex, 1);
    }
    
    // Add to inventory
    this.gameState.addToInventory({
      id: 'branch',
      ...branchItem
    });
    
    // Equip the branch
    this.gameState.equipWeapon({
      id: 'branch',
      ...branchItem
    });
    
    this.terminal.print(`You quickly grab the ${branchItem.name.toLowerCase()} and ready it as a weapon!`, 'action-result');
    this.terminal.print(`${branchItem.name} equipped!`, 'equip-success');
    
    // Continue with combat
    this.continueCombatInit();
  }

  getAvailableWeapons() {
    return this.gameState.inventory.filter(item => item.type === "weapon");
  }

  promptWeaponEquip(availableWeapons) {
    this.terminal.print("\nYou have no weapon equipped, but you have weapons in your inventory:", "combat-warning");
    
    availableWeapons.forEach((weapon, index) => {
      this.terminal.print(`${index + 1}. ${weapon.name} (Damage: ${weapon.damage})`, "weapon-option");
    });
    
    this.terminal.print("\nWould you like to equip a weapon before fighting?", "combat-prompt");
    this.terminal.print("Type the number of the weapon to equip it, or 'no' to fight unarmed:", "combat-prompt");
    
    // Set up temporary command handlers for weapon selection
    this.setupWeaponSelectionHandlers(availableWeapons);
  }

  setupWeaponSelectionHandlers(availableWeapons) {
    // Store original command handlers to restore later
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Add weapon selection handlers
    for (let i = 0; i < availableWeapons.length; i++) {
      const weaponIndex = i;
      this.terminal.registerCommand(`^${i + 1}$`, () => {
        const weapon = availableWeapons[weaponIndex];
        if (this.gameState.equipWeapon(weapon.id)) {
          this.terminal.print(`You equip the ${weapon.name}.`, "combat-equip");
          this.restoreCommandHandlers();
          this.continueCombatInit();
        }
      });
    }
    
    // Add 'no' option
    this.terminal.registerCommand("^(no|n)$", () => {
      this.terminal.print("You decide to fight unarmed.", "combat-choice");
      this.restoreCommandHandlers();
      this.continueCombatInit();
    });
  }

  restoreCommandHandlers() {
    // Restore original command handlers
    this.terminal.commandHandlers = this.originalHandlers;
    this.originalHandlers = null;
  }

  initializeCommandHandlers() {
    // Only register attack commands if no story engine is present
    // The story engine handles attack commands for initiating combat
    if (!this.storyEngine) {
    // Attack command during combat
    this.terminal.registerCommand('^(attack|fight|hit|strike)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.playerAttack();
      } else if (!this.inCombat) {
        this.terminal.print("There's nothing to attack right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to attack.", 'error-message');
      }
    });
    }
    
    // Defend command during combat
    this.terminal.registerCommand('^(defend|block|parry)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.playerDefend();
      } else if (!this.inCombat) {
        this.terminal.print("There's no need to defend right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to defend.", 'error-message');
      }
    });
    
    // Use item during combat
    this.terminal.registerCommand('^(use) (.+)$', (input) => {
      if (this.inCombat && this.playerTurn) {
        const itemName = input.match(/^use\s+(.+)$/i)[1].toLowerCase();
        this.useItemInCombat(itemName);
      } else if (!this.inCombat) {
        // Let the story engine handle normal item use
        return false; // Don't handle the command here
      } else {
        this.terminal.print("It's not your turn to use an item.", 'error-message');
      }
    });
    
    // Flee command during combat
    this.terminal.registerCommand('^(flee|escape|run)$', () => {
      if (this.inCombat && this.playerTurn) {
        this.attemptFlee();
      } else if (!this.inCombat) {
        this.terminal.print("There's nothing to flee from right now.", 'error-message');
      } else {
        this.terminal.print("It's not your turn to flee.", 'error-message');
      }
    });
  }

  initiateCombat(enemy) {
    this.inCombat = true;
    this.currentEnemy = enemy;
    this.playerTurn = true;
    
    // Display combat start message
    this.terminal.print(`\n--- COMBAT STARTED ---`, "combat-header");
    this.terminal.print(`You are fighting ${enemy.name}!`, "combat-start");
    this.terminal.print(enemy.combatDescription || enemy.description, "combat-description");
    
    // Check if player has no weapon but has weapons in inventory
    if (!this.gameState.equippedWeapon) {
      const availableWeapons = this.getAvailableWeapons();
      if (availableWeapons.length > 0) {
        this.promptWeaponEquip(availableWeapons);
        return; // Wait for player response before continuing
      } else {
        // No weapons in inventory, check for branch in current location
        const currentLocation = this.storyEngine.locations[this.gameState.currentLocation];
        if (currentLocation && currentLocation.items && currentLocation.items.includes('branch')) {
          const branchItem = this.storyEngine.items['branch'];
          if (branchItem && (!branchItem.hidden || this.gameState.flags[branchItem.revealFlag])) {
            this.promptBranchChoice();
            return; // Wait for player response before continuing
          }
        }
      }
    }
    
    // Continue with normal combat initialization
    this.continueCombatInit();
  }

  getAvailableWeapons() {
    return this.gameState.inventory.filter(item => item.type === "weapon");
  }

  promptWeaponEquip(availableWeapons) {
    this.terminal.print("\nYou have no weapon equipped, but you have weapons in your inventory:", "combat-warning");
    
    availableWeapons.forEach((weapon, index) => {
      this.terminal.print(`${index + 1}. ${weapon.name} (Damage: ${weapon.damage})`, "weapon-option");
    });
    
    this.terminal.print("\nWould you like to equip a weapon before fighting?", "combat-prompt");
    this.terminal.print("Type the number of the weapon to equip it, or 'no' to fight unarmed:", "combat-prompt");
    
    // Set up temporary command handlers for weapon selection
    this.setupWeaponSelectionHandlers(availableWeapons);
  }

  setupWeaponSelectionHandlers(availableWeapons) {
    // Store original command handlers to restore later
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Add weapon selection handlers
    for (let i = 0; i < availableWeapons.length; i++) {
      const weaponIndex = i;
      this.terminal.registerCommand(`^${i + 1}$`, () => {
        const weapon = availableWeapons[weaponIndex];
        if (this.gameState.equipWeapon(weapon.id)) {
          this.terminal.print(`You equip the ${weapon.name}.`, "combat-equip");
          this.restoreCommandHandlers();
          this.continueCombatInit();
        }
      });
    }
    
    // Add 'no' option
    this.terminal.registerCommand("^(no|n)$", () => {
      this.terminal.print("You decide to fight unarmed.", "combat-choice");
      this.restoreCommandHandlers();
      this.continueCombatInit();
    });
  }

  showCombatActions() {
    this.terminal.print("\nAvailable actions:", 'combat-actions-header');
    this.terminal.print("- attack: Attack the enemy", 'combat-action');
    this.terminal.print("- defend: Take a defensive stance to reduce damage", 'combat-action');
    this.terminal.print("- use [item]: Use an item from your inventory", 'combat-action');
    this.terminal.print("- flee: Attempt to escape from combat", 'combat-action');
    this.terminal.print("- switch weapon: Change your equipped weapon", 'combat-action');
  }

  continueCombatInit() {
    // Set up combat command handlers
    this.setupCombatHandlers();
    // Display enemy stats
    this.terminal.print(`${this.currentEnemy.name}'s Health: ${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`, "enemy-stats");
    
    // Display player stats
    this.terminal.print(`Your Health: ${this.gameState.health}/${this.gameState.maxHealth}`, "player-stats");
    
    // Display available combat actions
    this.showCombatActions();
  }

  getAvailableWeapons() {
    return this.gameState.inventory.filter(item => item.type === "weapon");
  }

  promptWeaponEquip(availableWeapons) {
    this.terminal.print("\nYou have no weapon equipped, but you have weapons in your inventory:", "combat-warning");
    
    availableWeapons.forEach((weapon, index) => {
      this.terminal.print(`${index + 1}. ${weapon.name} (Damage: ${weapon.damage})`, "weapon-option");
    });
    
    this.terminal.print("\nWould you like to equip a weapon before fighting?", "combat-prompt");
    this.terminal.print("Type the number of the weapon to equip it, or 'no' to fight unarmed:", "combat-prompt");
    
    // Set up temporary command handlers for weapon selection
    this.setupWeaponSelectionHandlers(availableWeapons);
  }

  setupWeaponSelectionHandlers(availableWeapons) {
    // Store original command handlers to restore later
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Add weapon selection handlers
    for (let i = 0; i < availableWeapons.length; i++) {
      const weaponIndex = i;
      this.terminal.registerCommand(`^${i + 1}$`, () => {
        const weapon = availableWeapons[weaponIndex];
        if (this.gameState.equipWeapon(weapon.id)) {
          this.terminal.print(`You equip the ${weapon.name}.`, "combat-equip");
          this.restoreCommandHandlers();
          this.continueCombatInit();
        }
      });
    }
    
    // Add 'no' option
    this.terminal.registerCommand("^(no|n)$", () => {
      this.terminal.print("You decide to fight unarmed.", "combat-choice");
      this.restoreCommandHandlers();
      this.continueCombatInit();
    });
  }

  restoreCommandHandlers() {
    // Restore original command handlers
    this.terminal.commandHandlers = this.originalHandlers;
    this.originalHandlers = null;
  }  
  playerAttack() {
    // Check if player has no weapon and suggest branch if available
    if (!this.gameState.equippedWeapon) {
      const currentLocation = this.storyEngine.locations[this.gameState.currentLocation];
      if (currentLocation && currentLocation.items && currentLocation.items.includes('branch')) {
        const branchItem = this.storyEngine.items['branch'];
        if (branchItem && (!branchItem.hidden || this.gameState.flags[branchItem.revealFlag])) {
          this.terminal.print(`You're fighting with your bare hands! You notice a ${branchItem.name.toLowerCase()} nearby that could serve as a weapon.`, 'combat-suggestion');
          this.terminal.print(`Try 'take branch' and then 'equip branch' to improve your combat effectiveness!`, 'combat-suggestion');
        }
      }
    }
    
    // Calculate player damage
    let baseDamage = 5; // Base unarmed damage
    let damageMultiplier = 1.0;
    
    // Add weapon damage if equipped
    if (this.gameState.equippedWeapon) {
      baseDamage = this.gameState.equippedWeapon.damage || 10;
      
      // Apply weapon-specific effects
      if (this.gameState.equippedWeapon.effects) {
        for (const effect of this.gameState.equippedWeapon.effects) {
          if (effect.type === 'damageMultiplier') {
            damageMultiplier *= effect.value;
          }
        }
      }
    }
    
    // Apply random variation (80% to 120% of base damage)
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    // Calculate final damage
    const damage = Math.floor(baseDamage * damageMultiplier * randomFactor);
    
    // Apply damage to enemy
    this.currentEnemy.health -= damage;
    
    // Display attack message
    if (this.gameState.equippedWeapon) {
      this.terminal.print(`You attack ${this.currentEnemy.name} with your ${this.gameState.equippedWeapon.name}, dealing ${damage} damage!`, 'player-attack');
    } else {
      this.terminal.print(`You attack ${this.currentEnemy.name} with your bare hands, dealing ${damage} damage!`, 'player-attack');
    }
    
    // Check if enemy is defeated
    if (this.currentEnemy.health <= 0) {
      this.enemyDefeated();
      return;
    }
    
    // Switch to enemy turn
    this.playerTurn = false;
    this.terminal.print(`${this.currentEnemy.name}'s Health: ${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`, 'enemy-stats');
    
    // Enemy attacks after a short delay
    setTimeout(() => this.enemyTurn(), 1500);
  }

  playerDefend() {
    // Set defensive stance
    this.defending = true;
    
    this.terminal.print("You take a defensive stance, preparing to block the next attack.", 'player-defend');
    
    // Switch to enemy turn
    this.playerTurn = false;
    
    // Enemy attacks after a short delay
    setTimeout(() => this.enemyTurn(), 1500);
  }  
  useItemInCombat(itemName) {
    // Find the item in inventory
    for (const item of this.gameState.inventory) {
      if (item.keywords.some(keyword => itemName.includes(keyword))) {
        // Check if item can be used in combat
        if (item.usableInCombat === false) {
          this.terminal.print(`You can't use the ${item.name} during combat.`, 'error-message');
          return;
        }
        
        // Check if item has a combat use handler
        if (item.onCombatUse) {
          const result = item.onCombatUse(this.gameState, this.terminal, this.currentEnemy, this);
          
          // If the item use was successful and should consume a turn
          if (result !== false) {
            // Switch to enemy turn
            this.playerTurn = false;
            
            // Check if enemy is defeated (might happen from item use)
            if (this.currentEnemy.health <= 0) {
              this.enemyDefeated();
              return;
            }
            
            // Enemy attacks after a short delay
            setTimeout(() => this.enemyTurn(), 1500);
          }
          
          return;
        } else if (item.onUse) {
          // Fall back to regular use if no combat-specific handler
          const result = item.onUse(this.gameState, this.terminal, this.storyEngine);
          
          // If the item use was successful and should consume a turn
          if (result !== false) {
            // Switch to enemy turn
            this.playerTurn = false;
            
            // Check if enemy is defeated (might happen from item use)
            if (this.currentEnemy.health <= 0) {
              this.enemyDefeated();
              return;
            }
            
            // Enemy attacks after a short delay
            setTimeout(() => this.enemyTurn(), 1500);
          }
          
          return;
        } else {
          this.terminal.print(`You're not sure how to use the ${item.name} in combat.`, 'error-message');
          return;
        }
      }
    }
    
    this.terminal.print(`You don't have any ${itemName} to use.`, 'error-message');
  }  
  attemptFlee() {
    // Calculate flee chance based on enemy's speed vs player's
    const enemySpeed = this.currentEnemy.speed || 5;
    let playerSpeed = 5; // Base speed
    
    // Adjust for armor (heavier armor reduces speed)
    if (this.gameState.equippedArmor) {
      playerSpeed -= (this.gameState.equippedArmor.speedPenalty || 0);
    }
    
    // Calculate flee chance (50% base + adjustment for speed difference)
    const fleeChance = 0.5 + (playerSpeed - enemySpeed) * 0.05;
    
    // Attempt to flee
    if (Math.random() < fleeChance) {
      // Successful flee
      this.terminal.print("You successfully escape from combat!", 'combat-flee');
      this.endCombat();
    } else {
      // Failed flee attempt
      this.terminal.print(`You try to escape, but ${this.currentEnemy.name} blocks your path!`, 'combat-flee-fail');
      
      // Switch to enemy turn (fleeing costs a turn even if unsuccessful)
      this.playerTurn = false;
      
      // Enemy attacks after a short delay
      setTimeout(() => this.enemyTurn(), 1500);
    }
  }  
  enemyTurn() {
    // Calculate enemy damage
    let baseDamage = this.currentEnemy.damage || 5;
    
    // Apply random variation (80% to 120% of base damage)
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    // Calculate damage reduction from armor
    let damageReduction = 0;
    if (this.gameState.equippedArmor) {
      damageReduction = this.gameState.equippedArmor.protection || 0;
    }
    
    // Additional damage reduction if defending
    if (this.defending) {
      damageReduction += 5;
      this.terminal.print("Your defensive stance reduces the incoming damage!", 'combat-defend');
      this.defending = false; // Reset defending status
    }
    
    // Calculate final damage (minimum 1)
    const damage = Math.max(1, Math.floor((baseDamage * randomFactor) - damageReduction));
    
    // Apply damage to player
    this.gameState.health -= damage;
    
    // Display attack message
    this.terminal.print(`${this.currentEnemy.name} attacks you, dealing ${damage} damage!`, 'enemy-attack');
    this.terminal.print(`Your Health: ${this.gameState.health}/${this.gameState.maxHealth}`, 'player-stats');
    
    // Check if player is defeated
    if (this.gameState.health <= 0) {
      this.gameState.health = 0;
      this.playerDefeated();
      return;
    }
    
    // Switch back to player turn
    this.playerTurn = true;
    
    // Show available actions
    this.showCombatActions();
  }  
  enemyDefeated() {
    this.terminal.print(`\nYou have defeated ${this.currentEnemy.name}!`, 'combat-victory');
    
    // Check for rewards
    if (this.currentEnemy.rewards) {
      // Handle experience or stat increases
      if (this.currentEnemy.rewards.healthIncrease) {
        this.gameState.maxHealth += this.currentEnemy.rewards.healthIncrease;
        this.gameState.health += this.currentEnemy.rewards.healthIncrease;
        this.terminal.print(`Your maximum health increases by ${this.currentEnemy.rewards.healthIncrease}!`, 'reward');
      }
      
      // Handle item rewards
      if (this.currentEnemy.rewards.items) {
        for (const itemId of this.currentEnemy.rewards.items) {
          const item = this.storyEngine.items[itemId];
          if (item) {
            this.gameState.addToInventory({
              id: itemId,
              ...item
            });
            this.terminal.print(`You found: ${item.name}`, 'reward');
          }
        }
      }
    }
    
    // Create corpse that remains in the location
    this.createCorpse();
    
    // Handle post-combat events
    if (this.currentEnemy.onDefeat) {
      this.currentEnemy.onDefeat(this.gameState, this.terminal, this.storyEngine);
    }
    
    // End combat
    this.endCombat();
  }
  
  createCorpse() {
    const currentLocation = this.storyEngine.locations[this.gameState.currentLocation];
    if (!currentLocation) return;
    
    // Create corpse ID based on enemy name
    const corpseId = `${this.currentEnemy.name.toLowerCase().replace(/\s+/g, '_')}_corpse`;
    
    // Determine loot based on enemy type
    let lootItems = [];
    const enemyName = this.currentEnemy.name.toLowerCase();
    
    if (enemyName.includes('wolf')) {
      lootItems = [
        { id: 'wolf_pelt' },
        { id: 'twisted_claw' }
      ];
    } else if (enemyName.includes('bear')) {
      lootItems = [
        { id: 'bear_hide' },
        { id: 'bear_claws' }
      ];
    }
    
    // Create corpse NPC
    const corpse = {
      name: `${this.currentEnemy.name} Corpse`,
      description: `The lifeless body of the ${this.currentEnemy.name.toLowerCase()}. You might be able to find something useful on it.`,
      presenceDescription: `The corpse of the ${this.currentEnemy.name.toLowerCase()} lies here.`,
      keywords: ["corpse", "body", "remains", ...this.currentEnemy.keywords],
      talkable: false,
      attackable: false,
      hidden: false,
      isCorpse: true,
      searched: false,
      originalEnemy: this.currentEnemy.name,
      loot: lootItems,
      onExamine: (gameState, terminal, storyEngine) => {
        terminal.print(`The ${this.currentEnemy.name.toLowerCase()} lies motionless. Its body shows the wounds from your battle.`, 'examine-result');
        
        // Check if there are loot items to find
        if (corpse.loot && corpse.loot.length > 0) {
          terminal.print("You might find something useful if you search the corpse.", 'examine-result');
        } else {
          terminal.print("The corpse appears to have nothing of value.", 'examine-result');
        }
      }
    };
    
    // Add corpse to the story engine's NPCs
    this.storyEngine.npcs[corpseId] = corpse;
    
    // Add corpse to current location's NPCs
    if (!currentLocation.npcs) {
      currentLocation.npcs = [];
    }
    currentLocation.npcs.push(corpseId);
    
    // Remove the original enemy from the location
    const enemyIndex = currentLocation.npcs.indexOf(this.currentEnemy.id || this.currentEnemy.name.toLowerCase().replace(/\s+/g, '_'));
    if (enemyIndex !== -1) {
      currentLocation.npcs.splice(enemyIndex, 1);
    }
  }
  
  playerDefeated() {
    this.terminal.print("\nYou have been defeated!", 'combat-defeat');
    
    // Handle player death
    if (this.currentEnemy.onPlayerDefeat) {
      this.currentEnemy.onPlayerDefeat(this.gameState, this.terminal, this.storyEngine);
    } else {
      // Default game over handling
      this.terminal.print("\nGAME OVER", 'game-over');
      this.terminal.print("\nPress Enter to return to title screen...", 'game-over-message');
      
      // Set up special Enter key handler for returning to title
      this.setupGameOverHandler();
    }
    
    // End combat
    this.endCombat();
  }
  
  setupGameOverHandler() {
    // Disable normal terminal processing
    this.terminal.disable();
    
    // Create a special keydown handler for Enter key
    const gameOverHandler = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        
        // Remove this handler
        document.removeEventListener('keydown', gameOverHandler);
        
        // Return to title screen
        this.returnToTitleScreen();
      }
    };
    
    // Add the handler to the document
    document.addEventListener('keydown', gameOverHandler);
  }
  
  returnToTitleScreen() {
    // Re-enable terminal
    this.terminal.enable();
    
    // Clear terminal
    this.terminal.clear();
    
    // Show title screen
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) {
      titleScreen.classList.add('active');
    }
  }  
  endCombat() {
    this.inCombat = false;
    this.currentEnemy = null;
    this.playerTurn = false;
    this.defending = false;
    
    this.terminal.print("\n--- COMBAT ENDED ---", 'combat-header');
    
    // Restore original command handlers
    this.restoreCommandHandlers();
  }
}