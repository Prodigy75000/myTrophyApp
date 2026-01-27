// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Buffer } = require("buffer"); // 🟢 ADD THIS LINE
const {
  exchangeCodeForAccessToken,
  exchangeNpssoForCode, // Optional
} = require("psn-api");

dotenv.config();

const {
  getServiceAuth,
  fetchWithAutoRefresh, // Still used for generic bootstrap calls
  fetchWithFallback, // 🟢 Ensure this is imported
} = require("./config/psn");
const { mergeTrophies, enrichTitlesWithArtwork } = require("./utils/trophyHelpers");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// 🟢 ADD THIS BLOCK (The Doorbell)
app.use((req, res, next) => {
  console.log(`🔔 SERVER HIT: ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------------------

function requireBearer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    // 🟢 Save the token to the request object so routes can use it
    req.accessToken = authHeader.split(" ")[1];
  }
  // We allow proceeding even without a token (for Guest/Bootstrap mode),
  // but individual routes can decide to enforce it.
  next();
}

// 🟢 HELPER: Decides whether to use User Token or Server Bootstrap
// 🟢 UPDATED HELPER: Ties psn.js logic into User requests
async function fetchPSN(url, userToken) {
  if (userToken) {
    console.log("🔐 Using User Token...");

    // Construct headers manually for the user
    const headers = {
      Authorization: `Bearer ${userToken}`,
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US",
    };

    // 🟢 USE psn.js HELPER: This ensures PS3/Vita games work for users too!
    return await fetchWithFallback(url, headers);
  } else {
    // Fallback to Server Bootstrap (uses psn.js internal token)
    console.log("🌍 Using Server Bootstrap Token...");
    return await fetchWithAutoRefresh(url);
  }
}

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

// BOOTSTRAP ENDPOINT
app.get("/api/login", async (req, res) => {
  try {
    console.log("🌍 Guest Bootstrap initiated...");
    const auth = await getServiceAuth(); // Uses psn.js to get system token
    res.json(auth);
  } catch (err) {
    console.error("❌ Bootstrap Error:", err.message);
    res.status(500).json({ error: "PSN Login Failed", details: err.message });
  }
});

// 🟢 ROBUST NPSSO ROUTE
app.post("/api/auth/npsso", async (req, res) => {
  try {
    const { npsso } = req.body;
    if (!npsso) return res.status(400).json({ error: "NPSSO token required" });

    console.log("🔄 Exchanging NPSSO for Access Token...");

    // 1. Exchange NPSSO -> Access Code
    const accessCode = await exchangeNpssoForCode(npsso);

    // 2. Exchange Access Code -> Tokens
    // This returns: accessToken, expiresIn, idToken, refreshToken, scope, tokenType
    const tokenResponse = await exchangeCodeForAccessToken(accessCode);

    const accessToken = tokenResponse.accessToken;
    // 🟢 Prefer idToken for identity, fallback to accessToken
    const idToken = tokenResponse.idToken || accessToken;

    if (!accessToken) throw new Error("No access token returned");

    // 3. Decode Token to get Account ID
    // We try to decode the idToken because it ALWAYS has the 'sub' field
    const jwtPayload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString()
    );

    // 🟢 Debugging: Let's see what keys we actually have if this fails again
    if (!jwtPayload.sub) {
      console.log("⚠️ Token Payload Keys:", Object.keys(jwtPayload));
    }

    const accountId = jwtPayload.sub;

    console.log(`🔓 Decoded Account ID: ${accountId}`);

    if (!accountId) {
      throw new Error("Could not find Account ID in token");
    }

    // 4. Fetch Profile
    const profileRes = await fetch(
      `https://m.np.playstation.com/api/userProfile/v1/internal/users/${accountId}/profiles`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US",
        },
      }
    );

    if (!profileRes.ok) throw new Error("Failed to fetch user profile");

    const profileData = await profileRes.json();
    console.log(`✅ Logged in as: ${profileData.onlineId}`);

    res.json({
      accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresIn: tokenResponse.expiresIn,
      accountId,
      onlineId: profileData.onlineId,
      avatarUrl:
        profileData.avatars?.find((a) => a.size === "l")?.url ||
        profileData.avatars?.[0]?.url,
    });
  } catch (err) {
    console.error("❌ NPSSO Exchange Error:", err.message);
    res.status(500).json({ error: "Authentication Failed", details: err.message });
  }
});

