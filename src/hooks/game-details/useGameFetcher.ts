// hooks/game-details/useGameFetcher.ts
import { useEffect, useState } from "react";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { useTrophy } from "../../../providers/TrophyContext";
import { UnifiedGame } from "./types";

export function useGameFetcher(gameId: string, gameObject: UnifiedGame | null) {
  const { accessToken, accountId } = useTrophy();

  const [localTrophies, setLocalTrophies] = useState<any[]>([]);
  const [trophyGroups, setTrophyGroups] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to fetch data
  const fetchData = async (isRefresh = false) => {
    // If we don't have the basic game object yet, or auth is missing, stop.
    if (!gameObject || !accountId || !accessToken) {
      // If we rely on Master Data, we might not need auth to view basic info,
      // but to fetch trophies we usually do.
      // For now, stop loading if we can't fetch.
      if (!isRefresh) setIsInitialLoading(false);
      return;
    }

    // Optimization: If it's a USER source and we already have the list from Context, skip fetch
    if (
      !isRefresh &&
      gameObject.source === "USER" &&
      gameObject.trophyList &&
      gameObject.trophyList.length > 0
    ) {
      setLocalTrophies(gameObject.trophyList);
      setIsInitialLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setIsInitialLoading(true);

      const platformParam =
        gameObject.trophyTitlePlatform !== "Unknown"
          ? `&platform=${encodeURIComponent(gameObject.trophyTitlePlatform)}`
          : "";

      const url =
        `${PROXY_BASE_URL}/api/trophies/${accountId}/${gameId}` +
        `?gameName=${encodeURIComponent(gameObject.trophyTitleName)}` +
        platformParam;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (data.trophies) setLocalTrophies(data.trophies);
      if (data.groups) setTrophyGroups(data.groups);
    } catch (e) {
      console.warn("Fetch failed", e);
    } finally {
      setIsInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger fetch when ID or Source changes
  useEffect(() => {
    fetchData();
  }, [gameId, gameObject?.source]);

  const onRefresh = () => fetchData(true);

  return {
    localTrophies,
    trophyGroups,
    isInitialLoading,
    refreshing,
    onRefresh,
  };
}
