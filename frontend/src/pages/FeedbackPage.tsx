// src/pages/FeedbackPage.tsx
import { useState } from "react";

interface FeedbackPageProps {
  onBack: () => void;
}

export default function FeedbackPage({ onBack }: FeedbackPageProps) {
  // 模擬環境數據 (讓使用者參考)
  const envData = {
    aqi: 42,
    temp: 20.5
  };

  // 表單狀態
  const [formData, setFormData] = useState({
    top: "",
    bottom: "",
    accessory: "",
    shoes: "",
    feeling: "Just right",
    adjustment: "Keep the same",
    allergyStatus: "None",
    symptoms: [] as string[],
    medicine: "No",
    impactScore: 0,
    rating: 5
  });

  // 處理多選症狀
  const toggleSymptom = (sym: string) => {
    setFormData(prev => {
      const exists = prev.symptoms.includes(sym);
      return {
        ...prev,
        symptoms: exists 
          ? prev.symptoms.filter(s => s !== sym)
          : [...prev.symptoms, sym]
      };
    });
  };

  const handleSubmit = () => {
    alert("Feedback Submitted! Thank you.");
    onBack();
  };

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: "800px" }}>
      
      {/* 🌟 內嵌 CSS：定義表單專屬的美化樣式 */}
      <style>{`
        /* 毛玻璃大容器 */
        .glass-form-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
          padding: 2.5rem;
        }

        /* 標題字體 */
        .title-serif {
          font-family: 'Playfair Display', serif;
          color: #2c3e50;
        }

        /* 互動式選項按鈕 (取代傳統 Radio) */
        .choice-btn {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.9rem;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          color: #555;
          flex: 1; /* 讓按鈕平均分配寬度 */
        }
        .choice-btn:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        /* 被選中的狀態 */
        .choice-btn.active {
          background: #2c3e50;
          color: white;
          border-color: #2c3e50;
          box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
        }

        /* 下拉選單美化 */
        .glass-select {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 10px 15px;
          width: 100%;
          font-family: 'Poppins', sans-serif;
          color: #333;
          outline: none;
        }
        .glass-select:focus {
          background: #fff;
          border-color: #2c3e50;
        }

        /* 滑桿美化 (Range Slider) */
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 5px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #2c3e50;
          margin-top: -8px; /* 修正對齊 */
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #fff;
        }

        /* 主要按鈕 */
        .btn-submit {
          background: #2c3e50;
          color: white;
          border: none;
          border-radius: 50px;
          padding: 12px 40px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s;
        }
        .btn-submit:hover {
          background: #1a252f;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(44, 62, 80, 0.3);
        }
      `}</style>

      {/* 頂部導航列 (Back) */}
      <div className="d-flex align-items-center mb-4">
        <button 
          onClick={onBack} 
          className="btn btn-link text-decoration-none text-secondary d-flex align-items-center p-0 me-3"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          ← Back
        </button>
        <h2 className="m-0 fw-bold title-serif">Share Your Feedback</h2>
      </div>

      <div className="glass-form-panel">
        
        {/* 環境數據提示 */}
        <div className="text-center mb-5 pb-4 border-bottom border-light">
          <p className="text-muted small mb-3 text-uppercase" style={{ letterSpacing: '1px' }}>Current Conditions</p>
          <div className="d-flex justify-content-center gap-5">
            <div>
              <div className="small text-secondary fw-bold">Air Quality</div>
              <div className="fs-4 fw-bold text-success">{envData.aqi} <span className="fs-6 text-muted fw-normal">(Good)</span></div>
            </div>
            <div>
              <div className="small text-secondary fw-bold">Temperature</div>
              <div className="fs-4 fw-bold text-dark">{envData.temp}°C</div>
            </div>
          </div>
        </div>

        {/* 1. 穿著調查 */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3 title-serif">1. What are you wearing today?</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="small text-muted mb-1">Top</label>
              <select className="glass-select" value={formData.top} onChange={e => setFormData({...formData, top: e.target.value})}>
                <option value="">Select top...</option>
                <option value="t-shirt">T-shirt</option>
                <option value="shirt">Shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="coat">Coat</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="small text-muted mb-1">Bottom</label>
              <select className="glass-select" value={formData.bottom} onChange={e => setFormData({...formData, bottom: e.target.value})}>
                <option value="">Select bottom...</option>
                <option value="jeans">Jeans</option>
                <option value="shorts">Shorts</option>
                <option value="skirt">Skirt</option>
                <option value="trousers">Trousers</option>
              </select>
            </div>
            {/* 可以視需要加入 Accessories / Shoes */}
          </div>
        </div>

        {/* 2. 體感溫度 */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3 title-serif">2. How do you feel?</h5>
          <div className="d-flex gap-2">
            {["Very cold", "Chilly", "Just right", "Warm", "Very hot"].map(opt => (
              <div 
                key={opt}
                className={`choice-btn ${formData.feeling === opt ? 'active' : ''}`}
                onClick={() => setFormData({...formData, feeling: opt})}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* 3. 穿著調整建議 */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3 title-serif">3. Adjust outfit?</h5>
          <div className="d-flex gap-2">
            {[
              { label: "Wear Less", val: "Wear less" },
              { label: "Keep Same", val: "Keep the same" },
              { label: "Wear More", val: "Wear more" }
            ].map(item => (
              <div 
                key={item.val}
                className={`choice-btn ${formData.adjustment === item.val ? 'active' : ''}`}
                onClick={() => setFormData({...formData, adjustment: item.val})}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* 4. 過敏狀況 */}
        <div className="mb-5">
          <h5 className="fw-bold mb-3 title-serif">4. Allergy Status</h5>
          <div className="d-flex gap-2">
             {["None", "Mild", "Severe"].map(opt => (
              <div 
                key={opt}
                className={`choice-btn ${formData.allergyStatus === opt ? 'active' : ''}`}
                onClick={() => setFormData({...formData, allergyStatus: opt})}
              >
                {opt === "None" ? "😊 None" : opt === "Mild" ? "🤧 Mild" : "😷 Severe"}
              </div>
            ))}
          </div>
        </div>

        {/* 5. 症狀 (多選) */}
        {formData.allergyStatus !== "None" && (
          <div className="mb-5 animate__animated animate__fadeIn">
            <h5 className="fw-bold mb-3 title-serif">5. Symptoms (Multi-select)</h5>
            <div className="d-flex flex-wrap gap-2">
              {["Sneezing", "Runny nose", "Itchy eyes", "Cough", "Skin rash", "Fatigue"].map(sym => (
                <div 
                  key={sym}
                  className={`choice-btn ${formData.symptoms.includes(sym) ? 'active' : ''}`}
                  style={{ flex: 'none' }} // 不要強制撐開，保持 Pill 形狀
                  onClick={() => toggleSymptom(sym)}
                >
                  {sym}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 滿意度評分 Slider */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-end mb-2">
             <h5 className="fw-bold mb-0 title-serif">6. Rate our recommendations</h5>
             <span className="fs-4 fw-bold text-dark">{formData.rating} <span className="fs-6 text-muted">/ 10</span></span>
          </div>
          <input 
            type="range" 
            min="0" max="10" 
            value={formData.rating} 
            onChange={e => setFormData({...formData, rating: Number(e.target.value)})} 
          />
          <div className="d-flex justify-content-between mt-1 small text-muted">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="text-center">
          <button className="btn-submit w-100" onClick={handleSubmit}>
            Submit Feedback
          </button>
        </div>

      </div>
    </div>
  );
}