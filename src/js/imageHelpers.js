// Image helper functions and standardized naming conventions
// Provides easy-to-use functions for adding images to locations

import { imageValidator } from './imageValidator.js';

/**
 * Standardized image naming conventions and helper functions
 */
export class ImageHelpers {
  constructor() {
    this.imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
    this.standardConditions = {
      // Time-based conditions
      DAY: 'time:day',
      NIGHT: 'time:night',
      DAWN: 'time:dawn',
      DUSK: 'time:dusk',
      
      // Common flag conditions
      SAVED_CHILDREN: 'flag:savedChildren',
      DEFEATED_CAVE_CREATURE: 'flag:defeatedCaveCreature',
      REMEMBERED_AMBUSH: 'flag:rememberedAmbush',
      VISITED_VILLAGE: 'flag:visitedVillage',
      
      // NPC presence conditions
      HAS_WOLF: 'npc:small_creature',
      HAS_ELDER: 'npc:village_elder',
      HAS_BLACKSMITH: 'npc:blacksmith'
    };
  }

  /**
   * Create a simple image configuration with just a default image
   * @param {string} imageName - Name of the image file (with or without extension)
   * @returns {Object} - Image configuration object
   */
  createSimpleImageConfig(imageName) {
    const imageFile = this.ensureImageExtension(imageName);
    return {
      default: imageFile
    };
  }

  /**
   * Create an image configuration with conditional images
   * @param {string} defaultImage - Default image file name
   * @param {Object} conditions - Object mapping condition names to image files
   * @returns {Object} - Image configuration object
   */
  createConditionalImageConfig(defaultImage, conditions = {}) {
    const config = {
      default: this.ensureImageExtension(defaultImage)
    };

    if (Object.keys(conditions).length > 0) {
      config.conditions = {};
      for (const [condition, imageName] of Object.entries(conditions)) {
        const conditionKey = this.standardizeCondition(condition);
        config.conditions[conditionKey] = this.ensureImageExtension(imageName);
      }
    }

    return config;
  }

  /**
   * Create a time-based image configuration (day/night variants)
   * @param {string} defaultImage - Default (day) image
   * @param {string} nightImage - Night variant image
   * @returns {Object} - Image configuration object
   */
  createTimeBasedImageConfig(defaultImage, nightImage) {
    return this.createConditionalImageConfig(defaultImage, {
      [this.standardConditions.NIGHT]: nightImage
    });
  }

  /**
   * Create an event-based image configuration (before/after states)
   * @param {string} defaultImage - Default (before) image
   * @param {string} flagName - Flag name to check
   * @param {string} afterImage - Image to show after flag is set
   * @returns {Object} - Image configuration object
   */
  createEventBasedImageConfig(defaultImage, flagName, afterImage) {
    const condition = `flag:${flagName}`;
    return this.createConditionalImageConfig(defaultImage, {
      [condition]: afterImage
    });
  }

  /**
   * Create an NPC-based image configuration
   * @param {string} defaultImage - Default image when no special NPCs present
   * @param {Object} npcImages - Object mapping NPC IDs to image files
   * @returns {Object} - Image configuration object
   */
  createNPCBasedImageConfig(defaultImage, npcImages = {}) {
    const conditions = {};
    for (const [npcId, imageName] of Object.entries(npcImages)) {
      conditions[`npc:${npcId}`] = imageName;
    }
    return this.createConditionalImageConfig(defaultImage, conditions);
  }

  /**
   * Ensure image name has a valid extension
   * @param {string} imageName - Image name with or without extension
   * @returns {string} - Image name with extension (defaults to .png)
   */
  ensureImageExtension(imageName) {
    if (!imageName) return imageName;
    
    // Check if it already has a valid extension
    const hasExtension = this.imageExtensions.some(ext => 
      imageName.toLowerCase().endsWith(ext)
    );
    
    if (hasExtension) {
      return imageName;
    }
    
    // Add .png as default extension
    return `${imageName}.png`;
  }

  /**
   * Standardize condition names to use consistent format
   * @param {string} condition - Condition name (can be shorthand or full)
   * @returns {string} - Standardized condition string
   */
  standardizeCondition(condition) {
    // If it's already a standard condition, return as-is
    if (condition.includes(':')) {
      return condition;
    }
    
    // Check if it's a shorthand condition
    const upperCondition = condition.toUpperCase();
    if (this.standardConditions[upperCondition]) {
      return this.standardConditions[upperCondition];
    }
    
    // Assume it's a flag name if no prefix
    return `flag:${condition}`;
  }

