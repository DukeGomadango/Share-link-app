"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ==========================================
// GLSL: Simplex 3D Noise & Shaders
// ==========================================

const simplexNoiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const BlobShaderMaterial = {
  vertexShader: `
    uniform float uTime;
    uniform float uNoiseFreq;
    uniform float uNoiseAmp;
    uniform vec2 uMousePos;
    uniform float uMouseSpeed;
    uniform float uPulse;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vNoiseVal;

    ${simplexNoiseGLSL}

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      
      // 3D Simplex noise based squishy displacement
      float noise = snoise(pos * uNoiseFreq + uTime * 0.7) * uNoiseAmp * (1.0 + uPulse * 0.35);
      vNoiseVal = noise;
      
      pos += normal * noise;
      
      // Mild mouse magnetic deformation
      vec4 modelPos = modelMatrix * vec4(pos, 1.0);
      float distToMouse = distance(modelPos.xy, uMousePos);
      if (distToMouse < 3.0) {
        float factor = smoothstep(3.0, 0.0, distToMouse);
        pos += normal * factor * uMouseSpeed * 0.12;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform float uPulse;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vNoiseVal;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel glow outline
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
      
      // Translucent glossy color blend
      vec3 baseColor = mix(uColor, uGlowColor, fresnel * 0.85);
      
      // Inject distortion shading highlights
      baseColor += vec3(vNoiseVal * 0.15);
      
      // Neon emission spike during pulse
      baseColor += uGlowColor * uPulse * 0.4;
      
      // Sophisticated glass alpha
      gl_FragColor = vec4(baseColor, 0.42 + fresnel * 0.48 + uPulse * 0.12);
    }
  `,
};

// ==========================================
// R3F Component: Interactive 3D Particle Ripple
// ==========================================

interface RippleProps {
  trigger: number;
  color: string;
}

interface RippleData {
  directions: Float32Array;
  positions: Float32Array;
}

