document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menu-button");
  const menu = document.getElementById("menu");

  // Toggle menu when clicking the hamburger button
  menuButton.addEventListener("click", function () {
    menu.classList.toggle("open");
  });

  // Close menu when clicking anywhere else on the page
  document.addEventListener("click", function (event) {
    if (!menu.contains(event.target) && event.target !== menuButton) {
      menu.classList.remove("open");
    }
  });

  // Example button functionality
  document.getElementById("myButton").addEventListener("click", function () {
    alert("Button Clicked!");
  });
});

// Get the canvas and setup WebGL
const canvas = document.getElementById("shaderCanvas");
const gl = canvas.getContext("webgl");

// Resize canvas to fit screen properly, including handling high-DPI screens
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Vertex Shader (Basic Pass-through)
const vertexShaderSrc = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// Fragment Shader (Generative Background Effect)
const fragmentShaderSrc = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Hash function for pseudo-randomness
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

// Basic noise function for smoother random offsets
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i.x + i.y * 57.0);
    float b = hash(i.x + 1.0 + i.y * 57.0);
    float c = hash(i.x + (i.y + 1.0) * 57.0);
    float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Signed Distance Function for a Circle
float circleSDF(vec2 p, float r) {
    return length(p) - r;
}

// Signed Distance Function for a Box
float boxSDF(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Generate a glitch offset based on noise and time
vec2 glitchOffset(vec2 uv, float scale, float intensity) {
    float n = noise(uv * scale + u_time);
    return vec2(sin(n * 10.0), cos(n * 10.0)) * intensity;
}

// Render a shape by mixing two colors based on the distance
vec3 renderShape(float dist, vec3 col1, vec3 col2) {
    return mix(col1, col2, smoothstep(0.005, 0.02, dist));
}

void main() {
    // Normalize coordinates to [-1, 1]
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    
    // Animate overall scale of UVs for a pulsating effect
    // uv *= 1.2 + 0.2 * sin(u_time);
    // uv = fract(uv * 1.) - 0.5 ;
    // Create a pulse for the glitch effect
    float glitchPulse = step(.99, fract(sin(u_time * 5.0) * 43758.5453));
    
    // Generate animated glitch offsets for the red and blue channels
    vec2 offsetR = glitchOffset(uv, 3.0, 0.03) * glitchPulse;
    vec2 offsetB = glitchOffset(uv, 3.0, 0.03) * glitchPulse;
    
    // Separate UV channels with additional time-based shifts
    vec2 uvR = uv + offsetR + vec2(0.02 * sin(u_time * 3.0), 0.0);
    vec2 uvG = uv;
    vec2 uvB = uv + offsetB - vec2(0.02 * sin(u_time * 3.0), 0.0);
    
    // Apply tiling to create a repeating, dynamic pattern
    uvR = fract(uvR * 2.5) - 0.5;
    uvG = fract(uvG * 2.5) - 0.5;
    uvB = fract(uvB * 2.5) - 0.5;
    
    // Animate shape positions over time
    vec2 circlePos = vec2(0.0, 0.0) + vec2(0.1 * cos(u_time), 0.1 * sin(u_time));
    vec2 boxPos = vec2(0.0, 0.4) + vec2(0.1 * sin(u_time * 1.3), 0.1 * cos(u_time * 1.3));
    
    // Compute SDF for each channel separately for the circle
    float circleDistR = circleSDF(uvR - circlePos, 0.1);
    float circleDistG = circleSDF(uvG - circlePos, 0.1);
    float circleDistB = circleSDF(uvB - circlePos, 0.1);
    
    // Compute SDF for the box for each channel
    float boxDistR = boxSDF(uvR - boxPos, vec2(0.15));
    float boxDistG = boxSDF(uvG - boxPos, vec2(0.15));
    float boxDistB = boxSDF(uvB - boxPos, vec2(0.15));
    
    // Combine the shapes by taking the minimum distance for each channel
    float shapeDistR = min(circleDistR, boxDistR);
    float shapeDistG = min(circleDistG, boxDistG);
    float shapeDistB = min(circleDistB, boxDistB);
    
    // Define two contrasting colors for the mix
    vec3 col1 = vec3(1.0, 0.5, 0.2);
    vec3 col2 = vec3(0.2, 0.5, 1.0);
    
    // Render each channel with the SDF shape and animated edge widths
    vec3 color;
    color.r = renderShape(shapeDistR, col1, col2).r;
    color.g = renderShape(shapeDistG, col1, col2).g;
    color.b = renderShape(shapeDistB, col1, col2).b;
    
    gl_FragColor = vec4(color, 1.0);
}


`;

// Compile Shaders
function compileShader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

// Create Shader Program
const vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Set up Geometry (Full Screen Quad)
const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

// Set Uniforms
const timeLocation = gl.getUniformLocation(program, "u_time");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

function render(time) {
  resizeCanvas(); // Ensure canvas size is updated before drawing
  gl.uniform1f(timeLocation, time * 0.001);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}
resizeCanvas();
render(0);
