// Image validation system for location images
// Provides validation and error handling for missing image files

export class ImageValidator {
  constructor() {
    this.validatedImages = new Map(); // Cache validation results
    this.missingImages = new Set();
    this.imageBasePath = 'src/assets/images/';
  }

  /**
   * Validate that an image file exists
   * @param {string} imagePath - Path to image file (relative to assets/images/)
   * @returns {Promise<boolean>} - True if image exists, false otherwise
   */
  async validateImageExists(imagePath) {
    // Return cached result if available
    if (this.validatedImages.has(imagePath)) {
      return this.validatedImages.get(imagePath);
    }

    try {
      // Create a new image element to test if file exists
      const img = new Image();
      const exists = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `assets/images/${imagePath}`;
      });

      // Cache the result
      this.validatedImages.set(imagePath, exists);
      
      if (!exists) {
        this.missingImages.add(imagePath);
        console.warn(`Image not found: ${imagePath}`);
      }

      return exists;
    } catch (error) {
      console.error(`Error validating image ${imagePath}:`, error);
      this.validatedImages.set(imagePath, false);
      this.missingImages.add(imagePath);
      return false;
    }
  }

  /**
   * Validate all images in a location's image configuration
   * @param {Object} imageConfig - Location's images configuration
   * @param {string} locationId - Location identifier for error reporting
   * @returns {Promise<Object>} - Validation results with missing images
   */
  async validateLocationImages(imageConfig, locationId) {
    const results = {
      valid: true,
      missingImages: [],
      warnings: []
    };

    if (!imageConfig) {
      results.warnings.push(`Location '${locationId}' has no image configuration`);
      return results;
    }

    // Validate default image
    if (imageConfig.default) {
      const isFile = this.isImageFile(imageConfig.default);
      if (isFile) {
        const exists = await this.validateImageExists(imageConfig.default);
        if (!exists) {
          results.valid = false;
          results.missingImages.push({
            type: 'default',
            path: imageConfig.default,
            location: locationId
          });
        }
      }
    }

    // Validate conditional images
    if (imageConfig.conditions) {
      for (const [condition, imagePath] of Object.entries(imageConfig.conditions)) {
        const isFile = this.isImageFile(imagePath);
        if (isFile) {
          const exists = await this.validateImageExists(imagePath);
          if (!exists) {
            results.valid = false;
            results.missingImages.push({
              type: 'conditional',
              condition: condition,
              path: imagePath,
              location: locationId
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Validate all location images in gameData
   * @param {Object} gameData - Game data object with locations
   * @returns {Promise<Object>} - Complete validation report
   */
  async validateAllLocationImages(gameData) {
    const report = {
      totalLocations: 0,
      locationsWithImages: 0,
      locationsWithoutImages: [],
      validLocations: [],
      invalidLocations: [],
      allMissingImages: [],
      summary: ''
    };

    for (const [locationId, location] of Object.entries(gameData.locations)) {
      report.totalLocations++;

      if (!location.images) {
        report.locationsWithoutImages.push(locationId);
        continue;
      }

      report.locationsWithImages++;
      const validation = await this.validateLocationImages(location.images, locationId);

      if (validation.valid) {
        report.validLocations.push(locationId);
      } else {
        report.invalidLocations.push({
          locationId,
          missingImages: validation.missingImages
        });
        report.allMissingImages.push(...validation.missingImages);
      }
    }

    // Generate summary
    report.summary = this.generateValidationSummary(report);
    return report;
  }

  /**
   * Check if a string represents an image file (has image extension)
   * @param {string} path - Path or scene name to check
   * @returns {boolean} - True if it's an image file
   */
  isImageFile(path) {
    return /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(path);
  }

  /**
   * Generate a human-readable validation summary
   * @param {Object} report - Validation report
   * @returns {string} - Formatted summary
   */
  generateValidationSummary(report) {
    let summary = `Image Validation Report:\n`;
    summary += `- Total locations: ${report.totalLocations}\n`;
    summary += `- Locations with image config: ${report.locationsWithImages}\n`;
    summary += `- Locations without image config: ${report.locationsWithoutImages.length}\n`;
    summary += `- Valid image configurations: ${report.validLocations.length}\n`;
    summary += `- Invalid image configurations: ${report.invalidLocations.length}\n`;
    summary += `- Total missing images: ${report.allMissingImages.length}\n`;

    if (report.locationsWithoutImages.length > 0) {
      summary += `\nLocations without image config:\n`;
      report.locationsWithoutImages.forEach(loc => {
        summary += `  - ${loc}\n`;
      });
    }

    if (report.allMissingImages.length > 0) {
      summary += `\nMissing images:\n`;
      report.allMissingImages.forEach(img => {
        summary += `  - ${img.path} (${img.type} for ${img.location})\n`;
      });
    }

    return summary;
  }

  /**
   * Get suggestions for fixing missing images
   * @param {Array} missingImages - Array of missing image objects
   * @returns {Array} - Array of suggestion objects
   */
  getSuggestions(missingImages) {
    const suggestions = [];
    const availableImages = this.getAvailableImages(); // Would need to be implemented

    missingImages.forEach(missing => {
      const suggestion = {
        missing: missing.path,
        location: missing.location,
        suggestions: []
      };

      // Suggest similar named files
      const baseName = missing.path.replace(/\.[^/.]+$/, '').toLowerCase();
      availableImages.forEach(available => {
        const availableBase = available.replace(/\.[^/.]+$/, '').toLowerCase();
        if (availableBase.includes(baseName) || baseName.includes(availableBase)) {
          suggestion.suggestions.push(available);
        }
      });

      suggestions.push(suggestion);
    });

    return suggestions;
  }

  /**
   * Clear validation cache (useful when images are added/removed)
   */
  clearCache() {
    this.validatedImages.clear();
    this.missingImages.clear();
  }

  /**
   * Get all missing images found during validation
   * @returns {Set} - Set of missing image paths
   */
  getMissingImages() {
    return new Set(this.missingImages);
  }
}

// Export singleton instance
export const imageValidator = new ImageValidator();