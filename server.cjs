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
function isExpiredTokenError(err) {
  if (!err) return false;

  const msg = String(err.message || "");
  return (
    msg.includes("Expired token") || msg.includes("expired") || msg.includes("22411164")
  );
}
async function fetchWithAutoRefresh(url) {
  let auth = await getServiceAuth();

  const headers = {
    Authorization: `Bearer ${auth.accessToken}`,
    "Accept-Language": "en-US",
    "User-Agent": "Mozilla/5.0",
  };

  try {
    return await fetchWithFallback(url, headers);
  } catch (err) {
    if (isExpiredTokenError(err)) {
      console.warn("🔑 Access token expired — refreshing");

      // force refresh
      serviceAuthCache = null;
      auth = await getServiceAuth();

      const retryHeaders = {
        Authorization: `Bearer ${auth.accessToken}`,
        "Accept-Language": "en-US",
        "User-Agent": "Mozilla/5.0",
      };

      return await fetchWithFallback(url, retryHeaders);
    }

    throw err;
  }
}

// 3) Fetch helper with legacy fallback for trophy endpoints
async function fetchWithFallback(url, headers) {
  let response = await fetch(url, { headers });

  // Legacy fallback: try npServiceName=trophy if 404
  if (!response.ok && response.status === 404) {
    // 🛡️ FIX: Only append if it's not already there!
    if (!url.includes("npServiceName=trophy")) {
      console.log("⚠️ 404 encountered, retrying with npServiceName=trophy...");
      const sep = url.includes("?") ? "&" : "?";
      response = await fetch(`${url}${sep}npServiceName=trophy`, { headers });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    // Don't crash the server, just throw so the caller can handle it (return [])
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
      // 👇 ADD THIS LINE to pass the rarity through
      trophyEarnedRate: user?.trophyEarnedRate ?? def?.trophyEarnedRate ?? null,
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

// ---------------- GAME TROPHIES ----------------
app.get("/api/trophies/:accountId/:npCommunicationId", async (req, res) => {
  const { gameName, platform } = req.query;

  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId, npCommunicationId } = req.params;

    // 1. Define URLs
    // A) User Progress (PS5 = Rich Data / PS4 = Sparse Data)
    const progressUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?limit=1000`;
    // B) Definitions (Critical for PS4, sometimes fails for PS5)
    const defUrl = `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`;
    // C) Groups (DLC Names)
    const groupsUrl = `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}/trophyGroups`;
    // 2. Parallel Fetch with ERROR HANDLING ON ALL
    const [progressData, defData, groupData] = await Promise.all([
      fetchWithAutoRefresh(progressUrl).catch((e) => ({ trophies: [] })),
      fetchWithAutoRefresh(defUrl).catch((e) => ({ trophies: [] })), // 👈 NOW ALLOWED TO FAIL (PS5 Fix)
      fetchWithAutoRefresh(groupsUrl).catch((e) => ({ trophyGroups: [] })),
    ]);

    const progress = progressData.trophies || [];
    const definitions = defData.trophies || [];
    const groups = groupData.trophyGroups || [];

    let finalTrophies = [];

    // 3. SMART MERGE STRATEGY
    // Check if 'progress' already has names (PS5 Games usually do)
    const isRichProgress = progress.length > 0 && !!progress[0].trophyName;

    if (isRichProgress) {
      // 🟢 CASE A: PS5 (Rich Data)
      // We don't need definitions, the user data has everything!
      finalTrophies = progress.map((p) => ({
        ...p,
        earned: !!p.earnedDateTime, // Ensure boolean exists
        // PS5 data usually has trophyGroupId, icon, detail, etc.
      }));
      console.log(`[PS5 DETECTED] Using rich progress for ${npCommunicationId}`);
    } else {
      // 🔵 CASE B: PS4 (Sparse Data)
      // We MUST merge with definitions because progress is missing names/icons
      if (definitions.length === 0) {
        console.warn(`[WARN] No definitions found for sparse game ${npCommunicationId}`);
        // If both failed, we return what we have (likely empty)
        finalTrophies = progress;
      } else {
        const progressMap = new Map();
        for (const p of progress) progressMap.set(p.trophyId, p);

        finalTrophies = definitions.map((def) => {
          const userP = progressMap.get(def.trophyId);
          return {
            ...def,
            earned: userP?.earned ?? false,
            earnedDateTime: userP?.earnedDateTime ?? null,
            trophyEarnedRate: userP?.trophyEarnedRate ?? def.trophyEarnedRate,
          };
        });
        console.log(`[PS4 DETECTED] Merged definitions for ${npCommunicationId}`);
      }
    }

    // 4. Return
    return res.json({
      meta: {
        npCommunicationId,
        gameName: gameName ?? null,
        platform: platform ?? null,
      },
      trophies: finalTrophies,
      groups: groups,
    });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
// ---------------- USER PROFILE (Avatar & OnlineID) ----------------
app.get("/api/user/profile/:accountId", async (req, res) => {
  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId } = req.params;

    // This official endpoint returns the avatar, onlineId, and aboutMe
    const url = `https://m.np.playstation.com/api/userProfile/v1/internal/users/${accountId}/profiles`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    const json = await fetchWithFallback(url, headers);
    res.json(json);
  } catch (err) {
    console.error("❌ Profile fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ---------------- TROPHY SUMMARY (Level & Progress) ----------------
app.get("/api/user/summary/:accountId", async (req, res) => {
  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId } = req.params;
    const url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophySummary`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    const json = await fetchWithFallback(url, headers);
    res.json(json);
  } catch (err) {
    console.error("❌ Summary fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ---------------- TROPHIES (LIBRARY + ART MERGE + HYBRID MATCH) ----------------
app.get("/api/trophies/:accountId", async (req, res) => {
  console.log("🚀 ROUTE HIT: /api/trophies/:accountId");

  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId } = req.params;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    // 1. Define URLs
    const trophyBaseUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const gameListBaseUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;

    // 2. Pagination Helper
    const fetchPaginated = async (baseUrl, key) => {
      const allItems = [];
      let offset = 0;
      const limit = 200;
      while (true) {
        const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
        const json = await fetchWithFallback(url, headers).catch((e) => ({}));
        const page = json[key] ?? [];
        allItems.push(...page);
        if (page.length < limit) break;
        offset += limit;
      }
      return allItems;
    };

    // 3. Fetch Both
    console.log("⏳ Fetching Trophy List & Game List...");
    const [trophyTitles, gameList] = await Promise.all([
      fetchPaginated(trophyBaseUrl, "trophyTitles"),
      fetchPaginated(gameListBaseUrl, "titles"),
    ]);
    console.log(`✅ Fetched: ${trophyTitles.length} Trophies | ${gameList.length} Games`);

    // 4. BUILD MAPS (The "Hybrid" Strategy)
    const artMapById = new Map();
    const artMapByName = new Map();

    // Helper to sanitize names (remove ™, ®, spaces, special chars, lowercase)
    const normalize = (str) => {
      if (!str) return "";
      return str.toLowerCase().replace(/[^\w\d]/g, ""); // "Tony Hawk's™ 1+2" -> "tonyhawks12"
    };

    for (const game of gameList) {
      // A. Extract Best Image
      // 🎯 FIX: Prioritize 'MASTER' (High-Res Square) instead of Cover Art (Wide/Landscape)
      // This prevents the "Zoomed In" cropping issue in square cards.
      let bestArt = game.imageUrl; // Default to standard square

      if (game.concept?.media?.images) {
        const master = game.concept.media.images.find((img) => img.type === "MASTER");
        // Fallback to 'icon0' if MASTER is missing, but MASTER is usually the best store art
        if (master) bestArt = master.url;
      }

      if (!bestArt) continue;

      // B. Map by ID (PPSA/CUSA)
      if (game.titleId) artMapById.set(game.titleId, bestArt);

      // Also map by concept IDs if available
      if (game.concept?.titleIds) {
        game.concept.titleIds.forEach((id) => artMapById.set(id, bestArt));
      }

      // C. Map by Name (Fallback)
      if (game.name) {
        artMapByName.set(normalize(game.name), bestArt);
      }
    }

    // 5. MERGE
    let matchCount = 0;
    const enrichedTitles = trophyTitles.map((t) => {
      let storeArt = null;

      // Attempt 1: ID Match (If trophy object has npTitleId)
      if (t.npTitleId) {
        storeArt = artMapById.get(t.npTitleId);
      }

      // Attempt 2: Name Match (If ID failed)
      if (!storeArt && t.trophyTitleName) {
        const cleanName = normalize(t.trophyTitleName);
        storeArt = artMapByName.get(cleanName);
      }

      if (storeArt) matchCount++;

      return {
        ...t,
        trophyTitleIconUrl: t.trophyTitleIconUrl,
        gameArtUrl: storeArt || t.trophyTitleIconUrl, // Store Art > Trophy Icon
      };
    });

    console.log(`🎨 Artwork Matched: ${matchCount} / ${trophyTitles.length} games`);

    res.json({
      totalItemCount: enrichedTitles.length,
      trophyTitles: enrichedTitles,
    });
  } catch (err) {
    console.error("🔥 ROUTE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.listen(4000, "0.0.0.0", () => console.log("Trophy Hub proxy running on port 4000"));
