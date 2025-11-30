// src/features/rain_chance/RainChance.tsx
import { useMemo, useState } from "react";
import "./RainChance.css";

type Props = {
  onBack: () => void;
};

type RainDrop = {
  id: number;
  left: number;      // 左右位置 (%)
  duration: number;  // 掉落時間 (s)
  delay: number;     // 延遲時間 (s)
  height: number;    // 雨滴長度 (px)
  opacity: number;   // 透明度
};

function getInfo(p: number) {
  if (p < 20)
    return { label: "Very Low", cls: "low", suggestion: "No umbrella needed", drops: Math.round(p * 0.5) };

  if (p < 50)
    return { label: "Low", cls: "low", suggestion: "Probably fine", drops: Math.round(p * 0.7) };

  if (p < 80)
    return { label: "Moderate", cls: "med", suggestion: "Maybe bring umbrella", drops: Math.round(p) };

  return { label: "High", cls: "high", suggestion: "Bring umbrella", drops: Math.round(p * 1.3) };
}

export default function RainChance({ onBack }: Props) {
  const [chance, setChance] = useState(45);
  const info = useMemo(() => getInfo(chance), [chance]);

  // ⭐ 根據降雨機率決定雨滴數量：0% 幾乎沒有，100% 很密
  const rainDrops: RainDrop[] = useMemo(() => {
    // 最少 10 滴、最多 120 滴，可以自己調整
    const min = 10;
    const max = 120;
    const count = Math.round(min + ((max - min) * chance) / 100);

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,          // 0~100% 之間
      duration: 2 + Math.random() * 1.5,  // 2~3.5 秒
      delay: Math.random() * -5,          // 負 delay 讓動畫一開始就有雨
      height: 20 + Math.random() * 40,    // 20~60 px
      opacity: 0.3 + Math.random() * 0.4, // 0.3~0.7
    }));
  }, [chance]);

  return (
    <div className="rc-page">
      {/* ⭐ 背景雨滴層（在最底層、覆蓋整個畫面） */}
      <div className="rc-rain-layer">
        {rainDrops.map((d) => (
          <div
            key={d.id}
            className="rc-raindrop"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              opacity: d.opacity,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>

      <button className="rc-back-btn" onClick={onBack}>
        ← Back to Menu
      </button>

      <div className="rc-card">
        <div className="rc-header">
          <span className="rc-header-icon">🌧️</span>
          <div>
            <div className="rc-title">Rain Probability</div>
            <div className="rc-subtitle">Interactive forecast</div>
          </div>
        </div>

        <div className="rc-label-row">
          <span>Chance of Rain</span>
          <span className={`rc-intensity ${info.cls}`}>
            {info.label} ({chance}%)
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={chance}
          onChange={(e) => setChance(Number(e.target.value))}
          className="rc-slider"
        />

        <div className="rc-helper">Drag to see intensity</div>

        <div className="rc-bottom">
          <div className="rc-info-card">
            <div className="rc-info-icon">💧</div>
            <div className="rc-info-label">Recommendation</div>
            <div className="rc-info-value">{info.suggestion}</div>
          </div>

          <div className="rc-info-card">
            <div className="rc-info-icon">🌧️</div>
            <div className="rc-info-label">Rain Drops</div>
            <div className="rc-info-value">{info.drops} active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
