// src/components/Background.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import FOG from 'vanta/dist/vanta.fog.min';

interface BackgroundProps {
  weatherCondition?: 'sunny' | 'cloudy' | 'rainy' | 'night';
}

export default function Background({ weatherCondition = 'sunny' }: BackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  const weatherOptions = {
    sunny: {
      highlightColor: 0xffffff,
      midtoneColor: 0xffecc2,
      lowlightColor: 0xa8d0e6,
      baseColor: 0xffffff,
      blurFactor: 0.6,
      speed: 1.2,
    },
    cloudy: {
      highlightColor: 0xf0f0f0,
      midtoneColor: 0xcfcfcf,
      lowlightColor: 0xa1a1a1,
      baseColor: 0xe0e0e0,
      blurFactor: 0.8,
      speed: 0.8,
    },
    rainy: {
      highlightColor: 0x6e7f80,
      midtoneColor: 0x4a545c,
      lowlightColor: 0x2c3e50,
      baseColor: 0x8fa3ad,
      blurFactor: 0.7,
      speed: 2.5,
    },
    night: {
      highlightColor: 0x759cbd,
      midtoneColor: 0x354a5f,
      lowlightColor: 0x152238,
      baseColor: 0x0a111c,
      blurFactor: 0.8,
      speed: 0.4,
    }
  };

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      const initialConfig = weatherOptions[weatherCondition] || weatherOptions.sunny;
      setVantaEffect(
        FOG({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          zoom: 0.8,
          ...initialConfig
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  useEffect(() => {
    if (vantaEffect) {
      const currentConfig = weatherOptions[weatherCondition] || weatherOptions.sunny;
      vantaEffect.setOptions(currentConfig);
    }
  }, [weatherCondition, vantaEffect]);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -1,
        transition: 'all 2s ease'
      }}
    />
  );
} 
// 👆 您的錯誤是因為這裡原本少了一個 "}"，現在補上了