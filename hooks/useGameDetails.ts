// hooks/useGameDetails.ts
import { useEffect, useMemo, useRef, useState } from "react";
// 🟢 Ensure this import matches your HeaderActionBar export
import { SortMode } from "../components/HeaderActionBar";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";
import { useMarkRecentGame } from "../utils/makeRecent";
import { normalizeTrophyType } from "../utils/normalizeTrophy";

import masterGamesRaw from "../data/master_games.json";

// Types
type UnifiedGame = {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string;
  progress: number;
  earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  definedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  lastUpdatedDateTime: string | null;
  source: "USER" | "MASTER";
  trophyList?: any[];
  rawTrophyList?: any[];
};

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
  trophyGroupId?: string;
  trophyHidden?: boolean;
};

type TrophyGroup = {
  trophyGroupId: string;
  trophyGroupName: string;
  trophyGroupIconUrl?: string;
};

// 🟢 HELPER: Same normalization for consistency
const normalizePlatform = (raw: string | undefined | null) => {
  if (!raw) return "PSN";
  const p = raw.toUpperCase();
  if (p.includes("PS5")) return "PS5";
  if (p.includes("PS4")) return "PS4";
  if (p.includes("PS3")) return "PS3";
  if (p.includes("VITA")) return "PSVITA";
  return raw;
};

export function useGameDetails(
  gameId: string,
  searchText: string,
  sortMode: SortMode,
  sortDirection: "ASC" | "DESC"
) {
  const { trophies, accessToken, accountId, refreshSingleGame, refreshAllTrophies } =
    useTrophy();
  const markRecentGame = useMarkRecentGame();

  const [localTrophies, setLocalTrophies] = useState<GameTrophy[]>([]);
  const [trophyGroups, setTrophyGroups] = useState<TrophyGroup[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());

  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());

  // 1. IDENTIFY GAME
  const gameObject = useMemo<UnifiedGame | null>(() => {
    if (!gameId) return null;

    const ownedGame = trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(gameId)
    );

    const masterEntry = (masterGamesRaw as any[]).find((g) =>
      g.linkedVersions?.some((v: any) => v.npCommunicationId === gameId)
    );

    if (ownedGame) {
      // ✅ Case 1: OWNED (Prioritize User Data)
      return {
        npCommunicationId: ownedGame.npCommunicationId,
        trophyTitleName: masterEntry?.displayName || ownedGame.trophyTitleName,
        trophyTitleIconUrl: masterEntry?.art?.square || ownedGame.trophyTitleIconUrl,

        // 🟢 NORMALIZE HERE FOR DETAILS SCREEN
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
      // ✅ Case 2: UNOWNED (Use Master Data)
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

        // 🟢 NORMALIZE HERE TOO
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

  // 2. MARK RECENT
  useEffect(() => {
    if (gameObject && gameObject.source === "USER") {
      markRecentGame({
        npwr: String(gameObject.npCommunicationId),
        gameName: gameObject.trophyTitleName,
        platform: gameObject.trophyTitlePlatform,
      });
    }
  }, [gameObject?.npCommunicationId, gameObject?.source]);

  // 3. FETCH DETAILS
  useEffect(() => {
    if (!gameObject) return;

    if (gameObject.source === "MASTER") {
      setIsInitialLoading(false);
      return;
    }

    if (
      gameObject.source === "USER" &&
      gameObject.trophyList &&
      gameObject.trophyList.length > 0
    ) {
      setIsInitialLoading(false);
    }

    if (!accountId || !accessToken) return;

    const controller = new AbortController();
    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `${PROXY_BASE_URL}/api/trophies/${accountId}/${gameId}` +
            `?gameName=${encodeURIComponent(gameObject.trophyTitleName)}` +
            `&platform=${encodeURIComponent(gameObject.trophyTitlePlatform)}`,
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
  }, [accountId, accessToken, gameId, gameObject]);

  // 4. PROCESS TROPHIES
  const rawTrophyList = useMemo(() => {
    if (!gameObject) return [];

    if (gameObject.source === "MASTER") {
      return (gameObject.rawTrophyList || []).map((t: any) => ({
        trophyId: t.id,
        trophyName: t.name,
        trophyDetail: t.detail,
        trophyIconUrl: t.iconUrl,
        trophyType: t.type,
        trophyHidden: t.hidden,
        trophyGroupId: t.groupId || "default",
        earned: false,
        earnedDateTime: null,
        trophyEarnedRate: "0.0",
      }));
    }

    return ((gameObject.trophyList?.length ? gameObject.trophyList : localTrophies) ||
      []) as GameTrophy[];
  }, [gameObject, localTrophies]);

  const processedTrophies = useMemo(() => {
    let list = [...rawTrophyList];

    if (searchText) {
      const lower = searchText.toLowerCase();
      list = list.filter(
        (t) =>
          t.trophyName.toLowerCase().includes(lower) ||
          t.trophyDetail?.toLowerCase().includes(lower)
      );
    }

    const dir = sortDirection === "ASC" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortMode) {
        case "TITLE":
          return a.trophyName.localeCompare(b.trophyName) * dir;
        case "PROGRESS":
          return (
            (parseFloat(a.trophyEarnedRate ?? "0") -
              parseFloat(b.trophyEarnedRate ?? "0")) *
            dir
          );
        case "LAST_PLAYED":
          const dA = a.earnedDateTime ? new Date(a.earnedDateTime).getTime() : 0;
          const dB = b.earnedDateTime ? new Date(b.earnedDateTime).getTime() : 0;
          return (dA - dB) * dir;
        default:
          return (a.trophyId - b.trophyId) * dir;
      }
    });

    return list;
  }, [rawTrophyList, searchText, sortMode, sortDirection]);

  // 5. GROUP DATA
  const groupedData = useMemo(() => {
    if (sortMode !== "LAST_PLAYED" && sortMode !== "TITLE" && sortMode !== "PROGRESS")
      return null;

    const groups: any[] = [];
    const groupMap = new Map(trophyGroups.map((g) => [g.trophyGroupId, g]));
    const buckets = new Map<string, typeof processedTrophies>();

    processedTrophies.forEach((t) => {
      const gid = t.trophyGroupId ?? "default";
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
        if (counts[type] !== undefined) counts[type]++;
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

  // 6. WATCHDOG
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

  // 7. REFRESH
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
    isInitialLoading,
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  };
}
