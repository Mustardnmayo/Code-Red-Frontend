uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    // Repeat texture by scaling UVs
    vec2 tiledUv = vUv * 2.0; // Increase this value to repeat more

    vec3 color = texture(uTexture, tiledUv).rgb;

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
