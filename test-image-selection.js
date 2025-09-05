// Test script to debug image selection for village_outskirts
const fs = require('fs');
const path = require('path');

// Mock gameData structure
const gameData = {
  locations: {
    village_outskirts: {
      images: {
        default: "village_outskirts",
        conditions: {
          "flag:savedChildren": "village_outskirts_peaceful",
          "npc:small_creature": "Wolf_Children.png"
        }
      },
      scene: "village",
      npcs: [] // This will be key - check if small_creature is here
    }
  }
};

// Mock gameState
const gameState = {
  flags: {
    savedChildren: false // Test both true and false
  },
  currentLocation: 'village_outskirts'
};

// Test function to simulate condition evaluation
function testConditionEvaluation(condition, gameState, location) {
  console.log(`\nTesting condition: ${condition}`);
  
  if (condition.startsWith('flag:')) {
    const flagName = condition.substring(5);
    const result = gameState.flags[flagName] === true;
    console.log(`  Flag ${flagName}: ${gameState.flags[flagName]} -> ${result}`);
    return result;
  }
  
  if (condition.startsWith('npc:')) {
    const npcId = condition.substring(4);
    const locationData = gameData.locations[gameState.currentLocation];
    const result = locationData.npcs && locationData.npcs.includes(npcId);
    console.log(`  NPC ${npcId} in location npcs [${locationData.npcs}]: ${result}`);
    return result;
  }
  
  return false;
}

// Test image selection
function testImageSelection(locationId, gameState) {
  console.log(`\n=== Testing image selection for ${locationId} ===`);
  const location = gameData.locations[locationId];
  const imageConfig = location.images;
  let selectedImage = imageConfig.default;
  
  console.log(`Default image: ${selectedImage}`);
  console.log(`Available conditions:`, Object.keys(imageConfig.conditions || {}));
  
  if (imageConfig.conditions) {
    for (const [condition, imageUrl] of Object.entries(imageConfig.conditions)) {
      console.log(`\nEvaluating: ${condition} -> ${imageUrl}`);
      if (testConditionEvaluation(condition, gameState, location)) {
        selectedImage = imageUrl;
        console.log(`*** CONDITION MATCHED! Selected: ${selectedImage} ***`);
        break;
      }
    }
  }
  
  console.log(`\nFinal selected image: ${selectedImage}`);
  return selectedImage;
}

// Test scenarios
console.log('='.repeat(60));
console.log('TESTING IMAGE SELECTION FOR VILLAGE_OUTSKIRTS');
console.log('='.repeat(60));

// Scenario 1: No NPCs, savedChildren = false
console.log('\n--- Scenario 1: No NPCs, savedChildren = false ---');
gameState.flags.savedChildren = false;
gameData.locations.village_outskirts.npcs = [];
testImageSelection('village_outskirts', gameState);

// Scenario 2: No NPCs, savedChildren = true
console.log('\n--- Scenario 2: No NPCs, savedChildren = true ---');
gameState.flags.savedChildren = true;
gameData.locations.village_outskirts.npcs = [];
testImageSelection('village_outskirts', gameState);

// Scenario 3: small_creature present, savedChildren = false
console.log('\n--- Scenario 3: small_creature present, savedChildren = false ---');
gameState.flags.savedChildren = false;
gameData.locations.village_outskirts.npcs = ['small_creature'];
testImageSelection('village_outskirts', gameState);

// Scenario 4: small_creature present, savedChildren = true
console.log('\n--- Scenario 4: small_creature present, savedChildren = true ---');
gameState.flags.savedChildren = true;
gameData.locations.village_outskirts.npcs = ['small_creature'];
testImageSelection('village_outskirts', gameState);

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));