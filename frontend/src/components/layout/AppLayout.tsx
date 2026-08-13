import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { History, Home, Package, QrCode, UserRound } from "lucide-react";
import styles from "./AppLayout.module.css";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/deliveries", label: "Deliveries", icon: Package },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const hideFab = location.pathname.startsWith("/scan");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>Card Delivery</strong>
        </div>
        <nav className={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={`${styles.main} ${hideFab ? styles.mainNoFab : ""}`}>
        <Outlet />
      </main>

      {!hideFab ? (
        <button
          type="button"
          className={styles.fab}
          aria-label="Scan QR"
          onClick={() => navigate("/scan")}
        >
          <QrCode size={26} />
          <span>Scan</span>
        </button>
      ) : null}

      <nav className={styles.bottomNav} aria-label="Main">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
          >
            <link.icon size={22} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
