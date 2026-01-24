// scripts/seedMaster.js
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api");
const fetch = require("node-fetch");

// Load Environment Variables
dotenv.config();

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

const SEED_USERS = ["PowerPyx"];

// Use process.cwd() to fix the directory path issue
const OUTPUT_FILE = path.join(process.cwd(), "data", "raw_master_db.json");

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function authenticate() {
  console.log("🔑 Authenticating with PSN...");
  const npsso = process.env.PSN_NPSSO;
  if (!npsso) throw new Error("Missing PSN_NPSSO in .env");

  // Exchange NPSSO for Access Token
  const code = await exchangeNpssoForCode(npsso);
  const token = await exchangeCodeForAccessToken(code);

  console.log("✅ Authenticated!");
  // 🚨 CRITICAL FIX: Return the FULL OBJECT, not just the string
  return token;
}

async function fetchWithRetry(url, token, retries = 3) {
  try {
    const res = await fetch(url, {
      headers: {
        // 🚨 DEBUG: If token is undefined, this throws 401
        Authorization: `Bearer ${token}`,
        "Accept-Language": "en-US",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("⏳ Rate limited... waiting 5s");
        await sleep(5000);
        return fetchWithRetry(url, token, retries - 1);
      }
      // Throw error to be caught by caller
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (e) {
    if (retries > 0) {
      await sleep(2000);
      return fetchWithRetry(url, token, retries - 1);
    }
    throw e;
  }
}

async function getAccountId(username, tokenObj) {
  try {
    console.log(`   🔎 Scouting user: ${username}...`);

    // 1. Get Profile
    const profile = await getProfileFromUserName(tokenObj, username);

    // 2. THE "PUBLIC" CHECK
    // If level is 0 or missing, the user is Private (or blocking API access)
    const level = profile.profile?.trophySummary?.level || 0;

    if (level === 0) {
      console.warn(`   ⛔ SKIPPING: ${username} has a private profile (Level 0).`);
      return null;
    }

    console.log(`   ✅ Valid Donor found! Level ${level}`);

    // 3. Return the Account ID
    return profile.accountId || profile.profile?.accountId || profile.id;
  } catch (e) {
    console.error(`   ❌ User not found or API error: ${e.message}`);
    return null;
  }
}

async function fetchAllPages(baseUrl, key, tokenStr) {
  let allItems = [];
  let offset = 0;
  const limit = 200;

  // 🚨 DEBUG CHECK
  if (!tokenStr || typeof tokenStr !== "string") {
    console.error("❌ ERROR: fetchAllPages received invalid token:", tokenStr);
    return [];
  }

  while (true) {
    const url = `${baseUrl}?limit=${limit}&offset=${offset}`;

    try {
      const data = await fetchWithRetry(url, tokenStr);
      const page = data[key] || [];
      allItems.push(...page);

      if (page.length < limit) break;
      offset += limit;
      await sleep(500);
    } catch (e) {
      console.error(`❌ Fetch Failed for ${key}:`, e.message);
      break; // Stop loop on error
    }
  }
  return allItems;
}

// ---------------------------------------------------------------------------
// MAIN CRAWLER LOGIC
// ---------------------------------------------------------------------------

async function runSeed() {
  const tokenObj = await authenticate();

  // 1. Extract String for manual fetches
  const accessTokenStr = tokenObj.accessToken;

  console.log("ℹ️ Token Check:", accessTokenStr ? "Valid String" : "UNDEFINED");

  const masterGameMap = new Map();

  // Load existing data
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log("📂 Loading existing database...");
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE));
      existing.forEach((g) => masterGameMap.set(g.npCommunicationId, g));
    } catch (e) {
      console.warn("⚠️ Could not read existing file, starting fresh.");
    }
  }

  for (const username of SEED_USERS) {
    console.log(`\n📡 Scanning User: ${username}...`);

    // 2. Pass OBJECT to getAccountId
    const accountId = await getAccountId(username, tokenObj);

    if (!accountId) {
      console.warn(`⚠️ Skipping ${username} (No Account ID)`);
      continue;
    }

    console.log(`   Account ID: ${accountId}`);

    // 3. Pass STRING to fetchAllPages
    const trophyUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const trophyTitles = await fetchAllPages(trophyUrl, "trophyTitles", accessTokenStr);
    console.log(`   🏆 Found ${trophyTitles.length} trophy lists`);

    const gameListUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;
    const gameList = await fetchAllPages(gameListUrl, "titles", accessTokenStr);
    console.log(`   🎮 Found ${gameList.length} library titles`);

    // Create Art Lookup Map
    const artMap = new Map();
    gameList.forEach((g) => {
      const masterImg = g.concept?.media?.images?.find((i) => i.type === "MASTER")?.url;
      if (masterImg && g.titleId) artMap.set(g.titleId, masterImg);
    });

    let newCount = 0;
    for (const t of trophyTitles) {
      if (!masterGameMap.has(t.npCommunicationId)) {
        const art = artMap.get(t.npTitleId) || t.trophyTitleIconUrl;

        const entry = {
          npCommunicationId: t.npCommunicationId,
          titleName: t.trophyTitleName,
          platform: t.trophyTitlePlatform,
          npTitleId: t.npTitleId,
          serviceName: t.trophyTitleServiceName,
          iconUrl: t.trophyTitleIconUrl,
          masterArtUrl: art,
          trophyCount: t.definedTrophies,
          developerId: null,
          sagaId: null,
          meta: {
            missables: null,
            glitched: null,
            online: null,
          },
        };

        masterGameMap.set(t.npCommunicationId, entry);
        newCount++;
      }
    }
    console.log(`   ➕ Added ${newCount} new unique games.`);
  }

  // Save to File
  const sortedGames = Array.from(masterGameMap.values()).sort((a, b) =>
    a.titleName.localeCompare(b.titleName)
  );

  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedGames, null, 2));
  console.log(`\n✅ Database Updated! Total Games: ${sortedGames.length}`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
}

runSeed();
