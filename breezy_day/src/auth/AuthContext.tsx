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

const API_BASE = import.meta.env.VITE_API_BASE as string;

async function jsonFetch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  // 啟動時從 localStorage 還原登入狀態
  useEffect(() => {
    const token = localStorage.getItem("bd_token");
    const email = localStorage.getItem("bd_email");
    const id = localStorage.getItem("bd_uid");
    if (token && email && id) setUser({ id, email });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await jsonFetch<{ token: string; user: { id: string; email: string } }>(
      "/api/auth/login",
      { email, password }
    );
    localStorage.setItem("bd_token", data.token);
    localStorage.setItem("bd_email", data.user.email);
    localStorage.setItem("bd_uid", data.user.id);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await jsonFetch<{ token: string; user: { id: string; email: string } }>(
      "/api/auth/register",
      { email, password }
    );
    localStorage.setItem("bd_token", data.token);
    localStorage.setItem("bd_email", data.user.email);
    localStorage.setItem("bd_uid", data.user.id);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("bd_token");
    localStorage.removeItem("bd_email");
    localStorage.removeItem("bd_uid");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
