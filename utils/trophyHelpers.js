// utils/trophyHelpers.js

/**
 * Merges static trophy definitions with user progress data.
 * Handles the "PS4 Sparse Data" issue.
 */
function mergeTrophies(definitions, progress) {
  const progressMap = new Map();
  for (const p of progress) progressMap.set(p.trophyId, p);

  return definitions.map((def) => {
    const userP = progressMap.get(def.trophyId);

    // Prioritize User object, fallback to Definition
    const target =
      userP?.trophyProgressTargetValue ?? def?.trophyProgressTargetValue ?? null;

    // Logic fix: If value is missing but target exists, default to "0" (0% progress)
    const value = userP?.trophyProgressValue ?? (target ? "0" : null);

    return {
      ...def,
      earned: userP?.earned ?? false,
      earnedDateTime: userP?.earnedDateTime ?? null,
      trophyEarnedRate: userP?.trophyEarnedRate ?? def.trophyEarnedRate ?? null,
      trophyProgressValue: value,
      trophyProgressTargetValue: target,
      trophyProgressRate: userP?.trophyProgressRate ?? null,
    };
  });
}

/**
 * Enhances the Trophy Title list with high-res artwork from the Game List API.
 * Supports both PS5 (PPSA) and PS4 (CUSA) titles.
 */
function enrichTitlesWithArtwork(trophyTitles, gameList) {
  const artMapById = new Map();
  const artMapByName = new Map();

  const normalize = (str) => (str ? str.toLowerCase().replace(/[^\w\d]/g, "") : "");

  // 1. Build Lookup Maps
  for (const game of gameList) {
    const validPlatform =
      game.titleId &&
      (game.titleId.startsWith("PPSA") || game.titleId.startsWith("CUSA"));
    if (!validPlatform) continue;

    const masterArt = game.concept?.media?.images?.find(
      (img) => img.type === "MASTER"
    )?.url;
    if (!masterArt) continue;

    if (game.titleId) artMapById.set(game.titleId, masterArt);
    if (game.concept?.titleIds) {
      game.concept.titleIds.forEach((id) => artMapById.set(id, masterArt));
    }
    if (game.name) {
      artMapByName.set(normalize(game.name), masterArt);
    }
  }

  // 2. Merge Artwork
  let matchCount = 0;
  const results = trophyTitles.map((t) => {
    let art = t.npTitleId ? artMapById.get(t.npTitleId) : null;

    if (!art && t.trophyTitleName) {
      art = artMapByName.get(normalize(t.trophyTitleName));
    }

    if (art) matchCount++;

    return {
      ...t,
      gameArtUrl: art || t.trophyTitleIconUrl, // Fallback to icon if no art found
    };
  });

  console.log(`🎨 Artwork Matched: ${matchCount} / ${trophyTitles.length}`);
  return results;
}

module.exports = { mergeTrophies, enrichTitlesWithArtwork };
