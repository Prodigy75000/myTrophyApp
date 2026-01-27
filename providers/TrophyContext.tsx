// providers/TrophyContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage"; // 🟢 Import Storage
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

// 🟢 STORAGE KEYS
const KEY_ACCESS_TOKEN = "user_access_token";
const KEY_ACCOUNT_ID = "user_account_id";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type UserProfile = {
  onlineId: string | null;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;

type TrophyData = {
  trophyTitles: {
    npCommunicationId: string;
    trophyTitleName: string;
    earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
    [key: string]: any;
  }[];
  [key: string]: any;
};

type TrophyContextType = {
  trophies: TrophyData | null;
  setTrophies: (data: any) => void;
  refreshAllTrophies: () => Promise<void>;
  refreshSingleGame: (npwr: string) => Promise<void>;
  accountId: string | null;
  setAccountId: (id: string | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  logout: () => Promise<void>; // 🟢 Added Logout
};

// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

const TrophyContext = createContext<TrophyContextType | null>(null);

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  const [trophies, setTrophies] = useState<TrophyData | null>(null);
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);

  // 🟢 1. LOAD FROM DISK ON START
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(KEY_ACCESS_TOKEN);
        const storedId = await AsyncStorage.getItem(KEY_ACCOUNT_ID);

        if (storedToken && storedId) {
          console.log("💾 Session Restored from Disk:", storedId);
          setAccessTokenState(storedToken);
          setAccountIdState(storedId);
          // We assume user is valid if token exists, Profile fetch in index.tsx will fill details
          setUser({ onlineId: "Loading...", avatarUrl: null });
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    };
    loadSession();
  }, []);

  // 🟢 2. WRAPPERS TO SAVE TO DISK
  const setAccessToken = async (token: string | null) => {
    setAccessTokenState(token);
    if (token) await AsyncStorage.setItem(KEY_ACCESS_TOKEN, token);
    else await AsyncStorage.removeItem(KEY_ACCESS_TOKEN);
  };

  const setAccountId = async (id: string | null) => {
    setAccountIdState(id);
    if (id) await AsyncStorage.setItem(KEY_ACCOUNT_ID, id);
    else await AsyncStorage.removeItem(KEY_ACCOUNT_ID);
  };

  // 🟢 3. LOGOUT FUNCTION
  const logout = async () => {
    console.log("👋 Logging out...");
    await AsyncStorage.clear(); // Wipes everything
    setAccessTokenState(null);
    setAccountIdState(null);
    setUser(null);
    setTrophies(null);
  };

  // -------------------------------------------------------------------------
  // DATA FETCHING ACTIONS
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
  // WATCHDOG HOOK INTEGRATION
  // -------------------------------------------------------------------------

  const watchdog = useTrophyWatchdog({
    accessToken,
    accountId,
    onNewTrophyDetected: refreshAllTrophies,
  });

  // Sync Watchdog Baseline
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

  // -------------------------------------------------------------------------
  // PROVIDER VALUE
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
      logout, // 🟢 Export Logout
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
