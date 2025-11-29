// src/components/WeatherPanel.tsx
import { useState } from "react";
import "./WeatherPage.css";

export type WeatherSummary = {
  city: string;
  updatedAt: string;
  description: string;
  rainProbability: number;
  rainLevelText: string;
  temperature: number; // current
  humidity: number;
  windSpeed: number;
  pressure: number;
  stationsCount: number;
  suggestion: string;
  minTemp?: number;
  maxTemp?: number;
  tempDiff?: number;
};

type Props = {
  summary: WeatherSummary | null;
};

type TimeOfDay = "morning" | "afternoon" | "evening";

const TAB_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export default function WeatherPanel({ summary }: Props) {
  const [activeTab, setActiveTab] = useState<TimeOfDay>("afternoon");

  if (!summary) {
    return (
      <div className="weather-panel">
        <div className="weather-panel-loading">Loading temperature...</div>
      </div>
    );
  }

  const low = summary.minTemp ?? summary.temperature;
  const high = summary.maxTemp ?? summary.temperature;
  const current = summary.temperature;
  const diff =
    typeof summary.tempDiff === "number"
      ? summary.tempDiff
      : Math.abs(high - low);

  const outfitList = getOutfitSuggestions(activeTab, low, current, high);

  return (
    <div className="weather-panel">
      {/* Title row */}
      <div className="weather-panel-header">
        <div>
          <div className="weather-panel-title">Weather Forecast</div>
          <div className="weather-panel-subtitle">Today&apos;s temperature</div>
        </div>
        <div className="weather-panel-location">{summary.city}</div>
      </div>

      {/* Low / Current / High cards */}
      <div className="temp-cards-row">
        <TempCard label="Low" value={low} type="low" />
        <TempCard label="Current" value={current} type="current" />
        <TempCard label="High" value={high} type="high" />
      </div>

      {/* Temperature difference banner */}
      <div className="temp-diff-banner">
        <div>
          Temperature difference today: <strong>{diff}°C</strong>
        </div>
        <div className="temp-diff-suggestion">
          {diff >= 8 ? "Dress in layers!" : "Comfortable temperature today."}
        </div>
      </div>

      {/* What to Wear */}
      <div className="outfit-section">
        <div className="outfit-header-row">
          <div className="outfit-title">What to Wear</div>
          <div className="outfit-hint">Tap or swipe</div>
        </div>

        {/* Tabs */}
        <div className="outfit-tabs">
          {(Object.keys(TAB_LABELS) as TimeOfDay[]).map((key) => (
            <button
              key={key}
              className={
                "outfit-tab" +
                (activeTab === key ? " outfit-tab-active" : "")
              }
              onClick={() => setActiveTab(key)}
              type="button"
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="outfit-content">
          {/* 左邊可以之後放小人 / icon，先放 placeholder */}
          <div className="outfit-avatar-placeholder">
            <span role="img" aria-label="outfit">
              🙂 
            </span>
          </div>

          {/* 右邊建議清單 */}
          <ul className="outfit-list">
            {outfitList.map((item, idx) => (
              <li key={idx} className="outfit-item">
                <span className="outfit-dot">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type TempCardProps = {
  label: string;
  value: number;
  type: "low" | "current" | "high";
};

function TempCard({ label, value, type }: TempCardProps) {
  return (
    <div className={`temp-card temp-card-${type}`}>
      <div className="temp-card-label">{label}</div>
      <div className="temp-card-value-row">
        <span className="temp-card-value">{value}</span>
        <span className="temp-card-unit">°C</span>
      </div>
    </div>
  );
}

function getOutfitSuggestions(
  time: TimeOfDay,
  low: number,
  current: number,
  high: number
): string[] {
  const avg = (low + high) / 2;
  const list: string[] = [];

  if (avg <= 15) {
    list.push("Warm coat or down jacket", "Long pants", "Scarf / warm socks");
  } else if (avg <= 24) {
    list.push("Light jacket or cardigan", "T-shirt inside", "Long pants or skirt");
  } else {
    list.push("T-shirt or sleeveless top", "Shorts or light pants", "Hat / sunglasses");
  }

  // 依照 time 再微調一句話
  if (time === "morning" && low <= 15) {
    list.push("Morning may feel chilly — bring an extra layer.");
  } else if (time === "evening" && current - low >= 5) {
    list.push("Evening will be cooler than daytime, bring a thin jacket.");
  }

  return list;
}
