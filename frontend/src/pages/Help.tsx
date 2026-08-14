import { PageHeader } from "../components/ui/PageHeader";
import { SettingsGroup } from "../components/ui/SettingsGroup";
import { HowItWorks } from "../components/ui/WorkflowSteps";
import styles from "./Profile.module.css";

export function HelpPage() {
  return (
    <div>
      <PageHeader title="Help & Support" backTo="/profile" />
      <SettingsGroup title="How It Works">
        <div className={styles.help} style={{ padding: "12px 8px 16px" }}>
          <HowItWorks />
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
