import { OrbitControls, Stars, Sparkles, Html, useTexture, useVideoTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { mainPhotos } from "./data";
import { motion, AnimatePresence } from "framer-motion";

// =========================================================
// 1. 氛围组：哑光色块碎片 (保持不变)
// =========================================================
function AtmosphereParticle({ stage, index }) {
  const ref = useRef();
  const config = useMemo(() => {
    const scaleX = 0.4 + Math.random() * 1.4; 
    const scaleY = 0.4 + Math.random() * 1.4;
    const colors = ['#555', '#777', '#999', '#bbb', '#3a4750', '#8c7b70', '#c9c1ac'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return { 
      baseScale: new THREE.Vector3(scaleX, scaleY, 1), 
      color,
      randomRot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
    };
  }, []);

  const { finalPos, scatterPos } = useMemo(() => {
    const r = 50 + Math.random() * 60; 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      finalPos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)),
      scatterPos: new THREE.Vector3((Math.random()-0.5)*250, (Math.random()-0.5)*150, (Math.random()-0.5)*100)
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetPos = new THREE.Vector3();
    let animScale = 1; 

    if (stage === 0) { 
      if (state.clock.elapsedTime < index * 0.002) {
        ref.current.scale.set(0,0,0); return;
      }
      targetPos.copy(scatterPos);
      targetPos.y += Math.sin(state.clock.elapsedTime * 0.5 + index) * 5; 
      animScale = 1.5; 
      ref.current.rotation.x += delta * 0.1;
      ref.current.rotation.y += delta * 0.1;
    } 
    else if (stage === 1) { 
      targetPos.set(0, 0, 0);
      animScale = 0.01; 
      ref.current.rotation.z += delta * 10;
    } 
    else if (stage === 2) { 
      targetPos.copy(finalPos);
      animScale = Math.random() * 0.6 + 0.6; 
      ref.current.rotation.x += delta * 0.03;
      ref.current.rotation.y += delta * 0.04;
    }

    const lerpSpeed = stage === 2 ? 0.05 : 0.04;
    ref.current.position.lerp(targetPos, lerpSpeed);
    ref.current.scale.lerp(config.baseScale.clone().multiplyScalar(animScale), 0.1);
  });

  return (
    <mesh ref={ref} scale={[0,0,0]} rotation={config.randomRot}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={config.color} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// =========================================================
// 2. 子组件：专门负责渲染图片 (Hook 安全)
// =========================================================
function ImagePlane({ url }) {
  const texture = useTexture(url);
  return (
    <meshBasicMaterial 
      map={texture} 
      side={THREE.DoubleSide} 
      transparent={true} 
    />
  );
}

// =========================================================
// 3. 子组件：专门负责渲染视频 (Hook 安全)
// =========================================================
function VideoPlane({ url }) {
  // 必须在这个组件内部无条件调用 Hook
  const texture = useVideoTexture(url, { 
    start: true, 
    muted: true, // 必须静音才能自动播放
    loop: true,
    playsInline: true 
  });
  
  return (
    <meshBasicMaterial 
      map={texture} 
      side={THREE.DoubleSide} 
      transparent={true} 
      toneMapped={false} // 让视频更亮
    />
  );
}

// =========================================================
// 4. 主角容器：MediaStar (逻辑分发)
// =========================================================
function MediaStar({ data, index, spherePos, stage, onClick }) {
  const ref = useRef();
  const [hovered, setHover] = useState(false);
  const isVideo = data.type === 'video';

  // 计算位置逻辑 (保持不变)
  const scatterPos = useMemo(() => {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 150, 
      (Math.random() - 0.5) * 80, 
      (Math.random() - 0.5) * 60
    );
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetPos = new THREE.Vector3();
    let targetScale = hovered ? 1.3 : 1; 

    if (stage === 0) {
      const timeToAppear = index * 0.05; 
      if (state.clock.elapsedTime < timeToAppear) {
        ref.current.scale.set(0, 0, 0); return;
      }
      targetPos.copy(scatterPos);
      targetPos.y += Math.sin(state.clock.elapsedTime + index) * 2;
      ref.current.lookAt(0, 0, 100); 
    } 
    else if (stage === 1) {
      targetPos.set(0, 0, 0); 
      targetScale = 0.1; 
      ref.current.rotation.z += delta * 8;
    } 
    else if (stage === 2) {
      targetPos.set(spherePos[0], spherePos[1], spherePos[2]);
      ref.current.lookAt(state.camera.position);
    }

    const lerpSpeed = stage === 2 ? 0.08 : 0.05;
    ref.current.position.lerp(targetPos, lerpSpeed);

    const finalScaleX = targetScale * 6;
    const finalScaleY = targetScale * (isVideo ? 3.375 : 4.5); // 调整视频长宽比
    ref.current.scale.lerp(new THREE.Vector3(finalScaleX, finalScaleY, 1), 0.1);
  });

  return (
    <mesh
      ref={ref}
      scale={[0.01, 0.01, 0.01]} 
      onPointerOver={() => { if(stage===2) { document.body.style.cursor = 'pointer'; setHover(true); } }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
      onClick={(e) => {
        if(stage === 2) { 
          e.stopPropagation();
          onClick(data);
        }
      }}
    >
      <planeGeometry args={[1, 1]} />
      
      {/* 核心修复：在这里根据类型渲染不同的子组件
          这样每个子组件里的 Hook 都是无条件执行的，符合 React 规则
      */}
      <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
        {isVideo ? (
          <VideoPlane url={data.url} />
        ) : (
          <ImagePlane url={data.url} />
        )}
      </Suspense>

      {/* 悬停标签 */}
      {hovered && stage === 2 && data.date && (
        <Html distanceFactor={20} position={[0, -0.6, 0]} transform>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-sm whitespace-nowrap rounded-full border border-white/30 pointer-events-none select-none">
            {isVideo && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            {data.date}
          </div>
        </Html>
      )}
    </mesh>
  );
}

// =========================================================
// 5. 宇宙容器
// =========================================================
function Universe({ onPhotoClick, stage }) {
  const photoPositions = useMemo(() => {
    const temp = [];
    const count = mainPhotos.length;
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    const r = 25 + Math.sqrt(count) * 2; 
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius * r;
      const z = Math.sin(theta) * radius * r;
      const finalY = y * r;
      temp.push([x, finalY, z]);
    }
    return temp;
  }, []);

  const atmosphereIndices = useMemo(() => Array.from({ length: 500 }, (_, i) => i), []);

  return (
    <group>
      {mainPhotos.map((item, i) => (
        <MediaStar 
          key={item.id} 
          index={i} 
          data={item} 
          spherePos={photoPositions[i]} 
          stage={stage} 
          onClick={onPhotoClick} 
        />
      ))}
      {atmosphereIndices.map((i) => (
        <AtmosphereParticle key={i} index={i} stage={stage} />
      ))}
    </group>
  );
}

// =========================================================
// 6. 大图展示组件
// =========================================================
function ActivePhotoOverlay({ activePhoto, onClose }) {
  return (
    <Html fullscreen style={{ pointerEvents: 'none', zIndex: 100 }}>
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-lg pointer-events-auto cursor-zoom-out p-4"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {activePhoto.type === 'video' ? (
                <video 
                  src={activePhoto.url} 
                  controls 
                  autoPlay 
                  className="max-h-[75vh] max-w-full rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.1)] outline-none"
                />
              ) : (
                <img 
                  src={activePhoto.url} 
                  alt="Memory" 
                  className="max-h-[75vh] w-auto object-contain rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.1)]" 
                />
              )}
              
              <div className="mt-6 text-center text-white space-y-2">
                {activePhoto.date && (
                  <>
                    <h2 className="text-3xl font-light tracking-widest font-mono">{activePhoto.date}</h2>
                    <div className="w-12 h-[1px] bg-white/50 mx-auto"></div>
                  </>
                )}
                <p className="text-lg font-light text-gray-200">{activePhoto.description || ""}</p>
                {activePhoto.people && (
                  <p className="text-sm text-gray-500 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full inline-block mt-2">{activePhoto.people}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}

export default function Experience() {
  const [activePhoto, setActivePhoto] = useState(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 4000);
    const timer2 = setTimeout(() => setStage(2), 5500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={1.5} /> 
      <fog attach="fog" args={['#050505', 20, 150]} />

      <OrbitControls 
        enableZoom={false} enablePan={false} 
        autoRotate={!activePhoto && stage === 2} 
        autoRotateSpeed={0.3} rotateSpeed={0.5}
        enabled={stage === 2} 
      />

      {stage === 2 && (
         <>
           <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
           <Sparkles count={300} scale={[50, 50, 50]} size={3} speed={0.4} opacity={0.5} color="#ffe0f0"/>
         </>
      )}

      <Universe onPhotoClick={setActivePhoto} stage={stage} />
      <ActivePhotoOverlay activePhoto={activePhoto} onClose={() => setActivePhoto(null)} />
    </>
  );
}