import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../services/authApi";

interface AuthCtx {
  user: { email: string } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (t && email) {
      setToken(t);
      setUser({ email });
    }
  }, []);

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    setToken(data.token);
    setUser({ email: data.email });
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
  }

  async function register(email: string, password: string) {
    await apiRegister(email, password);
    // 註冊完順便登入
    await login(email, password);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
