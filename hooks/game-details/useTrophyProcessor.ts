// hooks/game-details/useTrophyProcessor.ts
import { useMemo } from "react";
import { SortMode } from "../../components/HeaderActionBar";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";
import { GameTrophy, TrophyGroup, UnifiedGame } from "./types";

export function useTrophyProcessor(
  gameObject: UnifiedGame | null,
  localTrophies: GameTrophy[],
  trophyGroups: TrophyGroup[],
  fetchedId: string | null,
  gameId: string,
  searchText: string,
  sortMode: SortMode,
  sortDirection: "ASC" | "DESC"
) {
  // 1. Merge Raw List
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

    if (gameObject.trophyList && gameObject.trophyList.length > 0) {
      return gameObject.trophyList as GameTrophy[];
    }

    if (fetchedId === gameId) {
      return localTrophies;
    }

    return [];
  }, [gameObject, localTrophies, fetchedId, gameId]);

  // 2. Sort & Filter
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

  // 3. Group
  const groupedData = useMemo(() => {
    if (processedTrophies.length === 0) return null;
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

  return { processedTrophies, groupedData };
}
