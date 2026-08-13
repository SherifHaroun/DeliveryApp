import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import styles from "./Profile.module.css";

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
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
      setError(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Change Password" backTo="/profile" />
      {error ? <p className="banner-error">{error}</p> : null}
      {message ? <p className="banner-success">{message}</p> : null}
      <form className={styles.form} onSubmit={onSubmit}>
        <label className="field">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className="field">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <Button type="submit" block loading={saving}>
          {saving ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
