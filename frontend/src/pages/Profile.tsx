import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { ProfileData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { initials } from "../lib/format";
import styles from "./Profile.module.css";

export function ProfilePage() {
  const { logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ProfileData>("/api/profile")
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName, phone }),
      });
      await refresh();
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update profile");
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api("/api/profile/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!profile) {
    return <p className={styles.muted}>{error ?? "Loading profile…"}</p>;
  }

  return (
    <div>
      <header className={styles.hero}>
        <span className={styles.avatar}>{initials(profile.fullName)}</span>
        <div>
          <h1>{profile.fullName}</h1>
          <p>{profile.email}</p>
          <p className={styles.role}>{profile.role === "ADMIN" ? "Administrator" : "Courier"}</p>
        </div>
      </header>

      <section className={styles.stats}>
        <div>
          <strong>{profile.stats.inCustody}</strong>
          <span>In custody</span>
        </div>
        <div>
          <strong>{profile.stats.delivered}</strong>
          <span>Delivered</span>
        </div>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <form className={styles.card} onSubmit={saveProfile}>
        <h2>Account</h2>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <Button type="submit">Save changes</Button>
      </form>

      <form className={styles.card} onSubmit={changePassword}>
        <h2>Password</h2>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <Button type="submit" variant="ghost">
          Update password
        </Button>
      </form>

      <Button variant="danger" block onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