  /**
   * Generate suggested image names based on location ID
   * @param {string} locationId - Location identifier
   * @returns {Object} - Suggested image names for different states
   */
  generateImageSuggestions(locationId) {
    const baseName = this.locationIdToImageName(locationId);
    
    return {
      default: `${baseName}.png`,
      night: `${baseName}_night.png`,
      day: `${baseName}_day.png`,
      empty: `${baseName}_empty.png`,
      populated: `${baseName}_populated.png`,
      before: `${baseName}_before.png`,
      after: `${baseName}_after.png`,
      peaceful: `${baseName}_peaceful.png`,
      dangerous: `${baseName}_dangerous.png`
    };
  }

  /**
   * Convert location ID to a standardized image name
   * @param {string} locationId - Location identifier
   * @returns {string} - Standardized image base name
   */
  locationIdToImageName(locationId) {
    return locationId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('_');
  }

  /**
   * Validate and add image configuration to a location
   * @param {Object} location - Location object to modify
   * @param {Object} imageConfig - Image configuration to add
   * @param {string} locationId - Location identifier for error reporting
   * @returns {Promise<Object>} - Validation result
   */
  async addImageConfigToLocation(location, imageConfig, locationId) {
    // Validate the image configuration
    const validation = await imageValidator.validateLocationImages(imageConfig, locationId);
    
    if (validation.valid) {
      location.images = imageConfig;
      console.log(`✅ Added image configuration to location '${locationId}'`);
    } else {
      console.warn(`⚠️ Image configuration for '${locationId}' has missing images:`, validation.missingImages);
      // Still add the configuration but warn about missing images
      location.images = imageConfig;
    }
    
    return validation;
  }

  /**
   * Quick setup function for adding a simple image to a location
   * @param {Object} gameData - Game data object
   * @param {string} locationId - Location to modify
   * @param {string} imageName - Image file name
   * @returns {Promise<boolean>} - Success status
   */
  async quickAddImage(gameData, locationId, imageName) {
    const location = gameData.locations[locationId];
    if (!location) {
      console.error(`❌ Location '${locationId}' not found`);
      return false;
    }

    const imageConfig = this.createSimpleImageConfig(imageName);
    const validation = await this.addImageConfigToLocation(location, imageConfig, locationId);
    
    return validation.valid;
  }

  /**
   * Get available image files in the assets directory
   * Note: This would need to be implemented based on your build system
   * For now, returns common image patterns
   * @returns {Array} - Array of available image file names
   */
  getAvailableImages() {
    // This would ideally read from the actual assets directory
    // For now, return some common patterns based on the codebase
    return [
      'Village_Entrance.png',
      'Cottage.png',
      'Forest_Path.png',
      'Wolf_Children.png',
      'crossroads.png',
      'village_outskirts.png',
      'cave_entrance.png',
      'cave_interior.png',
      'forest_clearing.png'
    ];
  }

  /**
   * Print helpful documentation for adding images
   * @returns {string} - Documentation text
   */
  getDocumentation() {
    return `
# Image Configuration Guide

## Quick Setup (Most Common)
\`\`\`javascript
// Add a simple image to a location
imageHelpers.quickAddImage(gameData, 'my_location', 'My_Location.png');

// Or manually create simple config
location.images = imageHelpers.createSimpleImageConfig('My_Location.png');
\`\`\`

## Conditional Images
\`\`\`javascript
// Time-based (day/night)
location.images = imageHelpers.createTimeBasedImageConfig(
  'Village_Day.png',
  'Village_Night.png'
);

// Event-based (before/after)
location.images = imageHelpers.createEventBasedImageConfig(
  'Cave_Entrance.png',
  'defeatedCaveCreature',
  'Cave_Entrance_Cleared.png'
);

// NPC-based
location.images = imageHelpers.createNPCBasedImageConfig(
  'Village_Empty.png',
  { 'village_elder': 'Village_With_Elder.png' }
);

// Custom conditions
location.images = imageHelpers.createConditionalImageConfig(
  'Default.png',
  {
    'savedChildren': 'After_Rescue.png',
    'NIGHT': 'Night_Version.png'
  }
);
\`\`\`

## Image Naming Conventions
- Use PascalCase with underscores: \`Village_Entrance.png\`
- Add descriptive suffixes: \`_night\`, \`_empty\`, \`_after\`, \`_peaceful\`
- Extensions are optional (defaults to .png)

## Validation
\`\`\`javascript
// Validate all location images
const report = await imageValidator.validateAllLocationImages(gameData);
console.log(report.summary);
\`\`\`
`;
  }
}