function Ripple({ trigger, color }: RippleProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useRef(1.0);
  const count = 40;

  const [visible, setVisible] = useState(false);
  const [rippleData, setRippleData] = useState<RippleData | null>(null);

  // Initialize random directions in useEffect (completely pure!)
  useEffect(() => {
    const dirArr = new Float32Array(count * 3);
    const posArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2.0;
      const noise = Math.random() * 0.2;
      dirArr[i * 3] = Math.cos(angle) * (1.0 + noise);
      dirArr[i * 3 + 1] = Math.sin(angle) * (1.0 + noise);
      dirArr[i * 3 + 2] = (Math.random() * 2.0 - 1.0) * 0.2;
    }
    
    // Wrap state setting in requestAnimationFrame to prevent synchronous setState
    const frameId = requestAnimationFrame(() => {
      setRippleData({
        directions: dirArr,
        positions: posArr,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [count]);

  // Activate ripple on trigger changes safely in effect
  useEffect(() => {
    if (trigger > 0) {
      progress.current = 0.0;
      
      // Wrap state setting in requestAnimationFrame to prevent synchronous setState
      const frameId = requestAnimationFrame(() => {
        setVisible(true);
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [trigger]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: 0 },
  }), [color]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current || !rippleData || progress.current >= 1.0) return;

    progress.current = Math.min(1.0, progress.current + delta * 1.4);
    
    // Deactivate when finished
    if (progress.current >= 1.0) {
      setVisible(false);
      return;
    }

    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();

    // Mutate uniforms safely through material ref
    materialRef.current.uniforms.uOpacity.value = Math.pow(1.0 - progress.current, 2.0);
    const radius = progress.current * 3.2;

    for (let i = 0; i < count; i++) {
      const ox = Math.sin(time * 5.0 + i) * 0.05;
      const oy = Math.cos(time * 4.5 + i) * 0.05;

      posAttr.setXYZ(
        i,
        rippleData.directions[i * 3] * radius + ox,
        rippleData.directions[i * 3 + 1] * radius + oy,
        rippleData.directions[i * 3 + 2] * radius
      );
    }
    posAttr.needsUpdate = true;
  });

  if (!visible || !rippleData) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[rippleData.positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          uniform float uOpacity;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = 8.0 * (300.0 / -mvPosition.z) * (0.3 + uOpacity * 0.7);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, dist) * uOpacity;
            gl_FragColor = vec4(uColor, alpha * 0.95);
          }
        `}
      />
    </points>
  );
}

// ==========================================
// Particle Engine Component (Infinity Morph)
// ==========================================

interface ParticleStreamProps {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  pulseTrigger: number;
  isMobile: boolean;
  scrollPercent: number;
}

interface ParticleData {
  positions: Float32Array;
  randoms: Float32Array;
  speeds: Float32Array;
  sizes: Float32Array;
  progresses: Float32Array;
}

function ParticleStream({ startPos, endPos, pulseTrigger, isMobile, scrollPercent }: ParticleStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const count = isMobile ? 80 : 180;

  const pulseVal = useRef(0);
  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseVal.current = 1.0;
    }
  }, [pulseTrigger]);

  const [particles, setParticles] = useState<ParticleData | null>(null);

  useEffect(() => {
    const posArr = new Float32Array(count * 3);
    const randArr = new Float32Array(count * 3);
    const speedArr = new Float32Array(count);
    const sizeArr = new Float32Array(count);
    const progArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const progress = Math.random();
      
      posArr[i * 3] = THREE.MathUtils.lerp(startPos.x, endPos.x, progress);
      posArr[i * 3 + 1] = THREE.MathUtils.lerp(startPos.y, endPos.y, progress);
      posArr[i * 3 + 2] = THREE.MathUtils.lerp(startPos.z, endPos.z, progress);

      randArr[i * 3] = Math.random() * 2.0 - 1.0;
      randArr[i * 3 + 1] = Math.random() * 2.0 - 1.0;
      randArr[i * 3 + 2] = Math.random();

      speedArr[i] = 0.14 + Math.random() * 0.18;
      sizeArr[i] = 0.05 + Math.random() * 0.12;
      progArr[i] = Math.random();
    }

    const frameId = requestAnimationFrame(() => {
      setParticles({
        positions: posArr,
        randoms: randArr,
        speeds: speedArr,
        sizes: sizeArr,
        progresses: progArr,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [count, startPos, endPos]);

  const progressesRef = useRef<Float32Array | null>(null);
  useEffect(() => {
    if (particles) {
      progressesRef.current = particles.progresses;
    }
  }, [particles]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color("#6ee7b7") },
    uPulse: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !progressesRef.current || !materialRef.current || !particles) return;

    if (pulseVal.current > 0) {
      pulseVal.current = Math.max(0, pulseVal.current - delta * 1.5);
    }

    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uPulse.value = pulseVal.current;

    const midPoint = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5);
    midPoint.y += 1.0;

    const center = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5);

    const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    const loopRadius = isMobile ? 0.9 : 1.35;

    const morphBlend = THREE.MathUtils.smoothstep(scrollPercent, 0.7, 1.0);

    let baseSpeedModifier = 1.0;
    if (scrollPercent >= 0.2 && scrollPercent < 0.45) {
      baseSpeedModifier = 1.45;
    }

    for (let i = 0; i < count; i++) {
      let p = progressesRef.current[i];
      const activeSpeed = baseSpeedModifier + pulseVal.current * 3.5;
      
      p += particles.speeds[i] * delta * activeSpeed;
      if (p > 1.0) p = 0;
      progressesRef.current[i] = p;

      const term1 = Math.pow(1 - p, 2);
      const term2 = 2 * (1 - p) * p;
      const term3 = Math.pow(p, 2);

      const bx = term1 * startPos.x + term2 * midPoint.x + term3 * endPos.x;
      const by = term1 * startPos.y + term2 * midPoint.y + term3 * endPos.y;
      const bz = term1 * startPos.z + term2 * midPoint.z + term3 * endPos.z;

      const theta = p * Math.PI * 2.0;
      const denom = 1.0 + Math.pow(Math.sin(theta), 2);
      const lx = (loopRadius * Math.cos(theta)) / denom;
      const ly = (loopRadius * Math.sin(theta) * Math.cos(theta)) / denom;
      const lz = Math.sin(theta * 2.0) * 0.15;

      const infinityX = center.x + dir.x * lx + perp.x * ly;
      const infinityY = center.y + dir.y * lx + perp.y * ly;
      const infinityZ = center.z + dir.z * lx + perp.z * ly + lz;

      const mx = THREE.MathUtils.lerp(bx, infinityX, morphBlend);
      const my = THREE.MathUtils.lerp(by, infinityY, morphBlend);
      const mz = THREE.MathUtils.lerp(bz, infinityZ, morphBlend);

      const noiseAmp = 0.18 + pulseVal.current * 0.15;
      const ox = Math.sin(time * 2.0 + p * 12.0 + particles.randoms[i * 3] * 5.0) * noiseAmp;
      const oy = Math.cos(time * 1.8 + p * 10.0 + particles.randoms[i * 3 + 1] * 5.0) * noiseAmp;
      const oz = Math.sin(time * 2.2 + p * 8.0 + (particles.randoms[i * 3] + particles.randoms[i * 3 + 1]) * 4.0) * noiseAmp;

      posAttr.setXYZ(i, mx + ox, my + oy, mz + oz);
    }

    posAttr.needsUpdate = true;
  });

  if (!particles) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandoms"
          args={[particles.randoms, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform float uPulse;
          attribute vec3 aRandoms;
          attribute float aSize;
          varying float vOpacity;

          void main() {
            vOpacity = aRandoms.z * (0.6 + sin(uTime * 4.0 + aRandoms.x * 10.0) * 0.4);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = aSize * (320.0 / -mvPosition.z) * (1.0 + uPulse * 0.85);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uPulse;
          varying float vOpacity;

          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
            
            vec3 glowColor = mix(uColor, vec3(1.0, 1.0, 1.0), uPulse * 0.55);
            gl_FragColor = vec4(glowColor, alpha * 0.95);
          }
        `}
      />
    </points>
  );
}

