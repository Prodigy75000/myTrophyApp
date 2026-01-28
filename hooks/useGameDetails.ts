// hooks/useGameDetails.ts
import { useEffect, useRef, useState } from "react";
import { SortMode } from "../components/HeaderActionBar";
import { useTrophy } from "../providers/TrophyContext";
import { useGameFetcher } from "./game-details/useGameFetcher";
import { useGameIdentifier } from "./game-details/useGameIdentifier";
import { useTrophyProcessor } from "./game-details/useTrophyProcessor";

export function useGameDetails(
  gameId: string,
  searchText: string,
  sortMode: SortMode,
  sortDirection: "ASC" | "DESC"
) {
  const { refreshSingleGame, refreshAllTrophies } = useTrophy();
  const [refreshing, setRefreshing] = useState(false);
  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());
  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());

  // 1. Identify
  const gameObject = useGameIdentifier(gameId);

  // 2. Fetch
  const { localTrophies, trophyGroups, fetchedId, isInitialLoading } = useGameFetcher(
    gameId,
    gameObject
  );

  // 3. Process
  const { processedTrophies, groupedData } = useTrophyProcessor(
    gameObject,
    localTrophies,
    trophyGroups,
    fetchedId,
    gameId,
    searchText,
    sortMode,
    sortDirection
  );

  // 4. Watchdog
  useEffect(() => {
    if (processedTrophies.length === 0) return;
    const nextJustEarned = new Set<number>();
    processedTrophies.forEach((t) => {
      const wasEarned = prevTrophiesRef.current.get(t.trophyId);
      if (wasEarned === false && t.earned) nextJustEarned.add(t.trophyId);
      prevTrophiesRef.current.set(t.trophyId, !!t.earned);
    });

    if (nextJustEarned.size > 0) {
      setJustEarnedIds(nextJustEarned);
      setTimeout(() => setJustEarnedIds(new Set()), 3000);
    }
  }, [processedTrophies]);

  // 5. Refresh Logic
  const onRefresh = async () => {
    if (gameObject?.source === "MASTER") {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 500);
      return;
    }

    setRefreshing(true);
    await refreshSingleGame(gameId);
    await refreshAllTrophies();
    setRefreshing(false);
  };

  return {
    game: gameObject,
    isLoadingDetails: isInitialLoading || processedTrophies.length === 0, // 🟢 Renamed
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  };
}
