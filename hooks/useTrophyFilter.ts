// hooks/useTrophyFilter.ts
import { useMemo } from "react";
import type {
  FilterMode,
  OwnershipMode,
  PlatformFilter,
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
  showShovelware: boolean,
  platforms: PlatformFilter
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

    const isPlatformEnabled = (plat: string) => {
      if (plat === "PS5" && platforms.PS5) return true;
      if (plat === "PS4" && platforms.PS4) return true;
      if (plat === "PS3" && platforms.PS3) return true;
      if ((plat === "PSVITA" || plat === "PS Vita") && platforms.PSVITA) return true;
      return false;
    };

    // A. Process Owned Games
    rawUserGames.forEach((game: any) => {
      if (!isPlatformEnabled(game.trophyTitlePlatform)) return;

      const masterEntry = masterLookup.get(game.npCommunicationId);
      const groupKey =
        masterEntry?.canonicalId || game.npCommunicationId || `err_${Math.random()}`;

      let regionTag = undefined;
      if (masterEntry?.linkedVersions) {
        const specificVer = masterEntry.linkedVersions.find(
          (v: any) => v.npCommunicationId === game.npCommunicationId
        );
        if (specificVer?.region) regionTag = specificVer.region;
      }

      // 🟢 IMAGE PRIORITY (THE OVERRIDE SYSTEM) 🟢
      const manualArt = masterEntry?.art;

      // 1. GRID ICON (Mosaic)
      // Priority:
      //   A. 'storesquare' in JSON (Manual Override)
      //   B. 'trophyTitleIconUrl' from API (Auto-detected Master/4:3 from backend)
      //   C. 'square' in JSON (Legacy fallback)
      const displayIcon =
        manualArt?.storesquare ||
        game.trophyTitleIconUrl ||
        manualArt?.square ||
        manualArt?.grid;

      // 2. HERO ART (Game Details Header)
      // Priority:
      //   A. 'hero' in JSON (Manual Override)
      //   B. 'gameArtUrl' from API (Auto-detected Master from backend)
      //   C. 'master' in JSON (Legacy fallback)
      //   D. displayIcon (Last resort)
      const displayArt =
        manualArt?.hero || game.gameArtUrl || manualArt?.master || displayIcon;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          id: groupKey,
          title: masterEntry ? masterEntry.displayName : game.trophyTitleName,
          icon: displayIcon,
          art: displayArt,
          tags: masterEntry?.tags || [],
          versions: [],
        });
      }

      groupedMap.get(groupKey).versions.push({
        id: game.npCommunicationId,
        platform: game.trophyTitlePlatform,
        region: regionTag,
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
          const mArt = masterGame.art;
          const mConcept = masterGame.concept?.media?.images;

          // Try Manual -> Try Concept Square -> Fallback null
          const autoIcon = mConcept?.find((i: any) => i.type === "SQUARE_ICON")?.url;

          // Apply same priority logic for Unowned
          const icon =
            mArt?.storesquare || mArt?.square || autoIcon || masterGame.iconUrl;
          const art = mArt?.hero || mArt?.master || mArt?.square || autoIcon;

          const newItem = {
            id: groupKey,
            title: masterGame.displayName,
            icon: icon,
            art: art,
            tags: masterGame.tags || [],
            versions: [],
          };
          groupedMap.set(groupKey, newItem);
        }

        const group = groupedMap.get(groupKey);
        masterGame.linkedVersions?.forEach((v: any) => {
          if (!isPlatformEnabled(v.platform)) return;
          if (!group.versions.some((gv: any) => gv.id === v.npCommunicationId)) {
            group.versions.push({
              id: v.npCommunicationId,
              platform: v.platform,
              region: v.region,
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
    platforms,
  ]);

  // 4. SORTING
  const sortedList = useMemo(() => {
    const list = [...processedList];
    const dir = sortDirection === "ASC" ? 1 : -1;

    list.sort((a, b) => {
      const bestA = a.versions[0];
      const bestB = b.versions[0];

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
