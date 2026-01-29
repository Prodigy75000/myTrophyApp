// hooks/useTrophyFilter.ts
import { useMemo } from "react";
import type {
  FilterMode,
  OwnershipMode,
  PlatformFilter,
  SortDirection,
  SortMode,
} from "../components/HeaderActionBar";
import { calculateUserStats } from "../utils/trophyCalculations";
import { GameVersion, MasterGameEntry, XboxTitle } from "./game-details/types";
import { useGameIdentifier } from "./game-details/useGameIdentifier";
import { useTrophyProcessor } from "./game-details/useTrophyProcessor";

export function useTrophyFilter(
  userTrophies: any | null,
  masterGames: MasterGameEntry[],
  xboxTitles: XboxTitle[],
  searchText: string,
  filterMode: FilterMode,
  ownershipMode: OwnershipMode,
  sortMode: SortMode,
  sortDirection: SortDirection,
  pinnedIds: Set<string>,
  showShovelware: boolean,
  platforms: PlatformFilter
) {
  // 1. INITIALIZE HELPERS
  const { identifyGame } = useGameIdentifier(masterGames);
  const { processPsnGame, processXboxGame } = useTrophyProcessor();

  // 2. CALCULATE DASHBOARD STATS
  const userStats = useMemo(() => {
    return calculateUserStats(userTrophies?.trophyTitles);
  }, [userTrophies]);

  // 3. MAIN MERGE & PROCESS LOGIC
  const processedList = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        id: string;
        title: string;
        icon?: string;
        art?: string;
        tags: string[];
        versions: GameVersion[];
      }
    >();

    // Helper to check platform toggle
    const isPlatformEnabled = (plat: string) => {
      const p = plat.toUpperCase();
      if (p.includes("PS5") && platforms.PS5) return true;
      if (p.includes("PS4") && platforms.PS4) return true;
      if (p.includes("PS3") && platforms.PS3) return true;
      if ((p.includes("VITA") || p.includes("PS VITA")) && platforms.PSVITA) return true;
      if (p === "XBOX") return true; // Always show Xbox if loaded (or add a toggle later)
      return false;
    };

    // A. PROCESS PSN GAMES
    userTrophies?.trophyTitles?.forEach((game: any) => {
      const processed = processPsnGame(game);
      if (!isPlatformEnabled(processed.platform)) return;

      const master = identifyGame(game.npCommunicationId, game.trophyTitleName);
      const key = master?.canonicalId || game.npCommunicationId;

      if (!groupedMap.has(key)) {
        // Image Priority: Master Store -> Icon -> Master Grid
        const manualArt = master?.art;
        const icon =
          manualArt?.storesquare || game.trophyTitleIconUrl || manualArt?.square;
        const art = manualArt?.hero || game.gameArtUrl || manualArt?.master || icon;

        groupedMap.set(key, {
          id: key,
          title: master?.displayName || game.trophyTitleName,
          icon,
          art,
          tags: master?.tags || [],
          versions: [],
        });
      }
      groupedMap.get(key)!.versions.push(processed);
    });

    // B. PROCESS XBOX GAMES
    xboxTitles?.forEach((game) => {
      const processed = processXboxGame(game);
      // Only process if you want to filter Xbox via a toggle later, for now we include it

      const master = identifyGame(game.titleId, game.name);
      const key = master?.canonicalId || `xbox_${game.titleId}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: key,
          title: master?.displayName || game.name,
          icon: game.displayImage,
          art: game.displayImage,
          tags: master?.tags || [],
          versions: [],
        });
      }
      groupedMap.get(key)!.versions.push(processed);
    });

    // C. PROCESS UNOWNED (If Global Mode)
    if (ownershipMode !== "OWNED") {
      masterGames.forEach((master) => {
        const key = master.canonicalId;
        if (!key) return;

        // If we haven't seen this game yet, add it
        if (!groupedMap.has(key)) {
          const mArt = master.art;
          const icon = mArt?.storesquare || mArt?.square || master.iconUrl;
          const art = mArt?.hero || mArt?.master || icon;

          groupedMap.set(key, {
            id: key,
            title: master.displayName,
            icon,
            art,
            tags: master.tags || [],
            versions: [],
          });
        }

        const group = groupedMap.get(key)!;

        // Add "Ghost" versions for unowned platforms
        master.linkedVersions?.forEach((v) => {
          // Skip if we already have this version (e.g. we own the PS5 version)
          if (
            group.versions.some(
              (gv) => gv.id === v.npCommunicationId || gv.id === v.titleId
            )
          )
            return;

          // Normalize platform string for the filter check
          const rawPlat = v.platform || "UNKNOWN";
          let normPlat = rawPlat;
          if (rawPlat.includes("PS5")) normPlat = "PS5";
          else if (rawPlat.includes("PS4")) normPlat = "PS4";

          if (!isPlatformEnabled(normPlat)) return;

          group.versions.push({
            id: v.npCommunicationId || v.titleId || "unknown",
            platform: normPlat,
            region: v.region,
            progress: 0,
            isOwned: false,
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
          });
        });
      });
    }

    // D. FINAL FILTERING
    let combinedList = Array.from(groupedMap.values()).filter(
      (g) => g.versions.length > 0
    );

    if (!showShovelware) {
      combinedList = combinedList.filter((g) => !g.tags?.includes("shovelware"));
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      combinedList = combinedList.filter((g) => g.title?.toLowerCase().includes(lower));
    }

    if (filterMode !== "ALL") {
      combinedList = combinedList.filter((g) => {
        return g.versions.some((v) => {
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
    xboxTitles,
    masterGames,
    identifyGame,
    processPsnGame,
    processXboxGame,
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
      const bestA = a.versions[0]; // Simplified sort logic
      const bestB = b.versions[0];

      // Pin Logic
      const isPinnedA = a.versions.some((v) => pinnedIds.has(v.id));
      const isPinnedB = b.versions.some((v) => pinnedIds.has(v.id));
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;

      if (sortMode === "TITLE") {
        return (a.title || "").localeCompare(b.title || "") * dir;
      }
      if (sortMode === "PROGRESS") {
        const progA = Math.max(...a.versions.map((v) => v.progress || 0));
        const progB = Math.max(...b.versions.map((v) => v.progress || 0));
        return (progA - progB) * dir;
      }

      // Default: Date Earned / Last Played
      const timeA = new Date(bestA?.lastPlayed || 0).getTime();
      const timeB = new Date(bestB?.lastPlayed || 0).getTime();
      return (timeA - timeB) * dir;
    });

    return list;
  }, [processedList, sortMode, sortDirection, pinnedIds]);

  return { userStats, sortedList };
}
