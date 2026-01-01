// src/MemoryCloud.jsx
import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MemoryCloud({ count = 800 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 生成随机粒子数据
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 25; // 环绕半径
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 200; // 深度分布
      const scale = 0.5 + Math.random();
      temp.push({ x, y, z, scale });
    }
    return temp;
  }, [count]);

  useLayoutEffect(() => {
    particles.forEach((particle, i) => {
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.set(particle.scale, particle.scale, particle.scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      // 随机淡雅颜色
      meshRef.current.setColorAt(i, new THREE.Color(`hsl(${Math.random() * 360}, 60%, 80%)`));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [particles, dummy]);

  useFrame((state, delta) => {
    meshRef.current.rotation.z += delta * 0.02; // 整体缓慢旋转
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        transparent 
        opacity={0.3} 
        side={THREE.DoubleSide} 
        blending={THREE.AdditiveBlending} // 发光叠加模式
        depthWrite={false} 
      />
    </instancedMesh>
  );
}