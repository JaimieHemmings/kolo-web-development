'use client'
import * as THREE from 'three';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import { ResizeObserver } from '@juggle/resize-observer';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

vec4 permute(vec4 x) {
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec2 P) {
  vec4 Pi = floor(vec4(P.xy, P.xy) + vec4(0.0, 1.0, 1.0, 0.0));
  vec4 Pf = fract(vec4(P.xy, P.xy) + vec4(0.0, 1.0, 1.0, 0.0)) - vec4(0.0, 1.0, 1.0, 0.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xyxy;
  vec4 iy = Pi.zzww;
  vec4 fx = Pf.xyxy;
  vec4 fy = Pf.zzww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i / 41.0) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(
    dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
  vec2 uv = vUv * uResolution / min(uResolution.x, uResolution.y);
  float noise = cnoise(uv + uTime * 0.1);
  vec3 color = vec3(0.5 + 0.5 * sin(uTime + noise), 0.5, 1.0 - noise);
  gl_FragColor = vec4(color, 1.0);
}
`;

const PerlinShaderMaterial = () => {
  const materialRef = useRef(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  );
};

const PerlinShaderScene = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        resize={{ polyfill: ResizeObserver }}
        camera={{ position: [0, 0, 1] }}
      >
        <mesh>
          <planeGeometry args={[2, 2]} />
          <PerlinShaderMaterial />
        </mesh>
      </Canvas>
    </div>
  );
};

export default PerlinShaderScene;