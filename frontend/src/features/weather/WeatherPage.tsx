// src/features/weather/WeatherPage.tsx
import { useCallback, useEffect, useState } from "react"; // ⭐ 多了 useEffect
import "./WeatherPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CWA_API_URL = `${API_BASE_URL}/api/cwa93`;

type CwaTime = {
  StartTime?: string;
  EndTime?: string;
  ElementValue?: Array<Record<string, string>>;
};

type CwaElement = {
  ElementName: string;
  Time?: CwaTime[];
};

type CwaLocationRaw = {
  LocationName?: string; // 行政區名稱
  Latitude?: string;
  Longitude?: string;
  WeatherElement?: CwaElement[];
  __CountyName?: string; // 我們在前端或後端攤平時補上的縣市名
};

type ForecastRow = {
  index: number;
  start: string;
  end: string;
  temp: number | null;
  wx: string;
};

type SelectedPoint = {
  county: string;
  town: string;
  rows: ForecastRow[];
  nowTemp: number | null;
  rangeMin: number | null;
  rangeMax: number | null;
  nowWx: string;
};

type Props = {
  onBack?: () => void;
};

export default function WeatherPage({ onBack }: Props) {
  const [allLocations, setAllLocations] = useState<CwaLocationRaw[]>([]);
  const [selected, setSelected] = useState<SelectedPoint | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // ---- 工具：Haversine 距離 ----
  function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ---- 從 CWA 抓全部預報點（只抓一次，之後快取在 state） ----
  const fetchAllLocations = useCallback(async (): Promise<CwaLocationRaw[]> => {
    // 如果 state 裡已經有資料，直接用舊的
    if (allLocations.length) return allLocations;

    try {
      setLoadingData(true);
      setError(null);
      setStatus("下載氣象資料中…");

      const res = await fetch(CWA_API_URL);
      if (!res.ok) {
        throw new Error(`後端 /api/cwa93 回傳錯誤：${res.status}`);
      }
      const data = await res.json();

      const roots = (data.records?.Locations ?? []) as Array<{
        LocationsName?: string;
        Location?: CwaLocationRaw[];
      }>;

      const flat: CwaLocationRaw[] = [];
      for (const root of roots) {
        const county = root.LocationsName || "";
        const locs = root.Location || [];
        for (const loc of locs) {
          flat.push({
            ...loc,
            __CountyName: county,
          });
        }
      }

      setAllLocations(flat);
      setStatus("氣象資料下載完成。");
      return flat; // ⚠️ 一定要回傳
    } catch (err: any) {
      console.error(err);
      setError(err.message || "下載資料失敗");
      setStatus("下載資料失敗");
      return []; // 出錯時回空陣列
    } finally {
      setLoadingData(false);
    }
  }, [allLocations]);

  // ---- 從 WeatherElement 抓「溫度」 & 「天氣現象」 ----
  function getTempElement(loc: CwaLocationRaw): CwaElement | undefined {
    const arr = loc.WeatherElement || [];
    return (
      arr.find((e) => e.ElementName === "溫度") ||
      arr.find((e) => e.ElementName.includes("溫度"))
    );
  }

  function getWxElement(loc: CwaLocationRaw): CwaElement | undefined {
    const arr = loc.WeatherElement || [];
    return (
      arr.find((e) => e.ElementName === "天氣現象") ||
      arr.find((e) => e.ElementName === "天氣預報綜合描述") ||
      arr.find((e) => e.ElementName === "Wx")
    );
  }

  function buildSelectedPoint(loc: CwaLocationRaw): SelectedPoint {
    const county = loc.__CountyName || "";
    const town = loc.LocationName || "";

    const tempEl = getTempElement(loc);
    const wxEl = getWxElement(loc);

    const timeCount = Math.max(
      tempEl?.Time?.length || 0,
      wxEl?.Time?.length || 0
    );

    const rows: ForecastRow[] = [];
    const temps: number[] = [];

    for (let i = 0; i < timeCount && i < 24; i++) {
      const tObj = tempEl?.Time?.[i] || {};
      const wObj = wxEl?.Time?.[i] || {};

      const start = tObj.StartTime || wObj.StartTime || "";
      const end = tObj.EndTime || wObj.EndTime || "";

      let tempVal: string | number | undefined;
      if (tObj.ElementValue && tObj.ElementValue[0]) {
        const v = tObj.ElementValue[0];
        tempVal = (v as any).Temperature ?? (v as any).value;
        if (tempVal === undefined) {
          const values = Object.values(v);
          if (values.length > 0) tempVal = values[0];
        }
      }
      const tempNum =
        tempVal !== undefined && !isNaN(Number(tempVal))
          ? Number(tempVal)
          : null;

      let wxText = "";
      if (wObj.ElementValue && wObj.ElementValue[0]) {
        const vv = wObj.ElementValue[0];
        wxText =
          (vv as any).Wx ??
          (vv as any).Weather ??
          (vv as any).value ??
          Object.values(vv)[0] ??
          "";
      }

      if (tempNum !== null) temps.push(tempNum);

      rows.push({
        index: i + 1,
        start,
        end,
        temp: tempNum,
        wx: wxText || "-",
      });
    }

    let nowTemp: number | null = null;
    let rangeMin: number | null = null;
    let rangeMax: number | null = null;

    if (temps.length) {
      nowTemp = temps[0];
      rangeMin = Math.min(...temps);
      rangeMax = Math.max(...temps);
    }

    // 目前天氣現象取第一筆
    let nowWx = "-";
    const firstWxRow = wxEl?.Time?.[0];
    if (firstWxRow?.ElementValue?.[0]) {
      const vv = firstWxRow.ElementValue[0];
      nowWx =
        (vv as any).Wx ??
        (vv as any).Weather ??
        (vv as any).value ??
        Object.values(vv)[0] ??
        "-";
    }

    return {
      county,
      town,
      rows,
      nowTemp,
      rangeMin,
      rangeMax,
      nowWx,
    };
  }

  // ---- 依 GPS 找最近的預報點 ----
  const handleUseCurrentLocation = useCallback(async () => { // ⭐ 包成 useCallback
    if (!navigator.geolocation) {
      alert("這個瀏覽器不支援 GPS 取得位置");
      return;
    }

    setLoadingGps(true);
    setError(null);
    setStatus("取得目前位置中…");
    setSelected(null);

    try {
      // 這裡拿到實際的陣列
      const locations = await fetchAllLocations();
      if (!locations.length) {
        throw new Error("尚未取得任何預報點資料");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setStatus(
        `目前座標：${lat.toFixed(4)}, ${lon.toFixed(
          4
        )}，搜尋最近預報點中…`
      );

      let best: CwaLocationRaw | null = null;
      let bestDist = Infinity;

      for (const loc of locations) {
        const la = Number(loc.Latitude);
        const lo = Number(loc.Longitude);
        if (isNaN(la) || isNaN(lo)) continue;

        const d = distanceKm(lat, lon, la, lo);
        if (d < bestDist) {
          bestDist = d;
          best = loc;
        }
      }

      if (!best) {
        throw new Error("找不到對應的預報點");
      }

      const selectedPoint = buildSelectedPoint(best);
      setSelected(selectedPoint);
      setStatus(
        `已依目前位置選取：${selectedPoint.county} ${selectedPoint.town}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "取得 GPS 或預報資料失敗");
      setStatus("讀取失敗");
    } finally {
      setLoadingGps(false);
    }
  }, [fetchAllLocations]); // ⭐ 依賴 fetchAllLocations

  // ⭐ 一進來頁面自動叫 GPS
  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  return (
    <div className="weather-page">
      {onBack && (
        <button className="topbar-back-btn" onClick={onBack}>
          <span className="topbar-back-icon">←</span>
          <span>Back</span>
        </button>
      )}

      <h1 className="weather-title">一週天氣預報</h1>

      {/* 控制區 */}
      <div className="card-box mb-4">
        <p className="mb-2 text-muted">
          這個版本會在載入頁面時自動使用「目前位置」來找最近的預報點。
        </p>

        {/* ⭐ 這個按鈕可以改成「重新取得目前位置」，看你要不要保留 */}
        <button
          className="btn btn-primary"
          onClick={handleUseCurrentLocation}
          disabled={loadingGps || loadingData}
        >
          {loadingGps || loadingData ? "讀取中…" : "重新取得目前位置"}
        </button>

        <div className="mt-3 text-muted" id="status">
          {status}
        </div>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        <hr />

        <div>
          <h5 className="mb-1">推估行政區</h5>
          <p className="mb-0">
            {selected
              ? `${selected.county || "未知縣市"} ${
                  selected.town || "未知行政區"
                }`
              : "（尚未取得位置）"}
          </p>
        </div>

        {selected && (
          <div className="row mt-3 summary-cards" id="summaryCards">
            <div className="col-md-4 mb-2">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">最近時間點溫度</div>
                  <div className="fs-3 fw-bold" id="nowTemp">
                    {selected.nowTemp !== null
                      ? `${selected.nowTemp.toFixed(1)} °C`
                      : "- °C"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">未來溫度範圍</div>
                  <div className="fs-5" id="rangeTemp">
                    {selected.rangeMin !== null && selected.rangeMax !== null
                      ? `${selected.rangeMin.toFixed(
                          1
                        )} ～ ${selected.rangeMax.toFixed(1)} °C`
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">目前天氣現象</div>
                  <div className="fs-5" id="nowWx">
                    {selected.nowWx || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 結果表格 */}
      <div className="card-box">
        <p className="text-muted mb-2" id="summary">
          {selected
            ? `顯示最近 ${selected.rows.length} 個時間區間的預報資料。`
            : "尚未載入資料。"}
        </p>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>起始時間</th>
                <th>結束時間</th>
                <th>溫度 (°C)</th>
                <th>天氣現象</th>
              </tr>
            </thead>
            <tbody id="resultBody">
              {selected &&
                selected.rows.map((row) => (
                  <tr key={row.index}>
                    <td>{row.index}</td>
                    <td>{row.start}</td>
                    <td>{row.end}</td>
                    <td>
                      {row.temp !== null ? row.temp.toFixed(1) : "-"}
                    </td>
                    <td>{row.wx}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
