// Memory fragments and triggers for the Forgotten Steel game

import { MemoryData, MemoryTriggerData } from './memorySystem.js';

export const memoryData = {
  memories: {
    pond_visions: new MemoryData({
      id: 'pond_visions',
      title: 'Visions in the Water',
      text: 'You see flashes of yourself in gleaming armor, standing before a great castle. A woman in a crown speaks to you with urgency in her voice.',
      importance: 'major',
      flashImage: 'memory_castle.jpg'
    }),
    
    rememberedKnight: new MemoryData({
      id: 'rememberedKnight',
      title: 'The Knight\'s Oath',
      text: 'You remember taking an oath of service, kneeling before the throne. You were a knight of the realm, sworn to protect the innocent.',
      importance: 'critical',
      flashImage: 'memory_oath.jpg'
    }),
    
    wizard_betrayal: new MemoryData({
      id: 'wizard_betrayal',
      title: 'The Wizard\'s Betrayal',
      text: 'A trusted advisor... no, a wizard you once called friend. His face twists with malice as he raises his staff against you. "You know too much," he hisses.',
      importance: 'critical',
      flashImage: 'memory_betrayal.jpg'
    }),
    
    royal_scroll: new MemoryData({
      id: 'royal_scroll',
      title: 'Royal Decree',
      text: 'The scroll bears the royal seal. You remember delivering urgent messages between the castle and distant outposts. You were a trusted messenger of the crown.',
      importance: 'major',
      flashImage: 'memory_scroll.jpg'
    }),
    
    tower_symbols: new MemoryData({
      id: 'tower_symbols',
      title: 'The Wizard\'s Name',
      text: 'The symbols spell out a name: Malachar the Deceiver. Your former mentor, the court wizard who betrayed the realm and erased your memories.',
      importance: 'critical',
      flashImage: 'memory_symbols.jpg'
    }),
    
    crossroads_battle: new MemoryData({
      id: 'crossroads_battle',
      title: 'The Ambush',
      text: 'You remember now - you were ambushed here while carrying vital intelligence about Malachar\'s treachery. Dark creatures overwhelmed you, but not before you hid the evidence.',
      importance: 'critical',
      flashImage: 'memory_ambush.jpg'
    }),
    
    knight_identity: new MemoryData({
      id: 'knight_identity',
      title: 'Your True Name',
      text: 'Sir Aldric of Westmarch - that is who you are. A knight-errant in service to the crown, tasked with uncovering corruption in the highest ranks of the kingdom.',
      importance: 'critical',
      flashImage: 'memory_identity.jpg'
    })
  },
  
  triggers: {
    pond_examine: new MemoryTriggerData({
      id: 'pond_examine',
      type: 'examine',
      target: 'pond',
      memoryId: 'pond_visions',
      oneTime: true
    }),
    
    pond_examine_advanced: new MemoryTriggerData({
      id: 'pond_examine_advanced',
      type: 'examine',
      target: 'pond',
      memoryId: 'wizard_betrayal',
      condition: (gameState) => {
        return gameState.flags.pond_visions && gameState.memoryFragments.length >= 3;
      },
      oneTime: true
    }),
    
    scroll_examine: new MemoryTriggerData({
      id: 'scroll_examine',
      type: 'examine',
      target: 'scroll',
      memoryId: 'royal_scroll',
      oneTime: true
    }),
    
    symbols_examine: new MemoryTriggerData({
      id: 'symbols_examine',
      type: 'examine',
      target: 'symbols',
      memoryId: 'tower_symbols',
      condition: (gameState) => {
        return gameState.flags.rememberedMission;
      },
      oneTime: true
    }),
    
    ground_examine: new MemoryTriggerData({
      id: 'ground_examine',
      type: 'examine',
      target: 'ground',
      memoryId: 'crossroads_battle',
      oneTime: true
    }),
    
    signet_take: new MemoryTriggerData({
      id: 'signet_take',
      type: 'take',
      target: 'knight_signet',
      memoryId: 'knight_identity',
      oneTime: true
    })
  }
};

// Function to register all memories and triggers with the memory system
export function initializeMemorySystem(memorySystem) {
  // Register all memories
  Object.values(memoryData.memories).forEach(memory => {
    memorySystem.registerMemory(memory.id, memory);
  });
  
  // Register all triggers
  Object.values(memoryData.triggers).forEach(trigger => {
    memorySystem.registerMemoryTrigger(trigger.id, trigger);
  });
}