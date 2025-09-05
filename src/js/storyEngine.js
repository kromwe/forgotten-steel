// Story engine for managing game narrative and locations

export class StoryEngine {
  constructor(gameState, terminal, webglRenderer) {
    this.gameState = gameState;
    this.terminal = terminal;
    this.webglRenderer = webglRenderer;
    
    this.locations = {};
    this.items = {};
    this.npcs = {};
    this.combatSystem = null;
    this.memorySystem = null;
    
    // Ambient creature system
    this.ambientCreatures = this.initializeAmbientCreatures();
    
    this.initializeCommandHandlers();
  }
  
  initializeAmbientCreatures() {
    return [
      "A bird flies out of a nearby tree. It seems like it stares at you before it flies out of sight.",
      "A small shadow figure darts across the path in front of you. You can't identify what it was but it leaves you with an uneasy feeling.",
      "A rustling in the bushes catches your attention, but when you look, nothing is there.",
      "A distant howl echoes through the area, sending a chill down your spine.",
      "Something scurries through the underbrush nearby, too quick to see clearly.",
      "A pair of glowing eyes watches you from the darkness before disappearing.",
      "The sound of wings flapping overhead draws your gaze upward, but you see nothing.",
      "A twig snaps somewhere behind you, but when you turn around, the area is empty.",
      "A strange chittering sound comes from somewhere nearby, then falls silent.",
      "You catch a glimpse of movement in your peripheral vision, but it vanishes when you look directly.",
      "A low growl rumbles from somewhere in the distance, barely audible.",
      "Something brushes against your leg briefly before darting away into the shadows.",
      "The faint sound of padded footsteps follows you for a moment, then stops.",
      "A small creature skitters across your path, disappearing into a crevice before you can identify it.",
      "You hear the soft hoot of an owl, though you can't see it anywhere.",
      "A gentle breeze carries an unfamiliar scent, wild and untamed.",
      "The grass rustles as if something small is moving through it, just out of sight.",
      "A shadow passes overhead, but when you look up, the sky appears empty.",
      "You hear the distant splash of something entering water, though no water source is visible.",
      "A soft whimpering sound drifts from somewhere nearby, then fades away."
    ];
  }

  initializeCommandHandlers() {
    // Movement commands
    this.terminal.registerCommand('^(go|move|walk|run|travel) (to )?(north|south|east|west|n|s|e|w)', (input) => {
      const direction = input.match(/(north|south|east|west|n|s|e|w)/i)[0].toLowerCase();
      this.handleMovement(direction);
    });

    // Direct direction commands (without "go")
    this.terminal.registerCommand("^(north|south|east|west|n|s|e|w)$", (input) => {
      const direction = input.trim().toLowerCase();
      this.handleMovement(direction);
    });
    
    // Look command
    this.terminal.registerCommand('^(look|examine|inspect|l)( around)?$', () => {
      this.describeCurrentLocation();
    });
    
    // Look at specific object
    this.terminal.registerCommand('^(look|examine|inspect|l) (at )?(.+)$', (input) => {
      const target = input.match(/^(?:look|examine|inspect|l)(?: at)?\s+(.+)$/i)[1].toLowerCase();
      this.examineObject(target);
    });
    
    // Take/get item
    this.terminal.registerCommand('^(take|get|grab|pick up) (.+)$', (input) => {
      const itemName = input.match(/^(?:take|get|grab|pick up)\s+(.+)$/i)[1].toLowerCase();
      this.takeItem(itemName);
    });
    
    // Drop item
    this.terminal.registerCommand('^(drop|discard|throw away) (.+)$', (input) => {
      const itemName = input.match(/^(?:drop|discard|throw away)\s+(.+)$/i)[1].toLowerCase();
      this.dropItem(itemName);
    });
    
    // Use item
    this.terminal.registerCommand('^(use|activate|apply) (.+)$', (input) => {
      const itemName = input.match(/^(?:use|activate|apply)\s+(.+)$/i)[1].toLowerCase();
      this.useItem(itemName);
    });
    
    // Equip item
    this.terminal.registerCommand('^(equip|wear|wield) (.+)$', (input) => {
      const itemName = input.match(/^(?:equip|wear|wield)\s+(.+)$/i)[1].toLowerCase();
      this.equipItem(itemName);
    });
    
    // Inventory
    this.terminal.registerCommand('^(inventory|inv|i)$', () => {
      this.showInventory();
    });
    
    // Talk to NPC
    this.terminal.registerCommand('^(talk|speak|chat) (to|with) (.+)$', (input) => {
      const npcName = input.match(/^(?:talk|speak|chat) (?:to|with) (.+)$/i)[1].toLowerCase();
      this.talkToNPC(npcName);
    });
    
    // Attack
    this.terminal.registerCommand('^(attack|fight|hit) (.+)$', (input) => {
      const targetName = input.match(/^(?:attack|fight|hit) (.+)$/i)[1].toLowerCase();
      this.attackTarget(targetName);
    });
    
    // Help
    this.terminal.registerCommand('^(help|\\?)$', () => {
      this.showHelp();
    });
    
    // Status
    this.terminal.registerCommand('^(status|stats|health|condition)$', () => {
      this.showStatus();
    });
    
    // Save
    this.terminal.registerCommand('^(save)$', () => {
      if (this.gameState.saveGame()) {
        this.terminal.print("Game saved successfully.", 'system-message');
      } else {
        this.terminal.print("Failed to save game.", 'error-message');
      }
    });
    
    // Search command for corpses
    this.terminal.registerCommand('^(search|loot) (.+)$', (input) => {
      const targetName = input.match(/^(?:search|loot)\s+(.+)$/i)[1].toLowerCase();
      this.searchTarget(targetName);
    });
  }
  
