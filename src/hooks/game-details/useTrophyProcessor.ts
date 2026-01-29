import { GameCounts, GameVersion, XboxTitle } from "./types";

// Helper for PSN Counts
const getPsnCounts = (game: any): GameCounts => ({
  total:
    (game.definedTrophies?.bronze || 0) +
    (game.definedTrophies?.silver || 0) +
    (game.definedTrophies?.gold || 0) +
    (game.definedTrophies?.platinum || 0),
  bronze: game.definedTrophies?.bronze || 0,
  silver: game.definedTrophies?.silver || 0,
  gold: game.definedTrophies?.gold || 0,
  platinum: game.definedTrophies?.platinum || 0,
  earnedBronze: game.earnedTrophies?.bronze || 0,
  earnedSilver: game.earnedTrophies?.silver || 0,
  earnedGold: game.earnedTrophies?.gold || 0,
  earnedPlatinum: game.earnedTrophies?.platinum || 0,
});

// Helper for Xbox Counts
const getXboxCounts = (game: XboxTitle): GameCounts => ({
  total: game.achievement.totalGamerscore,
  earned: game.achievement.currentGamerscore, // The special field
  bronze: 0,
  silver: 0,
  gold: 0,
  platinum: 0,
  earnedBronze: 0,
  earnedSilver: 0,
  earnedGold: 0,
  earnedPlatinum: 0,
});

export function useTrophyProcessor() {
  const processPsnGame = (game: any): GameVersion => {
    return {
      id: game.npCommunicationId,
      platform: normalizePlatform(game.trophyTitlePlatform),
      progress: game.progress,
      lastPlayed: game.lastUpdatedDateTime,
      counts: getPsnCounts(game),
      isOwned: true,
    };
  };

  const processXboxGame = (game: XboxTitle): GameVersion => {
    return {
      id: game.titleId,
      platform: "XBOX",
      progress: game.achievement.progressPercentage,
      lastPlayed: game.lastUnlock,
      counts: getXboxCounts(game),
      isOwned: true,
    };
  };

  return { processPsnGame, processXboxGame };
}

// Simple Helper
const normalizePlatform = (raw: string) => {
  if (!raw) return "UNKNOWN";
  const p = raw.toUpperCase();
  if (p.includes("PS5")) return "PS5";
  if (p.includes("PS4")) return "PS4";
  if (p.includes("VITA")) return "PSVITA";
  return p;
};
