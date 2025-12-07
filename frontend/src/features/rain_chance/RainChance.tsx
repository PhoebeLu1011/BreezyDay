// src/features/rain_chance/RainChance.tsx
import { useEffect, useMemo, useState } from "react";
import "./RainChance.css";

type Props = {
  onBack: () => void;
};

type RainDrop = {
  id: number;
  left: number;
  duration: number;
  delay: number;
  height: number;
  opacity: number;
};

type RainInfoLevel = "veryLow" | "low" | "medium" | "high";

// 後端 base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const WEATHER_TODAY_URL = `${API_BASE_URL}/api/weather/today-range`;

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
      suggestion:
        "有機會遇到陣雨，建議帶折疊傘或帽子，鞋子避免太容易進水的材質。",
      drops: Math.round(40 + p),
    };
  }

  return {
    label: "High",
    level: "high",
    suggestion:
      "很大機率會下雨，建議一定要帶傘／雨衣，包包最好是防水材質，鞋子也選耐濕一點的。",
    drops: Math.round(70 + p * 1.2),
  };
}

export default function RainChance({ onBack }: Props) {
  // ⭐ 降雨機率：完全由 API 決定，使用者不能改
  const [chance, setChance] = useState<number | null>(null);

  // ⭐ 天氣敘述 & 地點 & 載入狀態
  const [weatherDesc, setWeatherDesc] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // 一進頁面就從後端拿今天的降雨機率 + 天氣敘述
  useEffect(() => {
    const loadRainFromApi = async () => {
      try {
        // 這裡先用預設「臺北市」，之後也可以改成從 Dashboard 傳縣市進來
        const res = await fetch(
          `${WEATHER_TODAY_URL}?locationName=${encodeURIComponent("臺北市")}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success) {
          if (typeof data.pop12h === "number") {
            setChance(data.pop12h);
          } else {
            setChance(0); // fallback
          }
          setWeatherDesc(data.weatherDesc || "");
          setLocationName(data.locationName || "臺北市");
        } else {
          setChance(0);
        }
      } catch (err) {
        console.error("loadRainFromApi error:", err);
        setChance(0);
      } finally {
        setLoading(false);
      }
    };

    loadRainFromApi();
  }, []);

  const safeChance = chance ?? 0;
  const info = useMemo(() => getInfo(safeChance), [safeChance]);

  // 根據降雨機率決定雨滴數量
  const rainDrops: RainDrop[] = useMemo(() => {
    const min = 10;
    const max = 120;
    const count = Math.round(min + ((max - min) * safeChance) / 100);

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 1.5,
      delay: Math.random() * -5,
      height: 20 + Math.random() * 40,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, [safeChance]);

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
              今日降雨機率由中央氣象局 F-C0032-001 提供，數值僅由預報決定，無法手動調整。
            </div>
          </div>
        </div>

        <div className="rc-label-row">
          <span>
            Chance of Rain
            {locationName && `（${locationName}）`}
          </span>
          <span
            className={`rc-intensity rc-level-${
              info.level === "veryLow" ? "low" : info.level
            }`}
          >
            {info.label} (
            {chance !== null ? `${chance}%` : loading ? "Loading..." : "--%"}
            )
          </span>
        </div>

        {/* Slider：只當顯示用，不可拖動 */}
        <input
          type="range"
          min={0}
          max={100}
          value={safeChance}
          className="rc-slider rc-slider-readonly"
          disabled
        />

        <div className="rc-helper-text">
          {loading
            ? "載入今日預報中..."
            : "滑桿位置對應中央氣象局的今日 12 小時降雨機率，僅供顯示，無法手動修改。"}
        </div>

        <div className="rc-bottom-row">
          <div className="rc-info-card">
            <div className="rc-info-icon">💧</div>
            <div className="rc-info-label">穿搭＆外出建議</div>
            <div className="rc-info-value">{info.suggestion}</div>
          </div>

          <div className="rc-info-card">
            <div className="rc-info-icon">🌦️</div>
            <div className="rc-info-label">天氣描述 & 雨滴效果</div>
            <div className="rc-info-value">
              {weatherDesc
                ? `${weatherDesc}；雨滴數量會隨機率變化（目前：約 ${info.drops} drops）`
                : `雨滴數量會隨機率變化（目前：約 ${info.drops} drops）`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
