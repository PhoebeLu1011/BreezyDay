// src/App.tsx
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AQIPage from "./features/aqi/AQIPage";
import ProfilePage from "./pages/ProfilePage";
import FeedbackPage from "./pages/FeedbackPage";
import WeatherPage from "./features/weather/WeatherPage";
import TopNav from "./components/TopNav";

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "profile"
  | "feedback"
  | "weather";

const STORAGE_KEY = "breezyday_last_page";

export default function App() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("landing");

  // 統一切頁函式：切頁 + 記錄最後停留頁面
  const go = (p: Page) => {
    setPage(p);
    if (p !== "landing" && p !== "auth") {
      localStorage.setItem(STORAGE_KEY, p);
    }
  };

  // 根據 user 狀態決定進哪一頁
  useEffect(() => {
    if (!user) {
      // 還沒登入 / 登出
      setPage("landing");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      // 已登入 → 試著讀最後停留頁面
      const saved = localStorage.getItem(STORAGE_KEY) as Page | null;
      if (
        saved === "dashboard" ||
        saved === "aqi" ||
        saved === "weather" ||
        saved === "profile" ||
        saved === "feedback"
      ) {
        setPage(saved);
      } else {
        setPage("dashboard");
      }
    }
  }, [user]);

  // ===== 使用者尚未登入 =====
  if (!user) {
    if (page === "auth") {
      return <AuthPage onAuthSuccess={() => go("dashboard")} />;
    }
    // 預設 Landing
    return <Landing onEnter={() => go("auth")} />;
  }

  // ===== 使用者已登入 =====
  return (
    <>
      {/* 全站共用頂端導覽列 */}
      <TopNav onNavigate={go} />

      {/* 避免內容被 fixed-top Navbar 擋住 */}
      <div style={{ paddingTop: "70px" }}>
        {page === "dashboard" && <Dashboard onNavigate={go} />}

        {page === "aqi" && <AQIPage />}

        {page === "weather" && <WeatherPage onBack={() => go("dashboard")} />}

        {page === "profile" && <ProfilePage onBack={() => go("dashboard")} />}

        {page === "feedback" && (
          <FeedbackPage onBack={() => go("dashboard")} />
        )}

        {/* fallback：如果 page 怪怪的就回 dashboard */}
        {["dashboard", "aqi", "weather", "profile", "feedback"].indexOf(
          page
        ) === -1 && <Dashboard onNavigate={go} />}
      </div>
    </>
  );
}
