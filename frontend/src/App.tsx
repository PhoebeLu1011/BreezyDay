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

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "aqi"
  | "profile"
  | "feedback"
  | "feedbackHistory";

const STORAGE_KEY = "breezyday_last_page";

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

  // ---------- visitor ----------
  if (!user) {
    if (page === "auth") {
      return <AuthPage onAuthSuccess={() => go("dashboard")} />;
    }
    return <Landing onEnter={() => go("auth")} />;
  }

  // ---------- logged-in ----------
  return (
    <>
      <TopNav onNavigate={go} />

      <div style={{ paddingTop: "70px" }}>

        {page === "dashboard" && <Dashboard onNavigate={go} />}

        {page === "aqi" && <AQIPage />}


        {page === "profile" && (
          <ProfilePage
            onBack={() => go("dashboard")}
            onViewFeedback={() => go("feedbackHistory")}   
          />
        )}

        {page === "feedback" && (
          <FeedbackPage onBack={() => go("dashboard")} />
        )}

        {page === "feedbackHistory" && (   
          <FeedbackHistoryPage onBack={() => go("profile")} />
        )}

      </div>
    </>
  );
}
