import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./auth-context";
import { getDashboardSession } from "../services/authService";

function readStoredValue(key, fallback) {
  const value = localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredValue("user", null));
  const [menus, setMenus] = useState(() => readStoredValue("menus", []));
  const [onboarding, setOnboarding] = useState(() =>
    readStoredValue("onboarding", null)
  );

  const login = useCallback((data) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("menus", JSON.stringify(data.menus));
    localStorage.setItem("onboarding", JSON.stringify(data.onboarding || null));

    setUser(data.user);
    setMenus(data.menus);
    setOnboarding(data.onboarding || null);
  }, []);

  const updateOnboarding = useCallback((data) => {
    localStorage.setItem("onboarding", JSON.stringify(data || null));
    setOnboarding(data || null);
  }, []);

  const refreshSession = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      return null;
    }

    const session = await getDashboardSession();

    if (session?.user) {
      localStorage.setItem("user", JSON.stringify(session.user));
      setUser(session.user);
    }

    if (session?.menus) {
      localStorage.setItem("menus", JSON.stringify(session.menus));
      setMenus(session.menus);
    }

    localStorage.setItem("onboarding", JSON.stringify(session?.onboarding || null));
    setOnboarding(session?.onboarding || null);

    return session;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    setMenus([]);
    setOnboarding(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      return;
    }

    refreshSession().catch(() => {
      // Ignore refresh failures here; the request interceptor and protected routes handle expired sessions.
    });
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      menus,
      onboarding,
      login,
      logout,
      updateOnboarding,
      refreshSession
    }),
    [user, menus, onboarding, login, logout, updateOnboarding, refreshSession]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
