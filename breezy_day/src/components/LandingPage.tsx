import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="content">
        <h1 className="title">BreezyDay</h1>
        <p className="subtitle">Dress light, breathe right.</p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="enter-btn" onClick={() => navigate("/login")}>
            Login
          </button>
          <button
            className="enter-btn"
            style={{ backgroundColor: "#4f6d8c" }}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
