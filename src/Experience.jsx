import { OrbitControls, Stars, Sparkles, Html, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { mainPhotos } from "./data";
import { motion, AnimatePresence } from "framer-motion";

// =========================================================
// 1. 氛围组：哑光色块碎片 (Matte Color Blocks)
// 还原截图效果：不规则的矩形，灰色调为主的哑光纸片感
// =========================================================
function AtmosphereParticle({ stage, index }) {
  const ref = useRef();
  
  // A. 随机配置 (形状与颜色)
  const config = useMemo(() => {
    // 1. 随机拉伸比例：制造不规则的矩形 (有的细长，有的扁平)
    // 范围从 0.4 倍到 1.8 倍，差异化很大
    const scaleX = 0.4 + Math.random() * 1.4; 
    const scaleY = 0.4 + Math.random() * 1.4;

    // 2. 灰色调定制色板 (参考截图的哑光感)
    const colors = [
      '#555555', // 中灰
      '#777777', // 标准灰
      '#999999', // 浅灰
      '#bbbbbb', // 亮灰
      '#3a4750', // 深蓝灰 (截图里的深色块)
      '#8c7b70', // 哑光棕灰 (截图里的棕色块)
      '#c9c1ac', // 米灰色 (截图里的亮色块)
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return { 
      baseScale: new THREE.Vector3(scaleX, scaleY, 1), // 基础不规则比例
      color,
      // 随机初始旋转角度
      randomRot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
    };
  }, []);

  // B. 随机位置 (包围在照片外围)
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
    let animScale = 1; // 动画阶段的整体缩放系数

    // --- 动画逻辑 ---
    if (stage === 0) { // 散落
      if (state.clock.elapsedTime < index * 0.002) {
        ref.current.scale.set(0,0,0); return;
      }
      targetPos.copy(scatterPos);
      targetPos.y += Math.sin(state.clock.elapsedTime * 0.5 + index) * 5; 
      animScale = 1.5; 
      ref.current.rotation.x += delta * 0.1;
      ref.current.rotation.y += delta * 0.1;
    } 
    else if (stage === 1) { // 汇聚
      targetPos.set(0, 0, 0);
      animScale = 0.01; 
      ref.current.rotation.z += delta * 10;
    } 
    else if (stage === 2) { // 爆炸
      targetPos.copy(finalPos);
      animScale = Math.random() * 0.6 + 0.6; // 最终大小有轻微差异
      ref.current.rotation.x += delta * 0.03;
      ref.current.rotation.y += delta * 0.04;
    }

    const lerpSpeed = stage === 2 ? 0.05 : 0.04;
    ref.current.position.lerp(targetPos, lerpSpeed);
    
    // 核心：将基础的不规则比例 * 动画缩放系数
    ref.current.scale.lerp(config.baseScale.clone().multiplyScalar(animScale), 0.1);
  });

  return (
    <mesh ref={ref} scale={[0,0,0]} rotation={config.randomRot}>
      {/* 回归基础的平面矩形 */}
      <planeGeometry args={[1, 1]} />
      
      <meshBasicMaterial 
        color={config.color} 
        transparent 
        opacity={0.5} // 半透明哑光感
        depthWrite={false} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

// =========================================================
// 2. 主角：真实照片 (PhotoStar) - 保持不变
// =========================================================
function PhotoStar({ data, index, spherePos, stage, onClick }) {
  const ref = useRef();
  const [hovered, setHover] = useState(false);
  const texture = useTexture(data.url);

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
    const finalScaleY = targetScale * 4.5;
    ref.current.scale.lerp(new THREE.Vector3(finalScaleX, finalScaleY, 1), 0.1);
  });

  return (
    <mesh
      ref={ref}
      scale={[0.01, 0.01, 0.01]} 
      onPointerOver={() => { if(stage===2) { document.body.style.cursor = 'pointer'; setHover(true); } }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
      onClick={(e) => { if(stage === 2) { e.stopPropagation(); onClick(data); } }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent={true} />
      {hovered && stage === 2 && data.date && (
        <Html distanceFactor={20} position={[0, -0.6, 0]} transform>
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-sm whitespace-nowrap rounded-full border border-white/30 pointer-events-none select-none">
            {data.date}
          </div>
        </Html>
      )}
    </mesh>
  );
}

// =========================================================
// 3. 宇宙容器
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

  // 生成 500 个氛围色块
  const atmosphereIndices = useMemo(() => Array.from({ length: 500 }, (_, i) => i), []);

  return (
    <group>
      {mainPhotos.map((photo, i) => (
        <PhotoStar key={photo.id} index={i} data={photo} spherePos={photoPositions[i]} stage={stage} onClick={onPhotoClick} />
      ))}
      {atmosphereIndices.map((i) => (
        <AtmosphereParticle key={i} index={i} stage={stage} />
      ))}
    </group>
  );
}

// 大图展示组件 (不变)
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
              <img src={activePhoto.url} alt="Memory" className="max-h-[75vh] w-auto object-contain rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.1)]" />
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