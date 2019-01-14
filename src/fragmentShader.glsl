precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
#define PI 3.141592

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 color=vec3(p,1.0);
    fragColor=vec4(color,1.0);
}

void main( void ){
    vec4 color = vec4(0.0,0.0,0.0,1.0);
    mainImage( color, gl_FragCoord.xy );
    color.w = 1.0;
    gl_FragColor = color;
}