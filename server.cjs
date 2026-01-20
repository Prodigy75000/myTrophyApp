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

// ---------------- GAME TROPHIES (Detail) ----------------
app.get("/api/trophies/:accountId/:npCommunicationId", async (req, res) => {
  const { gameName, platform } = req.query;

  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId, npCommunicationId } = req.params;

    // 1. Define URLs
    const progressUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?limit=1000`;
    const defUrl = `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`;
    const groupsUrl = `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}/trophyGroups`;

    // 2. Parallel Fetch
    const [progressData, defData, groupData] = await Promise.all([
      fetchWithAutoRefresh(progressUrl).catch((e) => ({ trophies: [] })),
      fetchWithAutoRefresh(defUrl).catch((e) => ({ trophies: [] })),
      fetchWithAutoRefresh(groupsUrl).catch((e) => ({ trophyGroups: [] })),
    ]);

    const progress = progressData.trophies || [];
    const definitions = defData.trophies || [];
    const groups = groupData.trophyGroups || [];

    let finalTrophies = [];

    // 3. SMART MERGE STRATEGY
    const isRichProgress = progress.length > 0 && !!progress[0].trophyName;

    if (isRichProgress) {
      // 🟢 CASE A: PS5 (Rich Data)
      finalTrophies = progress.map((p) => ({
        ...p,
        earned: !!p.earnedDateTime,
      }));
      console.log(`[PS5 DETECTED] Using rich progress for ${npCommunicationId}`);
    } else {
      // 🔵 CASE B: PS4/Sparse (Merge Required)
      if (definitions.length === 0) {
        console.warn(`[WARN] No definitions found for sparse game ${npCommunicationId}`);
        finalTrophies = progress;
      } else {
        const progressMap = new Map();
        for (const p of progress) progressMap.set(p.trophyId, p);

        // 🕵️ DEBUG: Log RAW keys from Sony for the first item
        if (progress.length > 0) {
          console.log("[DEBUG] Raw Progress Item Keys:", Object.keys(progress[0]));
        }
        const rawProgressItem = progress.find(
          (p) => p.trophyProgressValue || p.trophyProgressTargetValue
        );
        if (rawProgressItem) {
          console.log(
            `[DEBUG] Found Raw Progress on Trophy ID ${rawProgressItem.trophyId}:`,
            `${rawProgressItem.trophyProgressValue} / ${rawProgressItem.trophyProgressTargetValue}`
          );
        } else {
          console.log("[DEBUG] No progress values found in User Progress array.");
        }
        finalTrophies = definitions.map((def) => {
          const userP = progressMap.get(def.trophyId);

          // 1. Get Target: Try User object first, fallback to Definition (The Missing Link!)
          const target =
            userP?.trophyProgressTargetValue ?? def?.trophyProgressTargetValue ?? null;

          // 2. Get Value: Try User object first.
          //    If missing but we have a target, default to "0" (Fixes "null" value for 0% progress)
          const value = userP?.trophyProgressValue ?? (target ? "0" : null);

          return {
            ...def,
            earned: userP?.earned ?? false,
            earnedDateTime: userP?.earnedDateTime ?? null,
            trophyEarnedRate: userP?.trophyEarnedRate ?? def.trophyEarnedRate ?? null,

            // 👇 Use our calculated variables
            trophyProgressValue: value,
            trophyProgressTargetValue: target,
            trophyProgressRate: userP?.trophyProgressRate ?? null,
          };
        });
        console.log(`[PS4/SPARSE] Merged definitions for ${npCommunicationId}`);
      }
    }

    // 🕵️ FINAL DEBUG CHECK (After merge is done)
    const sampleWithProgress = finalTrophies.find((t) => t.trophyProgressTargetValue);
    console.log(`[DEBUG] Final Check - Has Progress Data? ${!!sampleWithProgress}`);
    if (sampleWithProgress) {
      console.log(
        `[DEBUG] Example: ${sampleWithProgress.trophyName}: ${sampleWithProgress.trophyProgressValue} / ${sampleWithProgress.trophyProgressTargetValue}`
      );
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
// ---------------- TROPHIES (STRICT: PS5 STORE ART vs PS4 TROPHY ICONS) ----------------
app.get("/api/trophies/:accountId", async (req, res) => {
  try {
    const accessToken = requireBearer(req, res);
    if (!accessToken) return;

    const { accountId } = req.params;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    // 1. Fetch Data
    const trophyBaseUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const gameListBaseUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;

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

    console.log("⏳ Fetching Trophy List & Game List...");
    const [trophyTitles, gameList] = await Promise.all([
      fetchPaginated(trophyBaseUrl, "trophyTitles"),
      fetchPaginated(gameListBaseUrl, "titles"),
    ]);

    // 2. Build Art Map
    const artMapById = new Map();
    const artMapByName = new Map();

    const normalize = (str) => {
      if (!str) return "";
      return str.toLowerCase().replace(/[^\w\d]/g, "");
    };

    for (const game of gameList) {
      // 🛡️ UPDATED RULE: Allow PS5 (PPSA) AND PS4 (CUSA)
      // This enables Square Store Art for PS4 games that have it (like Outlast).
      const validPlatform =
        game.titleId &&
        (game.titleId.startsWith("PPSA") || // PS5
          game.titleId.startsWith("CUSA")); // PS4

      if (!validPlatform) continue;

      const media = game.concept?.media?.images || [];
      const master = media.find((img) => img.type === "MASTER")?.url;

      // Use MASTER (Square) if available.
      if (!master) continue;

      // Map it by ID and Name
      if (game.titleId) artMapById.set(game.titleId, master);
      if (game.concept?.titleIds) {
        game.concept.titleIds.forEach((id) => artMapById.set(id, master));
      }
      if (game.name) {
        artMapByName.set(normalize(game.name), master);
      }
    }

    // 3. Merge
    let matchCount = 0;
    const enrichedTitles = trophyTitles.map((t) => {
      let storeArt = null;

      if (t.npTitleId) {
        storeArt = artMapById.get(t.npTitleId);
      }
      if (!storeArt && t.trophyTitleName) {
        const cleanName = normalize(t.trophyTitleName);
        storeArt = artMapByName.get(cleanName);
      }

      if (storeArt) matchCount++;

      return {
        ...t,
        trophyTitleIconUrl: t.trophyTitleIconUrl,
        // Now works for PS4 too if storeArt was found!
        gameArtUrl: storeArt || t.trophyTitleIconUrl,
      };
    });

    console.log(
      `🎨 Artwork Matched (PS5 + PS4): ${matchCount} / ${trophyTitles.length} games`
    );

    res.json({
      totalItemCount: enrichedTitles.length,
      trophyTitles: enrichedTitles,
    });
  } catch (err) {
    console.error("❌ Library error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.listen(4000, "0.0.0.0", () => console.log("Trophy Hub proxy running on port 4000"));
