import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { Config } from '@/lib/ohe-rules';

type View = 'iso' | 'front' | 'side';
function CameraPreset({ view }: { view: View }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const position = view === 'front' ? [0, 6, 16] : view === 'side' ? [16, 6, 0] : [13, 9, 14];
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(0, 3.5, 0);
    camera.updateProjectionMatrix();
    if (controls && 'target' in controls && controls.target instanceof THREE.Vector3) {
      controls.target.set(0, 3.5, 0);
      if ('update' in controls && typeof controls.update === 'function') controls.update();
    }
  }, [camera, controls, view]);
  return null;
}
function Rod({ from, to, radius = .045, color = '#aab8c8' }: { from: [number, number, number]; to: [number, number, number]; radius?: number; color?: string }) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const center = start.clone().add(end).multiplyScalar(.5);
  const direction = end.clone().sub(start);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), direction.clone().normalize());
  return <mesh position={center} quaternion={quaternion} castShadow><cylinderGeometry args={[radius, radius, direction.length(), 8]} /><meshStandardMaterial color={color} metalness={.65} roughness={.4} /></mesh>;
}
function Mast({ x, z = 0, lattice = true }: { x: number; z?: number; lattice?: boolean }) {
  if (!lattice) return <group position={[x,0,z]}><mesh position={[0,4.75,0]} castShadow><boxGeometry args={[.2,9.5,.3]} /><meshStandardMaterial color="#637387" metalness={.75} roughness={.4} /></mesh><mesh position={[0,4.75,0]}><boxGeometry args={[.48,9.5,.045]} /><meshStandardMaterial color="#56677a" metalness={.7} /></mesh></group>;
  return <group position={[x,0,z]}>
    {[-.17,.17].flatMap((dx) => [-.17,.17].map((dz) => <Rod key={`${dx}-${dz}`} from={[dx,0,dz]} to={[dx,9.5,dz]} radius={.035} color="#76899b" />))}
    {Array.from({length: 13}, (_,i) => <group key={i}>
      <Rod from={[-.17,i*.73,-.17]} to={[.17,(i+1)*.73,-.17]} radius={.022} color="#8193a2" />
      <Rod from={[.17,i*.73,.17]} to={[-.17,(i+1)*.73,.17]} radius={.022} color="#8193a2" />
      <Rod from={[-.17,i*.73,-.17]} to={[-.17,i*.73,.17]} radius={.018} />
      <Rod from={[.17,i*.73,-.17]} to={[.17,i*.73,.17]} radius={.018} />
    </group>)}
  </group>;
}
function Scene({ config, view }: { config: Config; view: View }) {
  const mastX = -config.implantation - .55;
  const portal = config.category === 'portal';
  const rightX = Math.min(6, mastX + config.portalSpan * .36);
  return <>
    <color attach="background" args={['#111d2a']} />
    <ambientLight intensity={1.45} />
    <directionalLight position={[6,16,9]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} />
    <CameraPreset view={view} />
    <OrbitControls makeDefault enableDamping minDistance={7} maxDistance={36} maxPolarAngle={Math.PI / 2.05} target={[0,3.5,0]} />
    <Grid position={[0,-.07,0]} args={[40,40]} cellSize={1} cellThickness={.35} cellColor="#334455" sectionSize={5} sectionColor="#44566b" fadeDistance={38} infiniteGrid />
    <mesh position={[0,-.23,0]} receiveShadow><boxGeometry args={[17,.3,11]} /><meshStandardMaterial color="#273545" roughness={1} /></mesh>
    <mesh position={[0,-.01,0]} receiveShadow><boxGeometry args={[3,.2,11]} /><meshStandardMaterial color="#69707a" roughness={1} /></mesh>
    {Array.from({length: 19}, (_, i) => <mesh key={i} position={[0,.13,-5.1+i*.57]} receiveShadow><boxGeometry args={[2.95,.13,.16]} /><meshStandardMaterial color="#584e48" /></mesh>)}
    {[-.76,.76].map((x) => <group key={x}><mesh position={[x,.27,0]} castShadow><boxGeometry args={[.085,.13,11]} /><meshStandardMaterial color="#a0a9af" metalness={.7} roughness={.38} /></mesh><mesh position={[x,.23,0]}><boxGeometry args={[.2,.05,11]} /><meshStandardMaterial color="#464d55" /></mesh></group>)}
    <mesh position={[mastX,-.13,0]} castShadow><boxGeometry args={[1.35,.85,1.35]} /><meshStandardMaterial color="#929eaa" roughness={.82} /></mesh>
    <mesh position={[mastX,-.51,0]}><boxGeometry args={[1.75,.15,1.75]} /><meshStandardMaterial color="#818b97" /></mesh>
    <Mast x={mastX} lattice={config.category !== 'single' || config.wind >= 136} />
    {portal ? <>
      <mesh position={[rightX,-.13,0]} castShadow><boxGeometry args={[1.35,.85,1.35]} /><meshStandardMaterial color="#929eaa" /></mesh>
      <Mast x={rightX} />
      <Rod from={[mastX,8.8,0]} to={[rightX,8.8,0]} radius={.1} />
      <Rod from={[mastX,9.3,0]} to={[rightX,9.3,0]} radius={.08} />
      {Array.from({length: 8},(_,i) => { const x = mastX + (rightX-mastX)*i/7; return <group key={i}><Rod from={[x,8.8,0]} to={[x,9.3,0]} radius={.018} />{i<7 && <Rod from={[x,8.8,0]} to={[x+(rightX-mastX)/7,9.3,0]} radius={.018} />}</group> })}
      <Rod from={[0,8.8,0]} to={[0,6.5,0]} radius={.04} />
    </> : <>
      <Rod from={[mastX,7.55,0]} to={[.05,7.55,0]} radius={.065} />
      <Rod from={[mastX,8.75,0]} to={[.05,7.55,0]} radius={.045} />
      <Rod from={[mastX,6.7,0]} to={[.4,6.7,0]} radius={.05} />
      <Rod from={[mastX,7.55,0]} to={[.4,6.7,0]} radius={.035} />
      {config.category === 'ttc' && <Rod from={[mastX,8.3,0]} to={[3.5,8.3,0]} radius={.075} />}
      <mesh position={[-.8,7.55,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,.42,10]} /><meshStandardMaterial color="#d5d4be" /></mesh>
      <mesh position={[-1.15,8.2,0]} rotation={[0,0,-.5]}><cylinderGeometry args={[.1,.1,.46,10]} /><meshStandardMaterial color="#d5d4be" /></mesh>
    </>}
    <Line points={[[-5,6.45,0],[6,6.45,0]]} color="#dfa94b" lineWidth={1.5} />
    <Line points={[[mastX,7.7,0],[6,7.7,0]]} color="#bac6ce" lineWidth={1} />
    <Line points={[[0,.6,1.25],[mastX,.6,1.25]]} color="#e5aa48" lineWidth={2} />
    <Line points={[[0,.38,1.25],[0,.82,1.25]]} color="#e5aa48" lineWidth={2} />
    <Line points={[[mastX,.38,1.25],[mastX,.82,1.25]]} color="#e5aa48" lineWidth={2} />
  </>;
}
export default function OheScene({ config, view }: { config: Config; view: View }) {
  return <Canvas shadows camera={{ position: [13,9,14], fov: 42, near: .1, far: 100 }} dpr={[1,1.8]} gl={{ antialias: true }}><Scene config={config} view={view} /></Canvas>;
}
