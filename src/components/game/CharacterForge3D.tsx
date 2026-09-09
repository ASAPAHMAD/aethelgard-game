import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  CharacterAppearance, 
  CombatArchetype, 
  PlayableOrigin, 
  ClassSpecialization,
  WeaponType,
  TransmogSettings
} from '../../types/game';
import { 
  createHumanoidPlayerCharacter, 
  PlayerCharacterAsset, 
  CharacterAnimationState 
} from '../../services/characterAssetService';
import { RotateCw, ZoomIn, ZoomOut, User, Sun, Moon, Eye, Sparkles } from 'lucide-react';

interface CharacterForge3DProps {
  appearance: CharacterAppearance;
  archetype: CombatArchetype;
  specialization?: ClassSpecialization;
  weaponType?: WeaponType;
  transmog?: TransmogSettings;
  lightingPreset?: 'dawn' | 'noon' | 'eclipse';
  viewMode?: 'forge' | 'inspect';
  onCameraChange?: (preset: 'full' | 'waist' | 'face') => void;
  className?: string;
}

export type CameraPreset = 'full' | 'waist' | 'face';

export const CharacterForge3D: React.FC<CharacterForge3DProps> = ({
  appearance,
  archetype,
  specialization,
  weaponType,
  transmog,
  lightingPreset = 'noon',
  viewMode = 'forge',
  className = 'w-full h-full'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Orbit & Camera state
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('full');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [activeLighting, setActiveLighting] = useState<'dawn' | 'noon' | 'eclipse'>(lightingPreset);
  const [characterPose, setCharacterPose] = useState<'idle' | 'combat' | 'triumph'>('idle');
  const characterPoseRef = useRef<'idle' | 'combat' | 'triumph'>('idle');
  characterPoseRef.current = characterPose;

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const playerAssetRef = useRef<PlayerCharacterAsset | null>(null);

  // Orbit controls state
  const orbitStateRef = useRef<{
    isDragging: boolean;
    prevX: number;
    prevY: number;
    rotY: number;
    rotX: number;
    targetDistance: number;
    currentDistance: number;
    targetLookAtY: number;
    currentLookAtY: number;
  }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotY: 0,
    rotX: 0.1,
    targetDistance: 3.6,
    currentDistance: 3.6,
    targetLookAtY: 1.05,
    currentLookAtY: 1.05
  });

  // Camera presets coordinates
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    const orbit = orbitStateRef.current;
    if (preset === 'full') {
      orbit.targetDistance = 3.6;
      orbit.targetLookAtY = 1.05;
    } else if (preset === 'waist') {
      orbit.targetDistance = 2.2;
      orbit.targetLookAtY = 1.35;
    } else if (preset === 'face') {
      orbit.targetDistance = 1.25;
      orbit.targetLookAtY = 1.62;
    }
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.12);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 3.6);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Lights Group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // 5. Environment Pedestal & Runes
    const pedestalGroup = new THREE.Group();
    pedestalGroup.name = 'pedestal';

    // Base Stone Disc
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.15, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      roughness: 0.8,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.075;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    // Outer Gold Runic Rim
    const rimGeo = new THREE.TorusGeometry(1.38, 0.03, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x473c10
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.005;
    pedestalGroup.add(rimMesh);

    // Inner Solar Glyph Inlay
    const solarDiscGeo = new THREE.RingGeometry(0.3, 1.25, 32);
    const solarDiscMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const solarDiscMesh = new THREE.Mesh(solarDiscGeo, solarDiscMat);
    solarDiscMesh.rotation.x = -Math.PI / 2;
    solarDiscMesh.position.y = 0.006;
    pedestalGroup.add(solarDiscMesh);

    // Aether Ambient Embers
    const emberCount = 35;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      const radius = 0.3 + Math.random() * 1.1;
      const angle = Math.random() * Math.PI * 2;
      emberPositions[i * 3] = Math.cos(angle) * radius;
      emberPositions[i * 3 + 1] = Math.random() * 2.2;
      emberPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    embers.name = 'embers';
    pedestalGroup.add(embers);

    scene.add(pedestalGroup);

    // 6. Character Root Group
    const charGroup = new THREE.Group();
    charGroup.name = 'character';
    scene.add(charGroup);
    characterGroupRef.current = charGroup;

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Animation & Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      const orbit = orbitStateRef.current;
      orbit.currentDistance += (orbit.targetDistance - orbit.currentDistance) * 0.12;
      orbit.currentLookAtY += (orbit.targetLookAtY - orbit.currentLookAtY) * 0.12;

      if (isAutoRotating && !orbit.isDragging) {
        orbit.rotY += delta * 0.4;
      }

      // Calculate camera position based on spherical coordinates
      const camY = orbit.currentLookAtY + Math.sin(orbit.rotX) * orbit.currentDistance;
      const camRadiusXZ = Math.cos(orbit.rotX) * orbit.currentDistance;
      const camX = Math.sin(orbit.rotY) * camRadiusXZ;
      const camZ = Math.cos(orbit.rotY) * camRadiusXZ;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, orbit.currentLookAtY, 0);

      // Character animation based on selected pose & idle breathing
      if (playerAssetRef.current) {
        const currentPose = characterPoseRef.current;
        const animState: CharacterAnimationState = 
          currentPose === 'combat' ? 'attack' :
          currentPose === 'triumph' ? 'triumph' : 'idle';
        const actionProg = currentPose === 'combat' ? (Math.sin(elapsedTime * 2.8) * 0.5 + 0.5) : 1.0;
        playerAssetRef.current.applyAnimationState(animState, elapsedTime, delta, actionProg);
      } else if (charGroup) {
        const breath = Math.sin(elapsedTime * 2.2) * 0.012;
        charGroup.position.y = breath;
      }

      // Embers floating upward
      if (embers) {
        const posAttr = embers.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        for (let i = 0; i < emberCount; i++) {
          array[i * 3 + 1] += delta * 0.35;
          if (array[i * 3 + 1] > 2.3) {
            array[i * 3 + 1] = 0.1;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [isAutoRotating]);

  // Update Scene Lighting Preset
  useEffect(() => {
    const lightsGroup = lightsGroupRef.current;
    if (!lightsGroup) return;

    // Clear existing lights
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    if (activeLighting === 'dawn') {
      // Warm gold & peach dawn
      const ambient = new THREE.AmbientLight(0x2a1a24, 1.2);
      lightsGroup.add(ambient);

      const sun = new THREE.DirectionalLight(0xffb703, 2.4);
      sun.position.set(3, 4, 3);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      lightsGroup.add(sun);

      const rim = new THREE.DirectionalLight(0xec4899, 1.5);
      rim.position.set(-3, 3, -3);
      lightsGroup.add(rim);

      const groundBounce = new THREE.PointLight(0xd97706, 1.2, 4);
      groundBounce.position.set(0, 0.2, 0);
      lightsGroup.add(groundBounce);
    } else if (activeLighting === 'eclipse') {
      // Abyssal purple & cold cyan eclipse with warm rim defining silhouette
      const ambient = new THREE.AmbientLight(0x1a1533, 1.3);
      lightsGroup.add(ambient);

      const key = new THREE.DirectionalLight(0xa78bfa, 2.4);
      key.position.set(2, 4, 2);
      key.castShadow = true;
      lightsGroup.add(key);

      const rim = new THREE.DirectionalLight(0x38bdf8, 2.2);
      rim.position.set(-3, 3, -2);
      lightsGroup.add(rim);

      // Character front silhouette fill for dark mode readability
      const faceFill = new THREE.DirectionalLight(0xfef08a, 0.75);
      faceFill.position.set(0, 1.6, 2.5);
      lightsGroup.add(faceFill);

      const corona = new THREE.PointLight(0xd946ef, 1.5, 4);
      corona.position.set(0, 1.5, -1);
      lightsGroup.add(corona);
    } else {
      // Crisp high-contrast noon solar temple
      const ambient = new THREE.AmbientLight(0x222633, 1.4);
      lightsGroup.add(ambient);

      const sun = new THREE.DirectionalLight(0xfffbeb, 2.6);
      sun.position.set(2.5, 5, 3.5);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      lightsGroup.add(sun);

      const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
      fill.position.set(-3, 2, 2);
      lightsGroup.add(fill);

      const rim = new THREE.DirectionalLight(0xf59e0b, 1.6);
      rim.position.set(-1, 3, -3);
      lightsGroup.add(rim);
    }
  }, [activeLighting]);

  // Rebuild / Update 3D Character Model with Anatomical Humanoid Asset
  useEffect(() => {
    const charGroup = characterGroupRef.current;
    if (!charGroup) return;

    // Dispose previous asset
    if (playerAssetRef.current) {
      playerAssetRef.current.dispose();
      playerAssetRef.current = null;
    }

    // Clear previous model meshes
    while (charGroup.children.length > 0) {
      charGroup.remove(charGroup.children[0]);
    }

    // Build anatomical humanoid player character
    const asset = createHumanoidPlayerCharacter(
      appearance,
      archetype,
      specialization,
      weaponType,
      transmog
    );
    playerAssetRef.current = asset;
    charGroup.add(asset.rootGroup);

    // Load master character rig (runtime URL or local assets)
    asset.loadMasterCharacter();

    // Load external Rodin Gen-2.5 GLB model if placed at /assets/characters/aethelgard-hero.glb
    asset.loadExternalGLB('/assets/characters/aethelgard-hero.glb');

    return () => {
      if (playerAssetRef.current) {
        playerAssetRef.current.dispose();
        playerAssetRef.current = null;
      }
    };
  }, [appearance, archetype, specialization, weaponType, transmog]);

  // Mouse & Touch Orbit Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    orbitStateRef.current.isDragging = true;
    orbitStateRef.current.prevX = e.clientX;
    orbitStateRef.current.prevY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const orbit = orbitStateRef.current;
    if (!orbit.isDragging) return;
    const dx = e.clientX - orbit.prevX;
    const dy = e.clientY - orbit.prevY;
    orbit.prevX = e.clientX;
    orbit.prevY = e.clientY;

    orbit.rotY += dx * 0.008;
    orbit.rotX = Math.max(-0.4, Math.min(0.7, orbit.rotX + dy * 0.008));
  };

  const handleMouseUp = () => {
    orbitStateRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const orbit = orbitStateRef.current;
    orbit.targetDistance = Math.max(1.0, Math.min(5.0, orbit.targetDistance + e.deltaY * 0.003));
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      orbitStateRef.current.isDragging = true;
      orbitStateRef.current.prevX = e.touches[0].clientX;
      orbitStateRef.current.prevY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const orbit = orbitStateRef.current;
    if (!orbit.isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - orbit.prevX;
    const dy = e.touches[0].clientY - orbit.prevY;
    orbit.prevX = e.touches[0].clientX;
    orbit.prevY = e.touches[0].clientY;

    orbit.rotY += dx * 0.01;
    orbit.rotX = Math.max(-0.4, Math.min(0.7, orbit.rotX + dy * 0.01));
  };

  const handleTouchEnd = () => {
    orbitStateRef.current.isDragging = false;
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative select-none overflow-hidden rounded-2xl bg-neutral-950 border border-amber-500/20 shadow-2xl ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Orbit & Camera Presets Toolbar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        {/* Camera Angles */}
        <div className="flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => applyCameraPreset('full')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              cameraPreset === 'full' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Full Body View"
          >
            Full
          </button>
          <button
            onClick={() => applyCameraPreset('waist')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              cameraPreset === 'waist' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Waist-up View"
          >
            Waist
          </button>
          <button
            onClick={() => applyCameraPreset('face')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              cameraPreset === 'face' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Face Closeup"
          >
            Face
          </button>
        </div>

        {/* Character Pose Switcher */}
        <div className="flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setCharacterPose('idle')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              characterPose === 'idle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Idle Breathing Pose"
          >
            Idle
          </button>
          <button
            onClick={() => setCharacterPose('combat')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              characterPose === 'combat'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Battle Ready Stance"
          >
            Battle
          </button>
          <button
            onClick={() => setCharacterPose('triumph')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              characterPose === 'triumph'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Victory Triumph Pose"
          >
            Triumph
          </button>
        </div>

        {/* Lighting & Rotation Controls */}
        <div className="flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveLighting('dawn')}
            className={`p-1.5 rounded-lg transition-all ${activeLighting === 'dawn' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'}`}
            title="Dawn Lighting"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => setActiveLighting('noon')}
            className={`p-1.5 rounded-lg transition-all ${activeLighting === 'noon' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'}`}
            title="Noon Temple Lighting"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </button>
          <button
            onClick={() => setActiveLighting('eclipse')}
            className={`p-1.5 rounded-lg transition-all ${activeLighting === 'eclipse' ? 'bg-purple-500/20 text-purple-300' : 'text-neutral-400 hover:text-neutral-200'}`}
            title="Twilight Eclipse Lighting"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
          </button>

          <div className="w-[1px] h-4 bg-neutral-800 mx-0.5" />

          <button
            onClick={() => setIsAutoRotating(prev => !prev)}
            className={`p-1.5 rounded-lg transition-all ${isAutoRotating ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'}`}
            title="Toggle Turntable Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Origin & Class 3D Badge Overlay */}
      <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1">
        <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-black/60 border border-amber-500/30 text-amber-300 backdrop-blur-sm">
          3D REALTIME FORGE
        </span>
        <span className="text-xs font-display font-bold text-neutral-200 drop-shadow">
          {appearance.name || 'Nameless Wanderer'}
        </span>
      </div>

      {/* Orbit interaction hint */}
      <div className="absolute top-3 right-3 pointer-events-none text-[10px] font-mono text-neutral-400/80 bg-black/50 px-2 py-0.5 rounded border border-neutral-800">
        Drag to Orbit • Scroll to Zoom
      </div>
    </div>
  );
};
