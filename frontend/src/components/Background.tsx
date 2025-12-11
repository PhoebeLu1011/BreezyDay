// src/components/Background.tsx
import { useEffect, useMemo, useState } from "react";

type Mode = "day" | "night";

function getTaipeiHour() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    hour12: false,
    hour: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "12";
  return Number(hourStr);
}

function getModeByTaipeiTime(): Mode {
  const hour = getTaipeiHour();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

const palettes = {
  day: {
    gradient: "linear-gradient(135deg, #c7d8f0 0%, #b7d1eb 100%)",
    cloudColor: "rgba(255, 255, 255, 0.82)",
    cloudBlur: "22px",
  },
  night: {
    gradient: "linear-gradient(135deg, #93a8cb 0%, #748ab1 45%, #52648a 100%)",
    cloudColor: "rgba(215, 230, 245, 0.7)",
    cloudBlur: "24px",
  },
} as const;

export default function Background() {
  const [mode, setMode] = useState<Mode>(() => getModeByTaipeiTime());

  useEffect(() => {
    const id = setInterval(() => setMode(getModeByTaipeiTime()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const palette = useMemo(() => palettes[mode], [mode]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100vh",
        zIndex: -1,
        background: palette.gradient,
        transition: "background 1.2s ease",
        overflow: "hidden",
      }}
    >
      <style>{`
        .bg-cloud {
          position: absolute;
          border-radius: 50%;
          filter: blur(${palette.cloudBlur});
          background: ${palette.cloudColor};
          animation: drift 36s linear infinite;
          opacity: 0.85;
        }
        .cloud-a { width: 220px; height: 120px; top: 12%; left: -10%; animation-duration: 40s; }
        .cloud-b { width: 260px; height: 140px; top: 32%; left: 68%; animation-duration: 48s; animation-delay: -10s; }
        .cloud-c { width: 200px; height: 110px; top: 64%; left: -14%; animation-duration: 42s; animation-delay: -18s; }
        .cloud-d { width: 260px; height: 130px; top: 78%; left: 70%; animation-duration: 52s; animation-delay: -24s; }
        .cloud-e { width: 180px; height: 100px; top: 18%; left: 40%; animation-duration: 46s; animation-delay: -8s; }
        .cloud-f { width: 210px; height: 110px; top: 52%; left: 85%; animation-duration: 50s; animation-delay: -16s; }
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-140vw); }
        }
      `}</style>
      <span className="bg-cloud cloud-a" />
      <span className="bg-cloud cloud-b" />
      <span className="bg-cloud cloud-c" />
      <span className="bg-cloud cloud-d" />
      <span className="bg-cloud cloud-e" />
      <span className="bg-cloud cloud-f" />
    </div>
  );
}
