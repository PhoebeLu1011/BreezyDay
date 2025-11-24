interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="bg-landing">
      {/* 如果之後有背景圖，可以在這裡再加一層 overlay */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "3.4rem",
            marginBottom: 8,
            color: "#355d7f",
            fontWeight: 600,
          }}
        >
          BreezyDay
        </h1>
        <p style={{ color: "#476682", marginBottom: 32 }}>
          Dress light, breathe right.
        </p>

        <button className="btn-primary" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}