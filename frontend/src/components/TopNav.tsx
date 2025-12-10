// src/components/TopNav.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../context/AuthContext";

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "profile"
  | "feedback"
  | "feedbackHistory";

type Props = {
  onNavigate: (page: Page) => void;
};

export default function TopNav({ onNavigate }: Props) {
  const { logout } = useAuth();  

  return (
    <>
      {/* 內嵌 CSS：保留您喜歡的藝術感底線動畫 */}
      <style>{`
        /* 定義導航連結的動畫樣式 */
        .nav-link-artistic {
          position: relative;
          color: #333; /* 字體顏色設為深灰，避免在亮背景看不見 */
          font-family: 'Poppins', sans-serif;
          font-weight: 600; /* 稍微加粗一點，因為背景透明時字體需要更明顯 */
          font-size: 1rem;
          padding: 0.5rem 1rem !important;
          transition: color 0.3s ease;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.8); /* 🌟 加一點白色光暈，確保背景變黑時字還看得到 */
        }

        .nav-link-artistic:hover {
          color: #000;
        }

        /* 藝術感底線動畫 */
        .nav-link-artistic::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 5px;
          left: 50%;
          background-color: #111;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .nav-link-artistic:hover::after {
          width: 70%;
        }

        /* 登出按鈕 */
        .btn-logout-artistic {
          font-family: 'Poppins', sans-serif;
          border: 1px solid #e74c3c;
          color: #e74c3c;
          background: rgba(255, 255, 255, 0.5); /* 按鈕給一點半透明底，比較好按 */
          transition: all 0.3s ease;
        }
        .btn-logout-artistic:hover {
          background: #e74c3c;
          color: white;
          box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
          transform: translateY(-1px);
        }
      `}</style>

      <nav 
        className="navbar navbar-expand-lg fixed-top"
        style={{ 
          // 🌟 修改重點：改成完全透明
          backgroundColor: "transparent", 
          backdropFilter: "none",        // 移除模糊濾鏡
          WebkitBackdropFilter: "none",
          boxShadow: "none",             // 移除陰影
          
          height: "80px",
          padding: "0 1.5rem"
        }}
      >
        <div className="container-fluid">
          
          {/* Logo：保留 Playfair Display 藝術字體 */}
          <span
            className="navbar-brand d-flex align-items-center"
            role="button"
            onClick={() => onNavigate("dashboard")}
            style={{ 
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, 
              fontStyle: "italic",
              cursor: "pointer", 
              color: "#1a1a1a", 
              fontSize: "1.8rem",
              letterSpacing: "-0.5px",
              textShadow: "0 0 15px rgba(255, 255, 255, 0.6)" // 加上光暈防護
            }}
          >
            BreezyDay
          </span>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            style={{ border: "none" }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto align-items-center gap-2">
              
              {/* 選單項目 */}
              {["dashboard", "aqi", "profile", "feedback", "feedbackHistory"].map((item) => (
                 <li className="nav-item" key={item}>
                  <span
                    className="nav-link nav-link-artistic"
                    role="button"
                    onClick={() => onNavigate(item as Page)}
                    style={{ textTransform: 'capitalize', cursor: 'pointer' }}
                  >
                    {item === "feedbackHistory" ? "History" : item}
                  </span>
                </li>
              ))}
              
              {/* 登出按鈕 */}
              <li className="nav-item ms-lg-4">
                  <span
                      className="nav-link btn-logout-artistic px-4 py-2 rounded-pill"
                      role="button"
                      onClick={logout}
                      style={{ 
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer"
                      }}
                  >
                      Log out
                  </span>
              </li>

            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}