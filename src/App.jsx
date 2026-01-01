import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Experience from "./Experience";
// 1. 引入 Loader 组件
import { Loader } from "@react-three/drei";

// UI 组件保持不变...
function UI() {
  // ... (省略 UI 组件的具体代码，不用改这里) ...
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 text-white mix-blend-difference">
      <header>
        <h1 className="text-5xl font-bold tracking-tighter">2025</h1>
        <p className="text-sm opacity-70 tracking-[0.3em] mt-2">CHRONICLE ARCHIVE</p>
      </header>
      <footer className="text-right">
        <h2 className="text-8xl font-mono opacity-10">2025</h2>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <div className="w-full h-screen bg-black relative">
      <UI />
      
      <Canvas 
        camera={{ position: [0, 0, 90], fov: 40 }} 
        gl={{ antialias: true, alpha: false }}
      >
        {/* Suspense 会配合 Loader 工作，在加载完成前挂起组件 */}
        <Suspense fallback={null}>
           <Experience />
        </Suspense>
      </Canvas>
      
      {/* 噪点遮罩保持不变 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] z-20"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* 2. 添加 Loader 组件。
          它会自动覆盖在屏幕最上方，直到所有图片加载完毕。
          你可以通过 data 插槽自定义显示的文字。
      */}
      <Loader 
        dataInterpolation={(p) => `Loading Memories... ${p.toFixed(0)}%`} 
        containerStyles={{ background: '#050505' }} // 背景色与网站一致
        innerStyles={{ width: '300px' }}
        barStyles={{ height: '2px', background: 'white' }}
        dataStyles={{ color: 'white', fontFamily: 'monospace' }}
      />
    </div>
  );
}