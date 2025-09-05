// Debug script to test image loading logic
import { gameData } from './src/js/gameData.js';
import { GameState } from './src/js/gameState.js';

// Create a test game state
const gameState = new GameState();
gameState.currentLocation = 'village_outskirts';

// Get the location data
const location = gameData.locations['village_outskirts'];
console.log('Village Outskirts Location Data:', location);
console.log('NPCs in location:', location.npcs);
console.log('Image config:', location.images);

// Test condition evaluation
const hasSmallCreature = location.npcs && location.npcs.includes('small_creature');
console.log('Has small_creature NPC:', hasSmallCreature);

const savedChildrenFlag = gameState.getFlag('savedChildren');
console.log('savedChildren flag:', savedChildrenFlag);

// Test image selection logic
const imageConfig = location.images;
let selectedImage = imageConfig.default;
console.log('Default image:', selectedImage);

if (imageConfig.conditions) {
  for (const [condition, imageUrl] of Object.entries(imageConfig.conditions)) {
    console.log(`Testing condition: ${condition} -> ${imageUrl}`);
    
    if (condition === 'flag:savedChildren') {
      const result = gameState.getFlag('savedChildren');
      console.log(`  flag:savedChildren = ${result}`);
      if (result) {
        selectedImage = imageUrl;
        console.log(`  Selected image: ${selectedImage}`);
        break;
      }
    } else if (condition === 'npc:small_creature') {
      const currentLocation = gameState.getCurrentLocationData();
      const result = currentLocation && currentLocation.npcs && currentLocation.npcs.includes('small_creature');
      console.log(`  npc:small_creature = ${result}`);
      if (result) {
        selectedImage = imageUrl;
        console.log(`  Selected image: ${selectedImage}`);
        break;
      }
    }
  }
}

console.log('Final selected image:', selectedImage);

// Test what happens with different game states
console.log('\n--- Testing with savedChildren = true ---');
gameState.setFlag('savedChildren', true);
let selectedImage2 = imageConfig.default;
if (imageConfig.conditions) {
  for (const [condition, imageUrl] of Object.entries(imageConfig.conditions)) {
    if (condition === 'flag:savedChildren' && gameState.getFlag('savedChildren')) {
      selectedImage2 = imageUrl;
      break;
    } else if (condition === 'npc:small_creature') {
      const currentLocation = gameState.getCurrentLocationData();
      const result = currentLocation && currentLocation.npcs && currentLocation.npcs.includes('small_creature');
      if (result) {
        selectedImage2 = imageUrl;
        break;
      }
    }
  }
}
console.log('Selected image with savedChildren=true:', selectedImage2);