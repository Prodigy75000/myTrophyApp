// scripts/buildMaster.js
const fs = require("fs");
const path = require("path");

// Import your massive lists
const {
  BLOCKED_KEYWORDS,
  SAGA_KEYWORDS,
  GENRE_MAP,
  SAGA_TO_GENRE,
  SHOVELWARE_KEYWORDS,
} = require("./dictionaries");

// PATHS
const RAW_FILE = path.join(process.cwd(), "data", "raw_master_db.json");
const OVERRIDE_FILE = path.join(process.cwd(), "data", "curated_overrides.json");
const MASTER_FILE = path.join(process.cwd(), "data", "master_games.json");

// ---------------------------------------------------------------------------
// HELPERS (Keep existing)
// ---------------------------------------------------------------------------
function detectGenre(title, sagaId) {
  if (sagaId && SAGA_TO_GENRE[sagaId]) return SAGA_TO_GENRE[sagaId];
  const lower = title.toLowerCase();
  for (const [genre, keywords] of Object.entries(GENRE_MAP)) {
    if (keywords.some((k) => lower.includes(k))) return genre;
  }
  return null;
}

function isLikelyShovelware(title, trophyCount, sagaId) {
  if (sagaId) return false;
  const lowerTitle = title.toLowerCase();
  if (SHOVELWARE_KEYWORDS.some((kw) => lowerTitle.includes(kw.toLowerCase())))
    return true;
  if (trophyCount.platinum > 0) {
    if (trophyCount.bronze === 0 && trophyCount.gold > 5) return true;
    if (trophyCount.bronze > 0 && trophyCount.gold / trophyCount.bronze > 3) return true;
  }
  return false;
}

