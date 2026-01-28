// scripts/seedAddon.js
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromUserName,
} = require("psn-api");
const fetch = require("node-fetch");

dotenv.config();

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

// 🔥 PUT YOUR "TREND SETTER" USERS HERE
const SEED_USERS = [
  "Roughdawg4", // Top tier hunter, usually early on big games
  "Pyx", // (Check both variations if PowerPyx fails)

  // --- RECENT HIT SPECIALISTS (Found in Wukong/Stellar Blade leaderboards) ---
  "boomber85851", // Black Myth: Wukong Guide Writer
  "Beauynn", // Early Wukong achiever
  "lSalty_Playerl", // Recent Wukong player
  "MarkC_97-TTV", // Recent Wukong player
  "SweetJohnnyCage", // Guide maker, often has Nintendo/PS5 hits early

  // --- FF7 REBIRTH & RPG GRINDERS ---
  "Angelalex242", // Active FF7 Rebirth player
  "ResidentGear31", // Active FF7 Rebirth player
  "Matty0289", // Active FF7 Rebirth player

  // --- FORUM HUNTERS (Discussing unreleased/new games) ---
  "Mr_Bandicoot93", // Discussing Yakuza/FF7 updates
  "Velar__", // Playing "2XKO" (Riot's fighting game)
  "DrZero_1983", // "Post Your Newest Game" thread active user
  "Vault-TecPhantom", // Cult of the Lamb DLC player

  // --- VARIETY STREAMERS (Good for "Normal" games) ---
  "PlatinumBro", // YouTuber, covers variety plats
  "BushidoCypher", // Often plays fighting games/action titles
  "PS5Trophies", // (Try "PS4Trophies" if this fails)
];

const MAIN_DB_FILE = path.join(process.cwd(), "data", "raw_master_db.json");
const ADDON_FILE = path.join(process.cwd(), "data", "raw_master_addon.json");

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function authenticate() {
  console.log("🔑 Authenticating...");
  const npsso = process.env.NPSSO;
  if (!npsso) throw new Error("Missing NPSSO");
  const code = await exchangeNpssoForCode(npsso);
  return await exchangeCodeForAccessToken(code);
}

async function fetchWithRetry(url, token, retries = 3) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Mozilla/5.0" },
    });
    if (res.status === 429) {
      console.warn("⏳ Rate limit... waiting 5s");
      await sleep(5000);
      return fetchWithRetry(url, token, retries - 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    const profile = await getProfileFromUserName(tokenObj, username);
    return profile.accountId || profile.profile?.accountId || profile.id;
  } catch (e) {
    console.warn(`❌ User ${username} not found/private.`);
    return null;
  }
}

async function fetchAllPages(baseUrl, key, tokenStr) {
  let allItems = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    try {
      const data = await fetchWithRetry(
        `${baseUrl}?limit=${limit}&offset=${offset}`,
        tokenStr
      );
      const page = data[key] || [];
      allItems.push(...page);
      if (page.length < limit) break;
      offset += limit;
      await sleep(500);
    } catch (e) {
      break;
    }
  }
  return allItems;
}

// ---------------------------------------------------------------------------
// MAIN LOGIC
// ---------------------------------------------------------------------------

async function runAddonSeed() {
  // 1. Load Known Games (Blocklist)
  const knownIds = new Set();
  if (fs.existsSync(MAIN_DB_FILE)) {
    const mainDb = JSON.parse(fs.readFileSync(MAIN_DB_FILE));
    mainDb.forEach((g) => knownIds.add(g.npCommunicationId));
    console.log(`🛡️ Loaded ${knownIds.size} existing games to ignore.`);
  }

  // 2. Load Existing Addon Data (Optional: Append to previous addon run)
  let newDiscoveriesMap = new Map();
  if (fs.existsSync(ADDON_FILE)) {
    try {
      const existingAddon = JSON.parse(fs.readFileSync(ADDON_FILE));
      existingAddon.forEach((g) => newDiscoveriesMap.set(g.npCommunicationId, g));
      console.log(`📂 Loaded ${existingAddon.length} existing addon entries.`);
    } catch (e) {}
  }

  const tokenObj = await authenticate();
  const tokenStr = tokenObj.accessToken;

  for (const username of SEED_USERS) {
    console.log(`\n📡 Scanning: ${username}`);
    const accountId = await getAccountId(username, tokenObj);
    if (!accountId) continue;

    // Fetch Trophies
    const trophyUrl = `https://m.np.playstation.com/api/trophy/v1/users/${accountId}/trophyTitles`;
    const trophyTitles = await fetchAllPages(trophyUrl, "trophyTitles", tokenStr);

    // Fetch Game List (for Art)
    const gameListUrl = `https://m.np.playstation.com/api/gamelist/v2/users/${accountId}/titles`;
    const gameList = await fetchAllPages(gameListUrl, "titles", tokenStr);

    // Map Art
    const artMap = new Map();
    gameList.forEach((g) => {
      const img = g.concept?.media?.images?.find((i) => i.type === "MASTER")?.url;
      if (img && g.titleId) artMap.set(g.titleId, img);
    });

    let userNewCount = 0;
    for (const t of trophyTitles) {
      // THE CRITICAL CHECK:
      // If it is NOT in Main DB AND NOT in current Addon List
      if (
        !knownIds.has(t.npCommunicationId) &&
        !newDiscoveriesMap.has(t.npCommunicationId)
      ) {
        const entry = {
          npCommunicationId: t.npCommunicationId,
          titleName: t.trophyTitleName,
          platform: t.trophyTitlePlatform,
          npTitleId: t.npTitleId,
          serviceName: t.trophyTitleServiceName,
          iconUrl: t.trophyTitleIconUrl,
          masterArtUrl: artMap.get(t.npTitleId) || t.trophyTitleIconUrl,
          trophyCount: t.definedTrophies,
          // ... other fields null
        };

        newDiscoveriesMap.set(t.npCommunicationId, entry);
        userNewCount++;
        console.log(`   🔥 NEW: ${t.trophyTitleName}`);
      }
    }
    console.log(`   Found ${userNewCount} new titles from this user.`);
  }

  // 3. Save Addon File
  const sortedAddon = Array.from(newDiscoveriesMap.values()).sort((a, b) =>
    a.titleName.localeCompare(b.titleName)
  );

  if (sortedAddon.length > 0) {
    fs.writeFileSync(ADDON_FILE, JSON.stringify(sortedAddon, null, 2));
    console.log(`\n✅ Saved ${sortedAddon.length} NEW games to: ${ADDON_FILE}`);
  } else {
    console.log("\n⚠️ No new games found.");
  }
}

runAddonSeed();
