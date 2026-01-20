// hooks/useGameDetails.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { TrophySortMode } from "../components/trophies/TrophyListHeader";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";
import { useMarkRecentGame } from "../utils/makeRecent";
import { normalizeTrophyType } from "../utils/normalizeTrophy";

// Types
type GameTrophy = {
  trophyId: number;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyType: string;
  earned?: boolean;
  earnedDateTime?: string | null;
  trophyEarnedRate?: string;
  trophyProgressTargetValue?: string;
  trophyProgressValue?: string;
};

type TrophyGroup = {
  trophyGroupId: string;
  trophyGroupName: string;
  trophyGroupIconUrl?: string;
};

export function useGameDetails(
  gameId: string,
  searchText: string,
  sortMode: TrophySortMode,
  sortDirection: "ASC" | "DESC"
) {
  const { trophies, accessToken, accountId, refreshSingleGame, refreshAllTrophies } =
    useTrophy();
  const markRecentGame = useMarkRecentGame();

  // Local State
  const [localTrophies, setLocalTrophies] = useState<GameTrophy[]>([]);
  const [trophyGroups, setTrophyGroups] = useState<TrophyGroup[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());

  // Refs
  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());

  // 1. Identify Game from Global Context
  const game = useMemo(() => {
    if (!gameId) return null;
    return trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(gameId)
    );
  }, [gameId, trophies]);

  // 2. Mark Recent Game
  useEffect(() => {
    if (game) {
      markRecentGame({
        npwr: String(game.npCommunicationId),
        gameName: game.trophyTitleName,
        platform: game.trophyTitlePlatform,
      });
    }
  }, [game?.npCommunicationId]);

  // 3. Fetch Details
  useEffect(() => {
    if (!accountId || !accessToken || !game) return;

    // Use cached list if available to avoid loading state
    if (game.trophyList && game.trophyList.length > 0) {
      setIsInitialLoading(false);
      // We don't return here because we might want to background refresh
    }

    const controller = new AbortController();
    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `${PROXY_BASE_URL}/api/trophies/${accountId}/${gameId}` +
            `?gameName=${encodeURIComponent(game.trophyTitleName)}` +
            `&platform=${encodeURIComponent(game.trophyTitlePlatform)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        const data = await res.json();
        if (!controller.signal.aborted) {
          setLocalTrophies(data.trophies ?? []);
          setTrophyGroups(data.groups ?? []);
        }
      } catch (e) {
        console.warn("Game details fetch failed", e);
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      }
    };

    fetchDetails();
    return () => controller.abort();
  }, [accountId, accessToken, gameId]);

  // 4. Combine & Sort Data
  const rawTrophyList = useMemo(() => {
    return (game?.trophyList?.length ? game.trophyList : localTrophies) as GameTrophy[];
  }, [game?.trophyList, localTrophies]);

  const processedTrophies = useMemo(() => {
    let list = [...rawTrophyList];

    // Filter
    if (searchText) {
      list = list.filter((t) =>
        t.trophyName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort
    const dir = sortDirection === "ASC" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortMode) {
        case "NAME":
          return a.trophyName.localeCompare(b.trophyName) * dir;
        case "RARITY":
          return (
            (parseFloat(a.trophyEarnedRate ?? "0") -
              parseFloat(b.trophyEarnedRate ?? "0")) *
            dir
          );
        case "STATUS":
          return ((a.earned ? 1 : 0) - (b.earned ? 1 : 0)) * dir;
        case "DATE_EARNED":
          const dA = a.earnedDateTime ? new Date(a.earnedDateTime).getTime() : 0;
          const dB = b.earnedDateTime ? new Date(b.earnedDateTime).getTime() : 0;
          return (dA - dB) * dir;
        default:
          return (a.trophyId - b.trophyId) * dir;
      }
    });

    return list;
  }, [rawTrophyList, searchText, sortMode, sortDirection]);

  // 5. Group Data (DLCs)
  const groupedData = useMemo(() => {
    if (sortMode !== "DEFAULT") return null;

    const groups: any[] = [];
    const groupMap = new Map(trophyGroups.map((g) => [g.trophyGroupId, g]));
    const buckets = new Map<string, typeof processedTrophies>();

    processedTrophies.forEach((t) => {
      const gid = (t as any).trophyGroupId ?? "default";
      if (!buckets.has(gid)) buckets.set(gid, []);
      buckets.get(gid)?.push(t);
    });

    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
      if (a === "default") return -1;
      if (b === "default") return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    sortedKeys.forEach((key) => {
      const list = buckets.get(key) || [];
      const info = groupMap.get(key);
      const isBaseGame = key === "default" || key === "001" || key === "Main";
      const name = isBaseGame ? "Base Game" : info?.trophyGroupName || `Add-on ${key}`;

      // Stats Calculation
      const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      const earnedCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      let totalPoints = 0,
        earnedPoints = 0;
      const POINTS: Record<string, number> = {
        bronze: 15,
        silver: 30,
        gold: 90,
        platinum: 0,
      };

      list.forEach((t: any) => {
        const type = normalizeTrophyType(t.trophyType);
        counts[type]++;
        totalPoints += POINTS[type] || 0;
        if (t.earned) {
          earnedCounts[type]++;
          earnedPoints += POINTS[type] || 0;
        }
      });

      const progress =
        totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      groups.push({
        id: key,
        name,
        isBaseGame,
        trophies: list,
        counts,
        earnedCounts,
        progress,
      });
    });

    return groups;
  }, [processedTrophies, trophyGroups, sortMode]);

  // 6. Watchdog for "Just Earned" events
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

  // 7. Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSingleGame(gameId);
    await refreshAllTrophies();
    setRefreshing(false);
  };

  return {
    game,
    isInitialLoading,
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  };
}
