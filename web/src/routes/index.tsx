import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PageRoute } from "./guards";
import LandingPage from "@/pages/landing";
import PricingPage from "@/pages/pricing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import DashboardLayout from "@/pages/dashboard/layout";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog/post";
import VerifyEmailPage from "@/pages/verify-email";
import InvitePage from "@/pages/invite";
import TermsPage from "@/pages/legal/terms";
import PrivacyPage from "@/pages/legal/privacy";
import DpaPage from "@/pages/legal/dpa";
import DashboardIndex from "@/pages/dashboard/overview";
import MembersPage from "@/pages/dashboard/members";
import BillingPage from "@/pages/dashboard/billing";
import ApiKeysPage from "@/pages/dashboard/api-keys";
import AuditPage from "@/pages/dashboard/audit";
import SettingsPage from "@/pages/dashboard/settings";
import AdminPage from "@/pages/dashboard/admin";

import type { MessageKey } from "@/i18n";

export const NAV_ITEMS: { key: string; labelKey: MessageKey; path: string }[] = [
  { key: "dashboard", labelKey: "overview", path: "/dashboard" },
  { key: "members", labelKey: "members", path: "/dashboard/members" },
  { key: "billing", labelKey: "billing", path: "/dashboard/billing" },
  { key: "api-keys", labelKey: "apiKeys", path: "/dashboard/api-keys" },
  { key: "audit", labelKey: "audit", path: "/dashboard/audit" },
  { key: "settings", labelKey: "settings", path: "/dashboard/settings" },
  { key: "admin", labelKey: "admin", path: "/dashboard/admin" },
];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/dpa" element={<DpaPage />} />
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
        <Route index element={<PageRoute pageKey="dashboard"><DashboardIndex /></PageRoute>} />
        <Route path="members" element={<PageRoute pageKey="members"><MembersPage /></PageRoute>} />
        <Route path="billing" element={<PageRoute pageKey="billing"><BillingPage /></PageRoute>} />
        <Route path="api-keys" element={<PageRoute pageKey="api-keys"><ApiKeysPage /></PageRoute>} />
        <Route path="audit" element={<PageRoute pageKey="audit"><AuditPage /></PageRoute>} />
        <Route path="settings" element={<PageRoute pageKey="settings"><SettingsPage /></PageRoute>} />
        <Route path="admin" element={<PageRoute pageKey="admin"><AdminPage /></PageRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
