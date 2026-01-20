// config/psn.js
const { exchangeNpssoForCode, exchangeCodeForAccessToken } = require("psn-api");
const fetch = require("node-fetch");
const { Buffer } = require("buffer");

// Cache implementation
let serviceAuthCache = null;

const NPSSO = process.env.PSN_NPSSO;

/**
 * Retrieves a valid PSN Access Token (cached or fresh).
 */
async function getServiceAuth() {
  // Return cached token if still valid (with 60s buffer)
  if (serviceAuthCache && Date.now() < serviceAuthCache.expiresAt) {
    return serviceAuthCache;
  }

  if (!NPSSO) throw new Error("Missing PSN_NPSSO in environment variables.");

  console.log("🔄 Refreshing PSN Service Token...");
  const code = await exchangeNpssoForCode(NPSSO);
  const tokenData = await exchangeCodeForAccessToken(code);

  // Decode Account ID from JWT safely
  let accountId = null;
  try {
    const parts = tokenData.accessToken.split(".");
    if (parts.length === 3) {
      const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString("utf8"));
      accountId = payload.account_id || payload.accountId;
    }
  } catch (e) {
    console.warn("⚠️ Could not decode JWT payload:", e.message);
  }

  // Fallback to token response ID
  accountId = accountId || tokenData.accountId || tokenData.user_id;

  const expiresIn = Number(tokenData.expiresIn || 0);
  const expiresAt = Date.now() + Math.max(expiresIn, 60) * 1000;

  serviceAuthCache = {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresIn,
    tokenType: tokenData.tokenType || "Bearer",
    accountId,
    expiresAt,
  };

  console.log("✅ Token Refreshed. Account ID:", accountId);
  return serviceAuthCache;
}

/**
 * Fetch wrapper that handles 401 retries automatically.
 */
async function fetchWithAutoRefresh(url, customHeaders = {}) {
  let auth = await getServiceAuth();

  const makeHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    "Accept-Language": "en-US",
    "User-Agent": "Mozilla/5.0",
    ...customHeaders,
  });

  try {
    return await fetchWithFallback(url, makeHeaders(auth.accessToken));
  } catch (err) {
    const msg = String(err.message || "");
    if (
      msg.includes("Expired token") ||
      msg.includes("AccessDenied") ||
      msg.includes("401")
    ) {
      console.warn("🔑 Token expired during fetch. Retrying...");
      serviceAuthCache = null; // Clear cache
      auth = await getServiceAuth(); // Force refresh
      return await fetchWithFallback(url, makeHeaders(auth.accessToken));
    }
    throw err;
  }
}

/**
 * Internal helper to handle legacy fallback URLs (npServiceName=trophy).
 */
async function fetchWithFallback(url, headers) {
  let response = await fetch(url, { headers });

  // Legacy fallback for 404s on specific endpoints
  if (!response.ok && response.status === 404 && !url.includes("npServiceName=trophy")) {
    console.log("⚠️ 404 encountered, retrying with legacy param...");
    const sep = url.includes("?") ? "&" : "?";
    response = await fetch(`${url}${sep}npServiceName=trophy`, { headers });
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

module.exports = { getServiceAuth, fetchWithAutoRefresh, fetchWithFallback };
