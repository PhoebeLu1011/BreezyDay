import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AQIPage from "./features/aqi/AQIPage";
import ProfilePage from "./pages/ProfilePage";
import FeedbackPage from "./pages/FeedbackPage";


type Page = "landing" | "auth" | "dashboard" | "aqi" | "profile" | "feedback";;

export default function App() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("landing");

  const go = (p: Page) => setPage(p);

  // ✨ 只要 user 不在了（登出），自動回到 landing
  useEffect(() => {
    if (!user) {
      setPage("landing");
    }
  }, [user]);

  // ===== 使用者「尚未登入」時能看到的頁面 =====
  if (!user) {
    if (page === "auth") {
      return <AuthPage onAuthSuccess={() => go("dashboard")} />;
    }
    // 預設顯示 Landing
    return <Landing onEnter={() => go("auth")} />;
  }

  // ===== 以下是「已登入」後可以看到的頁面 =====
  if (page === "dashboard") {
    return <Dashboard onNavigate={go} />;
  }

  if (page === "aqi") {
    return <AQIPage />;
  }

  if (page === "profile") {
    return <ProfilePage onBack={() => go("dashboard")} />;
  }

  if (page === "feedback") {
  return <FeedbackPage onBack={() => go("dashboard")} />;
  }

  // 已登入但 page 不是上述任一個 → fallback 到 Dashboard
  return <Dashboard onNavigate={go} />;
}
