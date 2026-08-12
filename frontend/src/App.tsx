import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { DeliveriesPage } from "./pages/Deliveries";
import { DeliveryDetailPage } from "./pages/DeliveryDetail";
import { HistoryPage } from "./pages/History";
import { LoginPage } from "./pages/Login";
import { ProfilePage } from "./pages/Profile";
import { ScanPage } from "./pages/Scan";

export default function App() {
  return (
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
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
