// Effects manager for handling visual effects, transitions, and animations

export class EffectsManager {
  constructor(webglRenderer) {
    this.webglRenderer = webglRenderer;
    this.activeEffects = [];
    this.particleSystems = [];
  }
  
  // Add a new effect
  addEffect(effect) {
    this.activeEffects.push(effect);
    return effect;
  }
  
  // Create and add a fade effect
  createFadeEffect(options = {}) {
    const fadeEffect = new FadeEffect({
      duration: options.duration || 1000,
      fadeIn: options.fadeIn !== undefined ? options.fadeIn : true,
      color: options.color || [0, 0, 0, 1],
      onComplete: options.onComplete || null
    });
    
    this.addEffect(fadeEffect);
    return fadeEffect;
  }
  
  // Create and add a flash effect
  createFlashEffect(options = {}) {
    const flashEffect = new FlashEffect({
      duration: options.duration || 500,
      color: options.color || [1, 1, 1, 1],
      pulses: options.pulses || 1,
      onComplete: options.onComplete || null
    });
    
    this.addEffect(flashEffect);
    return flashEffect;
  }
  
  // Create and add a shake effect
  createShakeEffect(options = {}) {
    const shakeEffect = new ShakeEffect({
      duration: options.duration || 500,
      intensity: options.intensity || 0.05,
      decreasing: options.decreasing !== undefined ? options.decreasing : true,
      onComplete: options.onComplete || null
    });
    
    this.addEffect(shakeEffect);
    return shakeEffect;
  }
  
  // Create and add a particle system
  createParticleSystem(options = {}) {
    const particleSystem = new ParticleSystem({
      position: options.position || [0, 0, 0],
      count: options.count || 50,
      duration: options.duration || 2000,
      color: options.color || [1, 1, 1, 1],
      size: options.size || [0.05, 0.05],
      speed: options.speed || 0.5,
      gravity: options.gravity !== undefined ? options.gravity : true,
      texture: options.texture || null,
      onComplete: options.onComplete || null
    });
    
    this.particleSystems.push(particleSystem);
    return particleSystem;
  }
  
  // Update all active effects and particle systems
  update(deltaTime) {
    // Update effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.update(deltaTime);
      
      // Remove completed effects
      if (effect.isComplete()) {
        if (effect.onComplete && typeof effect.onComplete === 'function') {
          effect.onComplete();
        }
        this.activeEffects.splice(i, 1);
      }
    }
    
    // Update particle systems
    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      const particleSystem = this.particleSystems[i];
      particleSystem.update(deltaTime);
      
      // Remove completed particle systems
      if (particleSystem.isComplete()) {
        if (particleSystem.onComplete && typeof particleSystem.onComplete === 'function') {
          particleSystem.onComplete();
        }
        this.particleSystems.splice(i, 1);
      }
    }
  }
  
  // Render all active effects and particle systems
  render() {
    // Apply effects to the renderer
    this.activeEffects.forEach(effect => {
      effect.apply(this.webglRenderer);
    });
    
    // Render particle systems
    this.particleSystems.forEach(particleSystem => {
      particleSystem.render(this.webglRenderer);
    });
  }
  
  // Clear all effects
  clearEffects() {
    this.activeEffects = [];
    this.particleSystems = [];
  }
}

// Base class for effects
class Effect {
  constructor(options = {}) {
    this.startTime = Date.now();
    this.duration = options.duration || 1000; // ms
    this.onComplete = options.onComplete || null;
    this.completed = false;
  }
  
  // Update the effect
  update(deltaTime) {
    // To be implemented by subclasses
  }
  
  // Apply the effect to the renderer
  apply(renderer) {
    // To be implemented by subclasses
  }
  
  // Check if the effect is complete
  isComplete() {
    if (this.completed) return true;
    
    const elapsed = Date.now() - this.startTime;
    return elapsed >= this.duration;
  }
  
  // Get the progress of the effect (0.0 to 1.0)
  getProgress() {
    const elapsed = Date.now() - this.startTime;
    return Math.min(1.0, elapsed / this.duration);
  }
}

// Fade effect (fade in or fade out)
class FadeEffect extends Effect {
  constructor(options = {}) {
    super(options);
    this.fadeIn = options.fadeIn !== undefined ? options.fadeIn : true;
    this.color = options.color || [0, 0, 0, 1]; // RGBA
  }
  
