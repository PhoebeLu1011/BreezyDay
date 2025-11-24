// src/features/aqi/AQITable.tsx
import type { StationRow, SortKey } from "./aqiTypes";
import type { AqiCategory } from "./aqiTypes";

interface Props {
  rows: StationRow[];
  rawRowsCount: number;
  keyword: string;
  sortKey: SortKey;
  levelFilter: string;
  onKeywordChange: (v: string) => void;
  onSortKeyChange: (k: SortKey) => void;
  onLevelFilterChange: (v: AqiCategory | "all") => void;
  onRefresh: () => void;
  onReset: () => void;
  statusText: string;
  loading: boolean;
  onSelectRow: (r: StationRow) => void;
  aqiClass: (v: string | undefined) => string;
}

const AQITable: React.FC<Props> = ({
  rows,
  rawRowsCount,
  keyword,
  sortKey,
  levelFilter,
  onKeywordChange,
  onSortKeyChange,
  onLevelFilterChange,
  onRefresh,
  onReset,
  statusText,
  loading,
  onSelectRow,
  aqiClass,
}) => {
  return (
    <div className="table-wrapper">
      <header>
        <h1>空氣品質即時查詢 - 全站列表</h1>
        <div id="controls">
          <div className="aqi-scale-header">
            <div className="aqi-scale-title">AQI Scale</div>
            <div className="aqi-scale-filter">
              <label>
                依等級篩選列表：
                <select
                  id="aqi-level-filter"
                  value={levelFilter}
                  onChange={(e) =>
                    onLevelFilterChange(e.target.value as AqiCategory | "all")
                  }
                >
                  <option value="all">全部</option>
                  <option value="good">良好 (0–50)</option>
                  <option value="moderate">普通 (51–100)</option>
                  <option value="usg">對敏感族群不健康 (101–150)</option>
                  <option value="unhealthy">不健康 (151–200)</option>
                  <option value="very">非常不健康 (201–300)</option>
                  <option value="hazardous">危害 (301+)</option>
                </select>
              </label>
            </div>
          </div>

          <input
            id="keyword"
            placeholder="搜尋站名 / 縣市"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          >
            <option value="aqi">依 AQI 排序</option>
            <option value="pm25">依 PM2.5 排序</option>
            <option value="pm10">依 PM10 排序</option>
            <option value="site">依測站名稱排序</option>
          </select>
          <button id="refresh" className="btn-table" onClick={onRefresh}>
            {loading ? "重新整理中..." : "重新整理"}
          </button>
          <button
            id="showAll"
            className="btn-table secondary"
            onClick={onReset}
          >
            顯示全部
          </button>
        </div>
      </header>

      <div id="status">
        {statusText}（原始資料共 {rawRowsCount} 筆）
      </div>

      <table>
        <thead>
          <tr>
            <th data-key="county">縣市</th>
            <th data-key="site">測站名稱</th>
            <th data-key="aqi">AQI</th>
            <th data-key="pm25">PM2.5</th>
            <th data-key="pm10">PM10</th>
            <th>O₃</th>
            <th>SO₂</th>
            <th>狀態</th>
            <th>發布時間</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.county}-${r.site}-${r.publishTime}`}
              data-site={r.site}
              onClick={() => onSelectRow(r)}
            >
              <td>{r.county}</td>
              <td>{r.site}</td>
              <td>
                <span className={`pill ${aqiClass(r.aqi)}`}>
                  {r.aqi || "-"}
                </span>
              </td>
              <td>{r.pm25 ?? "-"}</td>
              <td>{r.pm10 ?? "-"}</td>
              <td>{r.o3 ?? "-"}</td>
              <td>{r.so2 ?? "-"}</td>
              <td>{r.status || "-"}</td>
              <td>{r.publishTime || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AQITable;
