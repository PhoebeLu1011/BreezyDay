// src/App.tsx
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AQIPage from "./features/aqi/AQIPage";
import ProfilePage from "./pages/ProfilePage";
import FeedbackPage from "./pages/FeedbackPage";
import FeedbackHistoryPage from "./pages/FeedbackHistoryPage";
import TopNav from "./components/TopNav";
import Background from "./components/Background";

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "aqiTable"
  | "profile"
  | "feedback"
  | "feedbackHistory";

const STORAGE_KEY = "breezyday_last_page";

// 需要背景的所有頁面（都會套 Vanta）
const VANTA_PAGES: Page[] = [
  "landing",
  "auth",
  "dashboard",
  "aqi",
  "aqiTable",
  "profile",
  "feedback",
  "feedbackHistory",
];

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>("landing");

  // -------- Restore last page --------
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setPage("landing");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY) as Page | null;
      if (
        saved === "dashboard" ||
        saved === "aqi" ||
        saved === "aqiTable" ||
        saved === "profile" ||
        saved === "feedback" ||
        saved === "feedbackHistory"
      ) {
        setPage(saved);
      } else {
        setPage("dashboard");
      }
    }
  }, [user, loading]);

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

  // ---------- navigate ----------
  const go = (p: Page) => {
    setPage(p);
    if (p !== "landing" && p !== "auth") {
      localStorage.setItem(STORAGE_KEY, p);
    }
  };

  let content;

  if (!user) {
    if (page === "auth") {
      content = <AuthPage onAuthSuccess={() => go("dashboard")} />;
    } else {
      content = <Landing onEnter={() => go("auth")} />;
    }
  } else {
    content = (
      <>
        {page === "dashboard" && <Dashboard onNavigate={go} />}

        {page === "aqi" && (
          <AQIPage initialMode="dashboard" onNavigate={go} />
        )}

        {page === "aqiTable" && (
          <AQIPage initialMode="table" onNavigate={go} />
        )}

        {page === "profile" && (
          <ProfilePage/>
        )}

        {page === "feedback" && (
          <FeedbackPage />
        )}

        {page === "feedbackHistory" && (
          <FeedbackHistoryPage onBack={() => go("profile")} />
        )}
      </>
    );
  }

  // ---------- layout ----------
  return (
    <>
      {VANTA_PAGES.includes(page) && <Background />}

      {user && <TopNav onNavigate={go} />}

      <div
        style={{
          paddingTop: user ? "70px" : 0,
          minHeight: "100vh",
          background: "transparent",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        {content}
      </div>
    </>
  );
}
