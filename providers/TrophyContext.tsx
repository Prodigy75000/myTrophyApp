// providers/TrophyContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { XboxProfile, XboxTitle } from "../types/XboxTypes"; // Import types
import { calculateTotalTrophies } from "../utils/trophyCalculations";

// STORAGE KEYS
const KEY_ACCESS_TOKEN = "user_access_token";
const KEY_REFRESH_TOKEN = "user_refresh_token";
const KEY_EXPIRES_AT = "user_token_expires_at";
const KEY_ACCOUNT_ID = "user_account_id";
const KEY_ONLINE_ID = "user_online_id";
const KEY_AVATAR_URL = "user_avatar_url";

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
  logout: () => Promise<void>;
  handleLoginResponse: (data: any) => Promise<void>;
  xboxTitles: XboxTitle[];
  setXboxTitles: (titles: XboxTitle[]) => void;
  xboxProfile: XboxProfile | null;
  setXboxProfile: (profile: XboxProfile | null) => void;
};

const TrophyContext = createContext<TrophyContextType | null>(null);

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  const [trophies, setTrophies] = useState<TrophyData | null>(null);
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);
  const [xboxTitles, setXboxTitles] = useState<XboxTitle[]>([]);
  const [xboxProfile, setXboxProfile] = useState<XboxProfile | null>(null);

  // 🟢 HELPER: SAVE SESSION TO DISK
  const handleLoginResponse = async (data: any) => {
    const now = Date.now();
    const expiresIn = data.expiresIn || 3600;
    const expiresAt = now + expiresIn * 1000;

    setAccessTokenState(data.accessToken);
    setAccountIdState(data.accountId);

    // Set User State
    if (data.onlineId) {
      setUser({
        onlineId: data.onlineId,
        avatarUrl: data.avatarUrl,
        trophyLevel: user?.trophyLevel,
        progress: user?.progress,
      });
    }

    // Save to Disk
    const pairs: [string, string][] = [
      [KEY_ACCESS_TOKEN, data.accessToken],
      [KEY_ACCOUNT_ID, data.accountId],
      [KEY_EXPIRES_AT, expiresAt.toString()],
    ];

    if (data.refreshToken) pairs.push([KEY_REFRESH_TOKEN, data.refreshToken]);
    if (data.onlineId) pairs.push([KEY_ONLINE_ID, data.onlineId]);
    if (data.avatarUrl) pairs.push([KEY_AVATAR_URL, data.avatarUrl]);

    await AsyncStorage.multiSet(pairs);
  };

  // 🟢 NEW HELPER: Fetch Profile manually (Self-Healing)
  const fetchUserProfile = async (id: string, token: string) => {
    try {
      console.log("👤 [Self-Heal] Fetching missing profile data...");
      const res = await fetch(`${PROXY_BASE_URL}/api/user/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ [Self-Heal] Profile Updated:", data.onlineId);

        // Update State
        setUser({ onlineId: data.onlineId, avatarUrl: data.avatarUrl });

        // Update Disk (So we don't fetch next time)
        if (data.onlineId) await AsyncStorage.setItem(KEY_ONLINE_ID, data.onlineId);
        // Look for large avatar (l) or fallback to first one
        const avatar =
          data.avatars?.find((a: any) => a.size === "l")?.url || data.avatars?.[0]?.url;
        if (avatar) await AsyncStorage.setItem(KEY_AVATAR_URL, avatar);
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch profile", e);
    }
  };

  // 🟢 1. LOAD & AUTO-REFRESH ON START
  useEffect(() => {
    const loadSession = async () => {
      try {
        const values = await AsyncStorage.multiGet([
          KEY_ACCESS_TOKEN,
          KEY_ACCOUNT_ID,
          KEY_REFRESH_TOKEN,
          KEY_EXPIRES_AT,
          KEY_ONLINE_ID,
          KEY_AVATAR_URL,
        ]);

        const storedToken = values[0][1];
        const storedId = values[1][1];
        const storedRefresh = values[2][1];
        const storedExpiry = values[3][1];
        const storedName = values[4][1];
        const storedAvatar = values[5][1];

        if (storedToken && storedId) {
          const now = Date.now();
          const expiresAt = storedExpiry ? parseInt(storedExpiry, 10) : 0;

          // A. CHECK EXPIRATION
          if (storedRefresh && now > expiresAt - 5 * 60 * 1000) {
            console.log("⚠️ Token Expired! Attempting Refresh...");
            try {
              const res = await fetch(`${PROXY_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: storedRefresh }),
              });

              if (res.ok) {
                const newData = await res.json();
                console.log("✅ Session Refreshed Successfully!");
                await handleLoginResponse({ ...newData, accountId: storedId });
                return;
              } else {
                console.log("❌ Refresh Failed - Logging out");
                await logout();
                return;
              }
            } catch (err) {
              console.log("❌ Refresh Failed (Network) - Logging out");
              await logout();
              return;
            }
          }

          // B. RESTORE SESSION
          console.log("💾 Session Valid & Restored");
          setAccessTokenState(storedToken);
          setAccountIdState(storedId);

          if (storedName) {
            // Perfect scenario: We have everything
            setUser({ onlineId: storedName, avatarUrl: storedAvatar });
          } else {
            // 🟢 MISSING DATA SCENARIO: We have token, but no name.
            // Set placeholder, then fetch immediately.
            setUser({ onlineId: "Loading...", avatarUrl: null });
            fetchUserProfile(storedId, storedToken);
          }
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    };
    loadSession();
  }, []);

  // 🟢 2. LOGOUT
  const logout = async () => {
    console.log("👋 Logging out...");
    await AsyncStorage.clear();
    setAccessTokenState(null);
    setAccountIdState(null);
    setUser(null);
    setTrophies(null);
  };

  // 🟢 3. HELPERS
  const setAccessToken = (token: string | null) => setAccessTokenState(token);
  const setAccountId = (id: string | null) => setAccountIdState(id);

  // DATA FETCHING
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

        const trophyList = gameData.trophies || [];
        const earned = trophyList.filter((t: any) => t.earned).length;
        const total = trophyList.length;
        const progress = total > 0 ? Math.floor((earned / total) * 100) : 0;

        setTrophies((prev) => {
          if (!prev || !Array.isArray(prev.trophyTitles)) return prev;
          return {
            ...prev,
            trophyTitles: prev.trophyTitles.map((t) =>
              String(t.npCommunicationId) === String(npwr)
                ? { ...t, trophies: gameData.trophies, progress: progress }
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

  const watchdog = useTrophyWatchdog({
    accessToken,
    accountId,
    isReady: !!trophies,
    onNewTrophyDetected: refreshAllTrophies,
  });

  useEffect(() => {
    if (trophies?.trophyTitles) {
      const total = calculateTotalTrophies(trophies.trophyTitles);
      watchdog.updateBaseline(total);
    }
  }, [trophies]);

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
      logout,
      handleLoginResponse,
      xboxTitles, // 🟢 Added
      setXboxTitles, // 🟢 Added
      xboxProfile, // 🟢 Added
      setXboxProfile, // 🟢 Added
    }),
    [
      trophies,
      accountId,
      accessToken,
      user,
      refreshAllTrophies,
      refreshSingleGame,
      xboxTitles,
      xboxProfile,
    ]
  );

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => {
  const ctx = useContext(TrophyContext);
  if (!ctx) throw new Error("useTrophy must be used within TrophyProvider");
  return ctx;
};
