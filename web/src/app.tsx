import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { OrganizationProvider } from "@/contexts/organization-context";
import { I18nProvider } from "@/contexts/i18n-context";
import { Toaster, CookieConsent } from "@/components";
import { AppRoutes } from "@/routes";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <I18nProvider>
            <AppRoutes />
            <Toaster />
            <CookieConsent />
          </I18nProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
