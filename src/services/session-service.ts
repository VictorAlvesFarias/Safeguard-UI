import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { env } from "../environment";

/*
 * Session = short access token (JWT, 1 h) + refresh token (30 days, renewed on every use).
 * Both live in cookies so the Safeguard browser extension can use the same session. Before a
 * request with an expiring token, and after a 401, the refresh token is traded at
 * /refresh-token for a new pair; only when that fails is the user logged out.
 */

const SESSION_ROUTES = ["/sign-in", "/refresh-token", "/sign-out"];
/** Refresh this long before the access token expires. */
const EXPIRY_MARGIN_MS = 60 * 1000;

function isSessionRoute(url?: string) {
  return SESSION_ROUTES.some(route => (url ?? "").endsWith(route));
}

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="))).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function needsRefresh(token: string | undefined) {
  if (!token) return true;
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && Date.now() >= expiresAt - EXPIRY_MARGIN_MS;
}

/** Writes the sign-in / refresh response to cookies, kept until the refresh token expires. */
function saveSession(data: Record<string, any>) {
  const refreshExpiry = new Date(data.refreshTokenExpirationDateTime);
  const expires = isNaN(refreshExpiry.getTime())
    ? new Date(Date.now() + (Number(data.expirationTokenTime) || 3600) * 1000)
    : refreshExpiry;

  Object.keys(data).forEach(key => {
    const value = typeof data[key] == "object" ? JSON.stringify(data[key]) : data[key];
    Cookies.set(key, value, { expires });
  });
}

function clearSession() {
  Object.keys(Cookies.get()).forEach(key => Cookies.remove(key));
}

let refreshing: Promise<string | null> | null = null;
let onSessionExpired: () => void = () => { };

/** New access token, or null when the session is over. One refresh at a time. */
function refreshSession(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) return null;

      try {
        const response = await axios.post(`${env}/refresh-token`, { refreshToken });
        const data = response.data.data;
        saveSession(data);
        return data.token as string;
      } catch (error) {
        // 401: the refresh token is no longer valid. Anything else (API down): keep the session.
        if ((error as AxiosError).response?.status === 401) {
          clearSession();
          onSessionExpired();
        }
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }

  return refreshing;
}

async function signOut() {
  const refreshToken = Cookies.get("refreshToken");
  clearSession();
  if (refreshToken) {
    await axios.post(`${env}/sign-out`, { refreshToken }).catch(() => undefined);
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _sessionRetried?: boolean };

let installed = false;

/** Installs the axios interceptors (once; later calls only update the expiry callback). */
function installSessionInterceptors(expired: () => void) {
  onSessionExpired = expired;
  if (installed) return;
  installed = true;

  axios.interceptors.request.use(async config => {
    if (isSessionRoute(config.url) || !Cookies.get("refreshToken")) return config;

    if (needsRefresh(Cookies.get("token"))) {
      const token = await refreshSession();
      if (token) config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  });

  axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && config && !config._sessionRetried && !isSessionRoute(config.url) && Cookies.get("refreshToken")) {
      config._sessionRetried = true;
      const token = await refreshSession();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
        return axios.request(config);
      }
    }

    return Promise.reject(error);
  });
}

export {
  installSessionInterceptors,
  refreshSession,
  saveSession,
  signOut
}
