// Memory system for handling memory recovery events

export class MemorySystem {
  constructor(gameState, terminal, webglRenderer, audioManager) {
    this.gameState = gameState;
    this.terminal = terminal;
    this.webglRenderer = webglRenderer;
    this.audioManager = audioManager;
    this.memories = {};
    this.memoryTriggers = {};
    this.activeMemoryFlash = false;
    this.memoryFlashStartTime = 0;
    this.memoryFlashDuration = 2000; // ms
  }
  
  // Register a memory that can be recovered
  registerMemory(id, memoryData) {
    this.memories[id] = {
      id,
      title: memoryData.title || 'Forgotten Memory',
      text: memoryData.text || 'A fragment of memory returns to you...',
      flashImage: memoryData.flashImage || null,
      recovered: false,
      importance: memoryData.importance || 'minor', // minor, major, critical
      relatedObjectives: memoryData.relatedObjectives || [],
      onRecovered: memoryData.onRecovered || null
    };
  }
  
  // Register a trigger that can cause memory recovery
  registerMemoryTrigger(triggerId, triggerData) {
    this.memoryTriggers[triggerId] = {
      id: triggerId,
      type: triggerData.type, // location, item, combat, npc, objective
      target: triggerData.target, // ID of the location, item, etc.
      condition: triggerData.condition || null, // Function that returns true if trigger should activate
      memoryId: triggerData.memoryId, // ID of the memory to recover
      triggered: false,
      oneTime: triggerData.oneTime !== undefined ? triggerData.oneTime : true
    };
  }
  
  // Check all triggers based on an event
  checkTriggers(eventType, eventTarget, eventData = {}) {
    let triggeredMemories = [];
    
    Object.values(this.memoryTriggers).forEach(trigger => {
      // Skip already triggered one-time triggers
      if (trigger.triggered && trigger.oneTime) return;
      
      // Check if this trigger matches the event
      if (trigger.type === eventType && 
          (trigger.target === eventTarget || trigger.target === '*')) {
        
        // Check additional condition if provided
        let conditionMet = true;
        if (trigger.condition && typeof trigger.condition === 'function') {
          conditionMet = trigger.condition(this.gameState, eventData);
        }
        
        if (conditionMet) {
          // Mark as triggered
          trigger.triggered = true;
          
          // Recover the associated memory
          const memory = this.memories[trigger.memoryId];
          if (memory && !memory.recovered) {
            this.recoverMemory(trigger.memoryId);
            triggeredMemories.push(memory);
          }
        }
      }
    });
    
    return triggeredMemories;
  }
  
  // Recover a specific memory
  recoverMemory(memoryId) {
    const memory = this.memories[memoryId];
    if (!memory || memory.recovered) return false;
    
    // Mark as recovered
    memory.recovered = true;
    
    // Update game state
    this.gameState.memoryRecovered += 1;
    this.gameState.knownInformation.push({
      type: 'memory',
      title: memory.title,
      text: memory.text,
      importance: memory.importance
    });
    
    // Trigger memory flash effect
    this.triggerMemoryFlash(memory);
    
    // Call onRecovered callback if provided
    if (memory.onRecovered && typeof memory.onRecovered === 'function') {
      memory.onRecovered(this.gameState, this.terminal);
    }
    
    // Complete related objectives
    if (memory.relatedObjectives && memory.relatedObjectives.length > 0) {
      memory.relatedObjectives.forEach(objectiveId => {
        this.gameState.completeObjective(objectiveId);
      });
    }
    
    return true;
  }
  
  // Trigger a visual memory flash effect
  triggerMemoryFlash(memory) {
    // Play memory flash sound
    if (this.audioManager) {
      this.audioManager.playSound('memory_flash');
    }
    
    // Set up the visual effect
    this.activeMemoryFlash = true;
    this.memoryFlashStartTime = Date.now();
    this.currentMemoryFlash = memory;
    
    // Display memory text in terminal
    this.terminal.printHTML(`<div class="memory-flash">
      <h3>${memory.title}</h3>
      <p>${memory.text}</p>
    </div>`);
    
    // Set the flash image if provided
    if (memory.flashImage && this.webglRenderer) {
      this.webglRenderer.setMemoryFlashImage(memory.flashImage);
    }
  }
  
  // Update the memory system (call this in the game loop)
  update() {
    if (this.activeMemoryFlash) {
      const elapsed = Date.now() - this.memoryFlashStartTime;
      const progress = Math.min(1.0, elapsed / this.memoryFlashDuration);
      
      // Update the visual effect
      if (this.webglRenderer) {
        this.webglRenderer.updateMemoryFlash(progress, this.currentMemoryFlash);
      }
      
      // Check if the effect is complete
      if (progress >= 1.0) {
        this.activeMemoryFlash = false;
        this.currentMemoryFlash = null;
        
        // Reset the renderer
        if (this.webglRenderer) {
          this.webglRenderer.clearMemoryFlash();
        }
      }
      
      return true; // Memory system was updated
    }
    
    return false; // No update needed
  }
  
  // Get all recovered memories
  getRecoveredMemories() {
    return Object.values(this.memories).filter(memory => memory.recovered);
  }
  
  // Get all memories (for debugging)
  getAllMemories() {
    return this.memories;
  }
  
  // Get memory recovery progress as a percentage
  getMemoryRecoveryProgress() {
    const totalMemories = Object.keys(this.memories).length;
    if (totalMemories === 0) return 0;
    
    const recoveredCount = Object.values(this.memories).filter(m => m.recovered).length;
    return (recoveredCount / totalMemories) * 100;
  }
  
  // Check if a specific memory has been recovered
  isMemoryRecovered(memoryId) {
    return this.memories[memoryId] && this.memories[memoryId].recovered;
  }
}

// Memory data structure for defining memories
export class MemoryData {
  constructor(options) {
    this.id = options.id;
    this.title = options.title || 'Forgotten Memory';
    this.text = options.text || 'A fragment of memory returns to you...';
    this.flashImage = options.flashImage || null;
    this.importance = options.importance || 'minor'; // minor, major, critical
    this.relatedObjectives = options.relatedObjectives || [];
    this.onRecovered = options.onRecovered || null;
  }
}

// Memory trigger data structure for defining triggers
export class MemoryTriggerData {
  constructor(options) {
    this.id = options.id;
    this.type = options.type; // location, item, combat, npc, objective
    this.target = options.target; // ID of the location, item, etc.
    this.condition = options.condition || null;
    this.memoryId = options.memoryId;
    this.oneTime = options.oneTime !== undefined ? options.oneTime : true;
  }
}