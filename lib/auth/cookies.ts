export const ACCESS_TOKEN_COOKIE = "bd_access_token";
export const REFRESH_TOKEN_COOKIE = "bd_refresh_token";

/** Access token: short-lived, read by proxy.ts on every gated request. */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

/** Refresh token: long-lived, httpOnly, only ever sent to /api/auth/refresh. */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
