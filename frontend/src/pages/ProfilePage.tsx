import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css";

type Profile = {
  username: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  preferredStyles: string[];
};

type ProfilePageProps = {
  onBack?: () => void;
  onViewFeedback?: () => void;
};

export default function ProfilePage({
  onBack,
  onViewFeedback,
}: ProfilePageProps) {
  const { token, user, logout } = useAuth();

  const [profile, setProfile] = useState<Profile>({
    username: "",
    email: "",
    gender: "Female",
    dateOfBirth: "",
    preferredStyles: [],
  });

  const [newStyle, setNewStyle] = useState("");

  // ---------- 讀取資料 ----------
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile((prev) => ({
          ...prev,
          ...data,
          // 後端沒給 email 就用登入使用者的 email
          email: data.email ?? user?.email ?? prev.email,
        }));
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
      });
  }, [token, user]);

  // ---------- 新增 style tag ----------
  const addStyle = () => {
    const trimmed = newStyle.trim();
    if (!trimmed) return;
    if (profile.preferredStyles.includes(trimmed)) {
      setNewStyle("");
      return;
    }
    setProfile({
      ...profile,
      preferredStyles: [...profile.preferredStyles, trimmed],
    });
    setNewStyle("");
  };

  const removeStyle = (tag: string) => {
    setProfile({
      ...profile,
      preferredStyles: profile.preferredStyles.filter((s) => s !== tag),
    });
  };

  // Enter 也可以加 tag
  const handleNewStyleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addStyle();
    }
  };

  // ---------- 儲存 ----------
  const saveProfile = () => {
    fetch("http://localhost:5000/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    })
      .then((r) => r.json())
      .then(() => alert("Profile updated!"))
      .catch((err) => {
        console.error(err);
        alert("Failed to update profile.");
      });
  };

  // ---------- 上方按鈕 handler ----------
  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleViewFeedback = () => {
    if (onViewFeedback) onViewFeedback();
    else alert("TODO: navigate to Feedback page");
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {/* Top bar */}
        <header className="profile-topbar">
          <button className="topbar-back-btn" onClick={handleBack}>
            <span className="topbar-back-icon">←</span>
            <span>Back</span>
          </button>

          <div className="topbar-actions">
            <button className="topbar-chip-btn" onClick={handleViewFeedback}>
              View Feedback
            </button>
            <button className="topbar-chip-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* Main Card */}
        <div className="profile-card">
          {/* Card header */}
          <div className="profile-card-header">
            <div className="profile-avatar-circle">
              <span role="img" aria-label="avatar">
                👤
              </span>
            </div>
            <div>
              <h1 className="profile-title">Profile Settings</h1>
              <p className="profile-subtitle">
                Manage your account information
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
                  setProfile({ ...profile, username: e.target.value })
                }
                placeholder="Enter your username"
              />
            </div>

            {/* Email (只顯示，不可改) */}
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="form-input form-input-disabled"
                value={profile.email || user?.email || ""}
                disabled
              />
              <div className="form-helper">
                Email cannot be changed
              </div>
            </div>

            {/* Gender */}
            <div className="form-field">
              <label className="form-label">Gender</label>
              <select
                className="form-input"
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* DOB */}
            <div className="form-field">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={profile.dateOfBirth}
                onChange={(e) =>
                  setProfile({ ...profile, dateOfBirth: e.target.value })
                }
              />
            </div>

            {/* Preferred Style */}
            <div className="form-field">
              <label className="form-label">Preferred Style</label>
              <div className="form-helper">
                Add tags to describe your clothing preferences (e.g.,
                "short sleeves", "many jackets", "casual")
              </div>

              <div className="style-input-row">
                <input
                  className="form-input"
                  value={newStyle}
                  placeholder="Type a style tag and press Enter"
                  onChange={(e) => setNewStyle(e.target.value)}
                  onKeyDown={handleNewStyleKeyDown}
                />
                <button className="btn-secondary" onClick={addStyle}>
                  Add
                </button>
              </div>

              <div className="style-tags">
                {profile.preferredStyles.length === 0 && (
                  <div className="style-tags-empty">
                    Your style tags will appear here
                  </div>
                )}

                {profile.preferredStyles.map((s) => (
                  <span key={s} className="style-tag">
                    <span>{s}</span>
                    <button
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
          <button className="btn-save-profile" onClick={saveProfile}>
            <span className="btn-save-icon">💾</span>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
