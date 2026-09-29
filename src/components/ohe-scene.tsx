import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Config } from '@/lib/ohe-rules';

type View = 'iso' | 'front' | 'side';
const steel = new THREE.MeshStandardMaterial({ color: '#8297aa', metalness: .75, roughness: .4 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#596d80', metalness: .7, roughness: .5 });
const concrete = new THREE.MeshStandardMaterial({ color: '#9eaab5', roughness: .85 });
const ground = new THREE.MeshStandardMaterial({ color: '#344456', roughness: 1 });
const ballast = new THREE.MeshStandardMaterial({ color: '#687582', roughness: 1 });
const sleeper = new THREE.MeshStandardMaterial({ color: '#675d57', roughness: 1 });
const wire = new THREE.MeshStandardMaterial({ color: '#e5b45f', metalness: .65, roughness: .4 });
const porcelain = new THREE.MeshStandardMaterial({ color: '#dad6bf', roughness: .35 });
function box(group: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
function rod(group: THREE.Group, a: [number,number,number], b: [number,number,number], radius = .035, material: THREE.Material = steel) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),8), material);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize());
  mesh.castShadow = true; group.add(mesh);
}
function mast(group: THREE.Group, x: number, lattice: boolean) {
  if (!lattice) { box(group,x,4.75,0,.2,9.5,.3,darkSteel); box(group,x,4.75,0,.46,9.5,.045,steel); return; }
  for (const dx of [-.17,.17]) for (const dz of [-.17,.17]) rod(group,[x+dx,0,dz],[x+dx,9.5,dz],.033);
  for(let i=0;i<13;i++) {
    rod(group,[x-.17,i*.73,-.17],[x+.17,(i+1)*.73,-.17],.019);
    rod(group,[x+.17,i*.73,.17],[x-.17,(i+1)*.73,.17],.019);
    rod(group,[x-.17,i*.73,-.17],[x-.17,i*.73,.17],.014);
    rod(group,[x+.17,i*.73,-.17],[x+.17,i*.73,.17],.014);
  }
}
function buildModel(config: Config) {
  const group = new THREE.Group();
  const mx = -config.implantation - .55;
  box(group,0,-.28,0,17,.35,11,ground);
  box(group,0,-.035,0,3,.19,11,ballast);
  for(let i=0;i<19;i++) box(group,0,.14,-5.1+i*.57,3,.13,.16,sleeper);
  for(const x of [-.76,.76]) { box(group,x,.29,0,.09,.15,11,steel); box(group,x,.2,0,.22,.06,11,darkSteel); }
  box(group,mx,-.12,0,1.35,.85,1.35,concrete); box(group,mx,-.55,0,1.7,.15,1.7,concrete);
  mast(group,mx,config.category !== 'single' || config.wind >= 136);
  if(config.category === 'portal') {
    const rx = Math.min(6,mx+config.portalSpan*.36);
    box(group,rx,-.12,0,1.35,.85,1.35,concrete); mast(group,rx,true);
    rod(group,[mx,8.8,0],[rx,8.8,0],.09);
    rod(group,[mx,9.35,0],[rx,9.35,0],.07);
    for(let i=0;i<8;i++) { const x=mx+(rx-mx)*i/7; rod(group,[x,8.8,0],[x,9.35,0],.018); if(i<7) rod(group,[x,8.8,0],[x+(rx-mx)/7,9.35,0],.018); }
    rod(group,[0,8.8,0],[0,6.5,0],.04);
  } else {
    rod(group,[mx,7.55,0],[.05,7.55,0],.06);
    rod(group,[mx,8.75,0],[.05,7.55,0],.04);
    rod(group,[mx,6.7,0],[.4,6.7,0],.045);
    rod(group,[mx,7.55,0],[.4,6.7,0],.032);
    if(config.category === 'ttc') rod(group,[mx,8.3,0],[3.5,8.3,0],.07);
    rod(group,[-.8,7.33,0],[-.8,7.77,0],.11,porcelain);
    rod(group,[-1.1,7.92,0],[-1.25,8.35,0],.095,porcelain);
  }
  rod(group,[-6,6.45,0],[6,6.45,0],.012,wire);
  rod(group,[mx,7.7,0],[6,7.7,0],.01,steel);
  rod(group,[0,.65,1.45],[mx,.65,1.45],.013,wire);
  rod(group,[0,.44,1.45],[0,.86,1.45],.013,wire);
  rod(group,[mx,.44,1.45],[mx,.86,1.45],.013,wire);
  return group;
}
function Model({ config, view }: { config: Config; view: View }) {
  const { scene, camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    scene.background = new THREE.Color('#172435');
    scene.fog = new THREE.Fog('#172435', 25, 48);
    const ambient = new THREE.AmbientLight('#dcecff',2.15);
    const sun = new THREE.DirectionalLight('#fff3d9',3.1);
    sun.position.set(5,14,7); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
    const fill = new THREE.DirectionalLight('#7ba8e5',1.3); fill.position.set(-8,7,-6);
    const grid = new THREE.GridHelper(42,42,'#455b70','#324457'); grid.position.y=-.1;
    scene.add(ambient,sun,fill,grid);
    const orbit = new OrbitControls(camera,gl.domElement);
    orbit.enableDamping=true; orbit.minDistance=7; orbit.maxDistance=38; orbit.maxPolarAngle=Math.PI/2.05;
    orbit.target.set(0,3.5,0); controls.current=orbit;
    return () => { orbit.dispose(); controls.current=null; scene.remove(ambient,sun,fill,grid); grid.geometry.dispose(); };
  },[scene,camera,gl]);
  useEffect(() => {
    const model=buildModel(config); scene.add(model);
    return () => { scene.remove(model); model.traverse(object => { if(object instanceof THREE.Mesh) object.geometry.dispose(); }); };
  },[scene,config.category,config.wind,config.implantation,config.portalSpan]);
  useEffect(() => {
    const [x,y,z]: [number,number,number] = view === 'front' ? [0,6,16] : view === 'side' ? [16,6,0] : [13,9,14];
    camera.position.set(x,y,z); camera.lookAt(0,3.5,0); camera.updateProjectionMatrix(); controls.current?.target.set(0,3.5,0); controls.current?.update();
  },[camera,view]);
  useFrame(() => controls.current?.update());
  return null;
}
export default function OheScene({ config, view }: { config: Config; view: View }) {
  return <Canvas shadows camera={{ position: [13,9,14], fov: 42, near: .1, far: 100 }} dpr={[1,1.8]} gl={{ antialias: true }}><Model config={config} view={view} /></Canvas>;
}
