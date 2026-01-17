/**
 * TrophyContext
 * - Global app state for PSN session + trophies
 * - TEMP: owns trophies fetching & silent refresh logic
 * - Future: fetch logic will move to a dedicated data layer
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useRecentGames } from "../context/RecentGamesContext";
import { useDeltaRefresh } from "../utils/useDeltaRefresh";

export type UserProfile = {
  onlineId: string;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;
type TrophyItem = {
  trophyId: number;
  trophyName: string;
  earned?: boolean;
  earnedDateTime?: string | null;
};
type TrophyContextType = {
  trophies: any;
  setTrophies: (data: any) => void;

  refreshAllTrophies: () => Promise<void>;
  refreshSingleGame: (npwr: string) => Promise<void>; // 👈 NEW

  accountId: string | null;
  setAccountId: (id: string | null) => void;

  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  user: UserProfile;
  setUser: (u: UserProfile) => void;
};

const TrophyContext = createContext<TrophyContextType>({
  trophies: null,
  setTrophies: () => {},

  refreshAllTrophies: async () => {},
  refreshSingleGame: async () => {},

  accountId: null,
  setAccountId: () => {},

  accessToken: null,
  setAccessToken: () => {},

  user: null,
  setUser: () => {},
});

//console.log("🧩 Provider instance loaded");

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  // TODO: replace `any` with TrophyTitles model once schema is stable
  const [trophies, setTrophies] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);
  const { latestGameRef } = useRecentGames();
  function computeProgressFromCounts(trophies: any) {
    if (!trophies?.earned || !trophies?.defined) return null;

    const earnedTotal =
      trophies.earned.bronze +
      trophies.earned.silver +
      trophies.earned.gold +
      trophies.earned.platinum;

    const definedTotal =
      trophies.defined.bronze +
      trophies.defined.silver +
      trophies.defined.gold +
      trophies.defined.platinum;

    if (definedTotal === 0) return null;

    return Math.floor((earnedTotal / definedTotal) * 100);
  }
  const refreshAllTrophies = async () => {
    if (!accessToken || !accountId) return;

    try {
      const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      setTrophies(data);
    } catch (err) {
      console.log("❌ Full trophy refresh failed", err);
    }
  };
  useEffect(() => {
    if (!accessToken || !accountId) return;

    let cancelled = false;

    const run = async () => {
      await refreshAllTrophies();

      // 🔁 optional second pass (keep your existing behavior)
      setTimeout(async () => {
        if (!cancelled) {
          await refreshAllTrophies();
        }
      }, 1500);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [accessToken, accountId]);
  const refreshSingleGame = async (npwr: string) => {
    if (!accessToken || !accountId) return;

    try {
      const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}/${npwr}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const gameData = await res.json();

      // ✅ ADD THIS (missing piece)

      const trophyList = gameData.trophyList as TrophyItem[] | undefined;
      let progress: number | null = null;

      if (Array.isArray(trophyList) && trophyList.length > 0) {
        const earned = trophyList.filter((t) => t.earned).length;
        const total = trophyList.length;
        progress = Math.floor((earned / total) * 100);
      }
      setTrophies((prev: any) => {
        if (!prev || !Array.isArray(prev.trophyTitles)) return prev;

        return {
          ...prev,
          trophyTitles: prev.trophyTitles.map((t: any) =>
            String(t.npCommunicationId) === String(npwr)
              ? {
                  ...t,
                  trophies: gameData.trophies,
                  trophyList: gameData.trophyList,
                  progress: progress !== null ? progress : t.progress,
                }
              : t
          ),
        };
      });

      if (progress !== null) {
        console.log(`🔄 Game ${npwr} refreshed (progress ${progress}%)`);
      } else {
        console.log(`🔄 Game ${npwr} refreshed (progress unchanged)`);
      }
    } catch (err) {
      console.log("❌ Game refresh failed", err);
    }
  };
  useDeltaRefresh({
    accessToken,
    accountId,
    trophyTitles: trophies?.trophyTitles ?? null,
    onResults: (games: any[]) => {
      console.log(
        "🔎 Delta refresh games:",
        games.map((g) => ({
          npwr: g.npwr,
          earned: typeof g.trophies?.earned === "number" ? g.trophies.earned : null,
        }))
      );

      // 🔥 ESCALATION — side effect (SAFE here)
      const latest = latestGameRef.current;

      if (games.length > 0 && latest) {
        console.log("🎯 Escalating refresh for latest game:", latest.npwr);
        refreshSingleGame(String(latest.npwr));
      }

      // 🧠 PURE state update (counts only)
      setTrophies((prev: any) => {
        if (!prev || !Array.isArray(prev.trophyTitles)) return prev;

        let hasAnyDelta = false;

        const updatedTitles = prev.trophyTitles.map((title: any) => {
          const updated = games.find(
            (g: any) => String(g.npwr) === String(title.npCommunicationId)
          );

          if (!updated) return title;

          const prevEarned = title.earnedTrophies
            ? title.earnedTrophies.bronze +
              title.earnedTrophies.silver +
              title.earnedTrophies.gold +
              title.earnedTrophies.platinum
            : 0;

          const nextEarned = updated.trophies?.earned
            ? updated.trophies.earned.bronze +
              updated.trophies.earned.silver +
              updated.trophies.earned.gold +
              updated.trophies.earned.platinum
            : prevEarned;

          if (prevEarned !== nextEarned) {
            hasAnyDelta = true;
          }

          const mergedTrophies = updated.trophies ?? title.trophies;

          let nextProgress = title.progress;

          // ✅ recompute progress ONLY if earned actually changed
          if (
            updated.trophies &&
            title.trophies &&
            updated.trophies.earned !== title.trophies.earned
          ) {
            const computed = computeProgressFromCounts(mergedTrophies);
            if (computed !== null) {
              nextProgress = computed;
            }
          }

          return {
            ...title,
            trophies: mergedTrophies,

            earnedTrophies: mergedTrophies?.earned
              ? {
                  bronze: mergedTrophies.earned.bronze,
                  silver: mergedTrophies.earned.silver,
                  gold: mergedTrophies.earned.gold,
                  platinum: mergedTrophies.earned.platinum,
                }
              : title.earnedTrophies,

            definedTrophies: mergedTrophies?.defined
              ? {
                  bronze: mergedTrophies.defined.bronze,
                  silver: mergedTrophies.defined.silver,
                  gold: mergedTrophies.defined.gold,
                  platinum: mergedTrophies.defined.platinum,
                }
              : title.definedTrophies,

            progress: nextProgress,
          };
        });

        if (!hasAnyDelta) return prev;

        return {
          ...prev,
          trophyTitles: updatedTitles,
        };
      });
    },
  });
  const value = useMemo(
    () => ({
      trophies,
      setTrophies,
      refreshAllTrophies,
      refreshSingleGame,
      accountId,
      setAccountId,
      accessToken,
      setAccessToken,
      user,
      setUser,
    }),
    [trophies, accountId, accessToken, user]
  );

  // console.log("🧩 Provider trophies updated:", trophies?.trophyTitles?.length);

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => useContext(TrophyContext);
