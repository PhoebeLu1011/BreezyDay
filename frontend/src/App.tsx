import { useState, useEffect } from "react";
// 1. 引入真正的 AuthProvider 和 useAuth
import { AuthProvider, useAuth } from "./context/AuthContext";

// 引入你的頁面元件 (請確認路徑正確)
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import FeedbackPage from "./pages/FeedbackPage";
import FeedbackHistory from "./pages/FeedbackHistoryPage";
// ... 其他 import

// 定義頁面類型
type Page = "landing" | "dashboard" | "profile" | "feedback" | "history";

// 2. 建立一個內部元件來處理邏輯 (原本 App 的內容搬到這)
function AppContent() {
  // 使用真正的 useAuth (會自動去問後端有沒有登入)
  const { user, loading } = useAuth();
  
  const [page, setPage] = useState<Page>("landing");
  const [weatherType] = useState<'sunny' | 'cloudy' | 'rainy' | 'night'>('sunny');

  // 3. 監聽 user 狀態：自動切換頁面
  useEffect(() => {
    if (user) {
      // 如果 user 存在 (已登入)，跳轉到 Dashboard
      setPage("dashboard");
    } else {
      // 如果沒有 user (未登入/登出)，跳轉到 Landing
      setPage("landing");
    }
  }, [user]); // 當 user 狀態改變時執行

  // 4. 處理 Loading 狀態 (避免畫面閃爍)
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading...
      </div>
    );
  }

  // 5. 頁面渲染邏輯
  return (
    <>
      {/* 背景樣式與天氣效果 (保留你原本的) */}
      <div className={`app-container ${weatherType}`}>
        
        {/* 如果沒登入 -> 顯示 Landing */}
        {!user && (
           <LandingPage onEnter={() => {}} /> 
           // 註：現在登入邏輯在 Landing 內部自己處理，這裡的 onEnter 其實用不到了，但為了不報錯先留著
        )}

        {/* 如果已登入 -> 依 page 顯示對應頁面 */}
        {user && page === "dashboard" && (
          <Dashboard 
            toProfile={() => setPage("profile")}
            toFeedback={() => setPage("feedback")}
          />
        )}

        {user && page === "profile" && (
          <ProfilePage 
            onBack={() => setPage("dashboard")}
            toHistory={() => setPage("history")}
          />
        )}

        {user && page === "feedback" && (
          <FeedbackPage onBack={() => setPage("dashboard")} />
        )}
        
        {user && page === "history" && (
          <FeedbackHistory onBack={() => setPage("profile")} />
        )}

      </div>
    </>
  );
}

// 6. 最外層的 App：負責包上 AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}