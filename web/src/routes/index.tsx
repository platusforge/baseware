import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./guards";
import LandingPage from "@/pages/landing";
import PricingPage from "@/pages/pricing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import DashboardLayout from "@/pages/dashboard/layout";
import DashboardIndex from "@/pages/dashboard/index";
import MembersPage from "@/pages/dashboard/members";
import BillingPage from "@/pages/dashboard/billing";
import ApiKeysPage from "@/pages/dashboard/api-keys";
import AuditPage from "@/pages/dashboard/audit";
import SettingsPage from "@/pages/dashboard/settings";
import AdminPage from "@/pages/dashboard/admin";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Overview", path: "/dashboard" },
  { key: "members", label: "Members", path: "/dashboard/members" },
  { key: "billing", label: "Billing", path: "/dashboard/billing" },
  { key: "api-keys", label: "API Keys", path: "/dashboard/api-keys" },
  { key: "audit", label: "Audit", path: "/dashboard/audit" },
  { key: "settings", label: "Settings", path: "/dashboard/settings" },
  { key: "admin", label: "Admin", path: "/dashboard/admin" },
];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardIndex />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
