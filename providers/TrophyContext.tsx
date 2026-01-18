import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { PROXY_BASE_URL } from "../config/endpoints";

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
  refreshSingleGame: (npwr: string) => Promise<void>;
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

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  const [trophies, setTrophies] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);

  // 🐶 WATCHDOG STATE
  const lastTotalTrophiesRef = useRef<number>(-1);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // 1. FETCH ALL TROPHIES (The Heavy Lifter)
  const refreshAllTrophies = async () => {
    if (!accessToken || !accountId) return;
    try {
      console.log("♻️ Refreshing all trophies...");
      const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setTrophies(data);

      // Update our watchdog baseline
      if (data.trophyTitles) {
        const total = calculateTotalTrophies(data.trophyTitles);
        lastTotalTrophiesRef.current = total;
      }
    } catch (err) {
      console.log("❌ Full trophy refresh failed", err);
    }
  };

  // 2. FETCH SINGLE GAME (Detailed)
  const refreshSingleGame = async (npwr: string) => {
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

      // Update Global State
      setTrophies((prev: any) => {
        if (!prev || !Array.isArray(prev.trophyTitles)) return prev;
        return {
          ...prev,
          trophyTitles: prev.trophyTitles.map((t: any) =>
            String(t.npCommunicationId) === String(npwr)
              ? {
                  ...t,
                  trophies: gameData.trophies,
                  progress: progress,
                  // We update the local progress immediately
                }
              : t
          ),
        };
      });
    } catch (err) {
      console.log("❌ Game refresh failed", err);
    }
  };

  // 🛠️ HELPER: Sum all trophies to get a single checksum number
  const calculateTotalTrophies = (titles: any[]) => {
    return titles.reduce((acc, t) => {
      if (!t.earnedTrophies) return acc;
      return (
        acc +
        t.earnedTrophies.bronze +
        t.earnedTrophies.silver +
        t.earnedTrophies.gold +
        t.earnedTrophies.platinum
      );
    }, 0);
  };

  // 🐶 THE WATCHDOG: Polls for changes
  useEffect(() => {
    if (!accessToken || !accountId) return;

    const checkTrophyCount = async () => {
      try {
        // Fetch Lightweight Summary
        const res = await fetch(`${PROXY_BASE_URL}/api/user/summary/${accountId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (data.earnedTrophies) {
          const newTotal =
            data.earnedTrophies.bronze +
            data.earnedTrophies.silver +
            data.earnedTrophies.gold +
            data.earnedTrophies.platinum;

          const oldTotal = lastTotalTrophiesRef.current;

          // INIT: If first run, just set it
          if (oldTotal === -1) {
            lastTotalTrophiesRef.current = newTotal;
            return;
          }

          // 🚨 CHANGE DETECTED
          if (newTotal > oldTotal) {
            console.log(
              `🏆 NEW TROPHY DETECTED! (${oldTotal} -> ${newTotal}) Triggering refresh...`
            );
            lastTotalTrophiesRef.current = newTotal; // Update ref immediately to prevent double-fire
            await refreshAllTrophies(); // 🚀 TRIGGER THE REFRESH
          }
        }
      } catch (e) {
        // Silent fail is fine here, it's just a poll
      }
    };

    // Run immediately on mount/auth
    checkTrophyCount();

    // Poll every 30 seconds
    const interval = setInterval(checkTrophyCount, 30000);

    // App State Listener (Refresh immediately when coming back to app)
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        console.log("📱 App resumed: Watchdog checking immediately...");
        checkTrophyCount();
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken, accountId]);

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

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => useContext(TrophyContext);
