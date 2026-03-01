import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type JwtPayload = {
  exp?: number;
  userType?: string;
};

type StoredUser = {
  userType?: string;
};

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

const parseStoredUser = (raw: string | null): StoredUser | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredUser;
  } catch {
    return null;
  }
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    clearSession();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const storedUser = parseStoredUser(localStorage.getItem("user"));
  const role = String(storedUser?.userType || payload.userType || "").trim().toLowerCase();

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
