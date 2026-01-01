import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useRef, useEffect } from "react";
import Experience from "./Experience";
import { Loader } from "@react-three/drei";

// UI 组件
function UI() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // 切换逻辑：手动点击按钮时
  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.log("播放失败", e));
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    
    // 1. 设置音量
    audioRef.current.volume = 0.5;

    // 2. 尝试开场直接播放
    const attemptPlay = async () => {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.log("浏览器拦截了自动播放，等待用户交互...");
        // 3. 如果失败（被拦截），则添加一个一次性的全局点击监听
        // 只要用户点了一下屏幕（哪怕是旋转地球），音乐就开始
        const startAudioOnInteraction = () => {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            // 播放成功后，移除监听，不再打扰
            window.removeEventListener('click', startAudioOnInteraction);
            window.removeEventListener('touchstart', startAudioOnInteraction); // 兼容手机
          }).catch(e => console.log(e));
        };

        window.addEventListener('click', startAudioOnInteraction);
        window.addEventListener('touchstart', startAudioOnInteraction);
      }
    };

    attemptPlay();

  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 text-white mix-blend-difference">
      
      {/* 音乐标签：去掉斜杠，适应 GitHub Pages */}
      <audio ref={audioRef} loop src="bgm.mp3" />

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">2025</h1>
          <p className="text-sm opacity-70 tracking-[0.3em] mt-2">CHRONICLE ARCHIVE</p>
        </div>

        <button 
          onClick={toggleMusic}
          className="pointer-events-auto flex items-center gap-2 border border-white/30 rounded-full px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/20 transition-colors cursor-pointer bg-black/20 backdrop-blur-md"
        >
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
          {isPlaying ? "MUSIC ON" : "PLAY MUSIC"}
        </button>
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
        <Suspense fallback={null}>
           <Experience />
        </Suspense>
      </Canvas>
      
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15] z-20"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <Loader 
        dataInterpolation={(p) => `Loading Memories... ${p.toFixed(0)}%`} 
        containerStyles={{ background: '#000' }}
        barStyles={{ height: '2px', background: 'white' }}
        dataStyles={{ color: 'white', fontFamily: 'monospace' }}
      />
    </div>
  );
}