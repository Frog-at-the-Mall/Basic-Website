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
