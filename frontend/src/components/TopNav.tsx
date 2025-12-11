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
      {/* Top nav palette tuned to dashboard blues */}
      <style>{`
        .nav-link-artistic {
          position: relative;
          color: #355d7f;
          font-family: inherit;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.5rem 1rem !important;
          transition: color 0.3s ease;
          text-shadow: none;
        }

        .nav-link-artistic:hover {
          color: #2b4c69;
        }

        .nav-link-artistic::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 5px;
          left: 50%;
          background-color: #4f82c2;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .nav-link-artistic:hover::after {
          width: 70%;
        }

        .btn-logout-artistic {
          font-family: inherit;
          border: 1px solid #5f9cd2;
          color: #355d7f;
          background: rgba(255, 255, 255, 0.55);
          transition: all 0.3s ease;
        }
        .btn-logout-artistic:hover {
          background: linear-gradient(135deg, #6ea7d8, #4f82c2);
          color: #f7f9ff;
          box-shadow: 0 6px 16px rgba(79, 130, 194, 0.35);
          transform: translateY(-1px);
        }

        @media (max-width: 991.98px) {
          .navbar-collapse {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
          }
          .navbar-nav {
            align-items: flex-start !important;
            gap: 10px;
          }
          .nav-link-artistic {
            padding: 0.35rem 0 !important;
          }
          .btn-logout-artistic {
            display: inline-flex;
            margin-top: 4px;
          }
        }
      `}</style>

      <nav
        className="navbar navbar-expand-lg sticky-top"
        style={{
          backgroundColor: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: "none",
          height: "80px",
          padding: "0 1.5rem",
        }}
      >
        <div className="container-fluid">
          <span
            className="navbar-brand d-flex align-items-center"
            role="button"
            onClick={() => onNavigate("dashboard")}
            style={{
              fontFamily: "inherit",
              fontWeight: 700,
              cursor: "pointer",
              color: "#3a5a80",
              fontSize: "1.5rem",
              letterSpacing: "-0.5px",
              textShadow: "none",
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
              {["dashboard", "aqi", "profile", "feedback", "feedbackHistory"].map(
                (item) => {
                  const label =
                    item === "aqi"
                      ? "AQI"
                      : item === "feedbackHistory"
                      ? "History"
                      : item.charAt(0).toUpperCase() + item.slice(1);

                  return (
                    <li className="nav-item" key={item}>
                      <span
                        className="nav-link nav-link-artistic"
                        role="button"
                        onClick={() => onNavigate(item as Page)}
                        style={{ cursor: "pointer" }}
                      >
                        {label}
                      </span>
                    </li>
                  );
                }
              )}

              <li className="nav-item ms-lg-4">
                <span
                  className="nav-link btn-logout-artistic px-4 py-2 rounded-pill"
                  role="button"
                  onClick={logout}
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
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