// ==========================================
// Organic Dango Node Component
// ==========================================

interface DangoNodeProps {
  position: THREE.Vector3;
  scale: number;
  pulseTrigger: number;
  isMobile: boolean;
  baseColor: string;
  glowColor: string;
  scrollPercent: number;
  isNodeA: boolean;
}

function DangoNode({ position, scale, pulseTrigger, isMobile, baseColor, glowColor, scrollPercent, isNodeA }: DangoNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();

  const pulseState = useRef(0);
  const currentMouseSpeed = useRef(0);
  const prevMousePos = useRef(new THREE.Vector2(0, 0));

  // Click interaction state triggers
  const [clickTrigger, setClickTrigger] = useState(0);
  const [hovered, setHovered] = useState(false);

  // Damped spring physics
  const springOffset = useRef(0);
  const springVelocity = useRef(0);

  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseState.current = 1.0;
      springVelocity.current = 13.0; // Spring kick from upload drop
    }
  }, [pulseTrigger]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNoiseFreq: { value: isMobile ? 1.0 : 1.3 },
    uNoiseAmp: { value: 0.15 },
    uColor: { value: new THREE.Color(baseColor) },
    uGlowColor: { value: new THREE.Color(glowColor) },
    uMousePos: { value: new THREE.Vector2(0, 0) },
    uMouseSpeed: { value: 0 },
    uPulse: { value: 0 },
  }), [baseColor, glowColor, isMobile]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(baseColor);
      materialRef.current.uniforms.uGlowColor.value.set(glowColor);
    }
  }, [baseColor, glowColor]);

  // Handle mesh clicks: triggers squish deform + particle ripple
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    springVelocity.current = -12.0; // Poke/Squish inwards kick
    setClickTrigger((prev) => prev + 1);
  };

  // Change mouse cursor to pointer on hover safely in effect
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (hovered && !isMobile) {
      body.style.cursor = "pointer";
    } else {
      body.style.cursor = "auto";
    }
    return () => {
      body.style.cursor = "auto";
    };
  }, [hovered, isMobile]);

  useFrame((state, delta) => {
    if (pulseState.current > 0) {
      pulseState.current = Math.max(0, pulseState.current - delta * 1.6);
    }

    // Solve spring physics (Hooke's Law with damping)
    const k = 150;
    const c = 10;
    const springForce = -k * springOffset.current - c * springVelocity.current;
    springVelocity.current += springForce * delta;
    springOffset.current += springVelocity.current * delta;

    const currentMouse = new THREE.Vector2(pointer.x * 3.5, pointer.y * 3.5);
    const mouseDelta = currentMouse.distanceTo(prevMousePos.current);
    currentMouseSpeed.current = THREE.MathUtils.lerp(
      currentMouseSpeed.current,
      mouseDelta / (delta || 0.016),
      0.08
    );
    prevMousePos.current.copy(currentMouse);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      const totalPulse = pulseState.current + Math.abs(springOffset.current) * 0.6;
      materialRef.current.uniforms.uPulse.value = totalPulse;
      materialRef.current.uniforms.uMousePos.value.lerp(currentMouse, 0.08);
      materialRef.current.uniforms.uMouseSpeed.value = THREE.MathUtils.clamp(currentMouseSpeed.current * 0.05, 0.0, 1.2);

      if (scrollPercent >= 0.2 && scrollPercent < 0.45) {
        materialRef.current.uniforms.uNoiseFreq.value = 3.2;
        materialRef.current.uniforms.uNoiseAmp.value = 0.12 + Math.sin(state.clock.elapsedTime * 48.0) * 0.02;
      } else if (scrollPercent >= 0.45 && scrollPercent < 0.7) {
        if (isNodeA) {
          materialRef.current.uniforms.uNoiseFreq.value = 2.4;
          materialRef.current.uniforms.uNoiseAmp.value = 0.32;
        } else {
          materialRef.current.uniforms.uNoiseFreq.value = 1.1;
          materialRef.current.uniforms.uNoiseAmp.value = 0.13;
        }
      } else {
        materialRef.current.uniforms.uNoiseFreq.value = isMobile ? 1.0 : 1.3;
        materialRef.current.uniforms.uNoiseAmp.value = 0.15;
      }
    }

    if (meshRef.current) {
      const floatY = Math.sin(state.clock.elapsedTime * 1.2 + position.x) * 0.05;
      meshRef.current.position.set(0, floatY, 0);

      if (!isMobile) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, pointer.y * 0.22, 0.06);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, pointer.x * 0.22, 0.06);
      } else {
        meshRef.current.rotation.y += delta * 0.12;
      }

      const breathe = 1.0 + Math.sin(state.clock.elapsedTime * 0.8 + position.x) * 0.02;
      // Spring Bounce scaling
      const s = scale * breathe * (1.0 + springOffset.current * 0.3);
      meshRef.current.scale.set(s, s, s);
    }

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      const corePulse = 0.5 + Math.sin(state.clock.elapsedTime * 3.0) * 0.1 + pulseState.current * 0.5;
      mat.color.copy(uniforms.uGlowColor.value).multiplyScalar(corePulse);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.0, isMobile ? 3 : 5]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={true}
          uniforms={uniforms}
          vertexShader={BlobShaderMaterial.vertexShader}
          fragmentShader={BlobShaderMaterial.fragmentShader}
        />
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshBasicMaterial toneMapped={false} />
        </mesh>
      </mesh>
      {/* Click-triggered 3D Particle Ripple */}
      <Ripple trigger={clickTrigger} color={glowColor} />
    </group>
  );
}

