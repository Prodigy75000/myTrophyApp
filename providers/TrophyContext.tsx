// providers/TrophyContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophyWatchdog } from "../hooks/useTrophyWatchdog";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type UserProfile = {
  onlineId: string | null;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;
[];
type TrophyData = {
  trophyTitles: {
    npCommunicationId: string;
    trophyTitleName: string;
    earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
    [key: string]: any;
  }[];
  [key: string]: any; // FIX: Added "any"
};

type TrophyContextType = {
  trophies: TrophyData | null;
  setTrophies: (data: any) => void; // FIX: Fixed typo "s[]tTrophies"
  refreshAllTrophies: () => Promise<void>;
  refreshSingleGame: (npwr: string) => Promise<void>;
  accountId: string | null;
  setAccountId: (id: string | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
};

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

const TrophyContext = createContext<TrophyContextType | null>(null);

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  const [trophies, setTrophies] = useState<TrophyData | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);

  // -------------------------------------------------------------------------
  // 1. DATA FETCHING ACTIONS
  // -------------------------------------------------------------------------

  const refreshAllTrophies = useCallback(async () => {
    if (!accessToken || !accountId) return;
    try {
      console.log("♻️ [TrophyContext] Refreshing all trophies...");
      const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setTrophies(data);
    } catch (err) {
      console.error("❌ [TrophyContext] Full refresh failed", err);
    }
  }, [accessToken, accountId]);

  const refreshSingleGame = useCallback(
    async (npwr: string) => {
      if (!accessToken || !accountId) return;
      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}/${npwr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const gameData = await res.json();

        // Calculate progress locally
        const trophyList = gameData.trophies || [];
        const earned = trophyList.filter((t: any) => t.earned).length;
        const total = trophyList.length;
        const progress = total > 0 ? Math.floor((earned / total) * 100) : 0;

        // Optimistically update global state
        setTrophies((prev) => {
          if (!prev || !Array.isArray(prev.trophyTitles)) return prev;
          return {
            ...prev,
            trophyTitles: prev.trophyTitles.map((t) =>
              String(t.npCommunicationId) === String(npwr)
                ? {
                    ...t,
                    trophies: gameData.trophies,
                    progress: progress,
                  }
                : t
            ),
          };
        });
      } catch (err) {
        console.error("❌ [TrophyContext] Game refresh failed", err);
      }
    },
    [accessToken, accountId]
  );

  // -------------------------------------------------------------------------
  // 2. WATCHDOG HOOK INTEGRATION
  // -------------------------------------------------------------------------

  const watchdog = useTrophyWatchdog({
    accessToken,
    accountId,
    onNewTrophyDetected: refreshAllTrophies,
  });

  // FIX: Sync Watchdog Baseline when `trophies` changes
  useEffect(() => {
    if (trophies?.trophyTitles) {
      const total = trophies.trophyTitles.reduce((acc, t) => {
        if (!t.earnedTrophies) return acc;
        return (
          acc +
          t.earnedTrophies.bronze +
          t.earnedTrophies.silver +
          t.earnedTrophies.gold +
          t.earnedTrophies.platinum
        );
      }, 0);
      watchdog.updateBaseline(total);
    }
  }, [trophies]);

  // 🔎 TEMP DEBUG: verify Ragnarök trophy title entries exist in the loaded library
  useEffect(() => {
    const list = trophies?.trophyTitles;
    if (!Array.isArray(list)) return;

    const dump = (npwr: string) => {
      const hit = list.find((t: any) => String(t.npCommunicationId) === String(npwr));
      console.log(
        `[NPWR CHECK] ${npwr}:`,
        hit
          ? {
              name: hit.trophyTitleName,
              platform: hit.trophyTitlePlatform || hit.platform, // PSN responses often use trophyTitlePlatform
              progress: hit.progress,
              earnedTrophies: hit.earnedTrophies,
            }
          : "NOT FOUND"
      );
    };

    dump("NPWR22392_00"); // God of War Ragnarök PS5 (your master)
    dump("NPWR26627_00"); // God of War Ragnarök PS4 (your master)
  }, [trophies]);
  // -------------------------------------------------------------------------
  // 3. PROVIDER VALUE
  // -------------------------------------------------------------------------

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
    [trophies, accountId, accessToken, user, refreshAllTrophies, refreshSingleGame]
  );

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => {
  const ctx = useContext(TrophyContext);
  if (!ctx) throw new Error("useTrophy must be used within TrophyProvider");
  return ctx;
};
