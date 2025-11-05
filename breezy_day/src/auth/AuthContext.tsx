import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; email: string } | null;

type AuthContextType = {
  user: User;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const raw = localStorage.getItem("bd_token");
    const email = localStorage.getItem("bd_email");
    if (raw && email) setUser({ id: "local", email });
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: 換成真正 API
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json(); // { token, user: {id,email} }
    localStorage.setItem("bd_token", data.token);
    localStorage.setItem("bd_email", data.user.email);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Register failed");
    const data = await res.json(); // { token, user }
    localStorage.setItem("bd_token", data.token);
    localStorage.setItem("bd_email", data.user.email);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("bd_token");
    localStorage.removeItem("bd_email");
    setUser(null);
    // 若你採用 cookie-based session，這裡也可 call /api/auth/logout
  };

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
