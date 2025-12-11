// src/features/aqi/AQIDashboard.tsx
import { useState } from "react";
import type { StationRow } from "./aqiTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { TableCellsIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import {MapPinIcon} from "@heroicons/react/24/outline";

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
  onGoTable: () => void;
}

const AQIDashboard: React.FC<Props> = ({
  locationText,
  aqiValue,
  aqiInfo,
  aqiClassName,
  barPercent,
  onCurrentLocation,
  onGoTable,
}) => {
  const [scaleOpen, setScaleOpen] = useState(false);

  const levelPalette: Record<
    string,
    { box: string; boxText: string; bar: string }
  > = {
    "level-good": { box: "#4b925f", boxText: "#ffffff", bar: "#4b925f" },
    "level-moderate": { box: "#f5a623", boxText: "#ffffff", bar: "#f5a623" },
    "level-usg": { box: "#d67327", boxText: "#ffffff", bar: "#d67327" },
    "level-unhealthy": { box: "#d6453a", boxText: "#ffffff", bar: "#d6453a" },
    "level-very": { box: "#a1266b", boxText: "#ffffff", bar: "#a1266b" },
    "level-hazardous": { box: "#7b0022", boxText: "#ffffff", bar: "#7b0022" },
  };

  const palette =
    (aqiInfo?.className && levelPalette[aqiInfo.className]) ||
    { box: "#f4a521", boxText: "#ffffff", bar: "#f2b544" };

  return (
    <>
      <h1 className="main-title">Air Quality Monitor</h1>
      <p className="sub-title">Real-time Air Quality Index (AQI) Monitoring</p>

      <div className="city-controls">

        <button className="city-btn glass" onClick={onCurrentLocation}>
          <ArrowPathIcon width={18} height={18} />
          Refresh
        </button>

        <button className="city-btn glass" onClick={onGoTable}>
          <TableCellsIcon width={18} height={18} />
          AQI Table
        </button>

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
            <MapPinIcon className="aqi-pin-icon" aria-hidden="true" />
            <span id="main-location-text">{locationText || "Loading..."}</span>
          </div>

          <div className="aqi-main-row">
            <div
              className="aqi-box"
              id="main-aqi-box"
              style={{ background: palette.box, color: palette.boxText }}
            >
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
                style={{
                  width: `${barPercent}%`,
                  background: palette.bar,
                }}
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
      <div className="aqi-scale-toggle-wrapper">
        <button
          className="aqi-toggle-transparent"
          onClick={() => setScaleOpen((prev) => !prev)}
        >
          {scaleOpen ? (
            <ChevronUpIcon width={22} height={22} />
          ) : (
            <ChevronDownIcon width={22} height={22} />
          )}
        </button>
      </div> 
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

    </>
  );
};

export default AQIDashboard;
