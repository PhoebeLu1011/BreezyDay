import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Feedback.css";
// 共用 AQI 工具 & 型別
import { findNearestStation, getAqiInfo } from "../features/aqi/aqiUtils";
import type { StationRow } from "../features/aqi/aqiTypes";

type Props = {
  onBack: () => void;
};

export default function FeedbackPage({ onBack }: Props) {
  const { token } = useAuth();

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  
    // 今天日期（前端顯示用）
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

  // prettier buttons (we’ll style .btn-choice in CSS)
  function choiceBtn(base: string, active: boolean) {
    return `btn btn-choice ${base} ${active ? "active" : ""}`;
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
        // 1️ 打自己的後端拿 AQI
        const res = await fetch(`${API_BASE}/api/aqi`);
        const raw = await res.json();

        // 這裡沿用 AQIPage 的 mapping：data.records 是一個 array
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

        // 2️ 用瀏覽器定位 + findNearestStation 找最近測站
        if (!navigator.geolocation) {
          // 沒有定位權限就 fallback：拿第一筆
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
            // 拒絕定位時 fallback：第一個測站
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

    // envAqiSite 目前像是「臺北市 古亭」，取第一段當縣市
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
        // 寫回後端 envAqi / envAqiSite（對應 app.py 的欄位）
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
    <div className="feedback-container">
      {/* Top bar */}
      <div className="top-bar mb-3">
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
        <h2 className="mb-0">Share Your Feedback</h2>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">

          {/* 🌫 AQI 卡片 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">🌫 Current Air Quality (AQI)</label>

            {envAqi !== null ? (
              <div className="p-3 border rounded bg-light">
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">
                    {envAqiSite || "Unknown location"}
                  </span>
                  <span>{aqiInfo ? aqiInfo.label : "--"}</span>
                </div>

                <div className="text-muted small mt-1">Today • {todayStr}</div>

                <div className="fs-4 mt-2">{envAqi}</div>
              </div>
            ) : (
              <div className="text-muted">Loading AQI...</div>
            )}
          </div>


          {/* 🌡 今日溫度卡片 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">🌡 Today’s Temperature</label>

            {envMaxTemp !== null && envMinTemp !== null ? (
              <div className="p-3 border rounded bg-light">
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">
                    High / Low
                  </span>
                  <span className="text-muted small">{todayStr}</span>
                </div>

                <div className="mt-2">
                  <div>🔺 Max: <strong>{envMaxTemp}°C</strong></div>
                  <div>🔻 Min: <strong>{envMinTemp}°C</strong></div>
                  {envTempDiff !== null && (
                    <div>Δ Temp: <strong>{envTempDiff}°C</strong></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted">Loading temperature...</div>
            )}
          </div>

          {/* 1. Outfit: 4 dropdowns */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              1. What are you wearing today?
            </label>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small mb-1">Top</label>
                <select
                  className="form-select"
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
                  <option value="coat_thick">Coat / thick outerwear</option>
                  <option value="raincoat">Raincoat</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small mb-1">Bottom</label>
                <select
                  className="form-select"
                  value={bottom}
                  onChange={(e) => setBottom(e.target.value)}
                >
                  <option value="">Select bottom...</option>
                  <option value="shorts">Shorts</option>
                  <option value="skirt">Skirt</option>
                  <option value="jeans">Jeans</option>
                  <option value="long_pants">Long pants</option>
                  <option value="leggings">Leggings / tights</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small mb-1">Accessories</label>
                <select
                  className="form-select"
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                >
                  <option value="">Select accessories...</option>
                  <option value="none">None</option>
                  <option value="mask">Mask</option>
                  <option value="scarf">Scarf</option>
                  <option value="hat">Hat / cap</option>
                  <option value="glasses">Glasses</option>
                  <option value="sunglasses">Sunglasses</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small mb-1">Shoes</label>
                <select
                  className="form-select"
                  value={shoes}
                  onChange={(e) => setShoes(e.target.value)}
                >
                  <option value="">Select shoes...</option>
                  <option value="sneakers">Sneakers</option>
                  <option value="sandals">Sandals</option>
                  <option value="boots">Boots</option>
                  <option value="leather_shoes">Leather shoes</option>
                  <option value="slippers">Slippers</option>
                </select>
              </div>
            </div>
          </div>


          {/* 2. Temperature feel */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              2. How do you feel (temperature)?
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "very_cold"
                )}
                onClick={() => setTemperatureFeel("very_cold")}
              >
                🧊 Very cold
              </button>
              <button
                type="button"
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "just_right"
                )}
                onClick={() => setTemperatureFeel("just_right")}
              >
                😊 Just right
              </button>
              <button
                type="button"
                className={choiceBtn(
                  "flex-fill",
                  temperatureFeel === "very_hot"
                )}
                onClick={() => setTemperatureFeel("very_hot")}
              >
                🔥 Very hot
              </button>
            </div>
          </div>

          {/* 3. Outfit change intention */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              3. If you could adjust your outfit, what would you do?
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={choiceBtn("flex-fill", changeOutfit === "cooler")}
                onClick={() => setChangeOutfit("cooler")}
              >
                👕 Wear less / cooler
              </button>
              <button
                type="button"
                className={choiceBtn("flex-fill", changeOutfit === "same")}
                onClick={() => setChangeOutfit("same")}
              >
                😌 Keep the same
              </button>
              <button
                type="button"
                className={choiceBtn("flex-fill", changeOutfit === "warmer")}
                onClick={() => setChangeOutfit("warmer")}
              >
                🧥 Wear more / warmer
              </button>
            </div>
          </div>

          {/* 4. Overall allergy feeling */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              4. Overall, how are your allergies today?
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={choiceBtn("flex-fill", allergyFeel === "none")}
                onClick={() => setAllergyFeel("none")}
              >
                😊 None
              </button>
              <button
                type="button"
                className={choiceBtn("flex-fill", allergyFeel === "normal")}
                onClick={() => setAllergyFeel("normal")}
              >
                😐 Mild / normal
              </button>
              <button
                type="button"
                className={choiceBtn("flex-fill", allergyFeel === "severe")}
                onClick={() => setAllergyFeel("severe")}
              >
                🤧 Severe
              </button>
            </div>
          </div>

          {/* 5. Allergy symptoms */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
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
          <div className="mb-3">
            <label className="form-label fw-semibold">
              6. Did you take any allergy medicine today?
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={choiceBtn("flex-fill", allergyMed === "none")}
                onClick={() => setAllergyMed("none")}
              >
                🚫 No
              </button>
              <button
                type="button"
                className={choiceBtn("flex-fill", allergyMed === "otc")}
                onClick={() => setAllergyMed("otc")}
              >
                💊 OTC medicine
              </button>
              <button
                type="button"
                className={choiceBtn(
                  "flex-fill",
                  allergyMed === "prescribed"
                )}
                onClick={() => setAllergyMed("prescribed")}
              >
                🩺 Prescribed medicine
              </button>
            </div>
          </div>

          {/* 7. Allergy impact slider 0–10 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              7. How much do allergies affect your day today? (0–10)
            </label>
            <div className="d-flex align-items-center gap-3">
              <input
                type="range"
                className="form-range"
                min={0}
                max={10}
                value={allergyImpact}
                onChange={(e) => setAllergyImpact(Number(e.target.value))}
              />
              <div
                className="fw-bold"
                style={{ width: 40, textAlign: "right" }}
              >
                {allergyImpact}
              </div>
            </div>
          </div>

          {/* 8. Recommendation rating slider 0–10 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              8. Rate our outfit & allergy recommendations (0–10)
            </label>
            <div className="d-flex align-items-center gap-3">
              <input
                type="range"
                className="form-range"
                min={0}
                max={10}
                value={recommendationRating}
                onChange={(e) =>
                  setRecommendationRating(Number(e.target.value))
                }
              />
              <div
                className="fw-bold"
                style={{ width: 40, textAlign: "right" }}
              >
                {recommendationRating}
              </div>
            </div>
          </div>

          {/* Submit + status */}
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3 mt-3">
            <button
              className="btn btn-primary px-4 submit-btn"
              type="button"
              onClick={submitForm}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving..." : "Submit Feedback"}
            </button>

            {status === "ok" && (
              <div className="alert alert-success py-1 px-2 mb-0">Saved!</div>
            )}
            {status === "error" && (
              <div className="alert alert-danger py-1 px-2 mb-0">
                Failed to save. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
