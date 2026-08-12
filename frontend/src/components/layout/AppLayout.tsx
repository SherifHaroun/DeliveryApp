import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  QrCode,
  Truck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { initials } from "../../lib/format";
import styles from "./AppLayout.module.css";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/deliveries", label: "Deliveries", icon: Truck },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <CreditCard size={20} />
          </span>
          <div>
            <strong>Card Delivery</strong>
            <span>Courier workspace</span>
          </div>
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

        <NavLink to="/scan" className={styles.scanCta}>
          <QrCode size={18} />
          Scan QR Code
        </NavLink>

        <div className={styles.sidebarFoot}>
          <div className={styles.userChip}>
            <span>{initials(user?.fullName ?? "C")}</span>
            <div>
              <strong>{user?.fullName}</strong>
              <em>{user?.email}</em>
            </div>
          </div>
          <button className={styles.logout} onClick={handleLogout} type="button">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.brandMobile}>
            <CreditCard size={18} />
            Card Delivery
          </div>
          <button className={styles.logoutMobile} onClick={handleLogout} type="button">
            <LogOut size={16} />
          </button>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>

      <nav className={styles.bottomNav}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink
          to="/deliveries"
          className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
        >
          <Truck size={20} />
          Deliveries
        </NavLink>
        <NavLink to="/scan" className={styles.scanTab}>
          <QrCode size={22} />
          Scan
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
        >
          <History size={20} />
          History
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
        >
          <UserRound size={20} />
          Profile
        </NavLink>
      </nav>
    </div>
  );
}
