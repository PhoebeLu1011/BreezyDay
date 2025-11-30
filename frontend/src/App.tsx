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
import RainChance from "./features/rain_chance/RainChance";

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "profile"
  | "feedback"
  | "weather"
  | "rain";

const STORAGE_KEY = "breezyday_last_page";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>("landing");

  // 所有 hooks 一律寫在這裡（最上面），不要被 if 包住
  useEffect(() => {
    if (loading) return; // auth 還在初始化就先別動

    if (!user) {
      // 真正「沒有登入」的情況才清掉
      setPage("landing");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY) as Page | null;
      if (
        saved === "dashboard" ||
        saved === "aqi" ||
        saved === "weather" ||
        saved === "profile" ||
        saved === "feedback"||
        saved === "rain"
      ) {
        setPage(saved);
      } else {
        setPage("dashboard");
      }
    }
  }, [user, loading]);

  // hooks 全部宣告完之後，才可以早退 return
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  // 統一切頁函式：切頁 + 記錄最後停留頁面
  const go = (p: Page) => {
    setPage(p);
    if (p !== "landing" && p !== "auth") {
      localStorage.setItem(STORAGE_KEY, p);
    }
  };

  // ===== 使用者尚未登入 =====
  if (!user) {
    if (page === "auth") {
      return <AuthPage onAuthSuccess={() => go("dashboard")} />;
    }
    return <Landing onEnter={() => go("auth")} />;
  }

  // ===== 使用者已登入 =====
  return (
    <>
      <TopNav onNavigate={go} />

      <div style={{ paddingTop: "70px" }}>
        {page === "dashboard" && <Dashboard onNavigate={go} />}

        {page === "aqi" && <AQIPage />}

        {page === "weather" && <WeatherPage onBack={() => go("dashboard")} />}

        {page === "profile" && <ProfilePage onBack={() => go("dashboard")} />}

        {page === "feedback" && (
          <FeedbackPage onBack={() => go("dashboard")} />
        )}

        {page === "rain" && <RainChance onBack={() => go("dashboard")} />}

        {["dashboard", "aqi", "weather", "profile", "feedback", "rain"].indexOf(
          page
        ) === -1 && <Dashboard onNavigate={go} />}
      </div>
    </>
  );
}
