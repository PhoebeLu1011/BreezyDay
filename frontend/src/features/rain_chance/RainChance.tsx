// src/features/rain_chance/RainChance.tsx
import { useMemo, useState } from "react";
import "./RainChance.css";

type Props = {
  onBack: () => void;
};

type RainDrop = {
  id: number;
  left: number; // 左右位置 (%)
  duration: number; // 掉落時間 (s)
  delay: number; // 延遲時間 (s)
  height: number; // 雨滴長度 (px)
  opacity: number; // 透明度
};

type RainInfoLevel = "veryLow" | "low" | "medium" | "high";

// 依照「降雨機率」回傳等級、class、提示文字 & 雨滴數
function getInfo(p: number): {
  label: string;
  level: RainInfoLevel;
  suggestion: string;
  drops: number;
} {
  if (p < 20) {
    return {
      label: "Very Low",
      level: "veryLow",
      suggestion: "幾乎不會下雨，今天可以放心不帶傘～",
      drops: Math.round(10 + p * 0.3),
    };
  }

  if (p < 50) {
    return {
      label: "Low",
      level: "low",
      suggestion: "偶爾可能飄雨，行程正常即可，怕淋雨可以帶輕便雨衣。",
      drops: Math.round(20 + p * 0.6),
    };
  }

  if (p < 80) {
    return {
      label: "Medium",
      level: "medium",
      suggestion: "有機會遇到陣雨，建議帶折疊傘或帽子，鞋子避免太容易進水的材質。",
      drops: Math.round(40 + p),
    };
  }

  return {
    label: "High",
    level: "high",
    suggestion: "很大機率會下雨，建議一定要帶傘／雨衣，包包最好是防水材質，鞋子也選耐濕一點的。",
    drops: Math.round(70 + p * 1.2),
  };
}

export default function RainChance({ onBack }: Props) {
  // ✅ 直接用前端 state 控制降雨機率，不串 API
  const [chance, setChance] = useState<number>(40);

  const info = useMemo(() => getInfo(chance), [chance]);

  // 根據降雨機率決定雨滴數量
  const rainDrops: RainDrop[] = useMemo(() => {
    const min = 10;
    const max = 120;
    const count = Math.round(min + ((max - min) * chance) / 100);

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 1.5,
      delay: Math.random() * -5,
      height: 20 + Math.random() * 40,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, [chance]);

  return (
    <div className="rainchance-page rc-page">
      {/* 背景雨滴層 */}
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

      <div className="rainchance-card rc-card">
        <div className="rainchance-header">
          <span className="rc-header-icon">🌧️</span>
          <div>
            <div className="rc-title">Rain Probability</div>
            <div className="rc-subtitle">
              目前先用模擬降雨機率做介面展示，之後再接上實際預報 API。
            </div>
          </div>
        </div>

        <div className="rc-label-row">
          <span>Chance of Rain</span>
          <span
            className={`rc-intensity rc-level-${
              info.level === "veryLow" ? "low" : info.level
            }`}
          >
            {info.label} ({chance}%)
          </span>
        </div>

        {/* 這邊保留 slider，當作「調整情境」用 */}
        <input
          type="range"
          min={0}
          max={100}
          value={chance}
          onChange={(e) => setChance(Number(e.target.value))}
          className="rc-slider"
        />

        <div className="rc-helper-text">
          目前先用手動調整降雨機率，測試介面與提示文字的變化。之後只要把
          chance 改成接後端 API 的數值就可以了。
        </div>

        <div className="rc-bottom-row">
          <div className="rc-info-card">
            <div className="rc-info-icon">💧</div>
            <div className="rc-info-label">穿搭＆外出建議</div>
            <div className="rc-info-value">{info.suggestion}</div>
          </div>

          <div className="rc-info-card">
            <div className="rc-info-icon">🌧️</div>
            <div className="rc-info-label">雨滴視覺效果</div>
            <div className="rc-info-value">
              雨滴數量會隨機率變化（目前：{info.drops} drops）
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
