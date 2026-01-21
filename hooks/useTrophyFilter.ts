// hooks/useTrophyFilter.ts
import { useMemo } from "react";
import type {
  FilterMode,
  OwnershipMode,
  SortDirection,
  SortMode,
} from "../components/HeaderActionBar";

// Helper to calculate counts
const getCounts = (game: any) => ({
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

export function useTrophyFilter(
  userTrophies: any | null,
  masterGames: any[],
  searchText: string,
  filterMode: FilterMode,
  ownershipMode: OwnershipMode,
  sortMode: SortMode,
  sortDirection: SortDirection,
  pinnedIds: Set<string>,
  showShovelware: boolean // 👈 NEW PARAM
) {
  // 1. CALCULATE STATS
  const userStats = useMemo(() => {
    if (!userTrophies?.trophyTitles) return null;
    return userTrophies.trophyTitles.reduce(
      (acc: any, game: any) => {
        acc.bronze += game.earnedTrophies.bronze;
        acc.silver += game.earnedTrophies.silver;
        acc.gold += game.earnedTrophies.gold;
        acc.platinum += game.earnedTrophies.platinum;
        acc.total +=
          game.earnedTrophies.bronze +
          game.earnedTrophies.silver +
          game.earnedTrophies.gold +
          game.earnedTrophies.platinum;
        return acc;
      },
      { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 }
    );
  }, [userTrophies]);

  // 2. CREATE LOOKUP MAP
  const masterLookup = useMemo(() => {
    const map = new Map<string, any>();
    if (!masterGames) return map;
    masterGames.forEach((game) => {
      if (game.canonicalId) {
        map.set(game.canonicalId, game);
        if (game.linkedVersions) {
          game.linkedVersions.forEach((v: any) => map.set(v.npCommunicationId, game));
        }
      }
    });
    return map;
  }, [masterGames]);

  // 3. MERGE & GROUP LOGIC
  const processedList = useMemo(() => {
    const rawUserGames = userTrophies?.trophyTitles || [];
    const groupedMap = new Map<string, any>();

    // A. Process Owned Games
    rawUserGames.forEach((game: any) => {
      const masterEntry = masterLookup.get(game.npCommunicationId);
      // 🛡️ CRASH FIX: Ensure valid ID. Use Master ID -> fallback to Game ID -> fallback to random (rare)
      const groupKey =
        masterEntry?.canonicalId || game.npCommunicationId || `err_${Math.random()}`;
      // 1. Try to find specific region info from Master Data
      let regionTag = undefined;
      if (masterEntry?.linkedVersions) {
        const specificVer = masterEntry.linkedVersions.find(
          (v: any) => v.npCommunicationId === game.npCommunicationId
        );
        if (specificVer?.region) regionTag = specificVer.region;
      }
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          id: groupKey, // 👈 THE FIX for "undefined key"
          title: masterEntry ? masterEntry.displayName : game.trophyTitleName,
          icon: masterEntry?.art?.square || game.trophyTitleIconUrl,
          art: masterEntry?.art?.square || game.gameArtUrl,
          tags: masterEntry?.tags || [], // Import tags for filtering
          versions: [],
        });
      }

      groupedMap.get(groupKey).versions.push({
        id: game.npCommunicationId,
        platform: game.trophyTitlePlatform,
        progress: game.progress,
        lastPlayed: game.lastUpdatedDateTime,
        counts: getCounts(game),
        isOwned: true,
      });
    });

    // B. Process Unowned (Global Search)
    if (ownershipMode !== "OWNED") {
      masterGames.forEach((masterGame: any) => {
        const groupKey = masterGame.canonicalId;
        if (!groupKey) return;

        if (!groupedMap.has(groupKey)) {
          const newItem = {
            id: groupKey,
            title: masterGame.displayName,
            icon: masterGame.art.square,
            art: masterGame.art.square,
            tags: masterGame.tags || [],
            versions: [],
          };
          groupedMap.set(groupKey, newItem);
        }

        const group = groupedMap.get(groupKey);
        masterGame.linkedVersions?.forEach((v: any) => {
          if (!group.versions.some((gv: any) => gv.id === v.npCommunicationId)) {
            group.versions.push({
              id: v.npCommunicationId,
              platform: v.platform,
              progress: 0,
              lastPlayed: null,
              counts: {
                total: 0,
                bronze: 0,
                silver: 0,
                gold: 0,
                platinum: 0,
                earnedBronze: 0,
                earnedSilver: 0,
                earnedGold: 0,
                earnedPlatinum: 0,
              },
              isOwned: false,
            });
          }
        });
      });
    }

    // Convert to Array
    let combinedList = Array.from(groupedMap.values()).filter(
      (g) => g.versions.length > 0
    );

    // C. FILTERING
    if (!showShovelware) {
      combinedList = combinedList.filter((g) => !g.tags?.includes("shovelware"));
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      combinedList = combinedList.filter((g) => g.title?.toLowerCase().includes(lower));
    }

    if (filterMode !== "ALL") {
      combinedList = combinedList.filter((g) => {
        return g.versions.some((v: any) => {
          if (filterMode === "IN_PROGRESS") return v.progress > 0 && v.progress < 100;
          if (filterMode === "COMPLETED") return v.progress === 100;
          if (filterMode === "NOT_STARTED") return v.progress === 0;
          return true;
        });
      });
    }

    return combinedList;
  }, [
    userTrophies,
    masterGames,
    masterLookup,
    searchText,
    filterMode,
    ownershipMode,
    showShovelware,
  ]);

  // 4. SORTING
  const sortedList = useMemo(() => {
    const list = [...processedList];
    const dir = sortDirection === "ASC" ? 1 : -1;

    list.sort((a, b) => {
      const bestA = a.versions[0];
      const bestB = b.versions[0];

      // Pins
      const isPinnedA = a.versions.some((v: any) => pinnedIds.has(v.id));
      const isPinnedB = b.versions.some((v: any) => pinnedIds.has(v.id));
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;

      if (sortMode === "TITLE") {
        return (a.title || "").localeCompare(b.title || "") * dir;
      }
      if (sortMode === "PROGRESS") {
        const progA = Math.max(...a.versions.map((v: any) => v.progress || 0));
        const progB = Math.max(...b.versions.map((v: any) => v.progress || 0));
        return (progA - progB) * dir;
      }

      const timeA = new Date(bestA?.lastPlayed || 0).getTime();
      const timeB = new Date(bestB?.lastPlayed || 0).getTime();
      return (timeA - timeB) * dir;
    });

    return list;
  }, [processedList, sortMode, sortDirection, pinnedIds]);

  return { userStats, sortedList };
}
