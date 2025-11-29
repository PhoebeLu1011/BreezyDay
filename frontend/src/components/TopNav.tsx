// src/components/TopNav.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../context/AuthContext"; // 注意路徑：components -> context 要 ../

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "profile"
  | "feedback"
  | "weather";

type Props = {
  onNavigate: (page: Page) => void;
};

export default function TopNav({ onNavigate }: Props) {
  const { logout } = useAuth();  
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top border-bottom shadow-sm">
      <div className="container-fluid">
        {/* ⭐ 點品牌 → 回 Dashboard */}
        <span
          className="navbar-brand"
          role="button"
          onClick={() => onNavigate("dashboard")}
          style={{ fontWeight: 600, cursor: "pointer" }}
        >
          BreezyDay
        </span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <span
                className="nav-link"
                role="button"
                onClick={() => onNavigate("dashboard")}
              >
                Dashboard
              </span>
            </li>

            <li className="nav-item">
              <span
                className="nav-link"
                role="button"
                onClick={() => onNavigate("aqi")}
              >
                AQI
              </span>
            </li>

            <li className="nav-item">
              <span
                className="nav-link"
                role="button"
                onClick={() => onNavigate("weather")}
              >
                Weather
              </span>
            </li>

            <li className="nav-item">
              <span
                className="nav-link"
                role="button"
                onClick={() => onNavigate("profile")}
              >
                Profile
              </span>
            </li>

            <li className="nav-item">
              <span
                className="nav-link"
                role="button"
                onClick={() => onNavigate("feedback")}
              >
                Feedback
              </span>
            </li>
            <li className="nav-item">
                <span
                    className="nav-link"
                    role="button"
                    onClick={logout}
                >
                    Log out
                </span>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}