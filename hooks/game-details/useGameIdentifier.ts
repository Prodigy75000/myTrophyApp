// hooks/game-details/useGameIdentifier.ts
import { useMemo } from "react";
import masterGamesRaw from "../../data/master_games.json";
import { useTrophy } from "../../providers/TrophyContext";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";
import { UnifiedGame } from "./types";

const normalizePlatform = (raw: string | undefined | null) => {
  if (!raw) return "PSN";
  const p = raw.toUpperCase();
  if (p.includes("PS5")) return "PS5";
  if (p.includes("PS4")) return "PS4";
  if (p.includes("PS3")) return "PS3";
  if (p.includes("VITA")) return "PSVITA";
  return raw;
};

export function useGameIdentifier(gameId: string) {
  const { trophies } = useTrophy();

  return useMemo<UnifiedGame | null>(() => {
    if (!gameId) return null;

    const ownedGame = trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(gameId)
    );

    const masterEntry = (masterGamesRaw as any[]).find((g) =>
      g.linkedVersions?.some((v: any) => v.npCommunicationId === gameId)
    );

    if (ownedGame) {
      return {
        npCommunicationId: ownedGame.npCommunicationId,
        trophyTitleName: masterEntry?.displayName || ownedGame.trophyTitleName,
        trophyTitleIconUrl: masterEntry?.art?.square || ownedGame.trophyTitleIconUrl,
        trophyTitlePlatform: normalizePlatform(ownedGame.trophyTitlePlatform),
        progress: ownedGame.progress ?? 0,
        earnedTrophies: ownedGame.earnedTrophies ?? {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
        },
        definedTrophies: ownedGame.definedTrophies ?? {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
        },
        lastUpdatedDateTime: ownedGame.lastUpdatedDateTime || null,
        source: "USER",
        trophyList: ownedGame.trophyList,
      };
    }

    if (masterEntry) {
      const versionInfo = masterEntry.linkedVersions.find(
        (v: any) => v.npCommunicationId === gameId
      );
      const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      if (masterEntry.trophies) {
        masterEntry.trophies.forEach((t: any) => {
          const type = normalizeTrophyType(t.type);
          if (counts[type] !== undefined) counts[type]++;
        });
      }

      return {
        npCommunicationId: gameId,
        trophyTitleName: masterEntry.displayName,
        trophyTitleIconUrl: masterEntry.art?.square || masterEntry.iconUrl,
        trophyTitlePlatform: normalizePlatform(versionInfo?.platform),
        progress: 0,
        earnedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        definedTrophies: counts,
        lastUpdatedDateTime: null,
        rawTrophyList: masterEntry.trophies,
        source: "MASTER",
      };
    }

    return null;
  }, [gameId, trophies]);
}
