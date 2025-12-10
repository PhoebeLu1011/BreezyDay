// src/features/aqi/AQIPage.tsx
import { useState, useEffect } from "react";

export default function AQIPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬載入數據
    const timer = setTimeout(() => {
      setData({
        aqi: 42,
        status: "Good",
        station: "Taipei City Hall",
        // 詳細污染物數據
        pm25: 12,
        pm10: 28,
        o3: 35,
        so2: 3,
        // 狀態顏色 (模擬)
        pm25Status: "Moderate",
        pm10Status: "Moderate",
        o3Status: "Good",
        so2Status: "Good"
      });
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: "1100px" }}>
      
      <style>{`
        /* 上半部：詳細數據大面板 */
        .glass-panel-detail {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }

        /* 下半部：污染物專用卡片樣式 */
        .pollutant-card {
          border-radius: 20px;
          padding: 1.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(0,0,0,0.03);
          transition: transform 0.2s;
        }
        .pollutant-card:hover {
          transform: translateY(-3px);
        }

        /* 顏色主題：橘色系 (Moderate) */
        .bg-orange-light {
          background-color: #FFF8E1;
        }
        .badge-orange {
          background-color: #FFE0B2;
          color: #E65100;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px; /* 方圓角，比較整齊 */
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        /* 顏色主題：綠色系 (Good) */
        .bg-green-light {
          background-color: #E6FFFA;
        }
        .badge-green {
          background-color: #B2F5EA;
          color: #006d5b;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        /* 按鈕樣式 */
        .glass-btn {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #333;
          border-radius: 50px;
          padding: 8px 24px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .glass-btn:hover {
          background: #333;
          color: #fff;
        }
        .glass-btn-primary {
          background: #2c3e50;
          color: white;
          border: none;
        }
      `}</style>

      {/* 標題列 */}
      <div className="d-flex justify-content-between align-items-end mb-4 px-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "#2c3e50" }}>
            Air Quality Monitor
          </h2>
          <p className="text-secondary mb-0" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem" }}>
            Real-time monitoring for <span className="fw-bold text-dark">{loading ? "..." : data?.station}</span>
          </p>
        </div>
        <div className="d-flex gap-2">
           <button className="glass-btn glass-btn-primary">📍 Current Location</button>
           <button className="glass-btn">+ Add City</button>
        </div>
      </div>

      {/* 1. 上半部：詳細數據大面板 */}
      <div className="glass-panel-detail p-5 mb-5">
        <div className="row align-items-center">
          {/* 左側：AQI 大圓圈 */}
          <div className="col-md-5 text-center border-end border-secondary-subtle">
            <h6 className="text-uppercase text-secondary fw-bold mb-4" style={{ letterSpacing: '2px', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif" }}>
              Current AQI
            </h6>
            <div className="d-inline-flex flex-column justify-content-center align-items-center rounded-circle" 
                 style={{ 
                   background: loading ? '#f0f0f0' : '#e6fffa',
                   width: '200px', height: '200px',
                   boxShadow: 'inset 0 0 30px rgba(0,128,96,0.15)'
                 }}>
               {loading ? (
                 <span className="spinner-border text-secondary"></span>
               ) : (
                 <>
                   <div className="display-1 fw-bold" style={{ color: '#008060', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-2px' }}>
                     {data?.aqi}
                   </div>
                   <div className="fw-bold fs-4" style={{ color: '#008060', fontFamily: "'Poppins', sans-serif" }}>
                     {data?.status}
                   </div>
                 </>
               )}
            </div>
            <p className="small text-muted mt-3 font-monospace">Updated just now</p>
          </div>

          {/* 右側：健康建議 */}
          <div className="col-md-7 ps-md-5">
             <h4 className="fw-bold mb-3" style={{ color: '#2c3e50', fontFamily: "'Playfair Display', serif" }}>
                Health Advice
             </h4>
             <p className="text-secondary" style={{ lineHeight: '1.8', fontSize: '1rem' }}>
                The air quality is generally acceptable for most people. However, sensitive groups may experience minor health effects. It's a great day to enjoy outdoor activities!
             </p>
             <div className="mt-4 p-3 rounded-4 bg-white bg-opacity-50 border border-light d-flex align-items-center gap-3">
                <span style={{ fontSize: '1.5rem' }}>🏃</span>
                <div>
                    <strong className="d-block text-dark">Outdoor Activities</strong>
                    <span className="small text-muted">Good for walking, running, and cycling.</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. 下半部：Main Pollutants Today (PM2.5, PM10, O3, SO2) */}
      <h5 className="fw-bold mb-3 ps-2" style={{ color: '#2c3e50', fontFamily: "'Playfair Display', serif" }}>
        Main Pollutants Today
      </h5>
      <div className="row g-4">
        
        {/* 卡片 1: PM2.5 (橘色系) */}
        <div className="col-md-6 col-lg-3">
          <div className="pollutant-card bg-orange-light">
            {/* 🌟 修改：標題與 Badge 獨立一行，確保垂直置中對齊 */}
            <div className="d-flex justify-content-between align-items-center mb-1">
               <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '1.1rem'}}>PM2.5</h6>
               <span className="badge-orange">Moderate</span>
            </div>
            {/* 副標題獨立一行 */}
            <div className="small text-secondary mb-3">Fine Particles</div>
            
            <div className="mb-3 d-flex align-items-baseline">
               <span className="display-6 fw-bold text-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                 {loading ? "--" : data?.pm25}
               </span>
               <span className="small text-muted ms-2 fw-bold" style={{ fontSize: '0.8rem' }}>µg/m³</span>
            </div>

            {/* 進度條 */}
            <div>
               <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                  <div className="progress-bar bg-warning" role="progressbar" style={{ width: '45%', borderRadius: '10px' }}></div>
               </div>
               <div className="d-flex justify-content-between mt-2">
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>0</span>
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>Standard: 35 µg/m³</span>
               </div>
            </div>
          </div>
        </div>

        {/* 卡片 2: PM10 (橘色系) */}
        <div className="col-md-6 col-lg-3">
          <div className="pollutant-card bg-orange-light">
            <div className="d-flex justify-content-between align-items-center mb-1">
               <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '1.1rem'}}>PM10</h6>
               <span className="badge-orange">Moderate</span>
            </div>
            <div className="small text-secondary mb-3">Coarse Particles</div>
            
            <div className="mb-3 d-flex align-items-baseline">
               <span className="display-6 fw-bold text-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                 {loading ? "--" : data?.pm10}
               </span>
               <span className="small text-muted ms-2 fw-bold" style={{ fontSize: '0.8rem' }}>µg/m³</span>
            </div>

             <div>
               <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                  <div className="progress-bar bg-warning" role="progressbar" style={{ width: '30%', borderRadius: '10px' }}></div>
               </div>
               <div className="d-flex justify-content-between mt-2">
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>0</span>
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>Standard: 100 µg/m³</span>
               </div>
            </div>
          </div>
        </div>

        {/* 卡片 3: O3 (綠色系) */}
        <div className="col-md-6 col-lg-3">
          <div className="pollutant-card bg-green-light">
            <div className="d-flex justify-content-between align-items-center mb-1">
               <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '1.1rem'}}>O<sub>3</sub></h6>
               <span className="badge-green">Good</span>
            </div>
            <div className="small text-secondary mb-3">Ozone</div>
            
            <div className="mb-3 d-flex align-items-baseline">
               <span className="display-6 fw-bold text-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                 {loading ? "--" : data?.o3}
               </span>
               <span className="small text-muted ms-2 fw-bold" style={{ fontSize: '0.8rem' }}>ppb</span>
            </div>

             <div>
               <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: '20%', borderRadius: '10px' }}></div>
               </div>
               <div className="d-flex justify-content-between mt-2">
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>0</span>
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>Standard: 70 ppb</span>
               </div>
            </div>
          </div>
        </div>

        {/* 卡片 4: SO2 (綠色系) */}
        <div className="col-md-6 col-lg-3">
          <div className="pollutant-card bg-green-light">
            <div className="d-flex justify-content-between align-items-center mb-1">
               <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '1.1rem'}}>SO<sub>2</sub></h6>
               <span className="badge-green">Good</span>
            </div>
            <div className="small text-secondary mb-3">Sulfur Dioxide</div>
            
            <div className="mb-3 d-flex align-items-baseline">
               <span className="display-6 fw-bold text-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                 {loading ? "--" : data?.so2}
               </span>
               <span className="small text-muted ms-2 fw-bold" style={{ fontSize: '0.8rem' }}>ppb</span>
            </div>

             <div>
               <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: '10%', borderRadius: '10px' }}></div>
               </div>
               <div className="d-flex justify-content-between mt-2">
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>0</span>
                  <span className="small text-muted" style={{fontSize: '0.7rem'}}>Standard: 20 ppb</span>
               </div>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
}