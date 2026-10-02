import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Nugget() {
  const g = useRef<THREE.Group>(null);
  const frag = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    if (g.current) {
      g.current.rotation.y += d * 0.25;
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, state.pointer.y * 0.3, 0.05);
      g.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
    if (frag.current) frag.current.rotation.y -= d * 0.4;
  });
  return (
    <>
      <group ref={g}>
        <mesh scale={[1.25, 1.6, 1.1]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#d7dde6" metalness={0.95} roughness={0.18} flatShading />
        </mesh>
        <mesh scale={[0.55, 0.7, 0.5]} position={[0.75, -0.6, 0.3]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#d8b469" metalness={1} roughness={0.25} flatShading />
        </mesh>
      </group>
      <group ref={frag}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.5, Math.sin(a * 2) * 0.4, Math.sin(a) * 2.5]} scale={0.12 + (i % 3) * 0.05}>
              <tetrahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={i % 2 ? "#d8b469" : "#cdd5df"} metalness={1} roughness={0.3} flatShading />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

export default function Crystal() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#e3c06f" />
      <pointLight position={[3, -3, -2]} intensity={25} color="#8fa8d8" />
      <pointLight position={[0, 4, 4]} intensity={15} color="#ffffff" />
      <Nugget />
    </Canvas>
  );
}
