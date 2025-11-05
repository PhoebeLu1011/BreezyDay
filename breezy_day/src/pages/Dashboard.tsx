import React from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, Navigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="landing-container">
      <div className="content">
        <h2 className="title" style={{ fontSize: "2rem" }}>Hello, {user?.email}</h2>
        <p className="subtitle">This is your dashboard.</p>
        <Link to="/" className="enter-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
          Back to Landing
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
