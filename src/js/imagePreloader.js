// Image preloading system for smoother transitions
// Caches commonly used images to avoid loading delays

export class ImagePreloader {
  constructor() {
    this.cache = new Map(); // Map of image URLs to Image objects
    this.loadingPromises = new Map(); // Track ongoing loads
    this.preloadQueue = [];
    this.maxCacheSize = 50; // Limit cache size
    this.basePath = 'assets/images/';
  }

  /**
   * Preload a single image
   * @param {string} imagePath - Path to image (relative to assets/images/)
   * @returns {Promise<HTMLImageElement>} - Promise that resolves to loaded image
   */
  async preloadImage(imagePath) {
    const fullPath = imagePath.startsWith('assets/') ? imagePath : `${this.basePath}${imagePath}`;
    
    // Return cached image if available
    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(fullPath)) {
      return this.loadingPromises.get(fullPath);
    }

    // Create new loading promise
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Add to cache
        this.addToCache(fullPath, img);
        this.loadingPromises.delete(fullPath);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${fullPath}`);
        this.loadingPromises.delete(fullPath);
        reject(new Error(`Failed to load image: ${fullPath}`));
      };
      
      img.src = fullPath;
    });

    this.loadingPromises.set(fullPath, loadPromise);
    return loadPromise;
  }

  /**
   * Preload multiple images
   * @param {Array<string>} imagePaths - Array of image paths
   * @returns {Promise<Array>} - Promise that resolves when all images are loaded
   */
  async preloadImages(imagePaths) {
    const promises = imagePaths.map(path => this.preloadImage(path));
    return Promise.allSettled(promises);
  }

  /**
   * Preload images from a location's image configuration
   * @param {Object} imageConfig - Location's images configuration
   * @returns {Promise<Array>} - Promise that resolves when all images are loaded
   */
  async preloadLocationImages(imageConfig) {
    if (!imageConfig) return [];

    const imagesToLoad = [];
    
    // Add default image
    if (imageConfig.default && this.isImageFile(imageConfig.default)) {
      imagesToLoad.push(imageConfig.default);
    }
    
    // Add conditional images
    if (imageConfig.conditions) {
      for (const imagePath of Object.values(imageConfig.conditions)) {
        if (this.isImageFile(imagePath)) {
          imagesToLoad.push(imagePath);
        }
      }
    }

    return this.preloadImages(imagesToLoad);
  }

  /**
   * Preload all images from gameData locations
   * @param {Object} gameData - Game data object with locations
   * @returns {Promise<Object>} - Preload results summary
   */
  async preloadAllLocationImages(gameData) {
    const results = {
      totalImages: 0,
      successfulLoads: 0,
      failedLoads: 0,
      failedImages: []
    };

    const allPromises = [];
    
    for (const [locationId, location] of Object.entries(gameData.locations)) {
      if (location.images) {
        const locationPromises = await this.preloadLocationImages(location.images);
        allPromises.push(...locationPromises);
      }
    }

    results.totalImages = allPromises.length;
    
    // Wait for all preload attempts to complete
    const settledResults = await Promise.allSettled(allPromises);
    
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.successfulLoads++;
      } else {
        results.failedLoads++;
        results.failedImages.push(result.reason?.message || 'Unknown error');
      }
    });

    console.log(`Image preloading complete: ${results.successfulLoads}/${results.totalImages} images loaded`);
    if (results.failedLoads > 0) {
      console.warn(`Failed to load ${results.failedLoads} images:`, results.failedImages);
    }

    return results;
  }

  /**
   * Preload commonly used event images
   * @returns {Promise<Array>} - Promise that resolves when event images are loaded
   */
  async preloadEventImages() {
    const commonEventImages = [
      'Wolf_Children.png',
      'Battle_Aftermath.png',
      'Victory_Celebration.png',
      'Night_Scene.png',
      'Dawn_Scene.png'
    ];

    return this.preloadImages(commonEventImages);
  }

  /**
   * Add image to cache with size management
   * @param {string} path - Image path
   * @param {HTMLImageElement} img - Image element
   */
  addToCache(path, img) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(path, img);
  }

  /**
   * Get cached image if available
   * @param {string} imagePath - Path to image
   * @returns {HTMLImageElement|null} - Cached image or null
   */
  getCachedImage(imagePath) {
    const fullPath = imagePath.startsWith('assets/') ? imagePath : `${this.basePath}${imagePath}`;
    return this.cache.get(fullPath) || null;
  }

  /**
   * Check if image is cached
   * @param {string} imagePath - Path to image
   * @returns {boolean} - True if image is cached
   */
  isImageCached(imagePath) {
    const fullPath = imagePath.startsWith('assets/') ? imagePath : `${this.basePath}${imagePath}`;
    return this.cache.has(fullPath);
  }

  /**
   * Clear the image cache
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      cachedImages: this.cache.size,
      loadingImages: this.loadingPromises.size,
      maxCacheSize: this.maxCacheSize,
      cacheUsage: `${this.cache.size}/${this.maxCacheSize}`
    };
  }

  /**
   * Check if a string represents an image file
   * @param {string} path - Path to check
   * @returns {boolean} - True if it's an image file
   */
  isImageFile(path) {
    return /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(path);
  }

  /**
   * Preload images for upcoming locations based on current location
   * @param {Object} gameData - Game data object
   * @param {string} currentLocationId - Current location ID
   * @returns {Promise<Array>} - Promise that resolves when nearby images are loaded
   */
  async preloadNearbyLocationImages(gameData, currentLocationId) {
    const currentLocation = gameData.locations[currentLocationId];
    if (!currentLocation || !currentLocation.exits) {
      return [];
    }

    const nearbyImages = [];
    
    // Get images from connected locations
    for (const exitLocationId of Object.values(currentLocation.exits)) {
      const exitLocation = gameData.locations[exitLocationId];
      if (exitLocation && exitLocation.images) {
        const locationPromises = await this.preloadLocationImages(exitLocation.images);
        nearbyImages.push(...locationPromises);
      }
    }

    return Promise.allSettled(nearbyImages);
  }

  /**
   * Smart preloading based on game state and player behavior
   * @param {Object} gameData - Game data object
   * @param {Object} gameState - Current game state
   * @returns {Promise<Object>} - Preload results
   */
  async smartPreload(gameData, gameState) {
    const results = {
      currentLocation: [],
      nearbyLocations: [],
      eventImages: [],
      priorityImages: []
    };

    // Preload current location images
    const currentLocation = gameData.locations[gameState.currentLocation];
    if (currentLocation && currentLocation.images) {
      results.currentLocation = await this.preloadLocationImages(currentLocation.images);
    }

    // Preload nearby location images
    results.nearbyLocations = await this.preloadNearbyLocationImages(gameData, gameState.currentLocation);

    // Preload common event images
    results.eventImages = await this.preloadEventImages();

    // Preload priority images based on game state
    const priorityImages = this.getPriorityImages(gameState);
    if (priorityImages.length > 0) {
      results.priorityImages = await this.preloadImages(priorityImages);
    }

    return results;
  }

  /**
   * Get priority images to preload based on game state
   * @param {Object} gameState - Current game state
   * @returns {Array<string>} - Array of priority image paths
   */
  getPriorityImages(gameState) {
    const priorityImages = [];

    // Note: Night and celebration variants are handled by WebGL scenes, not separate image files
    // Removed references to non-existent image files to prevent 404 errors

    // Add cave images if player has map
    if (gameState.hasItem('map_to_den')) {
      priorityImages.push(
        'Cave_Entrance.png',
        'Cave_Interior.png',
        'Cave_Interior_creature.png'
      );
    }

    return priorityImages;
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader();

// Export convenience functions
export const preloadImage = (imagePath) => imagePreloader.preloadImage(imagePath);
export const preloadImages = (imagePaths) => imagePreloader.preloadImages(imagePaths);
export const getCachedImage = (imagePath) => imagePreloader.getCachedImage(imagePath);
export const isImageCached = (imagePath) => imagePreloader.isImageCached(imagePath);