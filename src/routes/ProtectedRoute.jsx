import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function checkAccess(menus, path) {
  const stack = [...menus];

  while (stack.length) {
    const item = stack.pop();

    if (item.path === path) return true;

    if (item.children) {
      stack.push(...item.children);
    }
  }

  return false;
}

export default function ProtectedRoute({ children, path }) {
  const { user, menus, onboarding } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!path) return children;

  if (path === "/client/company-profile-setup") {
    return children;
  }

  const hasAccess = checkAccess(menus, path);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
