import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Navbar: React.FC = () => {
  const { isAuthed, user, logout } = useAuth();

  return (
    <nav style={{ padding: "12px 20px", display: "flex", gap: 16, alignItems: "center" }}>
      <Link to="/" style={{ fontWeight: 700, textDecoration: "none", color: "#345b80" }}>
        BreezyDay
      </Link>
      <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
        {!isAuthed ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span style={{ opacity: 0.8 }}>{user?.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