  update(deltaTime) {
    // No additional update needed
  }
  
  apply(renderer) {
    const progress = this.getProgress();
    const alpha = this.fadeIn ? 1.0 - progress : progress;
    
    // Apply the fade effect to the renderer
    renderer.applyFadeEffect([
      this.color[0],
      this.color[1],
      this.color[2],
      alpha * this.color[3]
    ]);
  }
}

// Flash effect (screen flash)
class FlashEffect extends Effect {
  constructor(options = {}) {
    super(options);
    this.color = options.color || [1, 1, 1, 1]; // RGBA
    this.pulses = options.pulses || 1;
  }
  
  update(deltaTime) {
    // No additional update needed
  }
  
  apply(renderer) {
    const progress = this.getProgress();
    
    // Calculate flash intensity based on progress and pulse count
    const pulseProgress = (progress * this.pulses) % 1.0;
    const intensity = Math.sin(pulseProgress * Math.PI) * (1.0 - progress);
    
    // Apply the flash effect to the renderer
    renderer.applyFlashEffect([
      this.color[0],
      this.color[1],
      this.color[2],
      intensity * this.color[3]
    ]);
  }
}

// Shake effect (screen shake)
class ShakeEffect extends Effect {
  constructor(options = {}) {
    super(options);
    this.intensity = options.intensity || 0.05;
    this.decreasing = options.decreasing !== undefined ? options.decreasing : true;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  update(deltaTime) {
    const progress = this.getProgress();
    const factor = this.decreasing ? (1.0 - progress) : 1.0;
    
    // Generate random offsets
    this.offsetX = (Math.random() * 2 - 1) * this.intensity * factor;
    this.offsetY = (Math.random() * 2 - 1) * this.intensity * factor;
  }
  
  apply(renderer) {
    // Apply the shake effect to the renderer
    renderer.applyShakeEffect(this.offsetX, this.offsetY);
  }
}

// Particle system
class ParticleSystem {
  constructor(options = {}) {
    this.startTime = Date.now();
    this.duration = options.duration || 2000; // ms
    this.position = options.position || [0, 0, 0];
    this.count = options.count || 50;
    this.color = options.color || [1, 1, 1, 1]; // RGBA
    this.size = options.size || [0.05, 0.05]; // Width, Height
    this.speed = options.speed || 0.5;
    this.gravity = options.gravity !== undefined ? options.gravity : true;
    this.texture = options.texture || null;
    this.onComplete = options.onComplete || null;
    
    // Initialize particles
    this.particles = [];
    this.initParticles();
  }
  
  // Initialize particles
  initParticles() {
    for (let i = 0; i < this.count; i++) {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = this.speed * (0.5 + Math.random() * 0.5);
      
      this.particles.push({
        position: [...this.position],
        velocity: [
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * speed
        ],
        size: this.size.map(s => s * (0.5 + Math.random() * 0.5)),
        color: [...this.color],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        life: 1.0
      });
    }
  }
  
  // Update the particle system
  update(deltaTime) {
    const elapsed = Date.now() - this.startTime;
    const systemProgress = Math.min(1.0, elapsed / this.duration);
    
    // Update each particle
    this.particles.forEach(particle => {
      // Update position
      particle.position[0] += particle.velocity[0] * deltaTime;
      particle.position[1] += particle.velocity[1] * deltaTime;
      particle.position[2] += particle.velocity[2] * deltaTime;
      
      // Apply gravity
      if (this.gravity) {
        particle.velocity[1] -= 0.001 * deltaTime;
      }
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
      
      // Update life
      particle.life = Math.max(0, 1.0 - systemProgress);
      
      // Update color alpha based on life
      particle.color[3] = this.color[3] * particle.life;
    });
  }
  
  // Render the particle system
  render(renderer) {
    // Render each particle
    this.particles.forEach(particle => {
      if (particle.life <= 0) return;
      
      renderer.renderParticle(
        particle.position,
        particle.size,
        particle.color,
        particle.rotation,
        this.texture
      );
    });
  }
  
  // Check if the particle system is complete
  isComplete() {
    const elapsed = Date.now() - this.startTime;
    return elapsed >= this.duration;
  }
}