// src/features/weather/RainPanel.tsx
import { useEffect, useState } from "react";
import "./WeatherPage.css"; // 你的樣式放這裡，或改成別的 css

export type RainForecastDay = {
  label: string;
  temp: number;
  rainProbability: number;
};

type RainSummary = {
  rainProbability: number;  // 從 API summary.rainProbability
  rainLevelText: string;    // summary.rainLevelText (Low / Moderate / High)
  suggestion: string;       // summary.suggestion (Maybe bring umbrella ...)
};

type Props = {
  summary: RainSummary | null;
  forecast: RainForecastDay[];
  onBack: () => void;
};

export default function RainPanel({ summary, forecast, onBack }: Props) {
  // slider 目前顯示的降雨機率（可拖動）
  const [sliderValue, setSliderValue] = useState(0);

  // 一旦 summary 從 API 回來，就同步 slider
  useEffect(() => {
    if (summary) {
      setSliderValue(summary.rainProbability ?? 0);
    }
  }, [summary]);

  if (!summary) {
    // 還在 loading API 資料
    return (
      <div className="rain-card">
        <div className="rain-card-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Menu
          </button>
          <h2 className="rain-title">Rain Probability</h2>
        </div>
        <p style={{ padding: "24px" }}>Loading rain data...</p>
      </div>
    );
  }

  // 依照降雨機率算出文字顏色 / 等級
  const levelText = (() => {
    if (sliderValue >= 60) return "High";
    if (sliderValue >= 30) return "Moderate";
    return "Low";
  })();

  const levelClass = (() => {
    if (sliderValue >= 60) return "rain-label-high";
    if (sliderValue >= 30) return "rain-label-moderate";
    return "rain-label-low";
  })();

  // 讓「Rain Drops」數量跟機率有點關係：62% → 93 active
  const raindropsCount = Math.round(sliderValue * 1.5);

  return (
    <div className="rain-page">
      <button className="back-btn" onClick={onBack}>
        ← Back to Menu
      </button>

      <div className="rain-card">
        <header className="rain-card-header">
          <div>
            <div className="rain-card-title-row">
              <span className="rain-card-icon">🌧️</span>
              <span className="rain-card-title">Rain Probability</span>
            </div>
            <div className="rain-card-subtitle">Interactive forecast</div>
          </div>
        </header>

        {/* 中間：slider 區 */}
        <section className="rain-main">
          <div className="rain-main-top-row">
            <span>Chance of Rain</span>
            <span className={levelClass}>
              {levelText} ({sliderValue}%)
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="rain-slider"
          />

          <div className="rain-slider-hint">
            Drag the slider to see rain intensity change
          </div>
        </section>

        {/* 下方兩塊卡片：建議 + rain drops */}
        <section className="rain-bottom">
          <div className="rain-info-card">
            <div className="rain-info-label">
              <span className="rain-info-icon">💧</span>
              Recommendation
            </div>
            <div className="rain-info-main">
              {summary.suggestion || "No umbrella needed"}
            </div>
          </div>

          <div className="rain-info-card">
            <div className="rain-info-label">
              <span className="rain-info-icon">🌧️</span>
              Rain Drops
            </div>
            <div className="rain-info-main">
              {raindropsCount} active
            </div>
          </div>
        </section>

        {/* 如果想在這邊再放未來幾天的降雨卡片，可以用 forecast props */}
        {/* 例： */}
        {/* <section>...map forecast...</section> */}
      </div>
    </div>
  );
}
