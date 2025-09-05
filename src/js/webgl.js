// WebGL rendering system for the game

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.textures = {};
    this.currentScene = null;
    this.dynamicImage = null;
    
    this.init();
  }
  
  init() {
    // Initialize WebGL context
    try {
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
      
      // Set canvas size to match container
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      
      // Initialize shaders and program
      this.initShaders();
      
      // Set up buffers
      this.initBuffers();
      
      // Enable depth testing
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      
      // Clear color
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      
      console.log('WebGL initialized successfully');
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      
      // Display fallback message on canvas
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = '16px Courier New';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('WebGL not supported or initialization failed.', this.canvas.width / 2, this.canvas.height / 2);
      }
    }
  }
  
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  initShaders() {
    // Vertex shader source
    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying highp vec2 vTextureCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `;
    
    // Fragment shader source
    const fsSource = `
      varying highp vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      
      void main() {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
    `;
    
    // Create shader program
    const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);
    
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.program));
    }
    
    // Store attribute and uniform locations
    this.programInfo = {
      program: this.program,
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'),
        textureCoord: this.gl.getAttribLocation(this.program, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
        modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
        uSampler: this.gl.getUniformLocation(this.program, 'uSampler'),
      },
    };
  }
  
  loadShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('An error occurred compiling the shaders: ' + info);
    }
    
    return shader;
  }
  
  initBuffers() {
    // Create position buffer for a quad
    const positions = [
      -1.0, -1.0,  0.0,
       1.0, -1.0,  0.0,
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
    ];
    
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    // Create texture coordinate buffer
    const textureCoordinates = [
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
    ];
    
    this.textureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);
    
    // Create index buffer
    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];
    
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
  }
  
  loadTexture(url) {
    return new Promise((resolve, reject) => {
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      
      // Fill with a placeholder color until the image loads
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, 
        this.gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255])
      );
      
      // Load the image
      const image = new Image();
      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, 
          this.gl.UNSIGNED_BYTE, image
        );
        
        // Generate mipmaps if the image dimensions are powers of 2
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
          this.gl.generateMipmap(this.gl.TEXTURE_2D);
        } else {
          // Otherwise set texture parameters for non-power-of-2 textures
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
        
        resolve(texture);
      };
      
      image.onerror = () => {
        reject(new Error(`Failed to load texture: ${url}`));
      };
      
      image.src = url;
    });
    
    function isPowerOf2(value) {
      return (value & (value - 1)) === 0;
    }
  }
  
  async loadScene(sceneName) {
    try {
      // Load scene texture - try different formats
      let texture;
      const formats = ['svg', 'jpg', 'png'];
      
      for (const format of formats) {
        try {
          texture = await this.loadTexture(`assets/images/${sceneName}.${format}`);
          break;
        } catch (e) {
          // Try next format
        }
      }

      if (!texture) {
        // Fallback logic for different scene types
        const forestScenes = ['forest_path', 'forest_path_north', 'forest_path_south', 'forest_path_east', 'forest_path_west', 'crossroads'];
        const villageScenes = ['village_smithy', 'village_inn', 'village_elder_house', 'village_market'];
        const caveScenes = ['cave_entrance', 'cave_interior', 'creature_den_entrance', 'creature_den_interior'];
        const dungeonScenes = ['dungeon_entrance', 'dungeon_corridor', 'dungeon_chamber', 'underground_passage'];
        const castleScenes = ['castle_entrance', 'castle_courtyard', 'castle_hall', 'throne_room'];
        const hillScenes = ['hillside', 'mountain_path', 'rocky_outcrop', 'cliff_edge'];
        
        let fallbackImage;
        if (sceneName === 'village_entrance') {
          fallbackImage = 'Village_Entrance.png';
        } else if (sceneName === 'village_square') {
          fallbackImage = 'Cottage.png'; // Use Cottage.png for village square as it's more central/domestic
        } else if (sceneName === 'village_outskirts') {
          fallbackImage = 'Wolf_Children.png'; // Default image for village outskirts
        } else if (forestScenes.includes(sceneName)) {
          fallbackImage = 'Forest_Path.png';
        } else if (villageScenes.includes(sceneName)) {
          fallbackImage = 'Forest_Path.png'; // Use Forest_Path.png as default for village buildings
        } else if (caveScenes.includes(sceneName)) {
          fallbackImage = 'Cave_Entrance.png';
        } else if (dungeonScenes.includes(sceneName)) {
          fallbackImage = 'Dungeon_Entrance.png';
        } else if (castleScenes.includes(sceneName)) {
          fallbackImage = 'Castle_Entrance.png';
        } else if (hillScenes.includes(sceneName)) {
          fallbackImage = 'Hillside.png';
        } else {
          fallbackImage = 'Forest_Path.png';
        }
        
        texture = await this.loadTexture(`assets/images/${fallbackImage}`);
      }
      
      this.textures[sceneName] = texture;
      this.currentScene = sceneName;
      return true;
    } catch (error) {
      console.error('Failed to load scene:', error);
      return false;
    }
  }
  
  render(sceneName) {
    if (!this.gl) return;
    
    console.log(`[WebGL] Rendering scene: ${sceneName}`);
    
    // Try to load the scene if it's not already loaded
    if (this.currentScene !== sceneName) {
      if (!this.textures[sceneName]) {
        console.log(`[WebGL] Loading scene texture for: ${sceneName}`);
        this.loadScene(sceneName).then(() => this.render(sceneName));
        return;
      }
      this.currentScene = sceneName;
    }
    
    // Clear the canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // If we don't have the texture yet, don't render
    if (!this.textures[sceneName]) return;
    
    // Set up perspective matrix
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    
    // Set up model view matrix
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -4.0]);
    
    // Bind position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      3,        // numComponents
      this.gl.FLOAT, // type
      false,    // normalize
      0,        // stride
      0         // offset
    );
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
    
    // Bind texture coordinate buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.textureCoord,
      2,        // numComponents
      this.gl.FLOAT, // type
      false,    // normalize
      0,        // stride
      0         // offset
    );
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
    
    // Bind index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    // Use shader program
    this.gl.useProgram(this.programInfo.program);
    
    // Set uniforms
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );
    
    // Bind texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[sceneName]);
    this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
    
    // Draw
    this.gl.drawElements(
      this.gl.TRIANGLES,
      6,  // vertex count
      this.gl.UNSIGNED_SHORT, // type
      0   // offset
    );
  }
  
  // Set the current scene for rendering
  setScene(sceneData) {
    if (!sceneData) {
      console.warn('[WebGL] No scene data provided to setScene');
      return;
    }
    
    // Handle both string scene names and scene objects
    if (typeof sceneData === 'string') {
      // Scene data is just a scene name string
      this.currentScene = sceneData;
        this.dynamicImage = null; // Clear any dynamic image when setting a new scene
      this.render(sceneData);
    } else {
      // Scene data is an object with properties
      this.currentSceneData = sceneData;
      
      // If scene has a background, load it as the current scene
      if (sceneData.background) {
        const sceneName = sceneData.id || sceneData.background.replace(/\.[^/.]+$/, ""); // Remove extension
        this.currentScene = sceneName;
        this.dynamicImage = null;
        this.render(sceneName);
      } else if (sceneData.id) {
        this.currentScene = sceneData.id;
        this.dynamicImage = null;
        this.render(sceneData.id);
      }
    }
  }
  
  /**
   * Set a dynamic scene image that overlays or replaces the current scene
   * @param {string|null|Object} imageConfig - Image URL, null to restore, or config object
   * @param {Object} options - Additional options for image management
   */
  setDynamicSceneImage(imageConfig, options = {}) {
    if (!this.gl) return;
    
    // Handle legacy string/null input
    if (typeof imageConfig === 'string' || imageConfig === null) {
      imageConfig = { url: imageConfig };
    }
    
    const { url, priority = 'normal', persistent = false, transition = 'fade' } = imageConfig;
    const { delay = 100, preload = false, usePreloader = true } = options;
    
    if (!url) {
      // Restore original scene texture
      this.clearDynamicImage();
      return;
    }
    
    // Check priority against current dynamic image
    if (this.shouldSkipDueToLowerPriority({ priority })) {
      console.log(`[WebGL] Skipping dynamic image due to lower priority: ${url}`);
      return;
    }
    
    // Store the current config for priority checking
    this.currentDynamicConfig = { url, priority, persistent, transition };
    
    // Check if image is already cached in preloader
    if (usePreloader && window.imagePreloader) {
      const cachedImage = window.imagePreloader.getCachedImage(url);
      if (cachedImage) {
        this.applyDynamicImage(url, { ...imageConfig, cached: true });
        return;
      }
    }
    
    // Check if image should be preloaded
    if (preload) {
      this.queueImageForPreload(url);
    }
    
    // Load the new texture with configurable delay
    setTimeout(() => {
      this.loadTexture(url).then(texture => {
        if (texture && this.currentScene && this.currentDynamicConfig && this.currentDynamicConfig.url === url) {
          this.applyDynamicImage(url, { ...imageConfig, texture });
        }
      }).catch(error => {
        console.error(`[WebGL] Failed to load dynamic image: ${url}`, error);
        // Clear dynamic image state on error
        if (this.currentDynamicConfig && this.currentDynamicConfig.url === url) {
          this.clearDynamicImage();
        }
      });
    }, delay);
  }
  
  /**
   * Check if a new dynamic image should be skipped due to lower priority
   * @param {Object} newConfig - New image configuration
   * @returns {boolean} True if should skip
   */
  shouldSkipDueToLowerPriority(newConfig) {
    if (!this.dynamicImage) return false;
    
    const priorities = { low: 1, normal: 2, high: 3, critical: 4 };
    const currentPriority = priorities[this.dynamicImage.priority] || 2;
    const newPriority = priorities[newConfig.priority] || 2;
    
    return newPriority < currentPriority;
  }
  
  /**
   * Clear the current dynamic image and restore original scene
   */
  clearDynamicImage() {
    this.currentDynamicConfig = null;
    this.restoreOriginalScene();
  }
  
  /**
   * Force set a dynamic image regardless of priority
   * @param {string|Object} imageConfig - Image configuration
   * @param {Object} options - Additional options
   */
  forceDynamicSceneImage(imageConfig, options = {}) {
    // Clear current dynamic state first
    this.currentDynamicConfig = null;
    this.dynamicImage = null;
    
    // Set the new image with critical priority
    const config = typeof imageConfig === 'string' 
      ? { url: imageConfig, priority: 'critical', ...options }
      : { priority: 'critical', ...imageConfig, ...options };
      
    this.setDynamicSceneImage(config);
  }
  
  /**
   * Apply a dynamic image to the current scene
   * @param {string} url - Image URL
   * @param {Object} config - Image configuration
   */
  applyDynamicImage(url, config = {}) {
    const { texture, priority = 'normal', persistent = false, transition = 'fade', cached = false } = config;
    
    if (!this.currentScene) return;
    
    // Store original texture if not already stored
    if (!this.textures[this.currentScene + '_original']) {
      this.textures[this.currentScene + '_original'] = this.textures[this.currentScene];
    }
    
    // Store current dynamic image info
    this.dynamicImage = {
      url,
      priority,
      persistent,
      transition,
      cached,
      timestamp: Date.now()
    };
    
    // Replace current scene texture with dynamic image
    if (texture) {
      this.textures[this.currentScene] = texture;
    }
    
    // Apply fade-in effect if not cached
    if (transition === 'fade' && !cached) {
      this.applyFadeInEffect();
    }
    
    this.render(this.currentScene);
  }
  
  /**
   * Apply a fade-in effect for dynamic images
   */
  applyFadeInEffect() {
    // Simple fade-in implementation using opacity changes
    if (this.gl) {
      // This could be enhanced with actual shader-based fading
      // For now, just ensure smooth rendering
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
  }
  
  /**
   * Restore the original scene texture
   */
  restoreOriginalScene() {
    if (this.currentScene && this.textures[this.currentScene + '_original']) {
      this.textures[this.currentScene] = this.textures[this.currentScene + '_original'];
      delete this.textures[this.currentScene + '_original'];
      this.render(this.currentScene);
    } else if (this.currentScene) {
      // Clear cache and reload original scene
      delete this.textures[this.currentScene];
      this.loadScene(this.currentScene).then(() => {
        this.render(this.currentScene);
      });
    }
    this.dynamicImage = null;
    this.currentDynamicConfig = null;
  }
  
  /**
   * Queue an image for preloading
   * @param {string} imageUrl - URL of the image to preload
   */
  queueImageForPreload(imageUrl) {
    // Add to preload queue if not already cached
    if (!this.textures[imageUrl.split('/').pop().split('.')[0]]) {
      this.preloadImages([imageUrl]);
    }
  }
  
  /**
   * Clear dynamic image if it matches certain criteria
   * @param {Object} criteria - Criteria for clearing (priority, age, etc.)
   */
  clearDynamicImageIf(criteria = {}) {
    if (!this.dynamicImage) return;
    
    const { maxAge, priority, persistent } = criteria;
    
    // Don't clear persistent images unless explicitly requested
    if (this.dynamicImage.persistent && !criteria.forceClear) {
      return;
    }
    
    // Clear based on age
    if (maxAge && (Date.now() - this.dynamicImage.timestamp) > maxAge) {
      this.restoreOriginalScene();
      return;
    }
    
    // Clear based on priority
    if (priority && this.dynamicImage.priority === priority) {
      this.restoreOriginalScene();
      return;
    }
  }
  
  // Memory flash effect methods
  setMemoryFlashImage(imageUrl) {
    // Store the flash image for later use
    this.memoryFlashImage = imageUrl;
  }
  
  updateMemoryFlash(progress, memoryData) {
    // Update memory flash effect based on progress (0.0 to 1.0)
    this.memoryFlashProgress = progress;
    this.currentMemoryData = memoryData;
    
    // Apply flash effect to the current scene
    if (this.gl && this.currentScene) {
      // Create a flash overlay effect
      const flashIntensity = Math.sin(progress * Math.PI) * 0.3; // Fade in and out
      this.applyFlashOverlay(flashIntensity);
    }
  }
  
  clearMemoryFlash() {
    // Clear memory flash effects
    this.memoryFlashProgress = 0;
    this.currentMemoryData = null;
    this.memoryFlashImage = null;
  }
  
  applyFlashOverlay(intensity) {
    if (!this.gl || intensity <= 0) return;
    
    // Save current blend state
    const blendEnabled = this.gl.isEnabled(this.gl.BLEND);
    
    // Enable blending for overlay effect
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Create a white overlay with the specified intensity
    this.gl.clearColor(1.0, 1.0, 1.0, intensity);
    
    // Restore previous blend state
    if (!blendEnabled) {
      this.gl.disable(this.gl.BLEND);
    }
  }

  // Helper methods for common image patterns
  
  /**
   * Set scene image based on game state flags
   * @param {string} sceneName - Base scene name
   * @param {Object} gameState - Game state object with flags
   * @param {Object} imageMap - Map of flag conditions to image URLs
   */
  setConditionalSceneImage(sceneName, gameState, imageMap) {
    // Check conditions in priority order
    for (const [condition, imageUrl] of Object.entries(imageMap)) {
      if (this.evaluateCondition(condition, gameState)) {
        this.setDynamicSceneImage(imageUrl);
        return;
      }
    }
    // If no conditions match, use base scene
    this.setScene(sceneName);
  }

  /**
   * Evaluate a condition string against game state
   * @param {string} condition - Condition string (e.g., "flag:savedChildren", "!flag:wolfDefeated")
   * @param {Object} gameState - Game state object
   */
  evaluateCondition(condition, gameState) {
    if (condition.startsWith('!flag:')) {
      const flagName = condition.substring(6);
      return !gameState.getFlag(flagName);
    } else if (condition.startsWith('flag:')) {
      const flagName = condition.substring(5);
      return gameState.getFlag(flagName);
    } else if (condition.startsWith('npc:')) {
      const npcId = condition.substring(4);
      // Check if NPC is present in current location
      const currentLocation = gameState.getCurrentLocationData();
      return currentLocation && currentLocation.npcs && currentLocation.npcs.includes(npcId);
    } else if (condition.startsWith('!npc:')) {
      const npcId = condition.substring(5);
      // Check if NPC is NOT present in current location
      const currentLocation = gameState.getCurrentLocationData();
      return !currentLocation || !currentLocation.npcs || !currentLocation.npcs.includes(npcId);
    } else if (condition.startsWith('location:')) {
      const locationName = condition.substring(9);
      return gameState.currentLocation === locationName;
    } else if (condition.startsWith('time:')) {
      // For now, always return false for time conditions (can be enhanced later)
      return false;
    }
    return false;
  }

  /**
   * Set scene with time-based variants (day/night)
   * @param {string} baseScene - Base scene name
   * @param {string} timeOfDay - 'day' or 'night'
   */
  setTimeBasedScene(baseScene, timeOfDay = 'day') {
    const timeVariant = `${baseScene}_${timeOfDay}`;
    // Try time-specific variant first, fall back to base scene
    this.loadScene(timeVariant).then(success => {
      if (success) {
        this.render(timeVariant);
      } else {
        this.setScene(baseScene);
      }
    });
  }

  /**
   * Preload multiple images for smoother transitions
   * @param {Array<string>} imageUrls - Array of image URLs to preload
   */
  async preloadImages(imageUrls) {
    const preloadPromises = imageUrls.map(url => {
      // Extract scene name from URL for caching
      const sceneName = url.split('/').pop().split('.')[0];
      return this.loadTexture(url).then(texture => {
        if (texture) {
          this.textures[sceneName] = texture;
        }
        return texture;
      }).catch(error => {
        console.warn(`Failed to preload image: ${url}`, error);
        return null;
      });
    });
    
    const results = await Promise.all(preloadPromises);
    return results.filter(texture => texture !== null);
  }

  /**
   * Get appropriate scene image based on NPC presence and states
   * @param {string} baseScene - Base scene name
   * @param {Array} npcs - Array of NPCs in the location
   * @param {Object} npcImageMap - Map of NPC conditions to images
   */
  setNPCBasedScene(baseScene, npcs, npcImageMap) {
    for (const [npcCondition, imageUrl] of Object.entries(npcImageMap)) {
      const [npcId, state] = npcCondition.split(':');
      if (npcs.includes(npcId)) {
        if (!state || state === 'present') {
          this.setDynamicSceneImage(imageUrl);
          return;
        }
      }
    }
    // No special NPCs, use base scene
    this.setScene(baseScene);
  }
}

// Helper function to create a mat4 identity matrix
const mat4 = {
  create: function() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },
  
  perspective: function(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    
    return out;
  },
  
  translate: function(out, a, v) {
    const x = v[0], y = v[1], z = v[2];
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
      a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
      a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
      
      out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
      out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
      out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
      
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    
    return out;
  }
};

// Export the WebGL initialization function
export function initWebGL(canvas) {
  return new WebGLRenderer(canvas);
}