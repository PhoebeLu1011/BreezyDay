import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css"; 

interface ProfilePageProps {
  onBack: () => void;
  toHistory: () => void;
}

export default function ProfilePage({ onBack, toHistory }: ProfilePageProps) {
  const { user, logout } = useAuth();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Profile</h2>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <h3>User: {user?.email}</h3>
        </div>
        
        <div className="profile-menu">
          <button onClick={toHistory} className="menu-item">View History</button>
          <button onClick={logout} className="menu-item logout">Log Out</button>
        </div>
      </div>
    </div>
  );
}