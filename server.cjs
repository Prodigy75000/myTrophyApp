// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const { Buffer } = require("buffer");

const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NPSSO = process.env.PSN_NPSSO;
if (!NPSSO) {
  console.error("❌ Missing env var PSN_NPSSO. Add it to your .env file.");
  process.exit(1);
}

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

// 1) Bearer token extraction for routes where frontend sends token
function requireBearer(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return null;
  }
  return authHeader.split(" ")[1];
}

// 2) Service auth (NPSSO -> code -> access token) cached
let serviceAuthCache = null;
// shape: { accessToken, refreshToken, expiresAt, expiresIn, tokenType, accountId }

async function getServiceAuth() {
  if (serviceAuthCache && Date.now() < serviceAuthCache.expiresAt) {
    return serviceAuthCache;
  }

  const code = await exchangeNpssoForCode(NPSSO);
  const tokenData = await exchangeCodeForAccessToken(code);

  // Try decode JWT payload if it looks like a JWT (3 dot-separated parts)
  let decodedPayload = null;
  try {
    const parts = String(tokenData.accessToken).split(".");
    if (parts.length === 3) {
      const base64Payload = parts[1];
      const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
      decodedPayload = JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
    }
  } catch (e) {
    // not fatal — token may not be a JWT
    console.warn("⚠️ accessToken not decodable as JWT:", e.message);
  }

  const accountId =
    decodedPayload?.account_id ||
    decodedPayload?.accountId ||
    tokenData.accountId ||
    tokenData.user_id ||
    null;

  const expiresIn = Number(tokenData.expiresIn || 0);
  const expiresAt = Date.now() + Math.max(expiresIn, 60) * 1000; // minimum 60s safety

  serviceAuthCache = {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresIn,
    tokenType: tokenData.tokenType || "Bearer",
    accountId,
    expiresAt,
  };

  console.log("✅ Service access token refreshed for:", accountId);
  return serviceAuthCache;
}

// 3) Fetch helper with legacy fallback for trophy endpoints
async function fetchWithFallback(url, headers) {
  let response = await fetch(url, { headers });

  // Legacy fallback: try npServiceName=trophy if 404
  if (!response.ok && response.status === 404) {
    const sep = url.includes("?") ? "&" : "?";
    response = await fetch(`${url}${sep}npServiceName=trophy`, { headers });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}

// 4) Merge trophy definitions + user progress efficiently
function mergeTrophies(definitions, progress) {
  const progressById = new Map();
  for (const p of progress) progressById.set(p.trophyId, p);

  return definitions.map((def) => {
    const user = progressById.get(def.trophyId);
    return {
      ...def,
      earned: user?.earned ?? false,
      earnedDateTime: user?.earnedDateTime ?? null,
    };
  });
}

/**
 * ------------------------------------------------------------
 * Routes
 * ------------------------------------------------------------
 */

// ---------------- LOGIN ----------------
// Returns a cached service token so your frontend can use it.
// This avoids burning NPSSO exchanges every time you press "login".
app.get("/api/login", async (req, res) => {
  try {
    const auth = await getServiceAuth();
    res.json({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresIn: auth.expiresIn,
      accountId: auth.accountId,
      tokenType: auth.tokenType,
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({
      error: "Failed to retrieve PSN access token",
      details: err.message,
    });
  }
});

// ---------------- PROFILE ----------------
app.get("/api/profile/:username", async (req, res) => {
  try {
    const auth = await getServiceAuth();
    const profile = await getProfileFromUserName(auth.accessToken, req.params.username);
    res.json(profile);
  } catch (err) {
    console.error("❌ Profile error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TROPHIES (LIBRARY) ----------------
app.get("/api/trophies/:accountId", async (req, res) => {
  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId } = req.params;
    const baseUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    const allTitles = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
      const json = await fetchWithFallback(url, headers);

      const page = json.trophyTitles ?? [];
      allTitles.push(...page);

      if (page.length < limit) break;
      offset += limit;
    }

    // 🔎 Log high-value identity signals
    for (const t of allTitles) {
      console.log("[TITLE OBSERVED]", {
        npwr: t.npCommunicationId,
        name: t.trophyTitleName,
        platforms: t.trophyTitlePlatform,
        service: t.npServiceName,
        version: t.trophySetVersion,
      });
    }

    res.json({
      totalItemCount: allTitles.length,
      trophyTitles: allTitles,
    });
  } catch (err) {
    console.error("❌ Library error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GAME TROPHIES ----------------
app.get("/api/trophies/:accountId/:npCommunicationId", async (req, res) => {
  const { gameName, platform } = req.query;

  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId, npCommunicationId } = req.params;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    // A) USER PROGRESS
    const progressUrl =
      `https://m.np.playstation.com/api/trophy/v1/users/${accountId}` +
      `/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`;

    const progressJson = await fetchWithFallback(progressUrl, headers);
    const progress = progressJson.trophies ?? [];

    // B) DEFINITIONS
    const defUrl =
      `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}` +
      `/trophyGroups/all/trophies`;

    const defJson = await fetchWithFallback(defUrl, headers);
    const definitions = defJson.trophies ?? [];

    // C) MERGE
    const merged = mergeTrophies(definitions, progress);
    const finalData = merged.length > 0 ? merged : progress;

    console.log("[GAME OBSERVED]", { npwr: npCommunicationId, gameName, platform });

    return res.json({
      meta: {
        npCommunicationId,
        gameName: gameName ?? null,
        platform: platform ?? null,
      },
      trophies: finalData,
    });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// -------------- REFRESH ROUTE ----------------
app.post("/api/trophies/refresh", async (req, res) => {
  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId, games } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      return res.json({ updatedAt: Date.now(), games: [] });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    const results = [];

    for (const game of games) {
      const { npwr, gameName, platform } = game;
      console.log("[DELTA REFRESH]", { npwr, gameName, platform });

      try {
        const progressUrl =
          `https://m.np.playstation.com/api/trophy/v1/users/${accountId}` +
          `/npCommunicationIds/${npwr}/trophyGroups/all/trophies`;

        const progressJson = await fetchWithFallback(progressUrl, headers);
        const progress = progressJson.trophies ?? [];

        const defUrl =
          `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npwr}` +
          `/trophyGroups/all/trophies`;

        const defJson = await fetchWithFallback(defUrl, headers);
        const definitions = defJson.trophies ?? [];

        const merged = mergeTrophies(definitions, progress);
        const trophies = merged.length > 0 ? merged : progress;

        results.push({ npwr, gameName, platform, trophies });
      } catch (e) {
        console.warn("⚠️ Delta refresh failed for", npwr, e.message);
      }
    }

    res.json({
      updatedAt: Date.now(),
      games: results,
    });
  } catch (err) {
    console.error("🔥 DELTA REFRESH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, "0.0.0.0", () => console.log("Trophy Hub proxy running on port 4000"));