// 2. USER PROFILE
app.get("/api/user/profile/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    const url = `https://m.np.playstation.com/api/userProfile/v1/internal/users/${accountId}/profiles`;

    // 🟢 FIX: Pass req.accessToken to helper
    const json = await fetchPSN(url, req.accessToken);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. TROPHY SUMMARY
app.get("/api/user/summary/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    const url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophySummary`;

    // 🟢 FIX: Pass req.accessToken
    const json = await fetchPSN(url, req.accessToken);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GAME LIST
app.get("/api/trophies/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    console.log(`⏳ Fetching Games for ${accountId}...`);

    const trophyUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const gameListUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;

    // 🟢 FIX: Updated pagination helper to use user token
    const fetchAll = async (baseUrl, key) => {
      let items = [];
      let offset = 0;
      const limit = 200;
      while (true) {
        // Pass req.accessToken here
        const json = await fetchPSN(
          `${baseUrl}?limit=${limit}&offset=${offset}`,
          req.accessToken
        ).catch(() => ({}));
        const page = json[key] || [];
        items.push(...page);
        if (page.length < limit) break;
        offset += limit;
      }
      return items;
    };

    const [trophyTitles, gameList] = await Promise.all([
      fetchAll(trophyUrl, "trophyTitles"),
      fetchAll(gameListUrl, "titles"),
    ]);

    const enriched = enrichTitlesWithArtwork(trophyTitles, gameList);
    res.json({ totalItemCount: enriched.length, trophyTitles: enriched });
  } catch (err) {
    console.error("❌ Game List Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. GAME DETAILS
app.get(
  "/api/trophies/:accountId/:npCommunicationId",
  requireBearer,
  async (req, res) => {
    const { accountId, npCommunicationId } = req.params;
    const { gameName, platform } = req.query;

    try {
      const baseUrl = `https://m.np.playstation.com/api/trophy/v1`;

      // 🟢 FIX: Use fetchPSN with user token for all calls
      const [progressData, defData, groupData] = await Promise.all([
        fetchPSN(
          `${baseUrl}/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?limit=1000`,
          req.accessToken
        ).catch(() => ({ trophies: [] })),

        fetchPSN(
          `${baseUrl}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`,
          req.accessToken
        ).catch(() => ({ trophies: [] })),

        fetchPSN(
          `${baseUrl}/npCommunicationIds/${npCommunicationId}/trophyGroups`,
          req.accessToken
        ).catch(() => ({ trophyGroups: [] })),
      ]);

      const progress = progressData.trophies || [];
      const definitions = defData.trophies || [];

      // Smart Merge Strategy
      let finalTrophies = [];
      const isRichProgress = progress.length > 0 && !!progress[0].trophyName;

      if (isRichProgress) {
        console.log(`[PS5] Using rich progress for ${npCommunicationId}`);
        finalTrophies = progress.map((p) => ({ ...p, earned: !!p.earnedDateTime }));
      } else {
        if (definitions.length === 0) {
          console.warn(`[WARN] Sparse data & no definitions for ${npCommunicationId}`);
          finalTrophies = progress;
        } else {
          console.log(`[PS4] Merging definitions for ${npCommunicationId}`);
          finalTrophies = mergeTrophies(definitions, progress);
        }
      }

      res.json({
        meta: { npCommunicationId, gameName, platform },
        trophies: finalTrophies,
        groups: groupData.trophyGroups || [],
      });
    } catch (err) {
      console.error("❌ Detail Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