function cleanTitleForID(title) {
  return title
    .toLowerCase()
    .replace(/\(ps4\)/g, "")
    .replace(/\(ps5\)/g, "")
    .replace(/\(na\)/g, "")
    .replace(/\(eu\)/g, "")
    .replace(/\(jp\)/g, "")
    .replace(/\(asia\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/definitive edition/g, "")
    .replace(/game of the year/g, "")
    .replace(/goty/g, "")
    .replace(/complete edition/g, "")
    .replace(/director's cut/g, "")
    .replace(/digital deluxe/g, "")
    .replace(/premium edition/g, "")
    .replace(/special edition/g, "")
    .replace(/anniversary edition/g, "")
    .replace(/remastered/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// MAIN BUILD LOGIC
// ---------------------------------------------------------------------------
function runBuild() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error("❌ No raw data found.");
    return;
  }
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));

  let overrides = {};
  if (fs.existsSync(OVERRIDE_FILE)) {
    try {
      const content = fs.readFileSync(OVERRIDE_FILE, "utf-8").trim();
      if (content) overrides = JSON.parse(content);
    } catch (e) {
      console.warn("⚠️ Could not parse curated_overrides.json. Skipping it.");
    }
  }

  const clusters = new Map();

  // --- PASS 1: CLUSTER & MERGE ---
  rawData.forEach((entry) => {
    if (BLOCKED_KEYWORDS.some((k) => entry.titleName.includes(k))) return;

    const cleanKey = cleanTitleForID(entry.titleName);
    const canonicalId = `game_${cleanKey}`;
    const manualData = overrides[canonicalId] || {}; // Get manual data for this game

    // 1. Saga
    let sagaId = manualData.sagaId || null;
    if (!sagaId) {
      for (const [keyword, id] of Object.entries(SAGA_KEYWORDS)) {
        if (entry.titleName.toLowerCase().includes(keyword)) {
          sagaId = id;
          break;
        }
      }
    }

    // 2. Genre
    let genre = manualData.genre || detectGenre(entry.titleName, sagaId);

    // 3. Shovelware
    let isShovelware = false;
    if (manualData.isShovelware !== undefined) {
      isShovelware = manualData.isShovelware;
    } else {
      isShovelware = isLikelyShovelware(entry.titleName, entry.trophyCount, sagaId);
    }

    // 4. REGION LOOKUP (The New Part)
    // Check if overrides has a region map for this specific NPID
    const regionCode = manualData.regions
      ? manualData.regions[entry.npCommunicationId]
      : null;

    if (clusters.has(cleanKey)) {
      const existing = clusters.get(cleanKey);

      // Add version with optional region
      existing.linkedVersions.push({
        platform: entry.platform,
        npCommunicationId: entry.npCommunicationId,
        region: regionCode, // <--- Injected here
      });

      // Definitive Version Logic (Keep best art/stats)
      const currentIsPS5 = existing.linkedVersions.some((v) => v.platform === "PS5");
      const newIsPS5 = entry.platform === "PS5";
      const currentTotal = existing.stats.totalTrophies;
      const newTotal =
        entry.trophyCount.platinum +
        entry.trophyCount.gold +
        entry.trophyCount.silver +
        entry.trophyCount.bronze;

      let upgrade = false;
      if (newIsPS5 && !currentIsPS5) upgrade = true;
      if (newTotal > currentTotal && (!currentIsPS5 || newIsPS5)) upgrade = true;

      if (upgrade) {
        if (entry.masterArtUrl) existing.art.square = entry.masterArtUrl;
        existing.stats = {
          totalTrophies: newTotal,
          hasPlatinum: entry.trophyCount.platinum > 0,
        };
      }
      if (!existing.genre && genre) existing.genre = genre;
    } else {
      clusters.set(cleanKey, {
        canonicalId: canonicalId,
        displayName: entry.titleName,
        genre: genre,
        sagaId: sagaId,
        developerId: manualData.developerId || null,
        tags: isShovelware ? ["shovelware"] : [],
        art: { square: entry.masterArtUrl || entry.iconUrl },
        stats: {
          totalTrophies:
            entry.trophyCount.platinum +
            entry.trophyCount.gold +
            entry.trophyCount.silver +
            entry.trophyCount.bronze,
          hasPlatinum: entry.trophyCount.platinum > 0,
        },
        meta: {
          difficulty: manualData.difficulty || null,
          hoursToPlatinum: manualData.hoursToPlatinum || null,
          missables: manualData.missables || null,
          glitched: manualData.glitched || null,
          online: manualData.online || null,
        },
        linkedVersions: [
          {
            platform: entry.platform,
            npCommunicationId: entry.npCommunicationId,
            region: regionCode, // <--- Injected here
          },
        ],
      });
    }
  });

  const masterList = Array.from(clusters.values());

  // --- PASS 2: AUTO-SAGA DETECTION ---
  const prefixMap = new Map();
  masterList.forEach((game) => {
    if (game.sagaId) return;
    if (game.tags.includes("shovelware")) return;

    const words = game.displayName.replace(/[^a-zA-Z0-9 ]/g, "").split(" ");
    if (words.length >= 2) {
      const root = words.slice(0, 2).join(" ").toLowerCase();
      if (!prefixMap.has(root)) prefixMap.set(root, []);
      prefixMap.get(root).push(game);
    }
  });

  let autoSagaCount = 0;
  prefixMap.forEach((games, root) => {
    if (games.length >= 2) {
      const newSagaId = `saga_auto_${root.replace(/ /g, "_")}`;
      games.forEach((g) => {
        g.sagaId = newSagaId;
        const commonGenre = games.find((x) => x.genre)?.genre;
        if (commonGenre) g.genre = commonGenre;
      });
      autoSagaCount++;
    }
  });

  // WRITE
  fs.writeFileSync(MASTER_FILE, JSON.stringify(masterList, null, 2));

  console.log(`\n✅ Build Complete!`);
  console.log(
    `   📉 Condensed: ${rawData.length} -> ${masterList.length} Canonical Games`
  );
  console.log(`   🤖 Auto-Sagas Created: ${autoSagaCount}`);
  console.log(`   📁 Saved to: ${MASTER_FILE}`);
}

runBuild();
