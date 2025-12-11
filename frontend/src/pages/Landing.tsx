// src/pages/Landing.tsx
import { useEffect, useState } from "react";
import "../styles/Landing.css";

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  const [displayText, setDisplayText] = useState(
    "Your personal weather assistant."
  );

  useEffect(() => {
    const texts = [
      "Your personal weather assistant.",
      "Outfit suggestions powered by AI.",
      "Track your daily mood & feedback.",
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setDisplayText(texts[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page-root">
      <div className="landing-clouds" aria-hidden="true">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
        <span className="cloud cloud-4" />
      </div>
      <div className="landing-inner">
        <h1 className="landing-title">BreezyDay</h1>
        <div className="landing-underline" />
        <p className="landing-subtitle">{displayText}</p>

        <button className="landing-btn-primary" onClick={onEnter}>
          Get Started
        </button>
      </div>
    </div>
  );
}
