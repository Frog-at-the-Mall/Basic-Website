document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menu-button");
  const menu = document.getElementById("menu");
  const navShader = document.getElementById("shader-nav");

  // Ensure it fills the screen
  // navShader.style.width = "10vw";
  // navShader.style.height = "10vh";

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

  // Initialize shaders on all elements with IDs matching "shader-..."
  document.querySelectorAll("[id^='shader-']").forEach((element) => {
    // Create a canvas inside each marked element
    const canvas = document.createElement("canvas");
    canvas.width = element.clientWidth;
    canvas.height = element.clientHeight;
    element.appendChild(canvas);

    // Extract the shader name from the element ID (e.g., "shader-waves" -> "waves")
    const shaderName = element.id.replace("shader-", "");

    if (fragmentShaders[shaderName]) {
      initializeShader(canvas, fragmentShaders[shaderName]);
    }
  });
});

// Shader Collection
const fragmentShaders = {
  default: `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform vec2 u_resolution;
    uniform float u_time;
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec3 color = vec3(uv, abs(sin(u_time)));
        gl_FragColor = vec4(color, 1.0);
    }
  `,
  squares: `
    #ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Perlin-like noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Fractal Brownian Motion (FBM) function
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

float sdBox(in vec2 p, in vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float anim(in float speed){
    return abs(sin(u_time * speed));
}

void main() {
    // Convert fragment coordinate to normalized space (-1 to 1)
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // for(float i = 0.0; i < .0; i++)
    // how many
    uv = fract(uv* 7. ) -.5;
    
    // Define box size x,y
    vec2 boxSize = vec2((0.1) + anim(.5), (.1) / anim(.5));
    
    // Compute signed distance to box
    float dist = sdBox(uv, boxSize * .5);
    
    // Convert distance to grayscale color
    vec3 color = vec3(1.0 - smoothstep(0.0, 0.01, dist)); 

    gl_FragColor = vec4(color, 1.0);
}

  `,
  abyss: `
    #ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Color palette function
vec3 palette(float t) {
    vec3 a = vec3(0.5412, 0.3843, 0.6118);
    vec3 b = vec3(0.0, 0.1647, 0.902);
    vec3 c = vec3(0.0667, 0.0, 1.0);
    vec3 d = vec3(0.0, 0.0667, 1.0);
    return a + b * sin(6.28318 * (c * t + d)) * 0.5; // Scaled for smoother colors
}

// Hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Perlin-like noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Fractal Brownian Motion (FBM) function
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}



void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.6196, 0.3059, 0.3059);

    // Distortion - using noise for natural randomness
    uv.x += sin(uv.y * 0.5 + (u_time * 0.5)) * fbm(uv * .1) * 0.1;
    uv.y += cos(uv.x * 0.5 + (u_time * 0.5)) * fbm(uv * .1) * 0.1;
    uv *= vec2(1.3, 0.9);  // Slight scaling to avoid circles

    for (float i = 0.0; i < 4.0; i++) {
        // Adjust distance ------ don't change 0.5
        uv = fract(uv *2.2) - 0.5;
        
        float d = length(uv) * exp(-length(uv0));
        
        // u_time changes color movement speed
        vec3 col = palette(length(uv0) - i * 0.2 + u_time);

        // u_time changes fractal speed
        d = sin(d * 8.0 + (u_time * 0.91)) / 8.0;
        // Mixing colors
        d = abs(d);
        // Contrast
        d = pow(0.01 / max(d, 0.01), 5.0); // Avoid division by zero

        finalColor += col * d;
    }
  
    gl_FragColor = vec4(finalColor, 1.0);
}

  `,
  lines: `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 palette(float t){
    vec3 a = vec3(0.4471, 0.3216, 0.3216);
    vec3 b = vec3(0.5529, 0.4431, 0.4431);
    vec3 c = vec3(0.9255, 0.9137, 0.0235);
    vec3 d = vec3(0.3412, 0.3412, 0.4196);
    return a + b*cos(6.28318*(c*t+d));
}

void main() {

    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy)/u_resolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for(float i = 0.0; i < 4.0; i++){
        // adjust distance ------ don't change 0.5
        uv = fract(uv * 2.) - 0.5 ;
        
        float d = length(uv) * exp(-length(uv0));
        
        vec3 col = palette(length(uv0)+ i*.2 + u_time *.2);

        // not quite
        d = sin(d*8. + u_time)/8.;
        // does something with mixing colors
        d = abs(d);
        // contrast
        d = pow(0.01/d,5.0);

        finalColor += col * d;
    }
    
    gl_FragColor = vec4(finalColor,1.0);

}

  `,

  shapes: `
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
 
  `,
  waves: `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform vec2 u_resolution;
    uniform float u_time;
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
        vec3 color = vec3(wave, 0.0, 1.0 - wave);
        gl_FragColor = vec4(color, 1.0);
    }
  `,
  glitch: `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;


float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}
#define NUM_OCTAVES 6

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    // Normalize screen coordinates (0 to 1 range)
    vec2 st = gl_FragCoord.xy / u_resolution;
    
    // Control spacing of lines
    float spacing = 0.08; // Distance between lines (adjust this value)

    // Create a repeating pattern using mod()
    // mod-> repeat, tan -> start pos of wave, st.* -> angle of l ine, u_time -> movement,spacing??
    float linePattern =  ((mod(tan(st.y - fbm(st)) + (u_time *.007), spacing))   - spacing * 0.0);
    // float linePattern2 = ((mod(sin(st.x)        - (u_time *.1) ,spacing))  - spacing * 0.0);

    // Smooth step for anti-aliased lines
    float line = smoothstep(0.1, 0.0, linePattern);
    // float line2 = smoothstep(0.1,0.0,linePattern2);
    // Set final color: white lines on black background
    vec3 color = mix(vec3(1.0,  fbm(st), fbm(st)), vec3(0.2863, 0.3373, 0.3608), line);

    gl_FragColor = vec4(color, 1.0);
}

  `,
};

// Function to Initialize WebGL for Each Canvas
function initializeShader(canvas, fragmentSrc) {
  const gl = canvas.getContext("webgl");

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Vertex Shader (Same for all shaders)
  const vertexShaderSrc = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

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

  // Compile and Link Shaders
  const vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
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

  // Get Uniform Locations
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  function render(time) {
    resizeCanvas();
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  render(0);
}
