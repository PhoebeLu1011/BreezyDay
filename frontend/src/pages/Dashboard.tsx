import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";

// ⭐ 新增：定義 props 型別
type DashboardProps = {
  onNavigate: (page: "landing" | "auth" | "dashboard" | "aqi"| "profile") => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, logout } = useAuth();

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

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
            <button className="chip-btn" onClick={() => onNavigate("profile")}>
                Profile
            </button>
            <button className="chip-btn">Feedback</button>
            {user && (
              <button className="chip-btn chip-btn-outline" onClick={logout}>
                Log out
              </button>
            )}
          </div>
        </header>

        {/* Info cards row */}
        <section className="info-cards">
          {/* ⭐ 在 info-card 加上 onClick 跳轉 AQI */}
          <div
            className="info-card clickable"
            onClick={() => onNavigate("aqi")}
          >
            <div className="info-card-label">
              <span className="info-card-icon">💨</span> Air Quality
            </div>
            <div className="info-card-main">
              <span className="badge badge-warning">Moderate</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-label">
              <span className="info-card-icon">⚠️</span> Allergy Risk
            </div>
            <div className="info-card-main">
              <span className="badge badge-warning">Moderate</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-label">
              <span className="info-card-icon">💧</span> Rain Chance
            </div>
            <div className="info-card-main">
              <span className="info-card-number">45%</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-label">
              <span className="info-card-icon">🌡️</span> Temperature
            </div>
            <div className="info-card-main">
              <span className="info-card-number">18°C</span>
            </div>
          </div>
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

        {/* Important notes */}
        <section className="notes-card">
          <div className="notes-header">
            <span className="notes-icon">💡</span>
            <span className="notes-title">Important Notes</span>
          </div>

          <ul className="notes-list">
            <li>Large temperature variation — consider layered clothing</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
