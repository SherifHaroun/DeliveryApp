import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { ProfileData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import styles from "./Profile.module.css";

export function ProfileEditPage() {
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ProfileData>("/api/profile")
      .then((data) => {
        setFullName(data.fullName);
        setPhone(data.phone ?? "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
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
      setError(err instanceof ApiError ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" backTo="/profile" />
      {loading ? <p className={styles.muted}>Loading…</p> : null}
      {error ? <p className="banner-error">{error}</p> : null}
      {message ? <p className="banner-success">{message}</p> : null}
      {!loading ? (
        <form className={styles.form} onSubmit={onSubmit}>
          <label className="field">
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="field">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </label>
          <Button type="submit" block loading={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
