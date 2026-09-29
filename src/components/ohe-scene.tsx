import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CalculationResult, OheConfig } from '@/lib/ohe-rules';

export type SceneView = 'iso' | 'front' | 'side' | 'top';

interface OheSceneProps {
  config: OheConfig;
  result: CalculationResult;
  view: SceneView;
  wireframe?: boolean;
}

function createMaterials(wireframe: boolean) {
  return {
    steel: new THREE.MeshStandardMaterial({
      color: '#768c9f',
      metalness: 0.8,
      roughness: 0.35,
      wireframe,
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      color: '#3f5163',
      metalness: 0.85,
      roughness: 0.45,
      wireframe,
    }),
    railSteel: new THREE.MeshStandardMaterial({
      color: '#9db4c8',
      metalness: 0.9,
      roughness: 0.25,
      wireframe,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: '#8b969e',
      roughness: 0.9,
      wireframe,
    }),
    superBlockConcrete: new THREE.MeshStandardMaterial({
      color: '#a8b4be',
      roughness: 0.75,
      wireframe,
    }),
    concreteMuff: new THREE.MeshStandardMaterial({
      color: '#b5c1c9',
      roughness: 0.8,
      wireframe,
    }),
    ground: new THREE.MeshStandardMaterial({
      color: '#1a2430',
      roughness: 1,
      wireframe,
    }),
    ballast: new THREE.MeshStandardMaterial({
      color: '#53606e',
      roughness: 0.95,
      wireframe,
    }),
    sleeper: new THREE.MeshStandardMaterial({
      color: '#433c37',
      roughness: 0.85,
      wireframe,
    }),
    contactWire: new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.8,
      roughness: 0.3,
      wireframe,
    }),
    catenaryWire: new THREE.MeshStandardMaterial({
      color: '#e2b340',
      metalness: 0.7,
      roughness: 0.4,
      wireframe,
    }),
    porcelain: new THREE.MeshStandardMaterial({
      color: '#e2dfcd',
      roughness: 0.25,
      metalness: 0.1,
      wireframe,
    }),
    dimLine: new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      wireframe,
    }),
    stepLine: new THREE.MeshBasicMaterial({
      color: '#f97316',
      wireframe,
    }),
    sbLine: new THREE.MeshBasicMaterial({
      color: '#10b981',
      wireframe,
    }),
    counterweight: new THREE.MeshStandardMaterial({
      color: '#2d3748',
      metalness: 0.6,
      roughness: 0.6,
      wireframe,
    }),
  };
}

