// utils/trophyHelpers.js

/**
 * Merges static trophy definitions with user progress data.
 */
function mergeTrophies(definitions, progress) {
  const progressMap = new Map();
  for (const p of progress) progressMap.set(p.trophyId, p);

  return definitions.map((def) => {
    const userP = progressMap.get(def.trophyId);
    const target =
      userP?.trophyProgressTargetValue ?? def?.trophyProgressTargetValue ?? null;
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
 * Normalizes titles for fuzzy matching.
 */
function cleanTitle(title) {
  if (!title) return "";
  let s = title.toLowerCase();

  s = s.replace(/[™®©]/g, "");
  s = s.replace(/\bpart\s+i\b/g, "part 1");
  s = s.replace(/\bpart\s+ii\b/g, "part 2");
  s = s.replace(/\bpart\s+iii\b/g, "part 3");
  s = s.replace(/\biv\b/g, "4");
  s = s.replace(/\bv\b/g, "5");
  s = s.replace(/\(ps4\)/g, "").replace(/\(ps5\)/g, "");

  const junk = [
    " definitive edition",
    " director's cut",
    " directors cut",
    " digital deluxe edition",
    " deluxe edition",
    " standard edition",
    " game of the year",
    " goty",
    " remastered",
    " remake",
    " complete edition",
    " bonus edition",
    " ultimate edition",
    " cross-gen bundle",
    " & ",
    " and ",
    " the ",
  ];
  junk.forEach((j) => (s = s.replace(j, " ")));

  return s.replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Enhances the Trophy Title list with High-Res Store Artwork.
 */
function enrichTitlesWithArtwork(trophyTitles, gameList) {
  const artMapById = new Map();
  const artMapByName = new Map();

  for (const game of gameList) {
    if (!game.name || !game.concept?.media?.images) continue;

    const images = game.concept.media.images;

    // 1. Find Best 16:9 Art (Header)
    const masterArt = images.find((img) => img.type === "MASTER")?.url;

    // 🟢 UPDATED PRIORITY LIST: "MASTER" IS NOW #1
    // This will use the 16:9 MASTER image for the grid icon too.
    const priorityTypes = [
      "MASTER", // 👈 Requested: Master for both
      "FOUR_BY_THREE_BANNER",
      "SQUARE_ICON",
      "GAMEHUB_COVER_ART",
      "U00_ICON",
      "ICON",
    ];

    let squareArt = null;
    for (const type of priorityTypes) {
      const found = images.find((img) => img.type === type);
      if (found) {
        squareArt = found.url;
        break;
      }
    }

    if (!masterArt && !squareArt) continue;

    const artData = { master: masterArt, square: squareArt };

    if (game.titleId) artMapById.set(game.titleId, artData);
    if (game.concept?.titleIds) {
      game.concept.titleIds.forEach((id) => artMapById.set(id, artData));
    }

    const clean = cleanTitle(game.name);
    if (clean) artMapByName.set(clean, artData);
  }

  let matchCount = 0;
  const results = trophyTitles.map((t) => {
    let match = t.npTitleId ? artMapById.get(t.npTitleId) : null;
    const tClean = cleanTitle(t.trophyTitleName);

    if (!match && t.trophyTitleName) {
      match = artMapByName.get(tClean);
    }

    if (match) {
      matchCount++;
      return {
        ...t,
        trophyTitleIconUrl: match.square || t.trophyTitleIconUrl,
        gameArtUrl: match.master || match.square || t.trophyTitleIconUrl,
      };
    }

    return t;
  });

  console.log(`🎨 Artwork Matched: ${matchCount} / ${trophyTitles.length}`);
  return results;
}

module.exports = { mergeTrophies, enrichTitlesWithArtwork };
