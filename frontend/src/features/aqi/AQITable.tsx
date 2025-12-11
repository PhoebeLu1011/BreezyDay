import type { StationRow, SortKey, AqiCategory } from "./aqiTypes";
import "../../styles/AQITable.css";

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
    <section className="aqi-table-section">
      {/* === Header  === */}
      <div className="aqi-table-header">
        <div className="aqi-table-title-block">
          <h2 className="section-title">Real-time AQI Station List</h2>
          <p className="aqi-table-subtitle">
            Browse and filter all stations by city, name, or AQI category.
          </p>
        </div>

        {/* === Control Panel === */}
        <div className="aqi-table-controls">
          <label className="aqi-table-filter">
            Level:
            <select
              id="aqi-level-filter"
              value={levelFilter}
              onChange={(e) =>
                onLevelFilterChange(e.target.value as AqiCategory | "all")
              }
            >
              <option value="all">All</option>
              <option value="good">Good (0–50)</option>
              <option value="moderate">Moderate (51–100)</option>
              <option value="usg">Unhealthy for SG (101–150)</option>
              <option value="unhealthy">Unhealthy (151–200)</option>
              <option value="very">Very Unhealthy (201–300)</option>
              <option value="hazardous">Hazardous (301+)</option>
            </select>
          </label>

          <input
            id="keyword"
            className="aqi-table-input"
            placeholder="Search station / city"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />

          <select
            id="sort"
            className="aqi-table-select"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          >
            <option value="aqi">Sort by AQI</option>
            <option value="pm25">Sort by PM2.5</option>
            <option value="pm10">Sort by PM10</option>
            <option value="site">Sort by Station Name</option>
          </select>

          <button
            id="refresh"
            className="city-btn glass aqi-table-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            id="showAll"
            className="city-btn glass aqi-table-btn secondary"
            onClick={onReset}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Status text */}
      <div className="aqi-table-status">
        {statusText} (Total: {rawRowsCount} records)
      </div>

      {/* Main data table */}
      <table className="aqi-table">
        <thead>
          <tr>
            <th data-key="county">City</th>
            <th data-key="site">Station</th>
            <th data-key="aqi">AQI</th>
            <th data-key="pm25">PM2.5</th>
            <th data-key="pm10">PM10</th>
            <th>O₃</th>
            <th>SO₂</th>
            <th>Status</th>
            <th>Publish Time</th>
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
    </section>
  );
};

export default AQITable;
