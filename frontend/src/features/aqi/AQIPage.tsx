// src/features/aqi/AQIPage.tsx
import { useEffect, useMemo, useState } from "react";
import AQIDashboard from "./AQIDashboard";
import PollutantCards from "./PollutantCards";
import PollutantChart from "./PollutantChart";
import AQITable from "./AQITable";
import type { StationRow, SortKey } from "./aqiTypes";
import {
  aqiClass,
  getAqiCategory,
  getAqiInfo,
  findNearestStation,
} from "./aqiUtils";
import "./aqi.css";

// ✅ 從這裡開始改：改成打自己的後端，而不是直接打環境部
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AQI_API_URL = `${API_BASE_URL}/api/aqi`;

const AQIPage: React.FC = () => {
  const [rows, setRows] = useState<StationRow[]>([]);
  const [currentStation, setCurrentStation] = useState<StationRow | null>(null);
  const [watchedStations, setWatchedStations] = useState<StationRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("aqi");
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all");
  const [statusText, setStatusText] = useState("載入中...");
  const [loading, setLoading] = useState(false);

  // ⭐ 新增：控制是「儀表板模式」還是「表格模式」
  const [viewMode, setViewMode] = useState<"dashboard" | "table">("dashboard");

  // 抓 API（打自己的 Flask 後端）
  const loadData = async (initial = false) => {
    setLoading(true);
    setStatusText("資料載入中...");
    try {
      const res = await fetch(AQI_API_URL, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped: StationRow[] = (data?.records ?? []).map((r: any) => ({
        county: r.county || "",
        site: r.sitename || r.SiteName || "",
        aqi: r.aqi || "",
        pm25: toNum(r["pm2.5"] ?? r.pm2_5),
        pm10: toNum(r.pm10 ?? r.PM10),
        o3: toNum(r.o3 ?? r.O3),
        so2: toNum(r.so2 ?? r.SO2),
        status: r.status ?? r.Status ?? "",
        publishTime: r.publishtime || r.PublishTime || "",
        lat: numOrNull(r.latitude ?? r.Latitude),
        lon: numOrNull(r.longitude ?? r.Longitude),
      }));

      setRows(mapped);

      // 預設主卡片：優先台北市，沒有就第一筆
      let defaultStation =
        mapped.find(
          (r) =>
            r.county.includes("北市") ||
            r.county.includes("臺北") ||
            r.county.includes("台北"),
        ) || mapped[0];

      setCurrentStation(defaultStation ?? null);

      setStatusText(
        `顯示 ${mapped.length} 筆資料（來源：環境部即時空氣品質，更新時間：${new Date().toLocaleTimeString()}）`,
      );

      if (initial) {
        autoLocateOnLoad(mapped);
      }
    } catch (err) {
      console.error(err);
      setStatusText("讀取失敗，請稍後再試，或聯絡系統管理員。");
    } finally {
      setLoading(false);
    }
  };

  // 首次載入 + 每 5 分鐘更新一次
  useEffect(() => {
    loadData(true);
    const id = setInterval(() => loadData(false), 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto locate（頁面第一次載入就試一次）
  const autoLocateOnLoad = (dataRows: StationRow[]) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestStation(latitude, longitude, dataRows);
        if (nearest) {
          setCurrentStation(nearest);
        }
      },
      (err) => {
        console.log("auto locate failed:", err);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("瀏覽器不支援定位功能");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestStation(latitude, longitude, rows);
        if (nearest) {
          setCurrentStation(nearest);
        } else {
          alert("附近找不到可用測站");
        }
      },
      (err) => {
        console.error(err);
        alert("定位失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleAddCity = () => {
    const kw = window.prompt("請輸入縣市或測站名稱關鍵字：");
    if (!kw) return;
    const key = kw.trim().toLowerCase();
    const station = rows.find(
      (r) =>
        r.county.toLowerCase().includes(key) ||
        r.site.toLowerCase().includes(key),
    );
    if (!station) {
      alert("找不到符合的測站，請試試其他關鍵字");
      return;
    }
    if (
      watchedStations.some(
        (s) => s.site === station.site && s.county === station.county,
      )
    ) {
      alert("這個測站已在列表中");
      return;
    }
    setWatchedStations((prev) => [...prev, station]);
  };

  const handleRemoveWatched = (index: number) => {
    setWatchedStations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetFilters = () => {
    setKeyword("");
    setSortKey("aqi");
    setLevelFilter("all");
  };

  const filteredRows = useMemo(() => {
    let list = rows.filter((r) => {
      const kw = keyword.trim().toLowerCase();
      if (
        kw &&
        !r.county.toLowerCase().includes(kw) &&
        !r.site.toLowerCase().includes(kw)
      ) {
        return false;
      }
      if (levelFilter !== "all") {
        const cat = getAqiCategory(r.aqi);
        if (cat !== levelFilter) return false;
      }
      return true;
    });

    list = list.sort((a, b) => {
      if (sortKey === "site") {
        return a.site.localeCompare(b.site, "zh-Hant");
      }
      const key = sortKey as "aqi" | "pm25" | "pm10";
      const av = key === "aqi" ? Number(a.aqi) || 0 : a[key] ?? 0;
      const bv = key === "aqi" ? Number(b.aqi) || 0 : b[key] ?? 0;
      return bv - av;
    });

    return list;
  }, [rows, keyword, sortKey, levelFilter]);

  // 目前站台的污染物數值
  const currentPollutants = useMemo(() => {
    if (!currentStation) {
      return { pm25: NaN, pm10: NaN, o3: NaN, so2: NaN };
    }
    return {
      pm25: currentStation.pm25 ?? NaN,
      pm10: currentStation.pm10 ?? NaN,
      o3: currentStation.o3 ?? NaN,
      so2: currentStation.so2 ?? NaN,
    };
  }, [currentStation]);

  const mainInfo = currentStation ? getAqiInfo(currentStation.aqi) : null;
  const locationText = currentStation
    ? `${currentStation.county || ""} ${currentStation.site || ""}`.trim()
    : "未知測站";

  return (
    <div className="page">
      {viewMode === "dashboard" ? (
        <>
          {/* 上半部 Dashboard（主卡片 + 污染物卡片 + 圖表） */}
          <section className="top-section">
            <AQIDashboard
              locationText={locationText}
              aqiValue={currentStation?.aqi ?? "--"}
              aqiInfo={mainInfo}
              aqiClassName={
                mainInfo
                  ? `level-status ${mainInfo.className}`
                  : "level-status"
              }
              barPercent={
                currentStation
                  ? Math.min(
                      100,
                      ((Number(currentStation.aqi) || 0) / 300) * 100,
                    )
                  : 0
              }
              onCurrentLocation={handleCurrentLocation}
              onAddCity={handleAddCity}
              watchedStations={watchedStations}
              onClickWatched={(station) => setCurrentStation(station)}
              onRemoveWatched={handleRemoveWatched}
              // ⭐ 點這顆按鈕 → 切去 Table 畫面
              onGoTable={() => setViewMode("table")}
            />

            {/* Main Pollutants Today */}
            <PollutantCards
              pm25={currentPollutants.pm25}
              pm10={currentPollutants.pm10}
              o3={currentPollutants.o3}
              so2={currentPollutants.so2}
            />

            {/* Pollutant Chart */}
            <PollutantChart
              pm25={currentPollutants.pm25}
              pm10={currentPollutants.pm10}
              o3={currentPollutants.o3}
              so2={currentPollutants.so2}
            />
          </section>
        </>
      ) : (
        <>
          {/* Table 模式：上面一個「回儀表板」按鈕 + 全螢幕 AQITable */}
          <div style={{ marginBottom: "16px" }}>
            <button
              className="btn btn-link"
              onClick={() => setViewMode("dashboard")}
            >
              ← 回 AQI 儀表板
            </button>
          </div>

          <AQITable
            rows={filteredRows}
            rawRowsCount={rows.length}
            keyword={keyword}
            sortKey={sortKey}
            levelFilter={levelFilter}
            onKeywordChange={setKeyword}
            onSortKeyChange={setSortKey}
            onLevelFilterChange={setLevelFilter}
            onRefresh={() => loadData(false)}
            onReset={handleResetFilters}
            statusText={statusText}
            loading={loading}
            onSelectRow={(r) => {
              setCurrentStation(r);
            }}
            aqiClass={aqiClass}
          />
        </>
      )}
    </div>
  );
};

function toNum(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function numOrNull(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

export default AQIPage;
