import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import Layout from "../components/layout/Layout";
import ForgotPassword from "../pages/ForgotPassword";
import Login from "../pages/Login";
import AccountResetPassword from "../pages/AccountResetPassword";
import CompanyProfile from "../pages/CompanyProfile";
import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "./ProtectedRoute";

import AdminCommandCenter from "../pages/admin/AdminCommandCenter";
import UserManagement from "../pages/admin/UserManagement";
import MenuManagement from "../pages/admin/MenuManagement";
import ClientManagement from "../pages/admin/ClientManagement";
import AdminCompanyProfiles from "../pages/admin/AdminCompanyProfiles";
import AdminServiceRequests from "../pages/admin/AdminServiceRequests";
import AdminWorkforce from "../pages/admin/AdminWorkforce";
import ClientCommandCenter from "../pages/client/ClientCommandCenter";
import ServiceStore from "../pages/client/ServiceStore";
import WalletCredit from "../pages/client/WalletCredit";
import ClientTrackRequests from "../pages/client/ClientTrackRequests";
import AgentTasks from "../pages/agent/AgentTasks";
import MenuPlaceholder from "../pages/MenuPlaceholder";
import Unauthorized from "../pages/Unauthorized";

function flattenMenus(menus) {
  let result = [];

  menus.forEach((menu) => {
    result.push(menu);

    if (menu.children?.length) {
      result = result.concat(flattenMenus(menu.children));
    }
  });

  return result;
}

export default function AppRoutes() {
  const { menus } = useAuth();
  const allMenus = flattenMenus(menus || []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="client/company-profile-setup"
          element={
            <ProtectedRoute>
              <CompanyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="service-store"
          element={
            <ProtectedRoute path="/service-store">
              <ServiceStore />
            </ProtectedRoute>
          }
        />
        <Route
          path="service-store/*"
          element={
            <ProtectedRoute path="/service-store">
              <ServiceStore />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/service-store"
          element={
            <ProtectedRoute path="/client/service-store">
              <ServiceStore />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/service-store/*"
          element={
            <ProtectedRoute path="/client/service-store">
              <ServiceStore />
            </ProtectedRoute>
          }
        />
        {allMenus.map((menu) => {
          let Component;

          if (menu.path === "/admin/command-center") {
            Component = <AdminCommandCenter />;
          } else if (menu.path === "/client/command-center") {
            Component = <ClientCommandCenter />;
          } else if (menu.path === "/admin/users") {
            Component = <UserManagement />;
          } else if (menu.path === "/admin/menus") {
            Component = <MenuManagement />;
          } else if (
            menu.path === "/clients" ||
            menu.path === "/admin/clients" ||
            menu.path === "/admin/client-management"
          ) {
            Component = <ClientManagement />;
          } else if (
            menu.path === "/service-store" ||
            menu.path === "/client/service-store" ||
            menu.path.startsWith("/service-store/") ||
            menu.path.startsWith("/client/service-store/")
          ) {
            Component = <ServiceStore />;
          } else if (
            menu.path === "/client/company-profile" ||
            menu.path === "/company-profile"
          ) {
            Component = <CompanyProfile />;
          } else if (menu.path === "/admin/company-profile") {
            Component = <AdminCompanyProfiles />;
          } else if (menu.path === "/admin/service-requests") {
            Component = <AdminServiceRequests />;
          } else if (menu.path === "/admin/workforce") {
            Component = <AdminWorkforce />;
          } else if (menu.path === "/client/track-requests") {
            Component = <ClientTrackRequests />;
          } else if (menu.path === "/agent/tasks" || menu.path === "/agent/dashboard") {
            Component = <AgentTasks />;
          } else if (menu.path === "/client/wallet-credit") {
            Component = <WalletCredit />;
          } else {
            Component = <MenuPlaceholder />;
          }

          return (
            <Route
              key={menu.id}
              path={menu.path}
              element={
                <ProtectedRoute path={menu.path}>
                  {Component}
                </ProtectedRoute>
              }
            />
          );
        })}

        <Route path="account/reset-password" element={<AccountResetPassword />} />
        <Route path="*" element={<Navigate to="/unauthorized" />} />
      </Route>
    </Routes>
  );
}
