// hooks/game-details/useGameDetails.ts
import { useMemo } from "react";
// ⚠️ Ensure this path matches where your JSON is located
import masterGamesRaw from "../../../data/master_games.json";
import { useTrophy } from "../../../providers/TrophyContext";
import { UnifiedGame } from "./types";
import { useGameFetcher } from "./useGameFetcher";

export function useGameDetails(
  id: string,
  searchText: string = "",
  sortMode: "DEFAULT" | "RARITY" | "DATE_EARNED" = "DEFAULT",
  sortDirection: "ASC" | "DESC" = "ASC"
) {
  const { trophies, xboxTitles } = useTrophy();

  // 1. RESOLVE GAME OBJECT (Priority: PSN -> Xbox -> Master)
  const gameObject = useMemo((): UnifiedGame | null => {
    if (!id) return null;

    // A. PSN
    const psnGame = trophies?.trophyTitles?.find((t: any) => t.npCommunicationId === id);
    if (psnGame) {
      return {
        source: "USER",
        id: psnGame.npCommunicationId,
        trophyTitleName: psnGame.trophyTitleName,
        trophyTitlePlatform: psnGame.trophyTitlePlatform,
        trophyTitleIconUrl: psnGame.trophyTitleIconUrl,
        trophyList: psnGame.trophies || [],
        definedTrophies: psnGame.definedTrophies,
        earnedTrophies: psnGame.earnedTrophies,
        progress: psnGame.progress,
        npCommunicationId: psnGame.npCommunicationId,
      };
    }

    // B. Xbox
    const xboxGame = xboxTitles?.find((t) => t.titleId === id);
    if (xboxGame) {
      return {
        source: "XBOX",
        id: xboxGame.titleId,
        trophyTitleName: xboxGame.name,
        trophyTitlePlatform: "XBOX",
        trophyTitleIconUrl: xboxGame.displayImage,
        trophyList: [],
        progress: xboxGame.achievement.progressPercentage,
        originalXbox: xboxGame,
        // Map Gamerscore to generic 'counts' if needed for the header
        definedTrophies: {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
        },
        earnedTrophies: {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
        },
      };
    }

    // C. Master
    const master = (masterGamesRaw as any[]).find((m) => {
      if (m.canonicalId === id) return true;
      return m.linkedVersions?.some(
        (v: any) => v.npCommunicationId === id || v.titleId === id
      );
    });

    if (master) {
      return {
        source: "MASTER",
        id: id,
        trophyTitleName: master.displayName,
        trophyTitlePlatform: "Unknown",
        trophyTitleIconUrl: master.iconUrl,
        trophyList: [],
        masterData: master,
        progress: 0,
      };
    }
    return null;
  }, [id, trophies, xboxTitles]);

  // 2. FETCH DATA
  const { localTrophies, trophyGroups, isInitialLoading, refreshing, onRefresh } =
    useGameFetcher(id, gameObject);

  // 3. MERGE DATA (Prefer fresh fetch over context cache)
  const activeTrophies =
    localTrophies.length > 0 ? localTrophies : gameObject?.trophyList || [];

  // 4. PROCESS & SORT
  const processedTrophies = useMemo(() => {
    let list = [...activeTrophies];

    if (searchText) {
      const lower = searchText.toLowerCase();
      list = list.filter((t) => t.trophyName.toLowerCase().includes(lower));
    }

    list.sort((a, b) => {
      let valA, valB;
      const dir = sortDirection === "ASC" ? 1 : -1;

      if (sortMode === "RARITY") {
        valA = parseFloat(a.trophyEarnedRate ?? "100");
        valB = parseFloat(b.trophyEarnedRate ?? "100");
      } else if (sortMode === "DATE_EARNED") {
        valA = a.earned ? new Date(a.earnedDateTime).getTime() : 0;
        valB = b.earned ? new Date(b.earnedDateTime).getTime() : 0;
        if (valA === 0 && valB > 0) return 1;
        if (valB === 0 && valA > 0) return -1;
      } else {
        return (a.trophyId - b.trophyId) * dir;
      }
      return (valA - valB) * dir;
    });

    return list;
  }, [activeTrophies, searchText, sortMode, sortDirection]);

  // 5. GROUPING LOGIC
  const groupedData = useMemo(() => {
    if (!trophyGroups || trophyGroups.length === 0) return null;

    return trophyGroups
      .map((group) => {
        const groupTrophies = processedTrophies.filter((t) =>
          group.trophyIds.includes(t.trophyId)
        );
        if (groupTrophies.length === 0) return null;
        return { ...group, trophies: groupTrophies };
      })
      .filter(Boolean);
  }, [trophyGroups, processedTrophies]);

  // 6. JUST EARNED SET
  const justEarnedIds = useMemo(() => new Set<number>(), []);

  return {
    game: gameObject,
    isLoadingDetails: isInitialLoading,
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  };
}
