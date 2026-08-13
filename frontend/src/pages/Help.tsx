import { PageHeader } from "../components/ui/PageHeader";
import { SettingsGroup } from "../components/ui/SettingsGroup";
import styles from "./Profile.module.css";

export function HelpPage() {
  return (
    <div>
      <PageHeader title="Help & Support" backTo="/profile" />
      <SettingsGroup title="How to deliver a card">
        <div className={styles.help} style={{ padding: "12px 8px 16px" }}>
          <ol>
            <li>Scan the card QR code.</li>
            <li>Confirm the card.</li>
            <li>Send the OTP to the customer.</li>
            <li>Enter the OTP.</li>
            <li>Confirm the delivery.</li>
          </ol>
        </div>
      </SettingsGroup>
      <SettingsGroup title="Need help?">
        <div className={styles.help} style={{ padding: "12px 8px 16px" }}>
          <p>Contact your administrator or support team.</p>
        </div>
      </SettingsGroup>
    </div>
  );
}