  registerLocation(id, data) {
    this.locations[id] = data;
  }
  
  registerItem(id, data) {
    this.items[id] = data;
  }
  
  registerNPC(id, data) {
    this.npcs[id] = data;
  }
  
  setCombatSystem(combatSystem) {
    this.combatSystem = combatSystem;
  }
  
  setMemorySystem(memorySystem) {
    this.memorySystem = memorySystem;
  }
  
  start() {
    // Display the introduction
    this.showIntroduction();
    
    // Describe the starting location
    this.describeCurrentLocation();
  }
  
  showIntroduction() {
    this.terminal.print("You awaken on a dirt road, your head throbbing. Your clothes are torn and stained with blood and dirt. You have no memory of who you are or how you got here.", 'story-text');
    this.terminal.print("As you struggle to your feet, you find yourself at a crossroads. The world around you seems both familiar and strange.", 'story-text');
    this.terminal.print("\nType 'help' for a list of commands.", 'system-message');
  }
  
  describeCurrentLocation() {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location) {
      this.terminal.print(`Error: Location '${locationId}' not found.`, 'error-message');
      return;
    }
    
    // Update corpse decay states before describing location
    this.updateCorpseDecay(locationId);
    
    // Update WebGL scene
    this.webglRenderer.setScene(location.scene);
    
    // Print location name and description
    this.terminal.print(`\n${location.name}`, 'location-name');
    this.terminal.print(location.description, 'location-description');
    
    // List available exits
    if (location.exits && Object.keys(location.exits).length > 0) {
      const exitList = Object.keys(location.exits).map(dir => dir).join(', ');
      this.terminal.print(`Exits: ${exitList}`, 'exits-list');
    } else {
      this.terminal.print("There are no obvious exits.", 'exits-list');
    }
    
    // List visible items
    if (location.items && location.items.length > 0) {
      const visibleItems = location.items.filter(itemId => {
        const item = this.items[itemId];
        return item && (!item.hidden || this.gameState.flags[item.revealFlag]);
      });
      
      if (visibleItems.length > 0) {
        const itemNames = visibleItems.map(itemId => this.items[itemId].name);
        this.terminal.print(`You can see: ${itemNames.join(', ')}.`, 'items-list');
      }
    }
    
    // List NPCs
    if (location.npcs && location.npcs.length > 0) {
      const visibleNPCs = location.npcs.filter(npcId => {
        const npc = this.npcs[npcId];
        return npc && (!npc.hidden || this.gameState.flags[npc.revealFlag]);
      });
      
      if (visibleNPCs.length > 0) {
        visibleNPCs.forEach(npcId => {
          const npc = this.npcs[npcId];
          this.terminal.print(npc.presenceDescription, 'npc-description');
        });
      }
    }
    
