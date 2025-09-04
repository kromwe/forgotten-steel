// Scene manager for loading and transitioning between game scenes

export class SceneManager {
  constructor(webglRenderer) {
    this.webglRenderer = webglRenderer;
    this.scenes = {};
    this.currentScene = null;
    this.transitionInProgress = false;
    this.transitionProgress = 0;
    this.transitionDuration = 1000; // ms
    this.transitionStartTime = 0;
    this.transitionFromScene = null;
    this.transitionToScene = null;
  }
  
  // Register a scene with the manager
  registerScene(id, sceneData) {
    this.scenes[id] = sceneData;
    
    // Preload scene textures if provided
    if (sceneData.textures) {
      for (const [key, url] of Object.entries(sceneData.textures)) {
        this.webglRenderer.loadTexture(url).then(texture => {
          sceneData.loadedTextures = sceneData.loadedTextures || {};
          sceneData.loadedTextures[key] = texture;
        });
      }
    }
  }
  
  // Set the current scene immediately (no transition)
  setScene(sceneId) {
    if (!this.scenes[sceneId]) {
      console.error(`Scene '${sceneId}' not found`);
      return false;
    }
    
    this.currentScene = this.scenes[sceneId];
    this.webglRenderer.setScene(this.currentScene);
    return true;
  }
  
  // Transition to a new scene with a fade effect
  transitionToScene(sceneId) {
    if (!this.scenes[sceneId]) {
      console.error(`Scene '${sceneId}' not found`);
      return false;
    }
    
    if (this.transitionInProgress) {
      console.warn('Scene transition already in progress');
      return false;
    }
    
    this.transitionInProgress = true;
    this.transitionProgress = 0;
    this.transitionStartTime = Date.now();
    this.transitionFromScene = this.currentScene;
    this.transitionToScene = this.scenes[sceneId];
    
    return true;
  }
  
  // Update the scene manager (call this in the game loop)
  update() {
    if (this.transitionInProgress) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(1.0, elapsed / this.transitionDuration);
      
      // Render the transition
      this.webglRenderer.renderTransition(
        this.transitionFromScene, 
        this.transitionToScene, 
        this.transitionProgress
      );
      
      // Check if transition is complete
      if (this.transitionProgress >= 1.0) {
        this.transitionInProgress = false;
        this.currentScene = this.transitionToScene;
        this.webglRenderer.setScene(this.currentScene);
      }
      
      return true; // Scene was updated
    }
    
    return false; // No update needed
  }
  
  // Get the current scene
  getCurrentScene() {
    return this.currentScene;
  }
  
  // Check if a scene exists
  hasScene(sceneId) {
    return !!this.scenes[sceneId];
  }
  
  // Create a default scene for locations without specific scene data
  createDefaultScene(locationName) {
    return {
      id: `default_${locationName.toLowerCase().replace(/\s+/g, '_')}`,
      name: locationName,
      background: 'placeholder.svg',
      objects: [],
      lighting: {
        ambient: [0.5, 0.5, 0.5],
        directional: {
          direction: [-0.5, -1.0, -0.5],
          color: [1.0, 1.0, 1.0],
          intensity: 0.7
        }
      }
    };
  }
}

// Scene object class for interactive elements in scenes
export class SceneObject {
  constructor(options) {
    this.id = options.id || `object_${Math.floor(Math.random() * 10000)}`;
    this.type = options.type || 'sprite';
    this.position = options.position || [0, 0, 0];
    this.rotation = options.rotation || [0, 0, 0];
    this.scale = options.scale || [1, 1, 1];
    this.texture = options.texture || null;
    this.color = options.color || [1, 1, 1, 1];
    this.interactive = options.interactive || false;
    this.onInteract = options.onInteract || null;
    this.visible = options.visible !== undefined ? options.visible : true;
    this.animation = options.animation || null;
    this.animationTime = 0;
  }
  
  // Update the object (animations, etc.)
  update(deltaTime) {
    if (this.animation && this.visible) {
      this.animationTime += deltaTime;
      
      // Apply animation based on type
      switch (this.animation.type) {
        case 'rotate':
          this.rotation[0] = this.animation.baseRotation[0] + Math.sin(this.animationTime * this.animation.speed) * this.animation.amount;
          this.rotation[1] = this.animation.baseRotation[1] + Math.sin(this.animationTime * this.animation.speed) * this.animation.amount;
          this.rotation[2] = this.animation.baseRotation[2] + Math.sin(this.animationTime * this.animation.speed) * this.animation.amount;
          break;
          
        case 'bob':
          this.position[1] = this.animation.basePosition[1] + Math.sin(this.animationTime * this.animation.speed) * this.animation.amount;
          break;
          
        case 'pulse':
          const pulseFactor = 1.0 + Math.sin(this.animationTime * this.animation.speed) * this.animation.amount;
          this.scale[0] = this.animation.baseScale[0] * pulseFactor;
          this.scale[1] = this.animation.baseScale[1] * pulseFactor;
          this.scale[2] = this.animation.baseScale[2] * pulseFactor;
          break;
      }
    }
  }
  
  // Check if a point intersects with this object
  intersects(x, y) {
    if (!this.visible || !this.interactive) return false;
    
    // Simple bounding box check for now
    // This would need to be more sophisticated for actual 3D objects
    const halfWidth = this.scale[0] / 2;
    const halfHeight = this.scale[1] / 2;
    
    return (
      x >= this.position[0] - halfWidth &&
      x <= this.position[0] + halfWidth &&
      y >= this.position[1] - halfHeight &&
      y <= this.position[1] + halfHeight
    );
  }
  
  // Handle interaction with this object
  interact(gameState, terminal) {
    if (this.onInteract && typeof this.onInteract === 'function') {
      return this.onInteract(gameState, terminal, this);
    }
    return false;
  }
}