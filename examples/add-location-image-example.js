/**
 * Example: How to Add Images to Locations
 * 
 * This example demonstrates the new streamlined process for adding images
 * to game locations without troubleshooting.
 */

import { imageHelpers } from '../src/js/imageHelpers.js';
import { imageValidator } from '../src/js/imageValidator.js';
import { gameData } from '../src/js/gameData.js';

// Example 1: Simple location with one image
const tavernLocation = {
  name: "The Rusty Anchor Tavern",
  scene: "tavern",
  description: "A cozy tavern filled with the warmth of a crackling fire.",
  // Add image using helper function
  images: imageHelpers.createSimpleImageConfig("Tavern_Interior.png"),
  exits: {
    south: "village_square"
  }
};

// Example 2: Location with time-based images
const forestClearingLocation = {
  name: "Forest Clearing",
  scene: "forest",
  description: "A peaceful clearing surrounded by ancient trees.",
  // Different images for day/night
  images: imageHelpers.createTimeBasedImageConfig(
    "Forest_Clearing_Day.png",
    "Forest_Clearing_Night.png"
  ),
  exits: {
    north: "deep_forest",
    south: "forest_path"
  }
};

// Example 3: Location with event-based conditional images
const ancientRuinsLocation = {
  name: "Ancient Ruins",
  scene: "ruins",
  description: "Mysterious ruins that seem to pulse with ancient magic.",
  // Different images based on game events
  images: imageHelpers.createConditionalImageConfig({
    default: "Ruins_Dormant.png",
    conditions: [
      {
        condition: { flags: ["ruins_activated"] },
        image: "Ruins_Glowing.png"
      },
      {
        condition: { flags: ["ruins_destroyed"] },
        image: "Ruins_Destroyed.png"
      }
    ]
  }),
  exits: {
    west: "forest_clearing"
  }
};

// Example 4: Location with NPC-based images
const throneRoomLocation = {
  name: "Royal Throne Room",
  scene: "castle",
  description: "A grand throne room with towering pillars.",
  // Different images based on who's present
  images: imageHelpers.createNPCBasedImageConfig({
    default: "Throne_Room_Empty.png",
    npcImages: {
      "king": "Throne_Room_With_King.png",
      "queen": "Throne_Room_With_Queen.png"
    }
  }),
  exits: {
    south: "castle_hall"
  },
  npcs: ["king"]
};

// Example 5: How to add these locations to your game
function addNewLocationsToGame() {
  // Add locations to gameData
  gameData.locations.tavern = tavernLocation;
  gameData.locations.forest_clearing = forestClearingLocation;
  gameData.locations.ancient_ruins = ancientRuinsLocation;
  gameData.locations.throne_room = throneRoomLocation;
  
  console.log('✅ New locations added to game data');
}

// Example 6: Validate images before adding to production
async function validateNewLocationImages() {
  const locationsToValidate = {
    tavern: tavernLocation,
    forest_clearing: forestClearingLocation,
    ancient_ruins: ancientRuinsLocation,
    throne_room: throneRoomLocation
  };
  
  for (const [locationId, locationData] of Object.entries(locationsToValidate)) {
    const report = await imageValidator.validateLocationImages(locationId, locationData);
    
    if (report.missingImages.length > 0) {
      console.warn(`⚠️ Missing images for ${locationId}:`, report.missingImages);
      console.log('💡 Suggestions:', report.suggestions);
    } else {
      console.log(`✅ All images validated for ${locationId}`);
    }
  }
}

// Example 7: Quick validation of a single image
function quickImageCheck(imageName) {
  return imageValidator.validateImageFile(imageName)
    .then(exists => {
      if (exists) {
        console.log(`✅ ${imageName} exists and is ready to use`);
      } else {
        console.warn(`❌ ${imageName} not found. Please add it to /public/images/`);
        console.log(`💡 Suggested names: ${imageHelpers.generateImageSuggestions(imageName).join(', ')}`);
      }
      return exists;
    });
}

// Export examples for use
export {
  tavernLocation,
  forestClearingLocation,
  ancientRuinsLocation,
  throneRoomLocation,
  addNewLocationsToGame,
  validateNewLocationImages,
  quickImageCheck
};

// Usage instructions:
// 1. Create your location object with images using helper functions
// 2. Validate images exist using imageValidator
// 3. Add location to gameData.locations
// 4. The image system handles the rest automatically!

console.log(`
🎮 QUICK START GUIDE:

1. Use imageHelpers.createSimpleImageConfig("YourImage.png") for basic images
2. Use imageHelpers.createTimeBasedImageConfig() for day/night variations
3. Use imageHelpers.createConditionalImageConfig() for event-based images
4. Run imageValidator.validateLocationImages() to check your setup
5. Add your location to gameData.locations
6. Done! No more troubleshooting needed.

📁 Place your images in: /public/images/
📖 Full guide: /docs/IMAGE_GUIDE.md
`);