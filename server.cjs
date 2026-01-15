// server.js
const { Buffer } = require("buffer");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // ✅ force reliable DNS

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NPSSO = process.env.PSN_NPSSO;
let accessCache = null;
const trophyCache = new Map();
async function getAccessToken() {
  if (accessCache && Date.now() < accessCache.expiresAt) {
    return accessCache.token;
  }
  const code = await exchangeNpssoForCode(NPSSO);
  const tokens = await exchangeCodeForAccessToken(code);
  accessCache = {
    token: tokens.accessToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
  return accessCache.token;
}
// ---------------- LOGIN ----------------
app.get("/api/login", async (req, res) => {
  try {
    const authorization = await exchangeNpssoForCode(NPSSO);
    const tokenData = await exchangeCodeForAccessToken(authorization);

    let decodedPayload;
    try {
      const base64Payload = tokenData.accessToken.split(".")[1];
      const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
      decodedPayload = JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
    } catch (e) {
      console.error("⚠️ Failed to decode accessToken:", e.message);
    }

    const accountId =
      decodedPayload?.account_id ||
      decodedPayload?.accountId ||
      tokenData.accountId ||
      tokenData.user_id ||
      null;

    console.log("✅ PSN access token retrieved for:", accountId);
    res.json({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      accountId,
      tokenType: tokenData.tokenType || "Bearer",
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
    const accessToken = await getAccessToken();
    const profile = await getProfileFromUserName(accessToken, req.params.username);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TROPHIES (LIBRARY) ----------------
app.get("/api/trophies/:accountId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const accessToken = authHeader.split(" ")[1];
    const { accountId } = req.params;

    const baseUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;

    let allTitles = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `${baseUrl}?limit=${limit}&offset=${offset}`;

      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en-US",
        },
      });

      if (!r.ok) {
        const t = await r.text();
        return res.status(r.status).json({ error: t });
      }

      const json = await r.json();
      const page = json.trophyTitles ?? [];
      allTitles.push(...page);

      if (page.length < limit) break;
      offset += limit;
    }

    // 🔎 Log high-value identity signals
    allTitles.forEach((t) => {
      console.log("[TITLE OBSERVED]", {
        npwr: t.npCommunicationId,
        name: t.trophyTitleName,
        platforms: t.trophyTitlePlatform,
        service: t.npServiceName,
        version: t.trophySetVersion,
      });
    });

    res.json({
      totalItemCount: allTitles.length,
      trophyTitles: allTitles, // untouched
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// ---------------- GAME TROPHIES (MAX SIGNAL) ----------------
app.get("/api/trophies/:accountId/:npCommunicationId", async (req, res) => {
  const { gameName, platform } = req.query;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const accessToken = authHeader.split(" ")[1];
    const { accountId, npCommunicationId } = req.params;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    // Fetch helper with legacy fallback
    const fetchWithFallback = async (baseUrl) => {
      let response = await fetch(baseUrl, { headers });

      if (!response.ok && response.status === 404) {
        const sep = baseUrl.includes("?") ? "&" : "?";
        response = await fetch(`${baseUrl}${sep}npServiceName=trophy`, { headers });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      return response.json();
    };

    // A. USER PROGRESS
    const progressUrl =
      `https://m.np.playstation.com/api/trophy/v1/users/${accountId}` +
      `/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`;

    const progressJson = await fetchWithFallback(progressUrl);
    const progress = progressJson.trophies ?? [];

    // B. DEFINITIONS (also contains metadata)
    const defUrl =
      `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npCommunicationId}` +
      `/trophyGroups/all/trophies`;

    const defJson = await fetchWithFallback(defUrl);
    const definitions = defJson.trophies ?? [];

    // C. MERGE
    const merged = definitions.map((def) => {
      const user = progress.find((p) => p.trophyId === def.trophyId);
      return {
        ...def,
        earned: user?.earned ?? false,
        earnedDateTime: user?.earnedDateTime ?? null,
      };
    });

    const finalData = merged.length > 0 ? merged : progress;

    // D. META (first-party only)
    const trophyService = defJson?.npServiceName === "trophy2" ? "modern" : "legacy";

    console.log("[GAME OBSERVED]", {
      npwr: npCommunicationId,
      gameName,
      platform,
    });

    return res.json({
      meta: {
        npCommunicationId,
        gameName: gameName ?? null,
        platform: platform ?? null,
      },
      trophies: finalData,
    });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});
// -------------- REFRESH ROUTE ----------------
app.post("/api/trophies/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const accessToken = authHeader.split(" ")[1];
    const { accountId, games } = req.body;

    // games = [{ npwr, gameName, platform }]
    if (!Array.isArray(games) || games.length === 0) {
      return res.json({ updatedAt: Date.now(), games: [] });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en-US",
      "User-Agent": "Mozilla/5.0",
    };

    const fetchWithFallback = async (baseUrl) => {
      let response = await fetch(baseUrl, { headers });

      if (!response.ok && response.status === 404) {
        const sep = baseUrl.includes("?") ? "&" : "?";
        response = await fetch(`${baseUrl}${sep}npServiceName=trophy`, { headers });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      return response.json();
    };

    const results = [];

    for (const game of games) {
      const { npwr, gameName, platform } = game;

      console.log("[DELTA REFRESH]", { npwr, gameName, platform });

      try {
        const progressUrl =
          `https://m.np.playstation.com/api/trophy/v1/users/${accountId}` +
          `/npCommunicationIds/${npwr}/trophyGroups/all/trophies`;

        const progressJson = await fetchWithFallback(progressUrl);
        const progress = progressJson.trophies ?? [];

        const defUrl =
          `https://m.np.playstation.com/api/trophy/v1/npCommunicationIds/${npwr}` +
          `/trophyGroups/all/trophies`;

        const defJson = await fetchWithFallback(defUrl);
        const definitions = defJson.trophies ?? [];

        const merged = definitions.map((def) => {
          const user = progress.find((p) => p.trophyId === def.trophyId);
          return {
            ...def,
            earned: user?.earned ?? false,
            earnedDateTime: user?.earnedDateTime ?? null,
          };
        });

        const trophies = merged.length > 0 ? merged : progress;

        results.push({
          npwr,
          gameName,
          platform,
          trophies,
        });
      } catch (e) {
        console.warn("⚠️ Delta refresh failed for", npwr, e.message);
      }
    }

    res.json({
      updatedAt: Date.now(),
      games: results,
    });
  } catch (err) {
    console.error("🔥 DELTA REFRESH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, "0.0.0.0", () => console.log("Trophy Hub proxy running on port 4000"));