// ==========================================
// Full Hybrid Scene Setup
// ==========================================

interface SceneMeshProps {
  pulseTrigger: number;
  isMobile: boolean;
}

function SceneMesh({ pulseTrigger, isMobile }: SceneMeshProps) {
  const { viewport } = useThree();

  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollPercent(Math.min(1.0, Math.max(0.0, scrollTop / scrollHeight)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const responsiveScale = Math.min(1.0, viewport.width / 11);

  const { startPos, endPos, startScale, endScale } = useMemo(() => {
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    let sScale = 0.85;
    let eScale = 0.75;

    if (isMobile) {
      if (scrollPercent < 0.2) {
        start.set(-0.6 * responsiveScale, 0.6, 0);
        end.set(0.6 * responsiveScale, -0.2, -0.4);
        sScale = 0.55 * responsiveScale;
        eScale = 0.42 * responsiveScale;
      } else {
        const t = (scrollPercent - 0.2) / 0.8;
        const initialStart = new THREE.Vector3(-0.6 * responsiveScale, 0.6, 0);
        const initialEnd = new THREE.Vector3(0.6 * responsiveScale, -0.2, -0.4);
        
        const targetStart = new THREE.Vector3(-0.16, -0.7, -2.5);
        const targetEnd = new THREE.Vector3(0.16, -0.9, -2.5);

        start.lerpVectors(initialStart, targetStart, t);
        end.lerpVectors(initialEnd, targetEnd, t);
        sScale = (0.55 - t * 0.15) * responsiveScale;
        eScale = (0.42 - t * 0.12) * responsiveScale;
      }
    } else {
      if (scrollPercent < 0.2) {
        start.set(1.1 * responsiveScale, 0.6, 0.0);
        end.set(2.4 * responsiveScale, -0.6, -0.4);
        sScale = 0.75;
        eScale = 0.56;
      } else if (scrollPercent < 0.6) {
        const t = (scrollPercent - 0.2) / 0.4;
        const initialStart = new THREE.Vector3(1.1 * responsiveScale, 0.6, 0);
        const initialEnd = new THREE.Vector3(2.4 * responsiveScale, -0.6, -0.4);
        
        // Dynamic extreme 3D Depth-Choreographed Flight
        const targetStart = new THREE.Vector3(-2.2 * responsiveScale, 0.8, 1.8);
        const targetEnd = new THREE.Vector3(2.2 * responsiveScale, -0.8, -4.5);

        start.lerpVectors(initialStart, targetStart, t);
        end.lerpVectors(initialEnd, targetEnd, t);
        
        sScale = 0.75 + t * 0.25;
        eScale = 0.56 - t * 0.36;
      } else {
        const t = (scrollPercent - 0.6) / 0.4;
        const initialStart = new THREE.Vector3(-2.2 * responsiveScale, 0.8, 1.8);
        const initialEnd = new THREE.Vector3(2.2 * responsiveScale, -0.8, -4.5);
        
        const targetStart = new THREE.Vector3(1.9, -0.6, -2.0);
        const targetEnd = new THREE.Vector3(2.35, -0.9, -2.0);

        start.lerpVectors(initialStart, targetStart, t);
        end.lerpVectors(initialEnd, targetEnd, t);
        
        sScale = 1.0 - t * 0.37;
        eScale = 0.20 + t * 0.28;
      }
    }

    return {
      startPos: start,
      endPos: end,
      startScale: sScale,
      endScale: eScale,
    };
  }, [scrollPercent, isMobile, responsiveScale]);

  return (
    <>
      <ambientLight intensity={0.45} color="#d1fae5" />
      <directionalLight position={[6, 6, 6]} intensity={0.65} />
      <pointLight position={[-4, 3, -3]} intensity={0.55} color="#10b981" />
      <pointLight position={[4, -2, 4]} intensity={0.45} color="#6ee7b7" />

      {/* Dynamic Data Particle Bridge Stream */}
      <ParticleStream
        startPos={startPos}
        endPos={endPos}
        pulseTrigger={pulseTrigger}
        isMobile={isMobile}
        scrollPercent={scrollPercent}
      />

      {/* Dango Node A: Sender (Mint Green) */}
      <DangoNode
        position={startPos}
        scale={startScale}
        pulseTrigger={pulseTrigger}
        isMobile={isMobile}
        baseColor="#34d399"
        glowColor="#059669"
        scrollPercent={scrollPercent}
        isNodeA={true}
      />

      {/* Dango Node B: Receiver (Emerald Green) */}
      <DangoNode
        position={endPos}
        scale={endScale}
        pulseTrigger={pulseTrigger}
        isMobile={isMobile}
        baseColor="#6ee7b7"
        glowColor="#10b981"
        scrollPercent={scrollPercent}
        isNodeA={false}
      />
    </>
  );
}

interface DangoShareSceneProps {
  pulseTrigger: number;
  isMobile: boolean;
  onCreated?: () => void;
  eventSource: React.RefObject<HTMLDivElement | null>;
}

export default function DangoShareScene({
  pulseTrigger,
  isMobile,
  onCreated,
  eventSource,
}: DangoShareSceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10" aria-hidden="true">
      <Canvas
        dpr={isMobile ? [1, 1.2] : [1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => {
          if (onCreated) onCreated();
        }}
        eventSource={eventSource.current || undefined}
        eventPrefix="client"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
        }}
      >
        <SceneMesh pulseTrigger={pulseTrigger} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
