// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const {
  getServiceAuth,
  fetchWithAutoRefresh,
  fetchWithFallback,
} = require("./config/psn");
const { mergeTrophies, enrichTitlesWithArtwork } = require("./utils/trophyHelpers");
const { getProfileFromUserName } = require("psn-api");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------------------

function requireBearer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }
  req.accessToken = authHeader.split(" ")[1];
  next();
}

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

// 1. LOGIN (Bootstrap)
app.get("/api/login", async (req, res) => {
  try {
    const auth = await getServiceAuth();
    res.json(auth);
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ error: "PSN Login Failed", details: err.message });
  }
});

// 2. USER PROFILE
app.get("/api/user/profile/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    const url = `https://m.np.playstation.com/api/userProfile/v1/internal/users/${accountId}/profiles`;
    const json = await fetchWithAutoRefresh(url);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. TROPHY SUMMARY (Level & Progress)
app.get("/api/user/summary/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    const url = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophySummary`;
    const json = await fetchWithAutoRefresh(url);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GAME LIST (With Artwork)
app.get("/api/trophies/:accountId", requireBearer, async (req, res) => {
  try {
    const { accountId } = req.params;
    console.log(`⏳ Fetching Games for ${accountId}...`);

    const trophyUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const gameListUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;

    // Helper for pagination
    const fetchAll = async (baseUrl, key) => {
      let items = [];
      let offset = 0;
      const limit = 200;
      while (true) {
        const json = await fetchWithAutoRefresh(
          `${baseUrl}?limit=${limit}&offset=${offset}`
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

// 5. GAME DETAILS (Trophies + Groups)
app.get(
  "/api/trophies/:accountId/:npCommunicationId",
  requireBearer,
  async (req, res) => {
    const { accountId, npCommunicationId } = req.params;
    const { gameName, platform } = req.query;

    try {
      const baseUrl = `https://m.np.playstation.com/api/trophy/v1`;

      // Parallel Fetch
      const [progressData, defData, groupData] = await Promise.all([
        fetchWithAutoRefresh(
          `${baseUrl}/users/${accountId}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies?limit=1000`
        ).catch(() => ({ trophies: [] })),
        fetchWithAutoRefresh(
          `${baseUrl}/npCommunicationIds/${npCommunicationId}/trophyGroups/all/trophies`
        ).catch(() => ({ trophies: [] })),
        fetchWithAutoRefresh(
          `${baseUrl}/npCommunicationIds/${npCommunicationId}/trophyGroups`
        ).catch(() => ({ trophyGroups: [] })),
      ]);

      const progress = progressData.trophies || [];
      const definitions = defData.trophies || [];

      // Smart Merge Strategy
      let finalTrophies = [];
      const isRichProgress = progress.length > 0 && !!progress[0].trophyName; // PS5 has names in progress

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

// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
