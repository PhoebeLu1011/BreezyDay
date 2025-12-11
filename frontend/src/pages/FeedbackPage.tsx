// src/pages/FeedbackPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css"; // 共用 profile 風格外框 / 按鈕
import "../styles/Feedback.css";
// 共用 AQI 工具 & 型別
import { findNearestStation, getAqiInfo } from "../features/aqi/aqiUtils";
import type { StationRow } from "../features/aqi/aqiTypes";
import { SparklesIcon, SunIcon } from "@heroicons/react/24/outline";
//type Props = {};

export default function FeedbackPage() {
  const { token } = useAuth();

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const todayStr = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // ===== Environment (AQI) =====
  const [envAqi, setEnvAqi] = useState<number | null>(null);
  const [envAqiSite, setEnvAqiSite] = useState<string>("");

  // 今天高低溫（來自 F-C0032-001）
  const [envMaxTemp, setEnvMaxTemp] = useState<number | null>(null);
  const [envMinTemp, setEnvMinTemp] = useState<number | null>(null);
  const [envTempDiff, setEnvTempDiff] = useState<number | null>(null);

  // ===== Outfit (structured) =====
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [accessories, setAccessories] = useState("");
  const [shoes, setShoes] = useState("");

  // ===== Temperature feel / outfit change =====
  const [temperatureFeel, setTemperatureFeel] = useState(""); // very_cold / just_right / very_hot
  const [changeOutfit, setChangeOutfit] = useState(""); // cooler / same / warmer

  // ===== Allergy-related =====
  const [allergyFeel, setAllergyFeel] = useState(""); // severe / normal / none
  const [allergyImpact, setAllergyImpact] = useState(0); // 0–10 overall impact
  const [allergySymptoms, setAllergySymptoms] = useState<string[]>([]); // multi-label
  const [allergyMed, setAllergyMed] = useState(""); // none / otc / prescribed

  // ===== Overall rating for model =====
  const [recommendationRating, setRecommendationRating] = useState(5); // 0–10

  const [status, setStatus] = useState<"" | "saving" | "ok" | "error">("");

  function choiceBtn(base: string, active: boolean) {
    return `pill-button ${base} ${active ? "active" : ""}`;
  }

  function toggleSymptom(symptom: string) {
    setAllergySymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  }

  function symptomBtnClass(active: boolean) {
    return `symptom-toggle ${active ? "selected" : ""}`;
  }

  // ============================
  // 取得 AQI（最近測站）
  // ============================
  useEffect(() => {
    async function loadEnv() {
      try {
        const res = await fetch(`${API_BASE}/api/aqi`);
        const raw = await res.json();

        const rows: StationRow[] = (raw?.records ?? []).map((r: any) => ({
          county: r.county || "",
          site: r.sitename || r.SiteName || "",
          aqi: r.aqi || "",
          pm25: null,
          pm10: null,
          o3: null,
          so2: null,
          status: r.status ?? r.Status ?? "",
          publishTime: r.publishtime || r.PublishTime || "",
          lat:
            r.latitude !== undefined && r.latitude !== null
              ? Number(r.latitude)
              : null,
          lon:
            r.longitude !== undefined && r.longitude !== null
              ? Number(r.longitude)
              : null,
        }));

        if (!navigator.geolocation) {
          if (rows.length > 0) {
            const first = rows[0];
            const nAqi = Number(first.aqi);
            setEnvAqi(Number.isFinite(nAqi) ? nAqi : null);
            setEnvAqiSite(`${first.county} ${first.site}`.trim());
          }
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const nearest = findNearestStation(latitude, longitude, rows);

            if (nearest) {
              const nAqi = Number(nearest.aqi);
              setEnvAqi(Number.isFinite(nAqi) ? nAqi : null);
              setEnvAqiSite(`${nearest.county} ${nearest.site}`.trim());
            }
          },
          (err) => {
            console.error("Geolocation error", err);
            if (rows.length > 0) {
              const first = rows[0];
              const nAqi = Number(first.aqi);
              setEnvAqi(Number.isFinite(nAqi) ? nAqi : null);
              setEnvAqiSite(`${first.county} ${first.site}`.trim());
            }
          }
        );
      } catch (err) {
        console.error("Failed to load environment info", err);
      }
    }

    loadEnv();
  }, [API_BASE]);

  // ============================
  // 用 AQI 的縣市去抓今天高低溫（F-C0032-001）
  // ============================
  useEffect(() => {
    if (!envAqiSite) return;

    const county = envAqiSite.split(" ")[0] || envAqiSite;

    async function loadTodayRange() {
      try {
        const resp = await fetch(
          `${API_BASE}/api/weather/today-range?locationName=${encodeURIComponent(
            county
          )}`
        );
        const json = await resp.json();

        if (json.success) {
          setEnvMaxTemp(
            typeof json.maxTemp === "number" ? json.maxTemp : null
          );
          setEnvMinTemp(
            typeof json.minTemp === "number" ? json.minTemp : null
          );
          setEnvTempDiff(
            typeof json.tempDiff === "number" ? json.tempDiff : null
          );
        }
      } catch (e) {
        console.error("Failed to load today temp range", e);
      }
    }

    loadTodayRange();
  }, [API_BASE, envAqiSite]);

  // ============================
  // Submit
  // ============================
  async function submitForm() {
    try {
      setStatus("saving");

      const body = {
        outfitTop: top,
        outfitBottom: bottom,
        outfitAccessories: accessories,
        outfitShoes: shoes,
        temperatureFeel,
        changeOutfit,
        allergyFeel,
        allergyImpact,
        allergySymptoms,
        allergyMed,
        recommendationRating,
        envAqi,
        envAqiSite,
        feedbackDate: todayStr,
        envMaxTemp,
        envMinTemp,
        envTempDiff,
      };

      const resp = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error("Request failed");

      await resp.json();
      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  const aqiInfo = envAqi !== null ? getAqiInfo(envAqi) : null;

  return (
    <div className="profile-page feedback-page">
      <div className="profile-shell">

        {/* Page title (outside card, matches history style) */}
        <div className="top-bar">
          <h1 className="top-title">Share Your Feedback</h1>
          <div className="top-subtitle">
            Daily outfit and allergy check-in to improve your recommendations.
          </div>
        </div>

        <div className="profile-card">
          {/* Main form body */}
          <div className="profile-form feedback-form">
            {/* AQI */}
            <div className="form-field">
              <label className="feedback-label">
                <SparklesIcon className="form-icon" aria-hidden="true" /> Current Air Quality (AQI)
              </label>

              {envAqi !== null ? (
                <div className="info-card">
                  <div className="info-card-top-row">
                    <strong>{envAqiSite || "Unknown"}</strong>
                    <span>{aqiInfo?.label ?? "--"}</span>
                  </div>
                  <div className="small-label">Today • {todayStr}</div>

                  <div className="info-card-main-value">{envAqi}</div>
                </div>
              ) : (
                <div className="small-label">Loading AQI...</div>
              )}
            </div>

            {/* Temperature */}
            <div className="form-field">
              <label className="feedback-label">
                <SunIcon className="form-icon" aria-hidden="true" /> Today's Temperature
              </label>

              {envMaxTemp !== null ? (
                <div className="info-card">
                  <div className="info-card-top-row">
                    <strong>High / Low</strong>
                    <span className="small-label">{todayStr}</span>
                  </div>

                  <div className="info-card-temp-values">
                    Max: <strong>{envMaxTemp}°C</strong>
                    <br />
                    Min: <strong>{envMinTemp}°C</strong>
                    <br />
                    Δ Temp: <strong>{envTempDiff}°C</strong>
                  </div>
                </div>
              ) : (
                <div className="small-label">Loading temperature...</div>
              )}
            </div>

            {/* Outfit */}
            <div className="form-field">
              <label className="feedback-question">
                1. What are you wearing today?
              </label>

              <div className="feedback-grid-2">
                <div>
                  <div className="small-label">Top</div>
                  <select
                    className="feedback-select"
                    value={top}
                    onChange={(e) => setTop(e.target.value)}
                  >
                    <option value="">Select top...</option>
                    <option value="tshirt_short">Short-sleeve T-shirt</option>
                    <option value="tshirt_long">Long-sleeve T-shirt</option>
                    <option value="shirt">Shirt / blouse</option>
                    <option value="sweater">Sweater</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="jacket_light">Light jacket</option>
                    <option value="coat_thick">Thick coat</option>
                  </select>
                </div>

                <div>
                  <div className="small-label">Bottom</div>
                  <select
                    className="feedback-select"
                    value={bottom}
                    onChange={(e) => setBottom(e.target.value)}
                  >
                    <option value="">Select bottom...</option>
                    <option value="shorts">Shorts</option>
                    <option value="skirt">Skirt</option>
                    <option value="leggings">Leggings</option>
                    <option value="jeans">Jeans</option>
                    <option value="long_pants">Long pants</option>
                  </select>
                </div>
              </div>

              {/* Shoes & Accessories */}
              <div className="feedback-grid-2 feedback-grid-top-margin">
                <div>
                  <div className="small-label">Accessories</div>
                  <select
                    className="feedback-select"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                  >
                    <option value="">Select accessories...</option>
                    <option value="none">None</option>
                    <option value="mask">Mask</option>
                    <option value="scarf">Scarf</option>
                    <option value="hat">Hat</option>
                    <option value="glasses">Glasses</option>
                    <option value="sunglasses">Sunglasses</option>
                  </select>
                </div>

                <div>
                  <div className="small-label">Shoes</div>
                  <select
                    className="feedback-select"
                    value={shoes}
                    onChange={(e) => setShoes(e.target.value)}
                  >
                    <option value="">Select shoes...</option>
                    <option value="sneakers">Sneakers</option>
                    <option value="boots">Boots</option>
                    <option value="leather">Leather shoes</option>
                    <option value="sandals">Sandals</option>
                    <option value="slippers">Slippers</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Temperature Feel */}
            <div className="form-field">
              <label className="feedback-question">
                2. How do you feel (temperature)?
              </label>

            <div className="choice-row">
              <button
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "very_cold"
                )}
                type="button"
                onClick={() => setTemperatureFeel("very_cold")}
              >
                Very cold
              </button>

              <button
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "just_right"
                )}
                type="button"
                onClick={() => setTemperatureFeel("just_right")}
              >
                Just right
              </button>

              <button
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "very_hot"
                )}
                type="button"
                onClick={() => setTemperatureFeel("very_hot")}
              >
                Very hot
              </button>
            </div>
            </div>

            {/* 3. Outfit change intention */}
            <div className="form-field">
              <label className="feedback-question">
                3. If you could adjust your outfit, what would you do?
              </label>
              <div className="choice-row">
                <button
                  type="button"
                  className={choiceBtn(
                    "flex-fill",
                    changeOutfit === "cooler"
                  )}
                  onClick={() => setChangeOutfit("cooler")}
                >
                   Wear less / cooler
                </button>
                <button
                  type="button"
                  className={choiceBtn("flex-fill", changeOutfit === "same")}
                  onClick={() => setChangeOutfit("same")}
                >
                   Keep the same
                </button>
                <button
                  type="button"
                  className={choiceBtn(
                    "flex-fill",
                    changeOutfit === "warmer"
                  )}
                  onClick={() => setChangeOutfit("warmer")}
                >
                   Wear more / warmer
                </button>
              </div>
            </div>

            {/* 4. Overall allergy feeling */}
            <div className="form-field">
              <label className="feedback-question">
                4. Overall, how are your allergies today?
              </label>
              <div className="choice-row">
                <button
                  type="button"
                  className={choiceBtn("flex-fill", allergyFeel === "none")}
                  onClick={() => setAllergyFeel("none")}
                >
                   None
                </button>
                <button
                  type="button"
                  className={choiceBtn(
                    "flex-fill",
                    allergyFeel === "normal"
                  )}
                  onClick={() => setAllergyFeel("normal")}
                >
                   Mild / normal
                </button>
                <button
                  type="button"
                  className={choiceBtn(
                    "flex-fill",
                    allergyFeel === "severe"
                  )}
                  onClick={() => setAllergyFeel("severe")}
                >
                   Severe
                </button>
              </div>
            </div>

            {/* 5. Allergy symptoms */}
            <div className="form-field">
              <label className="feedback-question">
                5. Which allergy symptoms do you have today? (you can choose
                multiple)
              </label>

              <div className="symptom-toggle-group">
                {[
                  { key: "sneezing", label: "Sneezing" },
                  { key: "runny_nose", label: "Runny nose" },
                  { key: "stuffy_nose", label: "Stuffy nose" },
                  { key: "itchy_eyes", label: "Itchy / watery eyes" },
                  { key: "cough", label: "Cough" },
                  { key: "skin_rash", label: "Skin rash / itch" },
                  { key: "wheezing", label: "Wheezing / shortness of breath" },
                  { key: "fatigue", label: "Tired / fatigue" },
                ].map((sym) => {
                  const active = allergySymptoms.includes(sym.key);
                  return (
                    <button
                      key={sym.key}
                      type="button"
                      className={symptomBtnClass(active)}
                      onClick={() => toggleSymptom(sym.key)}
                      aria-pressed={active}
                    >
                      {sym.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Allergy medicine usage */}
            <div className="form-field">
              <label className="feedback-question">
                6. Did you take any allergy medicine today?
              </label>
              <div className="choice-row">
                <button
                  type="button"
                  className={choiceBtn("flex-fill", allergyMed === "none")}
                  onClick={() => setAllergyMed("none")}
                >
                   No
                </button>
                <button
                  type="button"
                  className={choiceBtn("flex-fill", allergyMed === "otc")}
                  onClick={() => setAllergyMed("otc")}
                >
                   OTC medicine
                </button>
                <button
                  type="button"
                  className={choiceBtn(
                    "flex-fill",
                    allergyMed === "prescribed"
                  )}
                  onClick={() => setAllergyMed("prescribed")}
                >
                   Prescribed medicine
                </button>
              </div>
            </div>

            {/* 7. Allergy impact slider 0–10 */}
            <div className="form-field slider-block">
              <label className="feedback-question">
                7. How much do allergies affect your day today? (0–10)
              </label>

              <div className="slider-card">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={allergyImpact}
                  onChange={(e) =>
                    setAllergyImpact(Number(e.target.value))
                  }
                  className="slider-track"
                />
                <div className="slider-value-pill">{allergyImpact}</div>
              </div>
            </div>

            {/* 8. Recommendation rating slider 0–10 */}
            <div className="form-field slider-block">
              <label className="feedback-question">
                8. Rate our outfit & allergy recommendations (0–10)
              </label>

              <div className="slider-card">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={recommendationRating}
                  onChange={(e) =>
                    setRecommendationRating(Number(e.target.value))
                  }
                  className="slider-track"
                />
                <div className="slider-value-pill">
                  {recommendationRating}
                </div>
              </div>
            </div>
          </div>

          {/* Submit + status：改成跟 Profile 一樣的 actions row */}
          <div className="profile-actions submit-row">
            <button
              className="btn-save-profile submit-btn"
              type="button"
              onClick={submitForm}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving..." : "Submit Feedback"}
            </button>

            {status === "ok" && (
              <div className="feedback-status feedback-status-ok">
                Saved!
              </div>
            )}
            {status === "error" && (
              <div className="feedback-status feedback-status-error">
                Failed to save. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
