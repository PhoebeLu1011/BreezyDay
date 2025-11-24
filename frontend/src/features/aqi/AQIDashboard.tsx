// src/features/aqi/AQIDashboard.tsx
import { useState } from "react";
import type { StationRow } from "./aqiTypes";
import { getAqiInfo } from "./aqiUtils";

interface Props {
  locationText: string;
  aqiValue: string;
  aqiInfo: { label: string; className: string } | null;
  aqiClassName: string;
  barPercent: number;
  onCurrentLocation: () => void;
  onAddCity: () => void;
  watchedStations: StationRow[];
  onClickWatched: (station: StationRow) => void;
  onRemoveWatched: (idx: number) => void;
}

const AQIDashboard: React.FC<Props> = ({
  locationText,
  aqiValue,
  aqiInfo,
  aqiClassName,
  barPercent,
  onCurrentLocation,
  onAddCity,
  watchedStations,
  onClickWatched,
  onRemoveWatched,
}) => {
  const [scaleOpen, setScaleOpen] = useState(false);

  return (
    <>
      <h1 className="main-title">Air Quality Monitor</h1>
      <p className="sub-title">Real-time Air Quality Index (AQI) Monitoring</p>

      <div className="city-controls">
        <button
          id="btn-current-location"
          className="btn btn-primary"
          onClick={onCurrentLocation}
        >
          📍 Current Location
        </button>
        <button
          id="btn-add-city"
          className="btn btn-secondary"
          onClick={onAddCity}
        >
          ＋ Add City
        </button>
        <div id="selected-city-tag" className="city-tag">
          <span>📍</span>
          <span id="selected-city-text">{locationText || "尚未選擇測站"}</span>
        </div>
      </div>

      <div className="aqi-main-card">
        <div className="aqi-header">
          <div className="aqi-header-icon">i</div>
          <div>
            <h2>Air Quality Index</h2>
            <p>Today's Forecast</p>
          </div>
        </div>

        <div className="aqi-main-body">
          <div className="main-location">
            <span>📍</span>
            <span id="main-location-text">{locationText || "載入中..."}</span>
          </div>

          <div className="aqi-main-row">
            <div className="aqi-box" id="main-aqi-box">
              <span className="aqi-box-label">AQI</span>
              <span className="aqi-box-value" id="main-aqi-value">
                {aqiValue}
              </span>
            </div>

            <div className="level-info">
              <span className="level-desc">Current Level</span>
              <span className={aqiClassName} id="main-aqi-level">
                {aqiInfo?.label ?? "--"}
              </span>
            </div>
          </div>

          <div className="aqi-bar">
            <div className="bar-track">
              <div
                className="bar-fill"
                id="main-aqi-bar"
                style={{ width: `${barPercent}%` }}
              />
            </div>
            <div className="bar-scale">
              <span>0</span>
              <span>300+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button + AQI Scale */}
      <button
        id="aqi-toggle-btn"
        className="aqi-toggle-btn"
        onClick={() => setScaleOpen((prev) => !prev)}
      >
        {scaleOpen ? "收起 AQI 等級 ▲" : "顯示 AQI 等級 ▼"}
      </button>

      <div
        id="aqi-scale-container"
        className={`aqi-scale-container ${scaleOpen ? "open" : ""}`}
      >
        <div className="aqi-scale-wrapper">
          <div className="aqi-scale-cards">
            <div className="aqi-scale-card aqi-scale-good">
              <div className="aqi-scale-number">50</div>
              <div className="aqi-scale-label">Good</div>
              <div className="aqi-scale-range">0–50</div>
            </div>
            <div className="aqi-scale-card aqi-scale-moderate">
              <div className="aqi-scale-number">100</div>
              <div className="aqi-scale-label">Moderate</div>
              <div className="aqi-scale-range">51–100</div>
            </div>
            <div className="aqi-scale-card aqi-scale-usg">
              <div className="aqi-scale-number">150</div>
              <div className="aqi-scale-label">Unhealthy for Sensitive</div>
              <div className="aqi-scale-range">101–150</div>
            </div>
            <div className="aqi-scale-card aqi-scale-unhealthy">
              <div className="aqi-scale-number">200</div>
              <div className="aqi-scale-label">Unhealthy</div>
              <div className="aqi-scale-range">151–200</div>
            </div>
            <div className="aqi-scale-card aqi-scale-very">
              <div className="aqi-scale-number">300</div>
              <div className="aqi-scale-label">Very Unhealthy</div>
              <div className="aqi-scale-range">201–300</div>
            </div>
            <div className="aqi-scale-card aqi-scale-hazardous">
              <div className="aqi-scale-number">400</div>
              <div className="aqi-scale-label">Hazardous</div>
              <div className="aqi-scale-range">301+</div>
            </div>
          </div>
        </div>
      </div>

      {/* 多城市卡片 */}
      <div id="city-cards" className="city-cards">
        {watchedStations.map((s, idx) => {
          const info = getAqiInfo(s.aqi);
          return (
            <div
              key={`${s.county}-${s.site}-${idx}`}
              className="city-card"
              onClick={() => onClickWatched(s)}
            >
              <button
                className="city-card-remove"
                title="移除"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveWatched(idx);
                }}
              >
                ✕
              </button>
              <div className="city-card-title">
                {s.county} {s.site}
              </div>
              <div>{s.status || ""}</div>
              <div className="city-card-aqi">
                <span className="city-card-aqi-value">{s.aqi || "--"}</span>
                <span className="city-card-aqi-label">{info.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AQIDashboard;
