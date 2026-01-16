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
  const { recentGamesRef } = useRecentGames();
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
      const earned = trophyList ? trophyList.filter((t) => t.earned).length : 0;
      const total = trophyList ? trophyList.length : 0;
      const progress = total > 0 ? Math.floor((earned / total) * 100) : 0;

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
                  progress, // 🔑 THIS is what index needs
                }
              : t
          ),
        };
      });

      console.log(`🔄 Game ${npwr} refreshed (progress ${progress}%)`);
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
          earned: g.trophies?.earned,
        }))
      );

      // 🔥 ESCALATION — side effect (SAFE here)
      const latestNpwr = Array.from(recentGamesRef.current.values()).at(-1)?.npwr;

      if (games.length > 0 && latestNpwr) {
        console.log("🎯 Escalating refresh for latest game:", latestNpwr);
        refreshSingleGame(String(latestNpwr));
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

          const prevEarned = title.trophies?.earned ?? 0;
          const nextEarned = updated.trophies?.earned ?? 0;

          if (prevEarned !== nextEarned) {
            hasAnyDelta = true;
          }

          return {
            ...title,
            trophies: updated.trophies,
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
