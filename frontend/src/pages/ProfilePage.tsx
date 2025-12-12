// src/pages/ProfilePage.tsx
import { useEffect, useState, type KeyboardEvent } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css";
import { UserIcon } from "@heroicons/react/24/outline";

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = String(rawBase).replace(/\/$/, "");
const PROFILE_URL = `${API_BASE_URL}/api/profile`;

type Profile = {
  username: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  preferredStyles: string[];
};



export default function ProfilePage() {
  const { token, user } = useAuth();

  const [profile, setProfile] = useState<Profile>({
    username: "",
    email: "",
    gender: "Female",
    dateOfBirth: "",
    preferredStyles: [],
  });

  const [newStyle, setNewStyle] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  // ---------- 讀取 Profile ----------
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(PROFILE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) {
          const text = await r.text();
          throw new Error(`GET ${PROFILE_URL} -> ${r.status} ${text}`);
        }

        const data = await r.json();

        setProfile((prev) => ({
          ...prev,
          ...data,
          email: (data.email ?? user?.email ?? prev.email) || "",
          gender: data.gender ?? prev.gender ?? "Female",
          dateOfBirth: data.dateOfBirth ?? prev.dateOfBirth ?? "",
          preferredStyles: data.preferredStyles ?? prev.preferredStyles ?? [],
        }));
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();
  }, [token, user]);

  // ---------- 讀本機 Gemini key ----------
  useEffect(() => {
    const saved = localStorage.getItem("geminiApiKey");
    if (saved) setGeminiKey(saved);
  }, []);

  // ---------- style tag ----------
  const addStyle = () => {
    const trimmed = newStyle.trim();
    if (!trimmed) return;

    if (profile.preferredStyles.includes(trimmed)) {
      setNewStyle("");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      preferredStyles: [...prev.preferredStyles, trimmed],
    }));
    setNewStyle("");
  };

  const removeStyle = (tag: string) => {
    setProfile((prev) => ({
      ...prev,
      preferredStyles: prev.preferredStyles.filter((s) => s !== tag),
    }));
  };

  const handleNewStyleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addStyle();
    }
  };

  // ---------- 儲存 Profile ----------
  const saveProfile = async () => {
    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      const r = await fetch(PROFILE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`PUT ${PROFILE_URL} -> ${r.status} ${text}`);
      }

      try {
        await r.json();
      } catch {
        // ignore non-json
      }

      alert("Profile updated!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    }
  };

  // ---------- 儲存 Gemini key (local only) ----------
  const saveGeminiKeyLocal = () => {
    const trimmed = geminiKey.trim();
    localStorage.setItem("geminiApiKey", trimmed);
    alert("Gemini API key has been saved locally!");
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">

        {/* Main Card */}
        <div className="profile-card">
          {/* Card header */}
          <div className="profile-card-header">
            <div>
              <UserIcon className="avatar-icon" />
            </div>
            <div>
              <h1 className="profile-title">Profile Settings</h1>
              <p className="profile-subtitle">
                Manage your account and personalization preferences.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="profile-form">
            {/* Username */}
            <div className="form-field">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={profile.username}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Enter your username"
              />
            </div>

            {/* Email (read only) */}
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="form-input form-input-disabled"
                value={profile.email || user?.email || ""}
                disabled
              />
              <div className="form-helper">Email cannot be changed</div>
            </div>

            {/* Gender + DOB */}
            <div className="form-field form-field-inline">
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={profile.gender}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, gender: e.target.value }))
                  }
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={profile.dateOfBirth}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Preferred Style */}
            <div className="form-field">
              <label className="form-label">Preferred Style</label>
              <div className="form-helper">
                Add tags to describe your clothing preferences (e.g.{" "}
                <span className="helper-chip">short sleeves</span>,{" "}
                <span className="helper-chip">layers</span>,{" "}
                <span className="helper-chip">casual</span>)
              </div>

              <div className="style-input-row">
                <input
                  className="form-input"
                  value={newStyle}
                  placeholder="Type a style tag and press Enter"
                  onChange={(e) => setNewStyle(e.target.value)}
                  onKeyDown={handleNewStyleKeyDown}
                />
                <button type="button" className="btn-ghost" onClick={addStyle}>
                  Add
                </button>
              </div>

              <div className="style-tags">
                {profile.preferredStyles.length === 0 && (
                  <div className="style-tags-empty">Your style tags will appear here.</div>
                )}

                {profile.preferredStyles.map((s) => (
                  <span key={s} className="style-tag">
                    <span>{s}</span>
                    <button
                      type="button"
                      className="style-tag-remove"
                      onClick={() => removeStyle(s)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="profile-actions">
            <button className="btn-save-profile" onClick={saveProfile}>
              <span>Save Changes</span>
            </button>
          </div>

          {/* AI Settings */}
          <div className="ai-settings-block">
            <h2 className="ai-settings-title">AI Settings</h2>
            <p className="ai-settings-subtitle">
              Store your Gemini API key locally to enable personalized allergy tips and outfit suggestions.
            </p>

            <div className="form-field">
              <label className="form-label">Gemini API Key</label>
              <input
                className="form-input"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Paste your Gemini API key here"
              />
              <div className="form-helper">
                This key is saved only on this device and is never stored in our database.
              </div>
            </div>

            <button
              className="btn-save-profile btn-save-secondary"
              type="button"
              onClick={saveGeminiKeyLocal}
            >
              <span>Save Gemini Key Locally</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