function addBox(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: THREE.Material
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRod(
  group: THREE.Group,
  a: [number, number, number],
  b: [number, number, number],
  radius: number,
  material: THREE.Material
) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dir = end.clone().sub(start);
  const length = dir.length();
  if (length < 0.001) return;

  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  mesh.position.copy(start.add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function buildOheAssembly(config: OheConfig, result: CalculationResult, wireframe: boolean): THREE.Group {
  const group = new THREE.Group();
  const mat = createMaterials(wireframe);

  const implantation = config.implantation ?? 3.00;
  const mastX = -implantation;
  const isBwa = config.role === 'OLA/BWA';
  const isRolled = result.mastType === 'rolled';

  // Cess Step Level C (distance from Rail Level to Foundation Top)
  const stepC = result.superBlock.stepC;
  const railY = 0.28; // Rail level elevation
  // If excess step (C > 0.50), top of main foundation is at (railY - stepC)
  // and Super Block of height (C - 0.50) is cast on top, reaching (railY - 0.50).
  // If C <= 0.50, top of main foundation is at (railY - stepC).
  const fTopY = railY - stepC;
  const castingTopY = result.superBlock.required ? railY - 0.50 : fTopY;

  // 1. Ground and Formation / Ballast
  addBox(group, -1, -0.4, 0, 14, 0.4, 14, mat.ground); // Ground
  addBox(group, 0, -0.05, 0, 3.8, 0.25, 14, mat.ballast); // Ballast bed

  // 2. Broad Gauge Track: Sleepers and Rails
  // Sleepers: length 2.75m along X, width 0.25m along Z, height 0.14m along Y
  for (let z = -6.5; z <= 6.5; z += 0.65) {
    addBox(group, 0, 0.12, z, 2.75, 0.14, 0.24, mat.sleeper);
  }

  // Broad gauge running rails: 1.676m gauge (rails at x = ±0.838m)
  for (const rx of [-0.838, 0.838]) {
    // Rail head
    addBox(group, rx, railY, 0, 0.08, 0.16, 14, mat.railSteel);
    // Rail base
    addBox(group, rx, 0.20, 0, 0.16, 0.04, 14, mat.darkSteel);
  }

  // 3. Lower Foundation Block (sized to matched dimensions A × B × H)
  const fA = result.foundations.bType.a;
  const fB = result.foundations.bType.b;
  const fH = result.foundations.bType.h;
  // Lower foundation center is at fTopY - fH / 2
  addBox(group, mastX, fTopY - fH / 2, 0, fA, fH, fB, mat.concrete);

  // 4. Parametric Super Block (if C > 0.50 m)
  if (result.superBlock.required && result.superBlock.height > 0) {
    const sbH = result.superBlock.height;
    // Super Block rests on top of main foundation (from fTopY to castingTopY)
    const sbCenterY = fTopY + sbH / 2;
    addBox(group, mastX, sbCenterY, 0, fA * 0.95, sbH, fB * 0.95, mat.superBlockConcrete);

    // Visual Super Block Callout / Dimension Line
    const sbMarkerX = mastX + fA * 0.65;
    addRod(group, [sbMarkerX, fTopY, 0], [sbMarkerX, castingTopY, 0], 0.012, mat.sbLine);
    addRod(group, [sbMarkerX - 0.1, fTopY, 0], [sbMarkerX + 0.1, fTopY, 0], 0.014, mat.sbLine);
    addRod(group, [sbMarkerX - 0.1, castingTopY, 0], [sbMarkerX + 0.1, castingTopY, 0], 0.014, mat.sbLine);
  }

  // 5. Concrete Chamfered Muff (placed at top of casting)
  const muffH = 0.26;
  const muffMesh = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(fA, fB) * 0.42, muffH, 4),
    mat.concreteMuff
  );
  muffMesh.position.set(mastX, castingTopY + muffH / 2, 0);
  muffMesh.rotation.y = Math.PI / 4;
  muffMesh.castShadow = true;
  group.add(muffMesh);

  // 6. Steel Mast Column Geometry
  // Standard mast embedded length = 1.35m + Super Block height if present
  // Height above casting top = 8.15m
  const mastHeightAbove = 8.15;
  const mastCenterY = castingTopY + mastHeightAbove / 2;

  if (isRolled) {
    // Rolled Section: 8"x6" RSJ or 6"x6" BFB (I-Beam geometry)
    // Central web
    addBox(group, mastX, mastCenterY, 0, 0.018, mastHeightAbove, 0.20, mat.darkSteel);
    // Outer flanges
    addBox(group, mastX + 0.075, mastCenterY, 0, 0.15, mastHeightAbove, 0.022, mat.steel);
    addBox(group, mastX - 0.075, mastCenterY, 0, 0.15, mastHeightAbove, 0.022, mat.steel);
  } else {
    // Fabricated K-Series Lattice Truss (K-150 / K-175 / K-200 / K-225 / K-250)
    const trussWidth = result.mastSection.includes('K-250')
      ? 0.25
      : result.mastSection.includes('K-225')
      ? 0.225
      : result.mastSection.includes('K-200')
      ? 0.20
      : 0.175;
    const halfW = trussWidth / 2;

    // 4 vertical channel legs
    for (const dx of [-halfW, halfW]) {
      for (const dz of [-halfW, halfW]) {
        addBox(group, mastX + dx, mastCenterY, dz, 0.05, mastHeightAbove, 0.05, mat.steel);
      }
    }
    // Diagonal 45-degree flat bar lacing panels along height
    const panelCount = 14;
    const panelH = mastHeightAbove / panelCount;
    for (let i = 0; i < panelCount; i++) {
      const y1 = castingTopY + i * panelH;
      const y2 = castingTopY + (i + 1) * panelH;
      // Front and rear face alternating diagonal lacing
      addRod(group, [mastX - halfW, y1, -halfW], [mastX + halfW, y2, -halfW], 0.014, mat.darkSteel);
      addRod(group, [mastX + halfW, y1, halfW], [mastX - halfW, y2, halfW], 0.014, mat.darkSteel);
      // Horizontal batten tie plates
      addRod(group, [mastX - halfW, y2, -halfW], [mastX - halfW, y2, halfW], 0.012, mat.darkSteel);
      addRod(group, [mastX + halfW, y2, -halfW], [mastX + halfW, y2, halfW], 0.012, mat.darkSteel);
    }
  }

  // 7. Cantilever Assembly (Stay tube, Bracket tube, Register arm, Insulators)
  // Contact wire is at standard RDSO height: y = 5.60 m.
  // Catenary wire is at y = 6.80 m (1.20 m encumbrance).
  const contactY = 5.60;
  const catenaryY = 6.80;
  const contactStagger = config.alignment === 'inside' ? 0.20 : config.alignment === 'outside' ? -0.20 : 0.15;
  const contactX = contactStagger;

  // Bracket tube (inclined from mast to contact wire assembly)
  addRod(group, [mastX, castingTopY + 5.90, 0], [contactX - 0.25, 6.75, 0], 0.038, mat.steel);
  // Top Stay tube (from upper mast to catenary support point)
  addRod(group, [mastX, castingTopY + 7.60, 0], [contactX, catenaryY + 0.1, 0], 0.032, mat.steel);
  // Register arm (horizontal arm supporting steady arm)
  addRod(group, [contactX - 0.70, 5.75, 0], [contactX + 0.10, 5.75, 0], 0.025, mat.steel);
  // Steady arm (holding contact wire clip)
  addRod(group, [contactX - 0.15, 5.75, 0], [contactX, contactY, 0], 0.018, mat.steel);

  // Porcelain disc insulator bells on mast attachment points
  for (const iy of [castingTopY + 5.90, castingTopY + 7.60]) {
    const insMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.45, 8), mat.porcelain);
    insMesh.position.set(mastX + 0.35, iy, 0);
    insMesh.rotation.z = Math.PI / 2;
    group.add(insMesh);
  }

  // 8. Overhead Conductors
  // Contact Wire running along track at y = 5.60 m
  addRod(group, [contactX, contactY, -7], [contactX, contactY, 7], 0.014, mat.contactWire);
  // Catenary Wire running along track at y = 6.80 m
  addRod(group, [contactX, catenaryY, -7], [contactX, catenaryY, 7], 0.012, mat.catenaryWire);

  // Droppers connecting catenary wire to contact wire
  for (const dz of [-4.5, -2.2, 0, 2.2, 4.5]) {
    addRod(group, [contactX, catenaryY, dz], [contactX, contactY + 0.02, dz], 0.006, mat.contactWire);
  }

  // 9. If BWA (Balance Weight Anchor): Guy Rod at 45°, Anchor Block, 3-Pulley ATD, Counterweights
  if (isBwa) {
    const anchorDistance = 4.2; // guy anchor block offset behind mast
    const anchorX = mastX - anchorDistance;
    // Guy anchor concrete foundation block
    addBox(group, anchorX, -0.8, 0, 1.2, 1.6, 1.2, mat.concrete);
    addBox(group, anchorX, 0.15, 0, 0.8, 0.3, 0.8, mat.concreteMuff);

    // Guy rod from mast top to anchor foundation at 45 degrees
    addRod(group, [mastX, castingTopY + 7.8, 0], [anchorX, 0.25, 0], 0.025, mat.steel);

    // 3-Pulley Auto Tensioning Device (ATD) bracket near mast top
    addBox(group, mastX - 0.35, castingTopY + 7.2, 0, 0.45, 0.15, 0.25, mat.darkSteel);
    for (const pOffset of [-0.08, 0.0, 0.08]) {
      const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), mat.darkSteel);
      pulley.position.set(mastX - 0.45, castingTopY + 7.2, pOffset);
      pulley.rotation.x = Math.PI / 2;
      group.add(pulley);
    }

    // Counterweight stack on guide rod
    addRod(group, [mastX - 0.45, 1.0, 0], [mastX - 0.45, castingTopY + 6.8, 0], 0.016, mat.steel);
    for (let c = 0; c < 14; c++) {
      addBox(group, mastX - 0.45, 1.3 + c * 0.12, 0, 0.45, 0.09, 0.45, mat.counterweight);
    }
  }

  // 10. Dynamic 3D HUD Annotations & Dimension Lines
  // A. Horizontal Implantation Dimension: Track Center (x=0) to Mast Face (x=mastX)
  const dimY = 0.55;
  addRod(group, [mastX, dimY, 0], [0, dimY, 0], 0.012, mat.dimLine);
  addRod(group, [mastX, dimY - 0.2, 0], [mastX, dimY + 0.2, 0], 0.015, mat.dimLine);
  addRod(group, [0, dimY - 0.2, 0], [0, dimY + 0.2, 0], 0.015, mat.dimLine);

  // B. Step Level Difference Dimension Line (C): Rail Level (railY) down to Foundation Top (fTopY)
  const stepDimX = mastX + fA / 2 + 0.22;
  addRod(group, [stepDimX, railY, 0], [stepDimX, fTopY, 0], 0.012, mat.stepLine);
  addRod(group, [stepDimX - 0.1, railY, 0], [stepDimX + 0.1, railY, 0], 0.015, mat.stepLine);
  addRod(group, [stepDimX - 0.1, fTopY, 0], [stepDimX + 0.1, fTopY, 0], 0.015, mat.stepLine);

  return group;
}

