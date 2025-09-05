// Debug script to check game state and NPC presence
const fs = require('fs');
const path = require('path');

// Read the gameData file to check the actual configuration
const gameDataPath = './src/js/gameData.js';
const gameDataContent = fs.readFileSync(gameDataPath, 'utf8');

// Extract village_outskirts configuration
const villageOutskirtsMatch = gameDataContent.match(/village_outskirts:\s*{[\s\S]*?(?=\n\s{4}\w|\n\s{2}},|\n\s{2}$)/m);

if (villageOutskirtsMatch) {
  console.log('='.repeat(60));
  console.log('VILLAGE_OUTSKIRTS CONFIGURATION');
  console.log('='.repeat(60));
  console.log(villageOutskirtsMatch[0]);
  console.log('\n' + '='.repeat(60));
} else {
  console.log('Could not find village_outskirts configuration');
}

// Check if the image files exist
const imageDir = './src/assets/images';
const imagesToCheck = [
  'village_outskirts.png',
  'village_outskirts_peaceful.png', 
  'Wolf_Children.png',
  'Village_Entrance.png',
  'Forest_Path.png'
];

console.log('\nIMAGE FILE EXISTENCE CHECK:');
console.log('='.repeat(40));

imagesToCheck.forEach(image => {
  const imagePath = path.join(imageDir, image);
  const exists = fs.existsSync(imagePath);
  console.log(`${image}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
});

// Check the WebGL fallback logic
console.log('\nWEBGL FALLBACK LOGIC:');
console.log('='.repeat(40));

const webglPath = './src/js/webgl.js';
const webglContent = fs.readFileSync(webglPath, 'utf8');

// Extract the fallback logic
const fallbackMatch = webglContent.match(/if \(!this\.textures\[sceneName\]\)[\s\S]*?(?=\n\s{4}\})/m);
if (fallbackMatch) {
  console.log('Fallback logic found:');
  console.log(fallbackMatch[0]);
} else {
  console.log('Could not find fallback logic');
}

console.log('\n' + '='.repeat(60));
console.log('DEBUG COMPLETE');
console.log('='.repeat(60));