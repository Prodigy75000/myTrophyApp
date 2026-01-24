// scripts/enrichMaster.js
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getTitleTrophies, // <-- Public Data (No Rarity)
  getUserTrophiesEarnedForTitle, // <-- User Data (Has Rarity)
} = require("psn-api");

dotenv.config();

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

const INPUT_FILE = path.join(process.cwd(), "data", "master_games.json");
const OUTPUT_FILE = path.join(process.cwd(), "data", "master_enriched.json");
const SHOVELWARE_FILE = path.join(process.cwd(), "data", "shovelware_dump.json");

// Rate Limit: 1.5s is safe for mixed calls
const DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function authenticate() {
  console.log("🔑 Authenticating with PSN...");
  const npsso = process.env.PSN_NPSSO;
  if (!npsso) throw new Error("Missing PSN_NPSSO in .env");

  const code = await exchangeNpssoForCode(npsso);
  const token = await exchangeCodeForAccessToken(code);
  return token;
}

// ---------------------------------------------------------------------------
// MAIN LOGIC
// ---------------------------------------------------------------------------

async function runEnrichment() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    return;
  }

  const allGames = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`📚 Loaded ${allGames.length} canonical games.`);

  // Resume capability
  let enrichedMap = new Map();
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE));
      existing.forEach((g) => enrichedMap.set(g.canonicalId, g));
      console.log(`🔄 Resuming... ${enrichedMap.size} games already enriched.`);
    } catch (e) {
      console.warn("⚠️ Output file corrupted or empty. Starting fresh.");
    }
  }

  const shovelwareList = [];
  const token = await authenticate();

  let processedCount = 0;
  let skippedCount = 0;

  for (const game of allGames) {
    const cid = game.canonicalId;

    // Filter 1: Shovelware
    if (game.tags && game.tags.includes("shovelware")) {
      shovelwareList.push(game);
      continue;
    }

    // Filter 2: Already Done
    if (enrichedMap.has(cid)) {
      continue;
    }

    // Filter 3: PS5 Only (for now)
    const primeVersion = game.linkedVersions.find((v) => v.platform === "PS5");
    if (!primeVersion) {
      skippedCount++;
      continue;
    }

    // --- THE HYBRID FETCH ---
    try {
      let trophySet;
      let hasRarity = false;

      try {
        // STRATEGY A: Try to get User Data (With Rarity)
        // This only works if YOU own/played the game.
        trophySet = await getUserTrophiesEarnedForTitle(
          token,
          "me",
          primeVersion.npCommunicationId,
          "all",
          { npServiceName: "trophy2" }
        );
        hasRarity = true;
        console.log(
          `💎 Fetched (Owned): [${primeVersion.npCommunicationId}] ${game.displayName}`
        );
      } catch (userError) {
        // STRATEGY B: Fallback to Public Data (No Rarity)
        // This works for ANY game.
        if (
          userError.message.includes("Resource not found") ||
          userError.response?.status === 404
        ) {
          trophySet = await getTitleTrophies(
            token,
            primeVersion.npCommunicationId,
            "all",
            { npServiceName: "trophy2" }
          );
          console.log(
            `📦 Fetched (Public): [${primeVersion.npCommunicationId}] ${game.displayName}`
          );
        } else {
          // If it's a real error (like 429 Too Many Requests), re-throw it
          throw userError;
        }
      }

      // --- BUILD OBJECT ---
      const enrichedGame = {
        ...game,
        iconUrl: trophySet.trophyTitleIconUrl || game.art?.square,

        trophies: trophySet.trophies.map((t) => ({
          id: t.trophyId,
          name: t.trophyName,
          detail: t.trophyDetail,
          iconUrl: t.trophyIconUrl,
          type: t.trophyType,
          hidden: t.trophyHidden,
          groupId: t.trophyGroupId,
          // If hasRarity is true, use the value. Otherwise null.
          earnedRate: hasRarity ? t.trophyEarnedRate : null,
        })),

        enrichedAt: new Date().toISOString(),
      };

      enrichedMap.set(cid, enrichedGame);
      processedCount++;

      // Save every 10 games
      if (processedCount % 10 === 0) {
        saveProgress(enrichedMap, shovelwareList);
      }

      await sleep(DELAY_MS);
    } catch (e) {
      console.error(
        `❌ FAILED [${primeVersion.npCommunicationId}] ${game.displayName}:`,
        e.message
      );
    }
  }

  // Final Save
  saveProgress(enrichedMap, shovelwareList);
  console.log("\n✅ Enrichment Complete!");
  console.log(`   ✨ Enriched: ${processedCount}`);
  console.log(`   ⏭️ Skipped: ${skippedCount}`);
}

function saveProgress(map, shovelList) {
  const sorted = Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2));
  if (shovelList.length > 0) {
    fs.writeFileSync(SHOVELWARE_FILE, JSON.stringify(shovelList, null, 2));
  }
}

runEnrichment();
