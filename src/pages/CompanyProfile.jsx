import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ClientCompanyProfile from "./client/ClientCompanyProfile";
import AdminCompanyProfiles from "./admin/AdminCompanyProfiles";

export default function CompanyProfile() {
  const location = useLocation();
  const { user, menus, onboarding } = useAuth();
  const isSetupRoute = location.pathname === "/client/company-profile-setup";

  if (
    isSetupRoute &&
    user?.role === "CLIENT" &&
    onboarding?.companyProfileCompleted === true
  ) {
    return <Navigate to={menus?.[0]?.path || "/client/command-center"} replace />;
  }

  if (location.pathname === "/admin/company-profile" || user?.role === "ADMIN") {
    return <AdminCompanyProfiles />;
  }

  return <ClientCompanyProfile />;
}
