import { PageHeader } from "../components/ui/PageHeader";
import { useTheme, type ThemeChoice } from "../theme/ThemeContext";
import styles from "./Profile.module.css";

const options: { id: ThemeChoice; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <PageHeader title="Appearance" backTo="/profile" />
      <div className={styles.choices}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={theme === option.id ? styles.choiceActive : styles.choice}
            onClick={() => setTheme(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
