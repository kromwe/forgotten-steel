// WebGL shader programs for rendering game scenes

export const shaders = {
  // Basic shader for rendering textured quads
  basic: {
    vertex: `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying highp vec2 vTextureCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `,
    fragment: `
      precision mediump float;
      
      varying highp vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      
      void main() {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
    `
  },
  
  // Shader with color tinting for special effects
  tinted: {
    vertex: `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying highp vec2 vTextureCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `,
    fragment: `
      precision mediump float;
      
      varying highp vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      uniform vec4 uTintColor;
      uniform float uTintAmount;
      
      void main() {
        vec4 texelColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = mix(texelColor, uTintColor * texelColor, uTintAmount);
      }
    `
  },
  
  // Shader for memory flash effects
  memoryFlash: {
    vertex: `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying highp vec2 vTextureCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `,
    fragment: `
      precision mediump float;
      
      varying highp vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      uniform float uFlashIntensity;
      uniform float uTime;
      
      void main() {
        vec4 texelColor = texture2D(uSampler, vTextureCoord);
        float flash = sin(uTime * 5.0) * 0.5 + 0.5;
        vec4 flashColor = vec4(1.0, 1.0, 1.0, 1.0);
        gl_FragColor = mix(texelColor, flashColor, flash * uFlashIntensity);
      }
    `
  },
  
  // Shader for scene transitions
  transition: {
    vertex: `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      
      varying highp vec2 vTextureCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `,
    fragment: `
      precision mediump float;
      
      varying highp vec2 vTextureCoord;
      
      uniform sampler2D uSampler1;
      uniform sampler2D uSampler2;
      uniform float uTransitionAmount;
      
      void main() {
        vec4 color1 = texture2D(uSampler1, vTextureCoord);
        vec4 color2 = texture2D(uSampler2, vTextureCoord);
        gl_FragColor = mix(color1, color2, uTransitionAmount);
      }
    `
  }
};

// Helper function to compile a shader program from source
export function createShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Check if creating the shader program failed
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

// Helper function to load a shader
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}