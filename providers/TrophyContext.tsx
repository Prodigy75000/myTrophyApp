/**
 * TrophyContext
 * - Global app state for PSN session + trophies
 * - TEMP: owns trophies fetching & silent refresh logic
 * - Future: fetch logic will move to a dedicated data layer
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  useEffect(() => {
    if (!accessToken || !accountId) return;

    let cancelled = false;
    // NOTE: Using EXPO_PUBLIC_PROXY_BASE_URL directly here.
    // Will be unified with config/endpoints.ts after audit.
    const fetchTrophies = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_PROXY_BASE_URL}/api/trophies/${accountId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await res.json();
        if (!cancelled) {
          setTrophies(data);
        }

        // 🔁 ONE silent re-fetch to pick up full cache
        setTimeout(async () => {
          try {
            const res2 = await fetch(
              `${process.env.EXPO_PUBLIC_PROXY_BASE_URL}/api/trophies/${accountId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const data2 = await res2.json();
            if (!cancelled) {
              setTrophies(data2);
            }
          } catch {
            // silent
          }
        }, 1500);
      } catch (err) {
        console.log("❌ Trophy fetch failed", err);
      }
    };

    fetchTrophies();

    return () => {
      cancelled = true;
    };
  }, [accessToken, accountId]);
  useDeltaRefresh({
    accessToken,
    accountId,
    onResults: (games: any[]) => {
      setTrophies((prev: any) => {
        if (!prev || !Array.isArray(prev.trophyTitles)) return prev;

        const updatedTitles = prev.trophyTitles.map((title: any) => {
          const updated = games.find(
            (g: any) => String(g.npwr) === String(title.npCommunicationId)
          );

          if (!updated) return title;

          return {
            ...title,
            trophies: updated.trophies,
          };
        });
        const prevEarned = prev.trophyTitles.reduce(
          (sum: number, t: any) => sum + (t.earnedTrophies ?? 0),
          0
        );
        const nextEarned = updatedTitles.reduce(
          (sum: number, t: any) => sum + (t.trophies?.earned ?? 0),
          0
        );

        if (nextEarned <= prevEarned) {
          return prev; // 🚫 no re-render
        }
        console.log("🏆 Trophy count increased:", prevEarned, "→", nextEarned);
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