/**
 * Image preloader class for caching and managing image loading
 */
class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.commonImages = [
      'src/assets/images/Wolf_Children.png',
      'src/assets/images/Wolf_Attacks.png',
      'src/assets/images/Forest_Path.png',
      'src/assets/images/Cottage.png',
      'src/assets/images/Village_Entrance.png'
    ];
  }

  /**
   * Preload an image and cache it
   * @param {string} imagePath - Path to the image
   * @returns {Promise<HTMLImageElement>} Promise that resolves to the loaded image
   */
  preload(imagePath) {
    if (this.cache.has(imagePath)) {
      return Promise.resolve(this.cache.get(imagePath));
    }

    if (this.loadingPromises.has(imagePath)) {
      return this.loadingPromises.get(imagePath);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(imagePath, img);
        this.loadingPromises.delete(imagePath);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(imagePath);
        reject(new Error(`Failed to load image: ${imagePath}`));
      };
      img.src = imagePath;
    });

    this.loadingPromises.set(imagePath, promise);
    return promise;
  }

  /**
   * Preload commonly used event images for smoother transitions
   * @returns {Promise<void>} Promise that resolves when all common images are loaded
   */
  async preloadCommonImages() {
    const promises = this.commonImages.map(imagePath => 
      this.preload(imagePath).catch(error => {
        console.warn(`Failed to preload common image: ${imagePath}`, error);
        return null;
      })
    );
    
    await Promise.all(promises);
    console.log(`Preloaded ${this.cache.size} common images`);
  }

  /**
   * Preload images for a specific location based on its configuration
   * @param {Object} locationData - Location data from gameData
   * @param {Object} gameState - Current game state for condition evaluation
   */
  async preloadLocationImages(locationData, gameState) {
    if (!locationData.images) return;

    const imagesToPreload = [];
    
    // Add default image
    if (locationData.images.default) {
      imagesToPreload.push(locationData.images.default);
    }

    // Add conditional images that might be shown
    Object.entries(locationData.images).forEach(([condition, imagePath]) => {
      if (condition !== 'default' && imagePath) {
        imagesToPreload.push(imagePath);
      }
    });

    // Preload all images for this location
    const promises = imagesToPreload.map(imagePath => 
      this.preload(imagePath).catch(error => {
        console.warn(`Failed to preload location image: ${imagePath}`, error.message || error);
        return null;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get a cached image if available
   * @param {string} imagePath - Path to the image
   * @returns {HTMLImageElement|null} Cached image or null
   */
  getCached(imagePath) {
    return this.cache.get(imagePath) || null;
  }

  /**
   * Check if an image is cached
   * @param {string} imagePath - Path to the image
   * @returns {boolean} True if cached
   */
  isCached(imagePath) {
    return this.cache.has(imagePath);
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      cachedImages: this.cache.size,
      loadingImages: this.loadingPromises.size,
      totalMemoryUsage: Array.from(this.cache.values()).reduce((total, img) => {
        return total + (img.width * img.height * 4); // Rough estimate in bytes
      }, 0)
    };
  }
}

// Export singleton instances
export const imageHelpers = new ImageHelpers();
export const imagePreloader = new ImagePreloader();

// Export convenience functions
export const quickAddImage = (gameData, locationId, imageName) => 
  imageHelpers.quickAddImage(gameData, locationId, imageName);

export const createSimpleImageConfig = (imageName) => 
  imageHelpers.createSimpleImageConfig(imageName);

export const createConditionalImageConfig = (defaultImage, conditions) => 
  imageHelpers.createConditionalImageConfig(defaultImage, conditions);

export const createTimeBasedImageConfig = (defaultImage, nightImage) => 
  imageHelpers.createTimeBasedImageConfig(defaultImage, nightImage);

export const createEventBasedImageConfig = (defaultImage, flagName, afterImage) => 
  imageHelpers.createEventBasedImageConfig(defaultImage, flagName, afterImage);