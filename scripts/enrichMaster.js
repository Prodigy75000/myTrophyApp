// scripts/enrichMaster.js
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getTitleTrophies,
} = require("psn-api");

dotenv.config();

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

// 🟢 FIX: Use __dirname to safely resolve paths from any folder
const INPUT_FILE = path.join(process.cwd(), "data", "master_games.json");

const OUTPUT_FILE = path.join(process.cwd(), "data", "master_enriched.json");

// 🟢 STRATEGY: We write shovelware to a totally separate file immediately

const SHOVELWARE_FILE = path.join(process.cwd(), "data", "master_shovelware.json");

const DELAY_MS = 1500;

// Helper: Prioritize modern platforms, but fallback to legacy
function getPrimeVersion(versions) {
  if (!versions || versions.length === 0) return null;
  const priority = ["PS5", "PS4", "PS3", "PSVITA", "PSP"];

  for (const plat of priority) {
    const found = versions.find((v) => v.platform === plat && v.npCommunicationId);
    if (found) return found;
  }
  return versions[0];
}

async function authenticate() {
  console.log("🔑 Authenticating with PSN...");
  const npsso = process.env.NPSSO;
  if (!npsso) throw new Error("Missing NPSSO in .env");
  const code = await exchangeNpssoForCode(npsso);
  return await exchangeCodeForAccessToken(code);
}

async function runEnrichment() {
  if (!fs.existsSync(INPUT_FILE))
    return console.error("❌ No Input File found at:", INPUT_FILE);

  const allGames = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

  // Load existing progress
  let enrichedMap = new Map();
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE));
      existing.forEach((g) => enrichedMap.set(g.canonicalId, g));
    } catch (e) {}
  }

  // Load existing shovelware
  let shovelwareList = [];
  if (fs.existsSync(SHOVELWARE_FILE)) {
    try {
      shovelwareList = JSON.parse(fs.readFileSync(SHOVELWARE_FILE));
    } catch (e) {}
  }

  let token = await authenticate();
  let tokenTime = Date.now();
  let processedCount = 0;

  console.log(`🚀 Starting enrichment for ${allGames.length} games...`);

  for (const game of allGames) {
    const cid = game.canonicalId;

    // 1. Shovelware Check
    if (game.tags && game.tags.includes("shovelware")) {
      if (!shovelwareList.some((s) => s.canonicalId === cid)) {
        shovelwareList.push(game);
      }
      continue;
    }

    // 2. Already Done Check
    if (enrichedMap.has(cid)) continue;

    // 3. Token Refresh Check (Every 50 mins)
    if (Date.now() - tokenTime > 1000 * 60 * 50) {
      console.log("⏳ Token expiring... refreshing...");
      token = await authenticate();
      tokenTime = Date.now();
    }

    // 4. Select Best Version
    const primeVersion = getPrimeVersion(game.linkedVersions);

    if (!primeVersion) {
      console.warn(`⚠️ No valid versions for ${game.displayName}`);
      continue;
    }

    // 🟢 FIX: Determine correct service ('trophy' for legacy, 'trophy2' for modern)
    const isLegacy = ["PS3", "PSVITA", "PSP"].includes(primeVersion.platform);
    const serviceName = isLegacy ? "trophy" : "trophy2";

    try {
      const trophySet = await getTitleTrophies(
        token,
        primeVersion.npCommunicationId,
        "all",
        { npServiceName: serviceName }
      );

      // 🟢 FIX: Safety check (trophySet.trophies || []) prevents the map error
      const safeTrophies = trophySet.trophies || [];

      const enrichedGame = {
        ...game,
        iconUrl: trophySet.trophyTitleIconUrl || game.art?.square,
        trophies: safeTrophies.map((t) => ({
          id: t.trophyId,
          name: t.trophyName,
          detail: t.trophyDetail,
          iconUrl: t.trophyIconUrl,
          type: t.trophyType,
          hidden: t.hiddenFlag || t.trophyHidden, // Handle varying API field names
          groupId: t.trophyGroupId,
        })),
        enrichedAt: new Date().toISOString(),
      };

      enrichedMap.set(cid, enrichedGame);
      processedCount++;
      console.log(
        `✅ [${processedCount}] Enriched (${primeVersion.platform}): ${game.displayName}`
      );

      if (processedCount % 10 === 0) {
        saveFiles(enrichedMap, shovelwareList);
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (e) {
      console.error(
        `❌ FAILED ${game.displayName} [${primeVersion.platform}]: ${e.message}`
      );
    }
  }

  saveFiles(enrichedMap, shovelwareList);
  console.log("🎉 DONE!");
}

function saveFiles(map, shovelList) {
  const sorted = Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2));
  fs.writeFileSync(SHOVELWARE_FILE, JSON.stringify(shovelList, null, 2));
}

runEnrichment();
