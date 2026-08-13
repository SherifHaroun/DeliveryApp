import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleHelp, Contrast, Info, KeyRound, LogOut, QrCode, UserRound } from "lucide-react";
import { api } from "../api/client";
import type { ProfileData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { SettingsGroup } from "../components/ui/SettingsGroup";
import { SettingsRow } from "../components/ui/SettingsRow";
import { initials } from "../lib/format";
import styles from "./Profile.module.css";

export function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ProfileData>("/api/profile")
      .then(setProfile)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (!profile) {
    return <p className={styles.muted}>{error ?? "Loading profile…"}</p>;
  }

  return (
    <div>
      <header className={styles.hero}>
        <p className={styles.pageTitle}>Profile</p>
        <span className={styles.avatar}>{initials(profile.fullName)}</span>
        <h1>{profile.fullName}</h1>
        <p>{profile.email}</p>
        <p className={styles.role}>{profile.role === "ADMIN" ? "Administrator" : "Courier"}</p>
      </header>

      <SettingsGroup title="Account">
        <SettingsRow to="/profile/edit" icon={<UserRound size={18} />} label="Profile" />
        <SettingsRow to="/profile/password" icon={<KeyRound size={18} />} label="Change Password" />
      </SettingsGroup>

      <SettingsGroup title="App">
        <SettingsRow to="/profile/appearance" icon={<Contrast size={18} />} label="Appearance" />
        <SettingsRow to="/profile/scan" icon={<QrCode size={18} />} label="Scan Preferences" />
      </SettingsGroup>

      <SettingsGroup title="Support">
        <SettingsRow to="/profile/help" icon={<CircleHelp size={18} />} label="Help & Support" />
        <SettingsRow to="/profile/about" icon={<Info size={18} />} label="About" />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          danger
          icon={<LogOut size={18} />}
          label="Logout"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        />
      </SettingsGroup>
    </div>
  );
}
