import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Feedback.css";
type Props = {
  onBack: () => void;
};

export default function FeedbackPage({ onBack }: Props) {
  const { token } = useAuth();

  const [wearing, setWearing] = useState("");
  const [temperatureFeel, setTemperatureFeel] = useState("");
  const [changeOutfit, setChangeOutfit] = useState("");
  const [allergyFeel, setAllergyFeel] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("");

  async function submitForm() {
    setStatus("Saving...");

    const body = {
      wearing,
      temperatureFeel,
      changeOutfit,
      allergyFeel,
      rating,
      comments,
    };

    const resp = await fetch("http://localhost:5000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    setStatus("Saved!");
  }

  return (
    <div className="page-shell">
      <div className="top-bar">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h1>Share Your Feedback</h1>
      </div>

      <div className="card">
        <label>1. What are you wearing today?</label>
        <input
          value={wearing}
          onChange={(e) => setWearing(e.target.value)}
          placeholder="e.g., light jacket, jeans"
        />

        <label>2. How do you feel?</label>
        <div className="btn-row">
          <button onClick={() => setTemperatureFeel("very_cold")}>Very Cold</button>
          <button onClick={() => setTemperatureFeel("just_right")}>Just Right</button>
          <button onClick={() => setTemperatureFeel("very_hot")}>Very Hot</button>
        </div>

        <label>3. What would you change?</label>
        <input
          value={changeOutfit}
          onChange={(e) => setChangeOutfit(e.target.value)}
          placeholder="e.g., remove jacket"
        />

        <label>4. How are your allergies?</label>
        <div className="btn-row">
          <button onClick={() => setAllergyFeel("severe")}>Severe</button>
          <button onClick={() => setAllergyFeel("normal")}>Normal</button>
          <button onClick={() => setAllergyFeel("none")}>None</button>
        </div>

        <label>5. Rate our recommendations (0-10)</label>
        <input
          type="range"
          min="0"
          max="10"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <div>{rating}/10</div>

        <label>6. Additional Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Any thoughts?"
        />

        <button className="submit-btn" onClick={submitForm}>
          Submit Feedback
        </button>

        <div>{status}</div>
      </div>
    </div>
  );
}
