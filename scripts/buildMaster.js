// scripts/buildMaster.js
const fs = require("fs");
const path = require("path");

const {
  BLOCKED_KEYWORDS,
  SAGA_KEYWORDS,
  GENRE_MAP,
  SAGA_TO_GENRE,
  SHOVELWARE_KEYWORDS,
} = require("./dictionaries");

const RAW_FILE = path.join(process.cwd(), "data", "raw_master_db.json");
const OVERRIDE_FILE = path.join(process.cwd(), "data", "curated_overrides.json");
const MASTER_FILE = path.join(process.cwd(), "data", "master_games.json");

// ... (Helpers remain the same) ...
function detectGenre(title, sagaId) {
  /* ... */
}
function isLikelyShovelware(title, trophyCount, sagaId) {
  /* ... */
}
function cleanTitleForID(title) {
  /* ... */
}

function runBuild() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error("❌ No raw data found.");
    return;
  }
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));

  // 1. LOAD OVERRIDES
  let overrides = {};
  if (fs.existsSync(OVERRIDE_FILE)) {
    try {
      const content = fs.readFileSync(OVERRIDE_FILE, "utf-8").trim();
      if (content) overrides = JSON.parse(content);
    } catch (e) {
      console.warn("⚠️ Could not parse curated_overrides.json. Skipping.");
    }
  }

  // 2. LOAD PREVIOUS STATE (For persistence)
  const previousTags = new Map();
  if (fs.existsSync(MASTER_FILE)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(MASTER_FILE, "utf-8"));
      oldData.forEach((game) => {
        if (game.tags && game.tags.length > 0) {
          previousTags.set(game.canonicalId, game.tags);
        }
      });
      console.log(`🧠 Loaded ${previousTags.size} games with existing tags.`);
    } catch (e) {
      console.warn("⚠️ Could not read previous master_games.json. Persistence skipped.");
    }
  }

  const clusters = new Map();

  rawData.forEach((entry) => {
    if (BLOCKED_KEYWORDS.some((k) => entry.titleName.includes(k))) return;

    const cleanKey = cleanTitleForID(entry.titleName);
    const canonicalId = `game_${cleanKey}`;
    const manualData = overrides[canonicalId] || {};

    // ... Saga & Genre Logic (Keep existing) ...

    // --- SHOVELWARE LOGIC (UPDATED) ---
    let isShovelware = false;

    // Priority 1: Explicit Override
    if (manualData.isShovelware !== undefined) {
      isShovelware = manualData.isShovelware;
    }
    // Priority 2: Persistence (Did we tag it manually in the JSON before?)
    else if (previousTags.has(canonicalId)) {
      const oldTags = previousTags.get(canonicalId);
      if (oldTags.includes("shovelware")) {
        isShovelware = true;
      } else {
        // If it existed before but DIDN'T have the tag, should we re-scan?
        // User request: "If i updated manually [added it], script will never remove it"
        // We only enforce persistence of PRESENCE, not absence.
        // If we want to strictly persist, we'd skip auto-detect here.
        // But let's assume we fallback to auto-detect if not flagged.
        isShovelware = isLikelyShovelware(entry.titleName, entry.trophyCount, null);
      }
    }
    // Priority 3: Auto-Detection
    else {
      isShovelware = isLikelyShovelware(entry.titleName, entry.trophyCount, null);
    }

    const regionCode = manualData.regions
      ? manualData.regions[entry.npCommunicationId]
      : null;

    if (clusters.has(cleanKey)) {
      const existing = clusters.get(cleanKey);
      existing.linkedVersions.push({
        platform: entry.platform,
        npCommunicationId: entry.npCommunicationId,
        region: regionCode,
      });

      // ... Definitive Version Logic ...
      // (Ensure tags are merged if needed, or keep existing)
      if (isShovelware && !existing.tags.includes("shovelware")) {
        existing.tags.push("shovelware");
      }
    } else {
      clusters.set(cleanKey, {
        canonicalId: canonicalId,
        displayName: entry.titleName,
        // ...
        tags: isShovelware ? ["shovelware"] : [],
        // ...
        linkedVersions: [
          {
            platform: entry.platform,
            npCommunicationId: entry.npCommunicationId,
            region: regionCode,
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
