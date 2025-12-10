import { useState, useEffect } from "react";
// 確保這裡引入的 CSS 檔名跟你的檔案名稱一模一樣
import "../styles/FeedbackHistory.css"; 

// 🔑 關鍵步驟：定義這個介面，讓元件知道它會收到 onBack
interface FeedbackHistoryProps {
  onBack: () => void;
}

export default function FeedbackHistory({ onBack }: FeedbackHistoryProps) {
  const [loading, setLoading] = useState(true);

  // 模擬資料載入
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="history-page-wrapper">
      <div className="history-container">
        
        {/* 頂部導航 */}
        <div className="history-header">
          {/* 這裡使用傳進來的 onBack 來返回上一頁 */}
          <button onClick={onBack} className="back-btn">
            ← Back
          </button>
          <h1 className="page-title">Feedback History</h1>
        </div>

        {/* 統計卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Feedback</h3>
            <p className="stat-value">0</p>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-value">0/10</p>
          </div>
          <div className="stat-card">
            <h3>Most Common</h3>
            <p className="stat-value">N/A</p>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="history-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your history...</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>No feedback history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}