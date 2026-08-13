import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AboutPage } from "./pages/About";
import { AppearancePage } from "./pages/Appearance";
import { ChangePasswordPage } from "./pages/ChangePassword";
import { DashboardPage } from "./pages/Dashboard";
import { DeliveriesPage } from "./pages/Deliveries";
import { DeliveryDetailPage } from "./pages/DeliveryDetail";
import { HelpPage } from "./pages/Help";
import { HistoryPage } from "./pages/History";
import { LoginPage } from "./pages/Login";
import { ProfilePage } from "./pages/Profile";
import { ProfileEditPage } from "./pages/ProfileEdit";
import { ScanPage } from "./pages/Scan";
import { ScanPreferencesPage } from "./pages/ScanPreferences";
import { ThemeProvider } from "./theme/ThemeContext";
import { ScanPrefsProvider } from "./theme/ScanPrefsContext";

export default function App() {
  return (
    <ThemeProvider>
      <ScanPrefsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/deliveries" element={<DeliveriesPage />} />
                  <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
                  <Route path="/scan" element={<ScanPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/edit" element={<ProfileEditPage />} />
                  <Route path="/profile/password" element={<ChangePasswordPage />} />
                  <Route path="/profile/appearance" element={<AppearancePage />} />
                  <Route path="/profile/scan" element={<ScanPreferencesPage />} />
                  <Route path="/profile/help" element={<HelpPage />} />
                  <Route path="/profile/about" element={<AboutPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ScanPrefsProvider>
    </ThemeProvider>
  );
}