function SceneCanvasContent({
  config,
  result,
  view,
  wireframe,
}: {
  config: OheConfig;
  result: CalculationResult;
  view: SceneView;
  wireframe: boolean;
}) {
  const { scene, camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  // Setup lighting, background, and orbit controls
  useEffect(() => {
    scene.background = new THREE.Color('#0d1520');
    scene.fog = new THREE.Fog('#0d1520', 20, 50);

    const ambientLight = new THREE.AmbientLight('#cfe1f5', 2.2);
    const sunLight = new THREE.DirectionalLight('#fff5e0', 3.2);
    sunLight.position.set(6, 16, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);

    const fillLight = new THREE.DirectionalLight('#60a5fa', 1.4);
    fillLight.position.set(-10, 8, -6);

    const grid = new THREE.GridHelper(30, 30, '#334155', '#1e293b');
    grid.position.y = -0.41;

    scene.add(ambientLight, sunLight, fillLight, grid);

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.target.set(-1.5, 3.8, 0);
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
      scene.remove(ambientLight, sunLight, fillLight, grid);
      grid.geometry.dispose();
    };
  }, [scene, camera, gl]);

  // Build model when parameters change
  useEffect(() => {
    const assembly = buildOheAssembly(config, result, wireframe);
    scene.add(assembly);

    return () => {
      scene.remove(assembly);
      assembly.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
    };
  }, [
    scene,
    config.implantation,
    config.stepLevel,
    config.role,
    config.alignment,
    config.wind,
    result.mastSection,
    result.superBlock.height,
    wireframe,
  ]);

  // Adjust camera position based on preset view
  useEffect(() => {
    const target = new THREE.Vector3(-1.5, 3.8, 0);
    if (view === 'front') {
      camera.position.set(-1.5, 4.0, 13);
    } else if (view === 'side') {
      camera.position.set(13, 4.0, 0);
    } else if (view === 'top') {
      camera.position.set(-1.5, 18, 0.1);
    } else {
      // Isometric view
      camera.position.set(8, 7.5, 10);
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, view]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

export default function OheScene({
  config,
  result,
  view,
  wireframe = false,
}: OheSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 7.5, 10], fov: 42, near: 0.1, far: 120 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <SceneCanvasContent
        config={config}
        result={result}
        view={view}
        wireframe={wireframe}
      />
    </Canvas>
  );
}