    // Check for first-time visit events
    if (!this.gameState.hasVisitedLocation(locationId) || location.alwaysTriggerEvent) {
      if (location.onFirstVisit) {
        location.onFirstVisit(this.gameState, this.terminal);
      }
    }
  }
  
  handleMovement(direction) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location) {
      this.terminal.print(`Error: Current location '${locationId}' not found.`, 'error-message');
      return;
    }
    
    // Normalize direction
    const dirMap = { n: 'north', s: 'south', e: 'east', w: 'west' };
    const normalizedDirection = dirMap[direction] || direction;
    
    // Check if exit exists
    if (!location.exits || !location.exits[normalizedDirection]) {
      this.terminal.print(`You cannot go ${normalizedDirection} from here.`, 'error-message');
      return;
    }
    
    const exit = location.exits[normalizedDirection];
    let targetLocationId;
    
    // Handle conditional exits
    if (typeof exit === 'object' && exit.condition) {
      if (!exit.condition(this.gameState, this)) {
        // Check if wolf death story should be triggered
        if (this.gameState.getFlag('triggerWolfDeathStory')) {
          this.triggerWolfDeathStory();
          return;
        }
        this.terminal.print(exit.blockedMessage || `You cannot go ${normalizedDirection} from here.`, 'error-message');
        return;
      }
      targetLocationId = exit.locationId;
    } else {
      targetLocationId = exit;
    }
    
    // Change location
    this.gameState.changeLocation(targetLocationId);
    this.terminal.print(`You go ${normalizedDirection}.`, 'action-result');
    
    // Check for ambient creature encounter
    this.checkAmbientCreatureEncounter(targetLocationId);
    
    // Describe new location
    this.describeCurrentLocation();
  }
  
  examineObject(target) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location) {
      this.terminal.print(`Error: Location '${locationId}' not found.`, 'error-message');
      return;
    }
    
    // Check if it's a feature of the location
    if (location.features) {
      for (const feature of location.features) {
        if (feature.keywords.some(keyword => target.includes(keyword))) {
          this.terminal.print(feature.description, 'examine-result');
          
          // Check for memory triggers
          if (this.memorySystem) {
            this.memorySystem.checkTriggers('examine', target, { feature: feature });
          }
          
          // Check for hidden items revealed by examining
          if (feature.revealsItem) {
            const itemId = feature.revealsItem;
            const item = this.items[itemId];
            
            if (item && item.hidden) {
              item.hidden = false;
              this.terminal.print(`You found ${item.name}!`, 'item-found');
              
              // If the item should be automatically added to inventory
              if (feature.autoTake) {
                this.gameState.addToInventory({
                  id: itemId,
                  ...item
                });
                this.terminal.print(`You take the ${item.name}.`, 'action-result');
              }
            }
          }
          
          return;
        }
      }
    }
    
    // Check if it's a visible item in the location
    if (location.items) {
      for (const itemId of location.items) {
        const item = this.items[itemId];
        if (item && (!item.hidden || this.gameState.flags[item.revealFlag])) {
          if (item.keywords.some(keyword => target.includes(keyword))) {
            this.terminal.print(item.description, 'examine-result');
            return;
          }
        }
      }
    }
    
    // Check if it's an NPC in the location
    if (location.npcs) {
      for (const npcId of location.npcs) {
        const npc = this.npcs[npcId];
        if (npc && (!npc.hidden || this.gameState.flags[npc.revealFlag])) {
          if (npc.keywords.some(keyword => target.includes(keyword))) {
            this.terminal.print(npc.description, 'examine-result');
            return;
          }
        }
      }
    }
    
    // Check if it's an item in the inventory
    for (const item of this.gameState.inventory) {
      if (item.keywords.some(keyword => target.includes(keyword))) {
        this.terminal.print(item.description, 'examine-result');
        return;
      }
    }
    
    this.terminal.print(`You don't see anything special about the ${target}.`, 'error-message');
  }
  
  takeItem(itemName) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location || !location.items) {
      this.terminal.print(`There's nothing here to take.`, 'error-message');
      return;
    }
    
    // Find the item in the current location
    for (let i = 0; i < location.items.length; i++) {
      const itemId = location.items[i];
      const item = this.items[itemId];
      
      if (item && (!item.hidden || this.gameState.flags[item.revealFlag])) {
        if (item.keywords.some(keyword => itemName.includes(keyword))) {
          // Check if item can be taken
          if (item.takeable === false) {
            this.terminal.print(item.cantTakeMessage || `You can't take the ${item.name}.`, 'error-message');
            return;
          }
          
          // Remove from location
          location.items.splice(i, 1);
          
          // Add to inventory
          this.gameState.addToInventory({
            id: itemId,
            ...item
          });
          
          this.terminal.print(`You take the ${item.name}.`, 'action-result');
          
          // Check for memory triggers
          if (this.memorySystem) {
            this.memorySystem.checkTriggers('take', itemId, { item: item });
          }
          
          // Check for special events when taking the item
          if (item.onTake) {
            item.onTake(this.gameState, this.terminal);
          }
          
          return;
        }
      }
    }
    
    this.terminal.print(`You don't see any ${itemName} here.`, 'error-message');
  }
  
  dropItem(itemName) {
    // Find the item in inventory
    for (let i = 0; i < this.gameState.inventory.length; i++) {
      const item = this.gameState.inventory[i];
      
      if (item.keywords.some(keyword => itemName.includes(keyword))) {
        // Check if item can be dropped
        if (item.droppable === false) {
          this.terminal.print(item.cantDropMessage || `You can't drop the ${item.name}.`, 'error-message');
          return;
        }
        
        // Remove from inventory
        const droppedItem = this.gameState.removeFromInventory(item.id);
        
        // Add to current location
        const locationId = this.gameState.currentLocation;
        const location = this.locations[locationId];
        
        if (!location.items) {
          location.items = [];
        }
        
        location.items.push(item.id);
        
        this.terminal.print(`You drop the ${item.name}.`, 'action-result');
        
        // Check for special events when dropping the item
        if (item.onDrop) {
          item.onDrop(this.gameState, this.terminal, locationId);
        }
        
        return;
      }
    }
    
    this.terminal.print(`You don't have any ${itemName}.`, 'error-message');
  }
  
  useItem(itemName) {
    // Find the item in inventory
    for (const item of this.gameState.inventory) {
      if (item.keywords.some(keyword => itemName.includes(keyword))) {
        // Check if item can be used
        if (item.usable === false) {
          this.terminal.print(item.cantUseMessage || `You can't use the ${item.name}.`, 'error-message');
          return;
        }
        
        // Check if item has a use handler
        if (item.onUse) {
          item.onUse(this.gameState, this.terminal, this);
          return;
        } else {
          this.terminal.print(`You're not sure how to use the ${item.name}.`, 'error-message');
          return;
        }
      }
    }
    
    // Check if it's a visible item in the location
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (location && location.items) {
      for (const itemId of location.items) {
        const item = this.items[itemId];
        if (item && (!item.hidden || this.gameState.flags[item.revealFlag])) {
          if (item.keywords.some(keyword => itemName.includes(keyword))) {
            // Check if item can be used
            if (item.usable === false) {
              this.terminal.print(item.cantUseMessage || `You can't use the ${item.name}.`, 'error-message');
              return;
            }
            
            // Check if item has a use handler
            if (item.onUse) {
              item.onUse(this.gameState, this.terminal, this);
              return;
            } else {
              this.terminal.print(`You're not sure how to use the ${item.name}.`, 'error-message');
              return;
            }
          }
        }
      }
    }
    
    this.terminal.print(`You don't see any ${itemName} that you can use.`, 'error-message');
  }
  
  equipItem(itemName) {
    // Find the item in inventory
    for (const item of this.gameState.inventory) {
      if (item.keywords.some(keyword => itemName.includes(keyword))) {
        // Check if item can be equipped
        if (item.type !== 'weapon' && item.type !== 'armor') {
          this.terminal.print(`You can't equip the ${item.name}.`, 'error-message');
          return;
        }
        
        // Equip the item
        if (item.type === 'weapon') {
          this.gameState.equipWeapon(item.id);
          this.terminal.print(`You equip the ${item.name}.`, 'action-result');
        } else if (item.type === 'armor') {
          this.gameState.equipArmor(item.id);
          this.terminal.print(`You equip the ${item.name}.`, 'action-result');
        }
        
        // Check for special events when equipping the item
        if (item.onEquip) {
          item.onEquip(this.gameState, this.terminal);
        }
        
        return;
      }
    }
    
    this.terminal.print(`You don't have any ${itemName} to equip.`, 'error-message');
  }
  
  showInventory() {
    if (this.gameState.inventory.length === 0) {
      this.terminal.print("You aren't carrying anything.", 'inventory-empty');
      return;
    }
    
    this.terminal.print("You are carrying:", 'inventory-header');
    
    for (const item of this.gameState.inventory) {
      let itemText = `- ${item.name}`;
      
      // Add equipped indicator
      if (this.gameState.equippedWeapon && this.gameState.equippedWeapon.id === item.id) {
        itemText += " (equipped as weapon)";
      } else if (this.gameState.equippedArmor && this.gameState.equippedArmor.id === item.id) {
        itemText += " (equipped as armor)";
      }
      
      this.terminal.print(itemText, 'inventory-item');
    }
  }
  
  talkToNPC(npcName) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location || !location.npcs) {
      this.terminal.print(`There's no one here to talk to.`, 'error-message');
      return;
    }
    
    // Find the NPC in the current location
    for (const npcId of location.npcs) {
      const npc = this.npcs[npcId];
      
      if (npc && (!npc.hidden || this.gameState.flags[npc.revealFlag])) {
        if (npc.keywords.some(keyword => npcName.includes(keyword))) {
          // Check if NPC can be talked to
          if (npc.talkable === false) {
            this.terminal.print(npc.cantTalkMessage || `${npc.name} doesn't seem interested in talking.`, 'error-message');
            return;
          }
          
          // Check if NPC has a talk handler
          if (npc.onTalk) {
            npc.onTalk(this.gameState, this.terminal, this);
            return;
          } else {
            this.terminal.print(`${npc.name} has nothing to say.`, 'error-message');
            return;
          }
        }
      }
    }
    
    this.terminal.print(`You don't see anyone called ${npcName} here.`, 'error-message');
  }
  
  attackTarget(targetName) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location || !location.npcs) {
      this.terminal.print(`There's no one here to attack.`, 'error-message');
      return;
    }
    
    // Find the NPC in the current location
    for (const npcId of location.npcs) {
      const npc = this.npcs[npcId];
      
      if (npc && (!npc.hidden || this.gameState.flags[npc.revealFlag])) {
        if (npc.keywords.some(keyword => targetName.includes(keyword))) {
          // Check if NPC can be attacked
          if (npc.attackable === false) {
            this.terminal.print(npc.cantAttackMessage || `You can't attack ${npc.name}.`, 'error-message');
            return;
          }
          
          // Check if combat system is available
          if (this.combatSystem) {
            this.combatSystem.initiateCombat(npc);
            return;
          } else {
            // Fallback if no combat system
            if (npc.onAttack) {
              npc.onAttack(this.gameState, this.terminal, this);
              return;
            } else {
              this.terminal.print(`You attack ${npc.name} but nothing happens.`, 'error-message');
              return;
            }
          }
        }
      }
    }
    
    this.terminal.print(`You don't see anyone called ${targetName} here.`, 'error-message');
  }
  
  searchTarget(targetName) {
    const locationId = this.gameState.currentLocation;
    const location = this.locations[locationId];
    
    if (!location || !location.npcs) {
      this.terminal.print(`There's nothing here to search.`, 'error-message');
      return;
    }
    
    // Find the NPC (corpse) in the current location
    for (const npcId of location.npcs) {
      const npc = this.npcs[npcId];
      
      if (npc && (!npc.hidden || this.gameState.flags[npc.revealFlag])) {
        if (npc.keywords.some(keyword => targetName.includes(keyword))) {
          // Check if it's a corpse that can be searched
          if (npc.isCorpse) {
            // Check if corpse has any loot remaining
            if (!npc.loot || npc.loot.length === 0) {
              this.terminal.print(`You have already looted everything from the ${npc.name}.`, 'action-result');
              return;
            }
            
            // Show loot menu
            this.showLootMenu(npc);
            return;
          } else {
            this.terminal.print(`You can't search ${npc.name}.`, 'error-message');
            return;
          }
        }
      }
    }
    
    this.terminal.print(`You don't see any ${targetName} here to search.`, 'error-message');
  }
  
  triggerWolfDeathStory() {
    // Clear the trigger flag
    this.gameState.setFlag('triggerWolfDeathStory', false);
    
    // Display the dramatic death story
    this.terminal.print("\n", 'story-text');
    this.terminal.print("As you turn your back on the terrified children and attempt to flee...", 'story-text');
    
    setTimeout(() => {
      this.terminal.print("\nThe twisted wolf's eyes gleam with predatory hunger. It sees your cowardice.", 'story-text');
    }, 1500);
    
    setTimeout(() => {
      this.terminal.print("\nWith lightning speed, the beast lunges forward, its massive jaws clamping down on your leg.", 'story-text');
    }, 3000);
    
    setTimeout(() => {
      this.terminal.print("\nYou scream in agony as razor-sharp teeth tear through flesh and bone.", 'story-text');
    }, 4500);
    
    setTimeout(() => {
      this.terminal.print("\nThe children's cries echo behind you as the wolf drags you into the darkness.", 'story-text');
    }, 6000);
    
    setTimeout(() => {
      this.terminal.print("\nYour vision fades as the creature's claws rake across your chest...", 'story-text');
    }, 7500);
    
    setTimeout(() => {
      this.terminal.print("\nIn your final moments, you hear the wolf's satisfied growl and the children's screams growing distant.", 'story-text');
    }, 9000);
    
    setTimeout(() => {
      this.terminal.print("\nYou have failed them. You have failed yourself.", 'story-text');
    }, 10500);
    
    setTimeout(() => {
      this.terminal.print("\n*** YOU HAVE DIED ***", 'error-message');
      // Use the story engine's own game over handling for wolf death story
      this.gameOverReturnToTitle();
    }, 12000);
  }
  
  gameOverReturnToTitle() {
    this.terminal.print("\nPress Enter to return to title screen...", 'game-over-message');
    
    // Set up special Enter key handler for returning to title
    this.setupGameOverHandler();
  }
  
  setupGameOverHandler() {
    // Clear existing command handlers but keep terminal enabled for mobile keyboard
    this.terminal.commandHandlers = {};
    
    // Set up special command handler for Enter key that works on mobile
    this.terminal.registerCommand('^$', () => {
      // Handle empty input (Enter key press)
      this.returnToTitleScreen();
    });
    
    // Also handle any input as return to title for convenience
    this.terminal.registerCommand('.*', () => {
      this.returnToTitleScreen();
    });
    
    // Keep input focused for mobile keyboard
    this.terminal.inputElement.focus();
  }
  
  returnToTitleScreen() {
    // Re-enable terminal
    this.terminal.enable();
    
    // Clear terminal
    this.terminal.clear();
    
    // Reset the game state to ensure clean restart
    if (this.gameState) {
      this.gameState.reset();
    }
    
    // Show title screen
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) {
      titleScreen.classList.add('active');
    }
  }

  showLootMenu(corpse) {
    this.terminal.print(`\nWhat do you want to loot from the ${corpse.name}?`, 'loot-menu-header');
    
    // Store current corpse for loot selection
    this.currentLootCorpse = corpse;
    
    // Display numbered loot options
    for (let i = 0; i < corpse.loot.length; i++) {
      const lootItem = corpse.loot[i];
      const item = this.items[lootItem.id];
      if (item) {
        this.terminal.print(`${i + 1}. ${item.name}`, 'loot-option');
      }
    }
    
    // Add "Take All" option
    this.terminal.print(`${corpse.loot.length + 1}. Take All`, 'loot-option');
    
    this.terminal.print(`\nEnter the number of your choice:`, 'loot-prompt');
    
    // Set up temporary command handlers for loot selection
    this.setupLootSelectionHandlers();
  }
  
  setupLootSelectionHandlers() {
    // Store original handlers
    this.originalHandlers = { ...this.terminal.commandHandlers };
    
    // Clear existing handlers
    this.terminal.commandHandlers = {};
    
    // Add number selection handler
    this.terminal.registerCommand('^([0-9]+)$', (input) => {
      const choice = parseInt(input.trim());
      this.handleLootSelection(choice);
    });
    
    // Add cancel option
    this.terminal.registerCommand('^(cancel|exit|quit)$', () => {
      this.cancelLootSelection();
    });
  }
  
  handleLootSelection(choice) {
    if (!this.currentLootCorpse || !this.currentLootCorpse.loot) {
      this.restoreOriginalHandlers();
      return;
    }
    
    const corpse = this.currentLootCorpse;
    const maxChoice = corpse.loot.length + 1; // +1 for "Take All"
    
    if (choice < 1 || choice > maxChoice) {
      this.terminal.print(`Invalid choice. Please enter a number between 1 and ${maxChoice}.`, 'error-message');
      return;
    }
    
    if (choice === maxChoice) {
      // Take All option
      this.takeAllLoot(corpse);
    } else {
      // Take specific item
      this.takeLootItem(corpse, choice - 1);
    }
    
    // Check if there's still loot remaining
    if (corpse.loot.length > 0) {
      this.terminal.print(`\nThere are still items remaining. Search the corpse again to continue looting.`, 'action-hint');
    }
    
    this.restoreOriginalHandlers();
  }
  
  takeAllLoot(corpse) {
    this.terminal.print(`You take everything from the ${corpse.name}:`, 'action-result');
    
    // Take all items
    while (corpse.loot.length > 0) {
      const lootItem = corpse.loot[0];
      const item = this.items[lootItem.id];
      if (item) {
        this.gameState.addToInventory({
          id: lootItem.id,
          ...item
        });
        this.terminal.print(`- ${item.name}`, 'item-found');
      }
      corpse.loot.shift(); // Remove the item from loot
    }
  }
  
  takeLootItem(corpse, index) {
    if (index >= 0 && index < corpse.loot.length) {
      const lootItem = corpse.loot[index];
      const item = this.items[lootItem.id];
      
      if (item) {
        this.gameState.addToInventory({
          id: lootItem.id,
          ...item
        });
        this.terminal.print(`You take the ${item.name}.`, 'action-result');
        
        // Remove the item from loot
        corpse.loot.splice(index, 1);
      }
    }
  }
  
  cancelLootSelection() {
    this.terminal.print('You decide not to loot anything right now.', 'action-result');
    this.restoreOriginalHandlers();
  }
  
  restoreOriginalHandlers() {
    // Restore original command handlers
    if (this.originalHandlers) {
      this.terminal.commandHandlers = this.originalHandlers;
      this.originalHandlers = null;
    }
    this.currentLootCorpse = null;
  }
  
  updateCorpseDecay(locationId) {
    const location = this.locations[locationId];
    if (!location || !location.npcs) return;
    
    const currentVisitCount = this.gameState.getLocationVisitCount(locationId);
    const corpsesToRemove = [];
    
    // Check each NPC in the location
    for (let i = location.npcs.length - 1; i >= 0; i--) {
      const npcId = location.npcs[i];
      const npc = this.npcs[npcId];
      
      if (npc && npc.isCorpse && npc.createdAtLocation === locationId) {
        const visitsSinceCreation = currentVisitCount - npc.createdAtVisitCount;
        
        if (visitsSinceCreation >= 3) {
          // Remove corpse completely after 3 visits
          corpsesToRemove.push({ index: i, npcId, npc });
        } else if (visitsSinceCreation >= 2) {
          // Severely decayed state
          this.updateCorpseToDecayState(npc, 'decayed');
        } else if (visitsSinceCreation >= 1) {
          // Rotting state
          this.updateCorpseToDecayState(npc, 'rotting');
        }
        // visitsSinceCreation === 0 means fresh (no change needed)
      }
    }
    
    // Remove completely decayed corpses
    for (const corpseInfo of corpsesToRemove) {
      location.npcs.splice(corpseInfo.index, 1);
      delete this.npcs[corpseInfo.npcId];
      // Loot is automatically lost when corpse is removed
    }
  }
  
  updateCorpseToDecayState(corpse, newState) {
    if (corpse.decayState === newState) return; // Already in this state
    
    corpse.decayState = newState;
    const enemyName = corpse.originalEnemy.toLowerCase();
    
    switch (newState) {
      case 'rotting':
        corpse.name = `Rotting ${corpse.originalEnemy} Corpse`;
        corpse.description = `The decomposing remains of the ${enemyName}. The smell is becoming quite unpleasant, and flies buzz around the body.`;
        corpse.presenceDescription = `The rotting corpse of the ${enemyName} lies here, emanating a foul odor.`;
        break;
        
      case 'decayed':
        corpse.name = `Severely Decayed ${corpse.originalEnemy} Remains`;
        corpse.description = `What's left of the ${enemyName} is barely recognizable. The advanced state of decay makes it difficult to look at for long.`;
        corpse.presenceDescription = `The severely decayed remains of the ${enemyName} are scattered here, reeking terribly.`;
        break;
    }
    
    // Update the onExamine function to reflect decay state
    corpse.onExamine = (gameState, terminal, storyEngine) => {
      let examineText;
      switch (newState) {
        case 'rotting':
          examineText = `The ${enemyName} corpse is in an advanced state of decomposition. The smell is overwhelming.`;
          break;
        case 'decayed':
          examineText = `The ${enemyName} remains are barely identifiable. Nature is quickly reclaiming what's left.`;
          break;
        default:
          examineText = `The ${enemyName} lies motionless. Its body shows the wounds from your battle.`;
      }
      
      terminal.print(examineText, 'examine-result');
      
      // Check if there are loot items to find
      if (corpse.loot && corpse.loot.length > 0) {
        if (newState === 'decayed') {
          terminal.print("You might still find something in the remains, though it's quite unpleasant to search.", 'examine-result');
        } else {
          terminal.print("You might find something useful if you search the corpse.", 'examine-result');
        }
      } else {
        terminal.print("The corpse appears to have nothing of value.", 'examine-result');
      }
    };
  }

  showHelp() {
    this.terminal.print("Available commands:", 'help-header');
    this.terminal.print("- look / examine [object]: Look around or examine something specific", 'help-item');
    this.terminal.print("- go/move [direction]: Move in a direction (north, south, east, west)", 'help-item');
    this.terminal.print("- take/get [item]: Pick up an item", 'help-item');
    this.terminal.print("- drop [item]: Drop an item from your inventory", 'help-item');
    this.terminal.print("- use [item]: Use an item", 'help-item');
    this.terminal.print("- equip [item]: Equip a weapon or armor", 'help-item');
    this.terminal.print("- inventory/inv: Check what you're carrying", 'help-item');
    this.terminal.print("- talk to [person]: Talk to someone", 'help-item');
    this.terminal.print("- attack [target]: Attack a creature or person", 'help-item');
    this.terminal.print("- search/loot [target]: Search a corpse for items", 'help-item');
    this.terminal.print("- status: Check your health and condition", 'help-item');
    this.terminal.print("- save: Save your game progress", 'help-item');
  }
  
  showStatus() {
    this.terminal.print(`Name: ${this.gameState.playerName}`, 'status-item');
    this.terminal.print(`Health: ${this.gameState.playerHealth}/${this.gameState.playerMaxHealth}`, 'status-item');
    
    if (this.gameState.equippedWeapon) {
      this.terminal.print(`Weapon: ${this.gameState.equippedWeapon.name}`, 'status-item');
    } else {
      this.terminal.print("Weapon: None", 'status-item');
    }
    
    if (this.gameState.equippedArmor) {
      this.terminal.print(`Armor: ${this.gameState.equippedArmor.name}`, 'status-item');
    } else {
      this.terminal.print("Armor: None", 'status-item');
    }
    
    this.terminal.print(`Memory recovered: ${this.gameState.memoryRecovered}%`, 'status-item');
  }
  
  checkAmbientCreatureEncounter(locationId) {
    // Don't show creatures in the starting location
    if (locationId === 'crossroads') {
      return;
    }
    
    // 25% chance of encountering an ambient creature
    if (Math.random() < 0.25) {
      // Select a random creature description
      const randomIndex = Math.floor(Math.random() * this.ambientCreatures.length);
      const creatureDescription = this.ambientCreatures[randomIndex];
      
      // Display the creature encounter with special styling
      this.terminal.print(creatureDescription, 'ambient-creature');
    }
  }

  update() {
    // Update game logic here if needed
    // This method is called every frame from the game loop
  }
}
