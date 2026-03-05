import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

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

type GuardResult =
  | { allowed: true; token: string }
  | { allowed: false; message: string; clearSession: boolean };

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

let lastGuardToastKey = "";

const evaluateLocalGuard = (allowedRoles: string[]): GuardResult => {
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      allowed: false,
      message: "Please login to continue.",
      clearSession: false,
    };
  }

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return {
      allowed: false,
      message: "Session expired. Please login again.",
      clearSession: true,
    };
  }

  const storedUser = parseStoredUser(localStorage.getItem("user"));
  const role = String(storedUser?.userType || payload.userType || "").trim().toLowerCase();

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      allowed: false,
      message: "You are not authorized to access this page.",
      clearSession: false,
    };
  }

  return { allowed: true, token };
};

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const location = useLocation();
  const normalizedAllowedRoles = useMemo(
    () => allowedRoles.map((role) => String(role).trim().toLowerCase()),
    [allowedRoles],
  );
  const [isChecking, setIsChecking] = useState(true);
  const [denyMessage, setDenyMessage] = useState<string>("");

  useEffect(() => {
    let isActive = true;

    const deny = (message: string, shouldClear: boolean) => {
      if (shouldClear) {
        clearSession();
      }
      if (!isActive) return;
      setDenyMessage(message);
      setIsChecking(false);
    };

    const allow = () => {
      if (!isActive) return;
      setDenyMessage("");
      setIsChecking(false);
    };

    const verify = async () => {
      const localGuard = evaluateLocalGuard(normalizedAllowedRoles);
      if (!localGuard.allowed) {
        deny(localGuard.message, localGuard.clearSession);
        return;
      }

      // For admin routes, confirm access with server-validated middleware.
      const needsAdminServerValidation = normalizedAllowedRoles.includes("admin");
      if (!needsAdminServerValidation) {
        allow();
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/admin/total-students"), {
          headers: {
            Authorization: `Bearer ${localGuard.token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            deny("Admin login required to access this page.", true);
            return;
          }
          deny("Unable to verify admin session. Please login again.", true);
          return;
        }

        allow();
      } catch {
        deny("Unable to verify admin session. Please login again.", true);
      }
    };

    setIsChecking(true);
    void verify();

    return () => {
      isActive = false;
    };
  }, [location.pathname, normalizedAllowedRoles]);

  useEffect(() => {
    if (isChecking || !denyMessage) return;
    const toastKey = `${location.pathname}|${denyMessage}`;
    if (toastKey === lastGuardToastKey) return;
    lastGuardToastKey = toastKey;
    toast.error(denyMessage);
  }, [denyMessage, isChecking, location.pathname]);

  if (isChecking) {
    return null;
  }

  if (denyMessage) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
