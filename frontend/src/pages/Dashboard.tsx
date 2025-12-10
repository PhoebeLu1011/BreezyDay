import { useState, useEffect } from "react";
import "../styles/Dashboard.css";

// 定義 Props
interface DashboardProps {
  toProfile: () => void;
  toFeedback: () => void;
}

export default function Dashboard({ toProfile, toFeedback }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [suggestionText, setSuggestionText] = useState("Analyzing weather data...");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/notionists/svg?seed=Felix");
  
  const [weatherData, setWeatherData] = useState<{temp: number; code: number; isDay: number} | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=25.0330&longitude=121.5654&current=weather_code,temperature_2m,is_day&timezone=Asia%2FTaipei"
        );
        const data = await response.json();
        setWeatherData({
          temp: data.current.temperature_2m,
          code: data.current.weather_code,
          isDay: data.current.is_day
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const simulateGeminiResponse = () => {
    setSuggestionText("It's a great day! Wear something comfortable.");
  };

  return (
    <div className="dashboard-container">
      {/* 歡迎區 */}
      <div className="dashboard-header">
        <h1 className="greeting">Hello, User!</h1>
        <div className="user-profile-icon" onClick={toProfile}>
          <span>U</span>
        </div>
      </div>

      {/* 功能按鈕 */}
      <div className="action-buttons">
        <button onClick={toFeedback} className="action-btn primary">Share Feedback</button>
        <button onClick={toProfile} className="action-btn secondary">Profile</button>
      </div>

      {/* 天氣卡片 */}
      <div className="aqi-card">
        <h3>Weather Status</h3>
        <p>{loading ? "Loading..." : `${weatherData?.temp}°C`}</p>
      </div>

      {/* AI 建議 */}
      <div className="suggestion-card">
        <h3>Outfit Suggestion</h3>
        <p>{suggestionText}</p>
        <button onClick={simulateGeminiResponse}>Refresh AI</button>
      </div>
    </div>
  );
}