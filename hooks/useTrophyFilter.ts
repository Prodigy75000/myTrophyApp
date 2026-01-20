// hooks/useTrophyFilter.ts
import { useMemo } from "react";
import type { FilterMode, SortDirection, SortMode } from "../components/HeaderActionBar";

type TrophyGame = any; // Replace with your actual TrophyTitle interface when available

/**
 * Hook to handle all the heavy lifting of filtering, sorting, and calculating stats.
 */
export function useTrophyFilter(
  trophies: { trophyTitles: TrophyGame[] } | null,
  searchText: string,
  filterMode: FilterMode,
  sortMode: SortMode,
  sortDirection: SortDirection,
  pinnedIds: Set<string>
) {
  // 1. Calculate Global Stats (Bronze/Silver/Gold counts)
  const userStats = useMemo(() => {
    if (!trophies?.trophyTitles) return null;

    return trophies.trophyTitles.reduce(
      (acc: any, game: TrophyGame) => {
        acc.bronze += game.earnedTrophies.bronze;
        acc.silver += game.earnedTrophies.silver;
        acc.gold += game.earnedTrophies.gold;
        acc.platinum += game.earnedTrophies.platinum;
        // Total count
        acc.total +=
          game.earnedTrophies.bronze +
          game.earnedTrophies.silver +
          game.earnedTrophies.gold +
          game.earnedTrophies.platinum;
        return acc;
      },
      { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 }
    );
  }, [trophies]);

  // 2. Filter the list (Search text + Status)
  const filteredList = useMemo(() => {
    if (!trophies?.trophyTitles) return [];

    let list = trophies.trophyTitles.filter((game: TrophyGame) =>
      game.trophyTitleName.toLowerCase().includes(searchText.toLowerCase())
    );

    switch (filterMode) {
      case "IN_PROGRESS":
        return list.filter((g: any) => g.progress > 0 && g.progress < 100);
      case "COMPLETED":
        return list.filter((g: any) => g.progress === 100);
      case "NOT_STARTED":
        return list.filter((g: any) => g.progress === 0);
      default:
        return list;
    }
  }, [trophies, searchText, filterMode]);

  // 3. Sort the list (Alphabetical, Progress, Date + Pinned items)
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    const dir = sortDirection === "ASC" ? 1 : -1;

    // Primary Sort
    list.sort((a, b) => {
      if (sortMode === "TITLE") {
        return a.trophyTitleName.localeCompare(b.trophyTitleName) * dir;
      }
      if (sortMode === "PROGRESS") {
        const progA = typeof a.progress === "number" ? a.progress : -1;
        const progB = typeof b.progress === "number" ? b.progress : -1;
        return (progA - progB) * dir;
      }
      // Default: LAST_PLAYED
      const timeA = new Date(a.lastUpdatedDateTime).getTime();
      const timeB = new Date(b.lastUpdatedDateTime).getTime();
      return (timeA - timeB) * dir;
    });

    // Secondary Sort: Always bump Pinned items to the top
    return list.sort((a, b) => {
      const isPinnedA = pinnedIds.has(a.npCommunicationId);
      const isPinnedB = pinnedIds.has(b.npCommunicationId);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      return 0;
    });
  }, [filteredList, sortMode, sortDirection, pinnedIds]);

  return { userStats, sortedList };
}
