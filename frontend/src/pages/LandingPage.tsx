import { useState } from "react";
import { useAuth } from "../context/AuthContext";
// 修正：原本寫 LandingPage.css，但你的檔案其實叫 Landing.css
import "../styles/LandingPage.css"; 

interface LandingProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        alert("Registration feature coming soon!");
      } else {
        await login(email, password);
        // 登入成功後，App.tsx 會自動切換頁面，這裡不用手動跳轉
      }
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <div className="landing-header">
          <h1 className="landing-title">BreezyDay</h1>
          <p className="landing-subtitle">
            {isRegistering ? "Join our community." : "Your personal air quality assistant."}
          </p>
        </div>
        <form className="landing-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <label>EMAIL</label>
            <input
              type="email"
              className="landing-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <label>PASSWORD</label>
            <input
              type="password"
              className="landing-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="landing-btn">
            {isRegistering ? "Create Account" : "Enter Dashboard"}
          </button>
        </form>
        <div className="landing-footer">
          <button type="button" className="toggle-btn" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}