import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { SettingsGroup } from "../components/ui/SettingsGroup";
import { Toggle } from "../components/ui/Toggle";
import { useScanPrefs } from "../theme/ScanPrefsContext";
import styles from "./Profile.module.css";

type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export function ScanPreferencesPage() {
  const { prefs, setPrefs } = useScanPrefs();
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [requesting, setRequesting] = useState(false);

  const refreshPermission = useCallback(async () => {
    try {
      const status = await navigator.permissions.query({ name: "camera" as PermissionName });
      setPermission(status.state);
    } catch {
      setPermission("unknown");
    }
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  async function enableCamera() {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
    } catch {
      setPermission("denied");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Scan Preferences" backTo="/profile" />

      <SettingsGroup title="Scan Success">
        <div className={styles.prefRow}>
          <span>Sound</span>
          <Toggle
            label="Sound"
            checked={prefs.sound}
            onChange={(sound) => setPrefs({ ...prefs, sound })}
          />
        </div>
        <div className={styles.prefRow}>
          <span>Vibration</span>
          <Toggle
            label="Vibration"
            checked={prefs.vibration}
            onChange={(vibration) => setPrefs({ ...prefs, vibration })}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Camera">
        <div style={{ padding: "12px 4px 16px" }}>
          {permission === "granted" ? (
            <p className={styles.cameraOk}>Camera permission enabled</p>
          ) : (
            <>
              <p className={styles.cameraWarn}>
                {permission === "denied"
                  ? "Camera access is blocked. Enable it in your browser settings to scan QR codes."
                  : "Camera permission is needed to scan card QR codes."}
              </p>
              {permission !== "denied" ? (
                <div style={{ marginTop: 12 }}>
                  <Button type="button" block loading={requesting} onClick={() => void enableCamera()}>
                    {requesting ? "Requesting..." : "Enable camera"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SettingsGroup>
    </div>
  );
}
