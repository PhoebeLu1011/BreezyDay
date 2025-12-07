// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

import "../styles/Dashboard.css";
import { getAqiInfo, findNearestStation } from "../features/aqi/aqiUtils";
import type { StationRow } from "../features/aqi/aqiTypes";

// 定義 props 型別
type DashboardProps = {
  onNavigate: (
    page:
      | "landing"
      | "auth"
      | "dashboard"
      | "aqi"
      | "profile"
      | "feedback"
      | "weather"
      | "rain"
  ) => void;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AQI_API_URL = `${API_BASE_URL}/api/aqi`;
const WEATHER_TODAY_URL = `${API_BASE_URL}/api/weather/today-range`;

// 依照 AQI label 決定用哪個顏色 class
function mapAqiLabelToClass(label: string | null): string {
  if (!label) return "badge-warning";

  const l = label.toLowerCase();
  if (l.includes("good")) return "badge-aqi-good";
  if (l.includes("moderate")) return "badge-aqi-moderate";
  if (l.includes("very unhealthy")) return "badge-aqi-very";
  if (l.includes("unhealthy for sensitive")) return "badge-aqi-usg";
  if (l.includes("hazardous")) return "badge-aqi-hazard";
  if (l.includes("unhealthy")) return "badge-aqi-unhealthy";

  // 如果之後你改成中文 label，可以在這裡再加條件
  return "badge-warning";
}

type AllergyRisk = "loading" | "low" | "moderate" | "dangerous" | "unknown";

// 根據 AQI 數值決定過敏風險
function getAllergyRiskFromAqiValue(aqi: number | null): AllergyRisk {
  if (aqi === null) return "loading";

  // 你可以自己微調區間
  if (aqi <= 50) return "low"; // good
  if (aqi <= 100) return "low"; // moderate -> low（照你剛剛的箭頭）
  if (aqi <= 150) return "moderate"; // USG
  // 以上都不是 -> unhealthy 以上都算 dangerous
  return "dangerous";
}

// 根據 risk 決定加在 .badge 後面的 class
function getAllergyRiskClass(risk: AllergyRisk): string {
  switch (risk) {
    case "low":
      return "badge-risk-low";
    case "moderate":
      return "badge-risk-moderate";
    case "dangerous":
      return "badge-risk-dangerous";
    case "loading":
      return "badge-risk-unknown";
    default:
      return "badge-risk-unknown";
  }
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { token } = useAuth();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  // Good / Moderate / Unhealthy...
  const [aqiLabel, setAqiLabel] = useState<string | null>(null);
  const [aqiLevelClass, setAqiLevelClass] =
    useState<string>("badge-warning");
  //  AQI 數值（給 Allergy Risk + AI 用）
  const [aqiValue, setAqiValue] = useState<number | null>(null);

  // 今日溫度資訊
  const [tempLocation, setTempLocation] = useState<string>("");
  const [tempMin, setTempMin] = useState<number | null>(null);
  const [tempMax, setTempMax] = useState<number | null>(null);
  const [tempDiff, setTempDiff] = useState<number | null>(null);

  //  AI Allergy Tips（Gemini)
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);

  // ===== 呼叫後端 /api/ai/allergy-tips，取得 Gemini 建議 =====
  const loadAiAllergyTips = async (
    aqi: number | null,
    minT: number | null,
    maxT: number | null
  ) => {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      console.warn("No Gemini API key found in localStorage");
      return;
    }
    if (!token) {
      console.warn("No auth token, skip AI tips");
      return;
    }

    setLoadingTips(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/allergy-tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          geminiApiKey: apiKey,
          env: {
            aqi: aqi ?? null,
            tempMin: minT ?? null,
            tempMax: maxT ?? null,
          },
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.tips)) {
        setAiTips(data.tips);
      } else {
        console.error("AI tips error:", data);
      }
    } catch (err) {
      console.error("AI tips fetch failed:", err);
    } finally {
      setLoadingTips(false);
    }
  };

  useEffect(() => {
    // 把原始 AQI records 轉成 StationRow[]
    const mapToRows = (records: any[]): StationRow[] =>
      (records ?? []).map((r: any) => ({
        county: r.county || r.County || "",
        site: r.sitename || r.SiteName || "",
        aqi: r.aqi || r.AQI || "",
        pm25: null,
        pm10: null,
        o3: null,
        so2: null,
        status: r.status ?? r.Status ?? "",
        publishTime: r.publishtime || r.PublishTime || "",
        lat:
          r.latitude !== undefined && r.latitude !== null
            ? Number(r.latitude)
            : null,
        lon:
          r.longitude !== undefined && r.longitude !== null
            ? Number(r.longitude)
            : null,
      }));

    // 根據縣市名稱 fallback（台北 > 第一筆）
    const pickFallbackStation = (rows: StationRow[]): StationRow | null =>
      rows.find(
        (r) =>
          r.county.includes("北市") ||
          r.county.includes("臺北") ||
          r.county.includes("台北")
      ) || rows[0] || null;

    // 呼叫後端 F-C0032-001 包裝的今日高低溫 API
    const loadTempByLocation = async (locationName: string) => {
      try {
        const res = await fetch(
          `${WEATHER_TODAY_URL}?locationName=${encodeURIComponent(
            locationName
          )}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success) {
          setTempLocation(data.locationName || locationName);
          setTempMin(data.minTemp ?? data.minT ?? null);
          setTempMax(data.maxTemp ?? data.maxT ?? null);
          setTempDiff(data.tempDiff ?? data.diff ?? null);
        }
      } catch (err) {
        console.error("loadTempByLocation error:", err);
      }
    };

    const loadEnv = async () => {
      try {
        const res = await fetch(AQI_API_URL, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const records: any[] = data?.records ?? [];
        const rows = mapToRows(records);
        if (!rows.length) return;

        // 沒 geolocation：直接 fallback
        if (!navigator.geolocation) {
          const fallback = pickFallbackStation(rows);
          if (!fallback) return;

          const info = getAqiInfo(fallback.aqi);
          if (info) {
            setAqiLabel(info.label);
            setAqiLevelClass(mapAqiLabelToClass(info.label));
          }

          const numAqi = Number(fallback.aqi);
          setAqiValue(Number.isFinite(numAqi) ? numAqi : null);

          setTempLocation(`${fallback.county} ${fallback.site}`.trim());
          await loadTempByLocation(fallback.county || "臺北市");
          return;
        }

        // 有 geolocation：找最近測站
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const nearest = findNearestStation(latitude, longitude, rows);
            const target = nearest || pickFallbackStation(rows);
            if (!target) return;

            const info = getAqiInfo(target.aqi);
            if (info) {
              setAqiLabel(info.label);
              setAqiLevelClass(mapAqiLabelToClass(info.label));
            }
            const numAqi = Number(target.aqi);
            setAqiValue(Number.isFinite(numAqi) ? numAqi : null);

            setTempLocation(`${target.county} ${target.site}`.trim());
            await loadTempByLocation(target.county || "臺北市");
          },
          async (err) => {
            console.error("geolocation error:", err);
            const fallback = pickFallbackStation(rows);
            if (!fallback) return;

            const info = getAqiInfo(fallback.aqi);
            if (info) {
              setAqiLabel(info.label);
              setAqiLevelClass(mapAqiLabelToClass(info.label));
            }

            const numAqi = Number(fallback.aqi);
            setAqiValue(Number.isFinite(numAqi) ? numAqi : null);

            setTempLocation(`${fallback.county} ${fallback.site}`.trim());
            await loadTempByLocation(fallback.county || "臺北市");
          }
        );
      } catch (err) {
        console.error("loadEnv error:", err);
      }
    };

    loadEnv();
  }, []);

  // 當 AQI + 溫度都載好之後，再呼叫 Gemini 產生建議
  useEffect(() => {
    if (aqiValue === null || tempMin === null || tempMax === null) return;
    loadAiAllergyTips(aqiValue, tempMin, tempMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aqiValue, tempMin, tempMax]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        {/* Top bar */}
        <header className="dashboard-header">
          <div>
            <div className="dashboard-title-row">
              <span className="dashboard-icon">✨</span>
              <span className="dashboard-title-text">Dashboard</span>
            </div>
            <div className="dashboard-date">{today}</div>
          </div>

          <div className="dashboard-actions">
            <button className="chip-btn">Customize</button>
            <button className="chip-btn">Share Tip</button>
          </div>
        </header>

        {/* Info cards row */}
        <section className="info-cards">
          {/* Air Quality 卡片 */}
          <div
            className="info-card clickable"
            onClick={() => onNavigate("aqi")}
          >
            <div className="info-card-label">
              <span className="info-card-icon">💨</span> Air Quality
            </div>
            <div className="info-card-main">
              <span className={`badge ${aqiLevelClass}`}>
                {aqiLabel ?? "Loading..."}
              </span>
            </div>
          </div>

          {/* Allergy Risk */}
          <div className="info-card">
            <div className="info-card-label">
              <span className="info-card-icon">⚠️</span> Allergy Risk
            </div>
            <div className="info-card-main">
              {(() => {
                const risk = getAllergyRiskFromAqiValue(aqiValue);
                const text =
                  risk === "loading"
                    ? "Loading..."
                    : risk === "unknown"
                    ? "Unknown"
                    : risk; // low / moderate / dangerous

                return (
                  <span className={`badge ${getAllergyRiskClass(risk)}`}>
                    {text}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Rain Chance（之後可以接真正 API） */}
          <div
            className="info-card clickable"
            onClick={() => onNavigate("rain")}
          >
            <div className="info-card-label">
              <span className="info-card-icon">💧</span> Rain Chance
            </div>
            <div className="info-card-main">
              <span className="info-card-number">45%</span>
            </div>
          </div>

          {/* Temperature 卡片：顯示今天高低溫簡略版 */}
          <div
            className="info-card clickable"
            onClick={() => onNavigate("weather")}
          >
            <div className="info-card-label">
              <span className="info-card-icon">🌡️</span> Temperature
            </div>
            <div className="info-card-main">
              {tempMin !== null && tempMax !== null ? (
                <span className="info-card-number">
                  {tempMin}–{tempMax}°C{" "}
                  {tempDiff !== null && ` (Δ ${tempDiff} °C)`}
                </span>
              ) : (
                <span className="info-card-number">--°C</span>
              )}
            </div>
          </div>
        </section>

        {/* Important notes */}
        <section className="notes-card">
          <div className="notes-header">
            <span className="notes-icon">💡</span>
            <span className="notes-title">
              Important Notes About Allergy
            </span>
          </div>

          <ul className="notes-list">
            {loadingTips && <li>Loading AI suggestions...</li>}

            {!loadingTips && aiTips.length === 0 && (
              <li>
                No AI tips yet. Save your Gemini API key in Profile to enable
                personalized allergy suggestions.
              </li>
            )}

            {!loadingTips &&
              aiTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
          </ul>
        </section>

        {/* Suggested outfit card */}
        <section className="outfit-card">
          <div className="outfit-header">
            <div className="outfit-icon">👕</div>
            <div>
              <div className="outfit-title">Suggested Outfit</div>
              <div className="outfit-subtitle">What to wear today</div>
            </div>
          </div>

          <div className="outfit-body">
            <div className="avatar-wrapper">
              <div className="avatar-head" />
              <div className="avatar-body" />
              <div className="avatar-legs" />
            </div>

            <div className="outfit-tags">
              <span className="tag-pill">Light jacket</span>
              <span className="tag-pill">Long-sleeved shirt</span>
              <span className="tag-pill">Jeans</span>

              <div className="outfit-note">
                <span className="sparkle">✨</span> No special items needed
              </div>
            </div>
          </div>

          <div className="outfit-footer">Afternoon Outfit</div>
        </section>
      </div>
    </div>
  );
}
