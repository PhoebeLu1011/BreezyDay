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
      setError(err.message || "Something went wrong.");
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
            ? "Log in for personalized Breezy Day weather & outfit recommendations."
            : "Create an account and begin your Breezy Day."}
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
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <p className="auth-hint">At least 6 characters, including letters and numbers.</p>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="authpage-btn-primary auth-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Processing..." : mode === "login" ? "Log in" : "Join Breezy Day"}
          </button>
        </form>

        <div className="auth-toggle-text">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <span
                className="auth-link"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Create one
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="auth-link"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Log in
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
