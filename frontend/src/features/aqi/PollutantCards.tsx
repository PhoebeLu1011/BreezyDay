// src/features/aqi/PollutantCards.tsx
interface Props {
  pm25: number;
  pm10: number;
  o3: number;
  so2: number;
}

const formatVal = (v: number) => (Number.isNaN(v) ? "--" : v);

const PollutantCards: React.FC<Props> = ({ pm25, pm10, o3, so2 }) => {
  return (
    <section className="pollutants-section">
      <div className="section-title-row">
        <h2 className="section-title">Main Pollutants Today</h2>
      </div>

      <div className="pollutant-grid">
        {/* PM2.5 */}
        <div className="pollutant-card card-yellow">
          <div className="pollutant-header">
            <div>
              <div className="pollutant-name">PM2.5</div>
              <div className="pollutant-subtitle">Fine Particles</div>
            </div>
            <span className="pollutant-badge badge-moderate">Moderate</span>
          </div>

          <div className="pollutant-value-row">
            <span className="pollutant-value" id="pm25-value">
              {formatVal(pm25)}
            </span>
            <span className="pollutant-unit">µg/m³</span>
          </div>

          <div className="pollutant-bar">
            <div
              className="pollutant-bar-inner bar-yellow"
              style={{
                width: pm25 && !Number.isNaN(pm25) ? `${(pm25 / 80) * 100}%` : "0%",
              }}
            />
          </div>

          <div className="pollutant-scale-row">
            <span>0</span>
            <span className="pollutant-standard">Standard: 35 µg/m³</span>
          </div>

          <p className="pollutant-desc">Particles smaller than 2.5 micrometers</p>
        </div>

        {/* PM10 */}
        <div className="pollutant-card card-yellow">
          <div className="pollutant-header">
            <div>
              <div className="pollutant-name">PM10</div>
              <div className="pollutant-subtitle">Coarse Particles</div>
            </div>
            <span className="pollutant-badge badge-moderate">Moderate</span>
          </div>

          <div className="pollutant-value-row">
            <span className="pollutant-value" id="pm10-value">
              {formatVal(pm10)}
            </span>
            <span className="pollutant-unit">µg/m³</span>
          </div>

          <div className="pollutant-bar">
            <div
              className="pollutant-bar-inner bar-yellow"
              style={{
                width: pm10 && !Number.isNaN(pm10) ? `${(pm10 / 120) * 100}%` : "0%",
              }}
            />
          </div>

          <div className="pollutant-scale-row">
            <span>0</span>
            <span className="pollutant-standard">Standard: 100 µg/m³</span>
          </div>

          <p className="pollutant-desc">Particles smaller than 10 micrometers</p>
        </div>

        {/* O3 */}
        <div className="pollutant-card card-green">
          <div className="pollutant-header">
            <div>
              <div className="pollutant-name">O₃</div>
              <div className="pollutant-subtitle">Ozone</div>
            </div>
            <span className="pollutant-badge badge-good">Good</span>
          </div>

          <div className="pollutant-value-row">
            <span className="pollutant-value" id="o3-value">
              {formatVal(o3)}
            </span>
            <span className="pollutant-unit">ppb</span>
          </div>

          <div className="pollutant-bar">
            <div
              className="pollutant-bar-inner bar-green"
              style={{
                width: o3 && !Number.isNaN(o3) ? `${(o3 / 80) * 100}%` : "0%",
              }}
            />
          </div>

          <div className="pollutant-scale-row">
            <span>0</span>
            <span className="pollutant-standard">Standard: 70 ppb</span>
          </div>

          <p className="pollutant-desc">Ground-level ozone</p>
        </div>

        {/* SO2 */}
        <div className="pollutant-card card-green">
          <div className="pollutant-header">
            <div>
              <div className="pollutant-name">SO₂</div>
              <div className="pollutant-subtitle">Sulfur Dioxide</div>
            </div>
            <span className="pollutant-badge badge-good">Good</span>
          </div>

          <div className="pollutant-value-row">
            <span className="pollutant-value" id="so2-value">
              {formatVal(so2)}
            </span>
            <span className="pollutant-unit">ppb</span>
          </div>

          <div className="pollutant-bar">
            <div
              className="pollutant-bar-inner bar-green"
              style={{
                width: so2 && !Number.isNaN(so2) ? `${(so2 / 40) * 100}%` : "0%",
              }}
            />
          </div>

          <div className="pollutant-scale-row">
            <span>0</span>
            <span className="pollutant-standard">Standard: 20 ppb</span>
          </div>

          <p className="pollutant-desc">From industrial activities</p>
        </div>
      </div>
    </section>
  );
};

export default PollutantCards;
