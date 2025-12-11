// src/features/aqi/PollutantChart.tsx
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface Props {
  pm25: number;
  pm10: number;
  o3: number;
  so2: number;
}

const PollutantChart: React.FC<Props> = ({ pm25, pm10, o3, so2 }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: ["PM2.5", "PM10", "O₃", "SO₂"],
        axisLine: { lineStyle: { color: "#9ca3af" } },
        axisLabel: { fontSize: 13 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 80,
        interval: 20,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
        axisLabel: { fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          data: [
            { value: Number.isNaN(pm25) ? NaN : pm25, itemStyle: { color: "#e15759" } },
            { value: Number.isNaN(pm10) ? NaN : pm10, itemStyle: { color: "#f28e2c" } },
            { value: Number.isNaN(o3) ? NaN : o3, itemStyle: { color: "#4e79a7" } },
            { value: Number.isNaN(so2) ? NaN : so2, itemStyle: { color: "#59a14f" } },
          ],
          barWidth: "55%",
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [pm25, pm10, o3, so2]);

  const formatVal = (v: number) => (Number.isNaN(v) ? "--" : v);

  return (
    <section className="chart-section">
      <h2 className="section-title">Pollutant Concentrations</h2>
      <div id="pollutant-chart" className="pollutant-chart" ref={chartRef} />

      <div className="chart-legend">
        <div className="legend-item">
          <span className="dot" style={{ background: "#e15759" }} />
          <div className="legend-text">
            <div>PM2.5</div>
            <small>
              <span id="legend-pm25">{formatVal(pm25)}</span> µg/m³
            </small>
          </div>
        </div>

        <div className="legend-item">
          <span className="dot" style={{ background: "#f28e2c" }} />
          <div className="legend-text">
            <div>PM10</div>
            <small>
              <span id="legend-pm10">{formatVal(pm10)}</span> µg/m³
            </small>
          </div>
        </div>

        <div className="legend-item">
          <span className="dot" style={{ background: "#4e79a7" }} />
          <div className="legend-text">
            <div>O₃</div>
            <small>
              <span id="legend-o3">{formatVal(o3)}</span> ppb
            </small>
          </div>
        </div>

        <div className="legend-item">
          <span className="dot" style={{ background: "#59a14f" }} />
          <div className="legend-text">
            <div>SO₂</div>
            <small>
              <span id="legend-so2">{formatVal(so2)}</span> ppb
            </small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PollutantChart;
