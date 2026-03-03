const toStringValue = (value: unknown) => String(value || "").trim();

const normalizeBase = (value: string) => value.replace(/\/+$/, "");

const isLocalHost = () => {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

const envBase = normalizeBase(toStringValue((import.meta as any).env?.VITE_API_BASE_URL));
export const API_BASE = envBase || (isLocalHost() ? "http://localhost:5000" : "");

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
};
