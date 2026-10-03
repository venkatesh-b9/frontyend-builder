import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CalculationResult, FoundationTypeKey, OheConfig } from '@/lib/ohe-rules';

export type SceneView = 'iso' | 'front' | 'side' | 'top';

interface OheSceneProps {
  config: OheConfig;
  result: CalculationResult;
  view: SceneView;
  wireframe?: boolean;
  selectedFoundationType?: FoundationTypeKey;
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
    plateMetal: new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.9,
      roughness: 0.25,
      wireframe,
    }),
    badgeSignal: new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.5,
      roughness: 0.3,
      wireframe,
    }),
    badgeAccent: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      metalness: 0.6,
      roughness: 0.3,
      wireframe,
    }),
    anchorLine: new THREE.MeshStandardMaterial({
      color: '#f97316',
      metalness: 0.8,
      roughness: 0.3,
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

/**
 * Builds an asymmetric side gravity trapezoidal prism per Image 4 (BG-Type).
 * Track face is vertical; outer rear face is sloped downwards.
 */
function addTrapezoidPrism(
  group: THREE.Group,
  xFront: number,
  xTopBack: number,
  xBotBack: number,
  yTop: number,
  yBot: number,
  zLen: number,
  material: THREE.Material
) {
  const halfZ = zLen / 2;
  const positions = new Float32Array([
    // Front Z face (+Z)
    xFront, yTop, halfZ,   // 0
    xTopBack, yTop, halfZ, // 1
    xBotBack, yBot, halfZ, // 2
    xFront, yBot, halfZ,   // 3
    // Back Z face (-Z)
    xFront, yTop, -halfZ,   // 4
    xTopBack, yTop, -halfZ, // 5
    xBotBack, yBot, -halfZ, // 6
    xFront, yBot, -halfZ,   // 7
  ]);

  const indices = [
    // Front face (+Z)
    0, 2, 1,  0, 3, 2,
    // Back face (-Z)
    4, 5, 6,  4, 6, 7,
    // Top face
    0, 1, 5,  0, 5, 4,
    // Sloped rear face
    1, 2, 6,  1, 6, 5,
    // Bottom face
    3, 7, 6,  3, 6, 2,
    // Track vertical front face
    0, 4, 7,  0, 7, 3,
  ];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/**
 * Builds a pyramidal frustum connecting bottom rectangle to top rectangle per Image 5 (NG-Type).
 */
function addFrustum(
  group: THREE.Group,
  centerX: number,
  yBot: number,
  yTop: number,
  botW: number, // across track (X)
  botD: number, // along track (Z)
  topW: number, // across track (X)
  topD: number, // along track (Z)
  material: THREE.Material
) {
  const halfBotW = botW / 2;
  const halfBotD = botD / 2;
  const halfTopW = topW / 2;
  const halfTopD = topD / 2;

  const positions = new Float32Array([
    // Top 4 vertices (y = yTop)
    centerX - halfTopW, yTop,  halfTopD, // 0
    centerX + halfTopW, yTop,  halfTopD, // 1
    centerX + halfTopW, yTop, -halfTopD, // 2
    centerX - halfTopW, yTop, -halfTopD, // 3
    // Bottom 4 vertices (y = yBot)
    centerX - halfBotW, yBot,  halfBotD, // 4
    centerX + halfBotW, yBot,  halfBotD, // 5
    centerX + halfBotW, yBot, -halfBotD, // 6
    centerX - halfBotW, yBot, -halfBotD, // 7
  ]);

  const indices = [
    // Top face
    0, 1, 2,  0, 2, 3,
    // Bottom face
    4, 6, 5,  4, 7, 6,
    // Front (+Z)
    0, 4, 5,  0, 5, 1,
    // Right (+X)
    1, 5, 6,  1, 6, 2,
    // Back (-Z)
    2, 6, 7,  2, 7, 3,
    // Left (-X)
    3, 7, 4,  3, 4, 0,
  ];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function buildOheAssembly(
  config: OheConfig,
  result: CalculationResult,
  wireframe: boolean,
  foundationTypeKey: FoundationTypeKey = 'bType'
): THREE.Group {
  const group = new THREE.Group();
  const mat = createMaterials(wireframe);

  const implantation = config.implantation ?? 3.00;
  const mastX = -implantation;
  const isBwa = config.role === 'OLA/BWA';
  const isRolled = result.mastType === 'rolled';

  // Cess Step Level C (distance from Rail Level to Foundation Top)
  const stepC = result.superBlock.stepC;
  const railY = 0.28; // Rail level elevation
  const fTopY = railY - stepC;
  const castingTopY = result.superBlock.required ? railY - 0.50 : fTopY;
  const sbH = result.superBlock.required && result.superBlock.height > 0 ? result.superBlock.height : 0;

  // 1. Ground and Formation / Ballast
  addBox(group, -1, -0.4, 0, 14, 0.4, 14, mat.ground);
  addBox(group, 0, -0.05, 0, 3.8, 0.25, 14, mat.ballast);

  // 2. Broad Gauge Track: Sleepers and Rails (1676 mm gauge)
  for (let z = -6.5; z <= 6.5; z += 0.65) {
    addBox(group, 0, 0.12, z, 2.75, 0.14, 0.24, mat.sleeper);
  }

  for (const rx of [-0.838, 0.838]) {
    addBox(group, rx, railY, 0, 0.08, 0.16, 14, mat.railSteel);
    addBox(group, rx, 0.20, 0, 0.16, 0.04, 14, mat.darkSteel);
  }

  // 3. PARAMETRIC FOUNDATION GEOMETRY (Matching Image 3, Image 4, Image 5)
  let muffTopWidth = 0.80;

  if (foundationTypeKey === 'bgType') {
    // ------------------------------------------------------------------------
    // IMAGE 4: BG-Type Side Gravity Foundation (Slopes/Cuttings)
    // ------------------------------------------------------------------------
    const bgEntry = result.foundations.bgType;
    const bgA = bgEntry.a; // Across track base width (1.40 - 2.00 m)
    const bgB = bgEntry.b; // Along track length (0.80 - 2.70 m)
    const bgC = bgEntry.c ?? 0.80; // Top width across track (0.80 m constant)
    const bgH = bgEntry.h; // Height (1.60 m)
    muffTopWidth = bgC;

    // Track face vertical at x = mastX - 0.40; outer slope down to mastX - 0.40 + bgA
    const xFront = mastX - bgC / 2;
    const xTopBack = mastX + bgC / 2;
    const xBotBack = xFront + bgA;
    const yTop = fTopY;
    const yBot = fTopY - bgH;

    addTrapezoidPrism(group, xFront, xTopBack, xBotBack, yTop, yBot, bgB, mat.concrete);

    // Super Block if C > 0.50 m (rests on top of C × B)
    if (sbH > 0) {
      addBox(group, mastX, fTopY + sbH / 2, 0, bgC * 0.96, sbH, bgB * 0.96, mat.superBlockConcrete);
    }

    // Dimension callout for BG-Type
    const markerX = xBotBack + 0.2;
    addRod(group, [markerX, yBot, 0], [markerX, yTop, 0], 0.012, mat.dimLine);
    addRod(group, [xFront, yBot - 0.1, 0], [xBotBack, yBot - 0.1, 0], 0.012, mat.dimLine);

  } else if (foundationTypeKey === 'ngType') {
    // ------------------------------------------------------------------------
    // IMAGE 5: NG-Type Pure Gravity Stepped Frustum Foundation
    // ------------------------------------------------------------------------
    const ngEntry = result.foundations.ngType;
    const ngDims = ngEntry.ngDims ?? {
      a1: 1.50,
      a2: 0.80,
      b1: 2.20,
      b2: 1.90,
      b3: 0.95,
      b4: 0.80,
    };
    muffTopWidth = ngDims.b4;

    // Stage 1: Bottom footing slab (150 mm = 0.15 m)
    const h1 = 0.15;
    const y1 = fTopY - 1.50 + h1 / 2;
    addBox(group, mastX, y1, 0, ngDims.b1, h1, ngDims.a1, mat.concrete);

    // Stage 2: Middle frustum (500 mm = 0.50 m)
    const yBot2 = fTopY - 1.50 + h1;
    const yTop2 = yBot2 + 0.50;
    addFrustum(group, mastX, yBot2, yTop2, ngDims.b2, ngDims.a1, ngDims.b3, ngDims.a2, mat.concrete);

    // Stage 3: Top rectangular neck / pedestal (850 mm = 0.85 m)
    const h3 = 0.85;
    const y3 = fTopY - h3 / 2;
    addBox(group, mastX, y3, 0, ngDims.b4, h3, ngDims.a2, mat.concrete);

    // Super Block if C > 0.50 m (rests on top of B4 × A2 neck)
    if (sbH > 0) {
      addBox(group, mastX, fTopY + sbH / 2, 0, ngDims.b4 * 0.96, sbH, ngDims.a2 * 0.96, mat.superBlockConcrete);
    }

  } else if (foundationTypeKey === 'nbcType') {
    // ------------------------------------------------------------------------
    // PDF 2 PAGE 06: NBC-Type Dry Black Cotton Soil Deep Stepped Foundation
    // ------------------------------------------------------------------------
    const nbcEntry = result.foundations.nbcType;
    const nbcDims = nbcEntry.nbcDims ?? {
      a1: 1.20,
      a2: 0.80,
      b1: 1.90,
      b2: 1.00,
      b3: 0.80,
      h2: 0.45,
      h3: 2.25,
    };
    muffTopWidth = nbcDims.a2;

    const totalDepth = 0.15 + nbcDims.h2 + nbcDims.h3;
    // Stage 1: Bottom base pad (150 mm = 0.15 m)
    const h1 = 0.15;
    const y1 = fTopY - totalDepth + h1 / 2;
    addBox(group, mastX, y1, 0, nbcDims.a1, h1, nbcDims.b1, mat.concrete);

    // Stage 2: Pyramidal frustum of height H2 tapering to A2 × B2
    const yBot2 = fTopY - totalDepth + h1;
    const yTop2 = yBot2 + nbcDims.h2;
    addFrustum(group, mastX, yBot2, yTop2, nbcDims.a1, nbcDims.b1, nbcDims.a2, nbcDims.b2, mat.concrete);

    // Stage 3: Top pedestal column of height H3 (A2 × B2)
    const y3 = fTopY - nbcDims.h3 / 2;
    addBox(group, mastX, y3, 0, nbcDims.a2, nbcDims.h3, nbcDims.b2, mat.concrete);

    // Super Block if C > 0.50 m (rests on top of A2 × B2 neck)
    if (sbH > 0) {
      addBox(group, mastX, fTopY + sbH / 2, 0, nbcDims.a2 * 0.96, sbH, nbcDims.b2 * 0.96, mat.superBlockConcrete);
    }

  } else if (foundationTypeKey === 'wbcType') {
    // ------------------------------------------------------------------------
    // PDF 2 PAGE 04: WBC-Type Wet Black Cotton Soil Stepped Raft Foundation
    // ------------------------------------------------------------------------
    const wbcEntry = result.foundations.wbcType;
    const wbcDims = wbcEntry.wbcDims ?? {
      a1: 1.10,
      a2: 1.80,
      a3: 0.80,
      b1: 1.50,
      b2: 2.20,
      h1: 1.20,
      h2: 0.50,
    };
    muffTopWidth = wbcDims.a1;

    const totalDepth = wbcDims.h1 + wbcDims.h2;
    // Stage 1: Bottom base raft pad (H2 = 0.50 m, A2 × B2)
    const yBotRaft = fTopY - totalDepth + wbcDims.h2 / 2;
    addBox(group, mastX, yBotRaft, 0, wbcDims.a2, wbcDims.h2, wbcDims.b2, mat.concrete);

    // Stage 2: Upper rectangular pedestal (H1 = 1.20 m, A1 × B1)
    const yTopPedestal = fTopY - wbcDims.h1 / 2;
    addBox(group, mastX, yTopPedestal, 0, wbcDims.a1, wbcDims.h1, wbcDims.b1, mat.concrete);

    // Super Block if C > 0.50 m (rests on top of A1 × B1)
    if (sbH > 0) {
      addBox(group, mastX, fTopY + sbH / 2, 0, wbcDims.a1 * 0.96, sbH, wbcDims.b1 * 0.96, mat.superBlockConcrete);
    }

  } else {
    // ------------------------------------------------------------------------
    // IMAGE 3: B-Type (Normal Soil) or HB-Type (Hard Soil) Rectangular Foundation
    // ------------------------------------------------------------------------
    const entry = foundationTypeKey === 'hbType' ? result.foundations.hbType : result.foundations.bType;
    const fA = entry.a;
    const fB = entry.b;
    const fH = entry.h;
    muffTopWidth = Math.max(fA, fB);

    addBox(group, mastX, fTopY - fH / 2, 0, fA, fH, fB, mat.concrete);

    // Super Block if C > 0.50 m
    if (sbH > 0) {
      addBox(group, mastX, fTopY + sbH / 2, 0, fA * 0.96, sbH, fB * 0.96, mat.superBlockConcrete);
    }
  }

  // Super Block Indicator Rods
  if (sbH > 0) {
    const sbMarkerX = mastX + 0.65;
    addRod(group, [sbMarkerX, fTopY, 0], [sbMarkerX, castingTopY, 0], 0.012, mat.sbLine);
    addRod(group, [sbMarkerX - 0.1, fTopY, 0], [sbMarkerX + 0.1, fTopY, 0], 0.014, mat.sbLine);
    addRod(group, [sbMarkerX - 0.1, castingTopY, 0], [sbMarkerX + 0.1, castingTopY, 0], 0.014, mat.sbLine);
  }

  // 4. Concrete Chamfered Muff (placed at top of casting)
  const muffH = 0.26;
  const muffMesh = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(0.40, muffTopWidth * 0.40), muffH, 4),
    mat.concreteMuff
  );
  muffMesh.position.set(mastX, castingTopY + muffH / 2, 0);
  muffMesh.rotation.y = Math.PI / 4;
  muffMesh.castShadow = true;
  group.add(muffMesh);

  // 5. STEEL MAST COLUMN GEOMETRY: STRICTLY B-TYPE ONLY (NO K-TYPE MASTS)
  const mastHeightAbove = 8.15;
  const mastCenterY = castingTopY + mastHeightAbove / 2;

  if (isRolled) {
    // Rolled Section: 8"x6" RSJ or 6"x6" BFB (I-Beam geometry)
    addBox(group, mastX, mastCenterY, 0, 0.018, mastHeightAbove, 0.20, mat.darkSteel);
    addBox(group, mastX + 0.075, mastCenterY, 0, 0.15, mastHeightAbove, 0.022, mat.steel);
    addBox(group, mastX - 0.075, mastCenterY, 0, 0.15, mastHeightAbove, 0.022, mat.steel);
  } else {
    // AUTHENTIC RDSO B-SERIES BATTENED MAST (B-150 / B-175 / B-200 / B-225 / B-250)
    // Strictly B-Type horizontal batten plates, NO diagonal K-truss!
    const mastWidth = result.mastSection.includes('B-250')
      ? 0.25
      : result.mastSection.includes('B-225')
      ? 0.225
      : result.mastSection.includes('B-200')
      ? 0.20
      : result.mastSection.includes('B-175')
      ? 0.175
      : 0.15;
    const halfW = mastWidth / 2;

    // Two ISMC channel legs spaced along Z
    for (const dz of [-halfW, halfW]) {
      // Channel web
      addBox(group, mastX, mastCenterY, dz, 0.14, mastHeightAbove, 0.022, mat.steel);
      // Flanges on both sides of channel web
      addBox(group, mastX - 0.06, mastCenterY, dz, 0.02, mastHeightAbove, 0.05, mat.steel);
      addBox(group, mastX + 0.06, mastCenterY, dz, 0.02, mastHeightAbove, 0.05, mat.steel);
    }

    // Horizontal Steel Batten Plates (B-Series Battened Mast ties spaced every 0.45m)
    const battenCount = 16;
    const battenSpacing = mastHeightAbove / (battenCount + 1);
    for (let i = 1; i <= battenCount; i++) {
      const battenY = castingTopY + i * battenSpacing;
      // Front face batten plate
      addBox(group, mastX + 0.068, battenY, 0, 0.012, 0.10, mastWidth + 0.03, mat.darkSteel);
      // Rear face batten plate
      addBox(group, mastX - 0.068, battenY, 0, 0.012, 0.10, mastWidth + 0.03, mat.darkSteel);
    }
  }

  // 6. Technical Mast Identification Plate on the front face of the mast (at Y = castingTopY + 2.50m)
  const plateY = castingTopY + 2.50;
  const plateFrontX = mastX + 0.08;
  // Steel Backing Plate
  addBox(group, plateFrontX, plateY, 0, 0.015, 0.38, 0.28, mat.plateMetal);
  // Mast Role Indicator Bar (signal yellow for ACC/ACA/OLC/OLI/BWA, cyan for Normal N)
  const roleBadgeMat = config.role === 'N/NACC' ? mat.badgeAccent : mat.badgeSignal;
  addBox(group, plateFrontX + 0.01, plateY + 0.10, 0, 0.012, 0.06, 0.24, roleBadgeMat);
  // Mast Section Specification Bar (cyan steel)
  addBox(group, plateFrontX + 0.01, plateY - 0.06, 0, 0.012, 0.08, 0.24, mat.badgeAccent);
  // 4 Corner Mounting Rivets
  const rivetOffsets: [number, number][] = [
    [0.15, 0.11],
    [0.15, -0.11],
    [-0.15, 0.11],
    [-0.15, -0.11],
  ];
  for (const [dy, dz] of rivetOffsets) {
    addBox(group, plateFrontX + 0.01, plateY + dy, dz, 0.012, 0.02, 0.02, mat.steel);
  }

  // 7. Cantilever Assembly & Overhead Conductors (Tailored to Mast Role)
  const role = config.role ?? 'N/NACC';
  const isOverlap = role === 'OLC' || role === 'OLI';
  const isAcc = role === 'ACC';
  const isAca = role === 'ACA';

  const contactY = 5.60;
  const catenaryY = 6.80;
  const contactStagger = config.alignment === 'inside' ? 0.20 : config.alignment === 'outside' ? -0.20 : 0.15;
  const contactX = contactStagger;

  if (isOverlap) {
    // ------------------------------------------------------------------------
    // DUAL CANTILEVERS (OLC - Overlap Central / OLI - Overlap Intermediate)
    // ------------------------------------------------------------------------
    // Run 1: In-run main track OHE (Z = -0.24)
    const z1 = -0.24;
    addRod(group, [mastX, castingTopY + 5.90, z1], [contactX - 0.25, 6.75, z1], 0.038, mat.steel);
    addRod(group, [mastX, castingTopY + 7.60, z1], [contactX, catenaryY + 0.10, z1], 0.032, mat.steel);
    addRod(group, [contactX - 0.70, 5.75, z1], [contactX + 0.10, 5.75, z1], 0.025, mat.steel);
    addRod(group, [contactX - 0.15, 5.75, z1], [contactX, contactY, z1], 0.018, mat.steel);

    // Porcelain Insulators for Run 1
    for (const iy of [castingTopY + 5.90, castingTopY + 7.60]) {
      const insMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.45, 8), mat.porcelain);
      insMesh.position.set(mastX + 0.35, iy, z1);
      insMesh.rotation.z = Math.PI / 2;
      group.add(insMesh);
    }

    // Run 2: Out-of-run transitioning OHE (Z = +0.24, higher by 0.15m per RDSO overlap rules)
    const z2 = 0.24;
    const elevatedContactY = contactY + 0.15;
    const elevatedCatenaryY = catenaryY + 0.15;
    const elevatedContactX = contactX + 0.35;
    addRod(group, [mastX, castingTopY + 6.05, z2], [elevatedContactX - 0.25, 6.90, z2], 0.038, mat.steel);
    addRod(group, [mastX, castingTopY + 7.75, z2], [elevatedContactX, elevatedCatenaryY + 0.10, z2], 0.032, mat.steel);
    addRod(group, [elevatedContactX - 0.70, elevatedContactY + 0.15, z2], [elevatedContactX + 0.10, elevatedContactY + 0.15, z2], 0.025, mat.steel);
    addRod(group, [elevatedContactX - 0.15, elevatedContactY + 0.15, z2], [elevatedContactX, elevatedContactY, z2], 0.018, mat.steel);

    // Porcelain Insulators for Run 2
    for (const iy of [castingTopY + 6.05, castingTopY + 7.75]) {
      const insMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.45, 8), mat.porcelain);
      insMesh.position.set(mastX + 0.35, iy, z2);
      insMesh.rotation.z = Math.PI / 2;
      group.add(insMesh);
    }

    // Overhead Conductors for Run 1
    addRod(group, [contactX, contactY, -7], [contactX, contactY, 7], 0.014, mat.contactWire);
    addRod(group, [contactX, catenaryY, -7], [contactX, catenaryY, 7], 0.012, mat.catenaryWire);
    for (const dz of [-4.5, -2.2, 0, 2.2, 4.5]) {
      addRod(group, [contactX, catenaryY, dz], [contactX, contactY + 0.02, dz], 0.006, mat.contactWire);
    }

    // Overhead Conductors for Run 2 (Parallel Overlap Run)
    addRod(group, [elevatedContactX, elevatedContactY, -7], [elevatedContactX, elevatedContactY, 7], 0.014, mat.catenaryWire);
    addRod(group, [elevatedContactX, elevatedCatenaryY, -7], [elevatedContactX, elevatedCatenaryY, 7], 0.012, mat.contactWire);
    for (const dz of [-4.5, -2.2, 0, 2.2, 4.5]) {
      addRod(group, [elevatedContactX, elevatedCatenaryY, dz], [elevatedContactX, elevatedContactY + 0.02, dz], 0.006, mat.contactWire);
    }

  } else {
    // ------------------------------------------------------------------------
    // SINGLE CANTILEVER (N / NACC, ACC, ACA, OLA / BWA)
    // ------------------------------------------------------------------------
    addRod(group, [mastX, castingTopY + 5.90, 0], [contactX - 0.25, 6.75, 0], 0.038, mat.steel);
    addRod(group, [mastX, castingTopY + 7.60, 0], [contactX, catenaryY + 0.1, 0], 0.032, mat.steel);
    addRod(group, [contactX - 0.70, 5.75, 0], [contactX + 0.10, 5.75, 0], 0.025, mat.steel);
    addRod(group, [contactX - 0.15, 5.75, 0], [contactX, contactY, 0], 0.018, mat.steel);

    // Porcelain disc insulator bells
    for (const iy of [castingTopY + 5.90, castingTopY + 7.60]) {
      const insMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.45, 8), mat.porcelain);
      insMesh.position.set(mastX + 0.35, iy, 0);
      insMesh.rotation.z = Math.PI / 2;
      group.add(insMesh);
    }

    // Overhead Conductors (Contact & Catenary wires)
    addRod(group, [contactX, contactY, -7], [contactX, contactY, 7], 0.014, mat.contactWire);
    addRod(group, [contactX, catenaryY, -7], [contactX, catenaryY, 7], 0.012, mat.catenaryWire);

    // Droppers connecting catenary wire to contact wire
    for (const dz of [-4.5, -2.2, 0, 2.2, 4.5]) {
      addRod(group, [contactX, catenaryY, dz], [contactX, contactY + 0.02, dz], 0.006, mat.contactWire);
    }

    // ------------------------------------------------------------------------
    // ROLE: ACC (Anti-Creep Centre Mast Equipment)
    // ------------------------------------------------------------------------
    if (isAcc) {
      // Bi-metallic center clamp on catenary
      addBox(group, contactX, catenaryY, 0, 0.12, 0.10, 0.25, mat.badgeSignal);
      // Twin anti-creep anchor struts from catenary clamp back to mast fittings
      for (const dz of [-0.25, 0.25]) {
        addRod(group, [mastX + 0.06, castingTopY + 7.20, dz], [contactX, catenaryY, 0], 0.022, mat.steel);
        const strutIns = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.35, 8), mat.porcelain);
        strutIns.position.set(mastX + 0.80, castingTopY + 7.15, dz * 0.7);
        strutIns.rotation.z = Math.PI / 2;
        group.add(strutIns);
      }
      // Longitudinal anti-creep messenger wire spanning along catenary level
      addRod(group, [contactX, catenaryY + 0.08, -5], [contactX, catenaryY + 0.08, 5], 0.010, mat.anchorLine);
    }

    // ------------------------------------------------------------------------
    // ROLE: ACA (Anti-Creep Anchor Mast Equipment)
    // ------------------------------------------------------------------------
    if (isAca) {
      const acaAnchorX = mastX - 3.20;
      // Ground concrete anchor block
      addBox(group, acaAnchorX, -0.4, 0, 0.9, 0.8, 0.9, mat.concrete);
      addBox(group, acaAnchorX, 0.10, 0, 0.6, 0.2, 0.6, mat.concreteMuff);
      // 45° Anti-creep termination guy wire from top catenary level to ground anchor
      addRod(group, [mastX, castingTopY + 7.40, 0], [acaAnchorX, 0.20, 0], 0.020, mat.anchorLine);
      // Porcelain strain insulator along guy wire
      const strainIns = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.40, 8), mat.porcelain);
      strainIns.position.set(mastX - 1.20, castingTopY + 4.80, 0);
      strainIns.rotation.z = Math.atan2(castingTopY + 7.20, 3.20);
      group.add(strainIns);
      // Turnbuckle tightening fitting
      addBox(group, acaAnchorX + 0.25, 0.45, 0, 0.08, 0.15, 0.08, mat.darkSteel);
    }

    // ------------------------------------------------------------------------
    // ROLE: OLA / BWA (Balance Weight Anchor Mast Equipment)
    // ------------------------------------------------------------------------
    if (isBwa) {
      const anchorDistance = 4.2;
      const anchorX = mastX - anchorDistance;
      addBox(group, anchorX, -0.8, 0, 1.2, 1.6, 1.2, mat.concrete);
      addBox(group, anchorX, 0.15, 0, 0.8, 0.3, 0.8, mat.concreteMuff);

      // Guy rod at 45 degrees
      addRod(group, [mastX, castingTopY + 7.8, 0], [anchorX, 0.25, 0], 0.025, mat.steel);

      // 3-Pulley Auto Tensioning Device (ATD) bracket
      addBox(group, mastX - 0.35, castingTopY + 7.2, 0, 0.45, 0.15, 0.25, mat.darkSteel);
      for (const pOffset of [-0.08, 0.0, 0.08]) {
        const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), mat.darkSteel);
        pulley.position.set(mastX - 0.45, castingTopY + 7.2, pOffset);
        pulley.rotation.x = Math.PI / 2;
        group.add(pulley);
      }

      // Counterweight stack
      addRod(group, [mastX - 0.45, 1.0, 0], [mastX - 0.45, castingTopY + 6.8, 0], 0.016, mat.steel);
      for (let c = 0; c < 14; c++) {
        addBox(group, mastX - 0.45, 1.3 + c * 0.12, 0, 0.45, 0.09, 0.45, mat.counterweight);
      }
    }
  }

  // 9. Dimension Lines HUD
  const dimY = 0.55;
  addRod(group, [mastX, dimY, 0], [0, dimY, 0], 0.012, mat.dimLine);
  addRod(group, [mastX, dimY - 0.2, 0], [mastX, dimY + 0.2, 0], 0.015, mat.dimLine);
  addRod(group, [0, dimY - 0.2, 0], [0, dimY + 0.2, 0], 0.015, mat.dimLine);

  const stepDimX = mastX + 0.85;
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
  selectedFoundationType,
}: {
  config: OheConfig;
  result: CalculationResult;
  view: SceneView;
  wireframe: boolean;
  selectedFoundationType?: FoundationTypeKey;
}) {
  const { scene, camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

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
    };
  }, [scene, camera, gl]);

  // Rebuild assembly when config, result, wireframe, or selectedFoundationType changes
  useEffect(() => {
    const assembly = buildOheAssembly(config, result, wireframe, selectedFoundationType ?? 'bType');
    scene.add(assembly);

    return () => {
      scene.remove(assembly);
      assembly.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, [scene, config, result, wireframe, selectedFoundationType]);

  // Camera presets
  useEffect(() => {
    const target = new THREE.Vector3(-1.5, 3.8, 0);
    if (view === 'front') {
      camera.position.set(-1.5, 4.0, 13);
    } else if (view === 'side') {
      camera.position.set(13, 4.0, 0);
    } else if (view === 'top') {
      camera.position.set(-1.5, 18, 0.1);
    } else {
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
  selectedFoundationType = 'bType',
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
        selectedFoundationType={selectedFoundationType}
      />
    </Canvas>
  );
}
