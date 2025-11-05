import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <form onSubmit={onSubmit} className="content" style={{ maxWidth: 360, width: "90%" }}>
        <h2 className="title" style={{ fontSize: "2rem" }}>Login</h2>
        <p className="subtitle">Welcome back</p>
        {err && <div style={{ color: "#b00020", marginBottom: 12 }}>{err}</div>}
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 12, marginBottom: 12, width: "100%", borderRadius: 8, border: "1px solid #c7d2e0" }}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 12, marginBottom: 16, width: "100%", borderRadius: 8, border: "1px solid #c7d2e0" }}
          required
        />
        <button className="enter-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p style={{ marginTop: 12 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
