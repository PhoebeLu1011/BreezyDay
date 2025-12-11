// src/pages/FeedbackHistoryPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/FeedbackHistory.css";

type Props = {
  onBack: () => void;
};

type FeedbackDoc = {
  _id: string;
  feedbackDate?: string;
  createdAt?: string;

  outfitTop?: string;
  outfitBottom?: string;
  outfitAccessories?: string;
  outfitShoes?: string;

  temperatureFeel?: string;
  changeOutfit?: string;

  allergyFeel?: string;
  allergyImpact?: number;
  allergySymptoms?: string[];
  allergyMed?: string;

  recommendationRating?: number;

  envAqi?: number | null;
  envAqiSite?: string;
  envMaxTemp?: number | null;
  envMinTemp?: number | null;
  envTempDiff?: number | null;
};

export default function FeedbackHistoryPage({ onBack }: Props) {
  const { token } = useAuth();
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [list, setList] = useState<FeedbackDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // 讀取所有 feedback
  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const resp = await fetch(`${API_BASE}/api/feedback`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          console.error("GET /api/feedback failed", resp.status);
          return;
        }

        const json = await resp.json();
        if (json.success && Array.isArray(json.data)) {
          setList(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [API_BASE, token]);

  function formatLabel(text?: string) {
    if (!text) return "--";
    return text.replace(/_/g, " ");
  }

  // 平均評分
  const avgRating =
    list.length === 0
      ? 0
      : list.reduce(
          (sum, f) => sum + (f.recommendationRating ?? 0),
          0
        ) / list.length;

  // Most Common: 最常出現的 allergyFeel
  function getMostCommonAllergyFeel(items: FeedbackDoc[]): string {
    if (items.length === 0) return "N/A";

    const counts: Record<string, number> = {};
    for (const fb of items) {
      const key = fb.allergyFeel || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    }

    let bestKey = "unknown";
    let bestCount = 0;
    for (const key in counts) {
      if (counts[key] > bestCount) {
        bestKey = key;
        bestCount = counts[key];
      }
    }

    const labelMap: Record<string, string> = {
      none: "Allergy: None",
      normal: "Allergy: Normal",
      severe: "Allergy: Severe",
      unknown: "N/A",
    };

    return labelMap[bestKey] || "N/A";
  }

  const mostCommonLabel = getMostCommonAllergyFeel(list);

  return (
    <div className="feedback-history-page">
      <div className="feedback-history-container">
        {/* Top bar */}
        <div className="history-topbar">
          <div className="history-title-block">
            <h2 className="history-title">Feedback History</h2>
            <p className="history-subtitle">Review your past feedback entries.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-title">Total Feedback</div>
            <div className="summary-value">{list.length}</div>
          </div>

          <div className="summary-card">
            <div className="summary-title">Average Rating</div>
            <div className="summary-value">
              {list.length === 0 ? "0/10" : `${avgRating.toFixed(1)}/10`}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-title">Most Common</div>
            <div className="summary-value">{mostCommonLabel}</div>
          </div>
        </div>

        {/* History List */}
        <div className="history-list">
          {loading ? (
            <div className="empty-msg">Loading...</div>
          ) : list.length === 0 ? (
            <div className="empty-msg">No feedback yet</div>
          ) : (
            <div className="history-scroller">
              {/* header row */}
              <div className="history-header-row">
                <div className="history-header-cell">Date</div>
                <div className="history-header-cell">Location / AQI</div>
                <div className="history-header-cell">
                  Temp (High / Low / Δ)
                </div>
                <div className="history-header-cell">Temp Feel</div>
                <div className="history-header-cell">Change Outfit</div>
                <div className="history-header-cell">
                  Outfit (Top / Bottom)
                </div>
                <div className="history-header-cell">Accessories</div>
                <div className="history-header-cell">Shoes</div>
                <div className="history-header-cell">Allergy Feel</div>
                <div className="history-header-cell">Allergy Impact</div>
                <div className="history-header-cell">Allergy Med</div>
                <div className="history-header-cell">Symptoms</div>
                <div className="history-header-cell">Rating</div>
              </div>

              {/* data rows */}
              {list.map((fb) => (
                <div className="history-row" key={fb._id}>
                  {/* Date */}
                  <div className="history-cell history-cell-date">
                    {fb.feedbackDate ||
                      fb.createdAt?.slice(0, 10) ||
                      "--"}
                  </div>

                  {/* Location / AQI */}
                  <div className="history-cell">
                    <div className="cell-main">
                      {fb.envAqiSite || "Unknown"}
                    </div>
                    <div className="cell-sub">
                      AQI:{" "}
                      {fb.envAqi === null || fb.envAqi === undefined
                        ? "--"
                        : fb.envAqi}
                    </div>
                  </div>

                  {/* Temp (High / Low / Δ) */}
                  <div className="history-cell">
                    <div className="cell-main">
                      {fb.envMaxTemp ?? "--"}° /{" "}
                      {fb.envMinTemp ?? "--"}°
                    </div>
                    <div className="cell-sub">
                      Δ {fb.envTempDiff ?? "--"}°C
                    </div>
                  </div>

                  {/* Temp Feel */}
                  <div className="history-cell">
                    {formatLabel(fb.temperatureFeel)}
                  </div>

                  {/* Change Outfit */}
                  <div className="history-cell">
                    {formatLabel(fb.changeOutfit)}
                  </div>

                  {/* Outfit (Top / Bottom) */}
                  <div className="history-cell">
                    <div className="cell-main">
                      {formatLabel(fb.outfitTop)}
                    </div>
                    <div className="cell-sub">
                      {formatLabel(fb.outfitBottom)}
                    </div>
                  </div>

                  {/* Accessories */}
                  <div className="history-cell">
                    {formatLabel(fb.outfitAccessories)}
                  </div>

                  {/* Shoes */}
                  <div className="history-cell">
                    {formatLabel(fb.outfitShoes)}
                  </div>


                  {/* Allergy Feel */}
                  <div className="history-cell">
                    {formatLabel(fb.allergyFeel)}
                  </div>

                  {/* Allergy Impact */}
                  <div className="history-cell">
                    {fb.allergyImpact ?? "--"}
                  </div>

                  {/* Allergy Med */}
                  <div className="history-cell">
                    {formatLabel(fb.allergyMed)}
                  </div>

              {/* Symptoms */}
              <div className="history-cell symptoms-cell">
                {fb.allergySymptoms && fb.allergySymptoms.length > 0 ? (
                  <div className="symptom-list">
                    {fb.allergySymptoms.map((sym) => (
                      <span className="symptom-chip" key={sym}>
                        {formatLabel(sym)}
                      </span>
                    ))}
                  </div>
                ) : (
                  "None"
                )}
              </div>


              {/* Rating */}
              <div className="history-cell history-cell-rating">
                {fb.recommendationRating ?? 0}/10
              </div>
            </div>
          ))}
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
