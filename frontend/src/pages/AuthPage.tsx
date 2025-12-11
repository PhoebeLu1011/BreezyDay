import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { FormEvent } from "react";
import "../styles/Landing.css";
import "../styles/AuthPage.css";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page-root">
      <div className="landing-clouds" aria-hidden="true">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
        <span className="cloud cloud-4" />
        <span className="cloud cloud-5" />
      </div>

      <div className="card-glass auth-card">
        <button
          type="button"
          className="auth-back-btn"
          onClick={onAuthSuccess}
        >
          ←
        </button>

        <h2 className="auth-title">BreezyDay</h2>

        <p className="auth-subtitle">
          {mode === "login"
            ? "登入以使用個人化天氣與穿搭建議"
            : "建立帳號，開始記錄你的每一天"}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            密碼
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <p className="auth-hint">建議至少 6 碼，包含英數。</p>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn-primary auth-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "送出中..." : mode === "login" ? "登入" : "註冊"}
          </button>
        </form>

        <div className="auth-toggle-text">
          {mode === "login" ? (
            <>
              還沒有帳號？{" "}
              <span
                className="auth-link"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                建立帳號
              </span>
            </>
          ) : (
            <>
              已經有帳號了？{" "}
              <span
                className="auth-link"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                前往登入
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
