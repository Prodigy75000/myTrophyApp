/**
 * TrophyContext
 * - Global app state for PSN session + trophies
 * - TEMP: owns trophies fetching & silent refresh logic
 * - Future: fetch logic will move to a dedicated data layer
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useDeltaRefresh } from "../utils/useDeltaRefresh";

export type UserProfile = {
  onlineId: string;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;

type TrophyContextType = {
  trophies: any;
  setTrophies: (data: any) => void;

  refreshAllTrophies: () => Promise<void>;

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
  useDeltaRefresh({
    accessToken,
    accountId,
    trophyTitles: trophies?.trophyTitles ?? null,
    onResults: (games: any[]) => {
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

        if (!hasAnyDelta) {
          return prev; // 🚫 no meaningful change → no re-render
        }

        console.log("🏆 Trophy delta detected via Tier-1 refresh");

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
