import {  useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { FormEvent } from "react";

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
    <div className="bg-landing">
      <div className="card-glass" style={{ width: 380, maxWidth: "90%" }}>
        <h2
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: 4,
            color: "#355d7f",
          }}
        >
          BreezyDay
        </h2>
        <p
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: 20,
            color: "#617c94",
          }}
        >
          {mode === "login"
            ? "登入以使用個人化天氣與穿搭建議"
            : "建立帳號，開始記錄你的每一天"}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 14, marginBottom: 10 }}>
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            密碼
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <p style={{ fontSize: 12, color: "#8a9bb0", marginTop: 2 }}>
            建議至少 6 碼，包含英數。
          </p>

          {error && (
            <div
              style={{
                marginTop: 10,
                color: "#c53c3c",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: 18 }}
          >
            {loading ? "送出中..." : mode === "login" ? "登入" : "註冊"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 13,
            color: "#617c94",
          }}
        >
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
