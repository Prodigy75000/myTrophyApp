import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { UserProfile } from "../../types/ContextTypes";

const KEY_ACCESS_TOKEN = "user_access_token";
const KEY_REFRESH_TOKEN = "user_refresh_token";
const KEY_EXPIRES_AT = "user_token_expires_at";
const KEY_ACCOUNT_ID = "user_account_id";
const KEY_ONLINE_ID = "user_online_id";
const KEY_AVATAR_URL = "user_avatar_url";

export function usePsnAuth() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);

  // 1. LOGOUT
  const logout = useCallback(async () => {
    console.log("👋 Logging out...");
    await AsyncStorage.clear();
    setAccessToken(null);
    setAccountId(null);
    setUser(null);
  }, []);

  // 2. SAVE LOGIN
  const handleLoginResponse = useCallback(async (data: any) => {
    const now = Date.now();
    const expiresIn = data.expiresIn || 3600;
    const expiresAt = now + expiresIn * 1000;

    setAccessToken(data.accessToken);
    setAccountId(data.accountId);

    if (data.onlineId) {
      setUser({
        onlineId: data.onlineId,
        avatarUrl: data.avatarUrl,
      });
    }

    const pairs: [string, string][] = [
      [KEY_ACCESS_TOKEN, data.accessToken],
      [KEY_ACCOUNT_ID, data.accountId],
      [KEY_EXPIRES_AT, expiresAt.toString()],
    ];

    if (data.refreshToken) pairs.push([KEY_REFRESH_TOKEN, data.refreshToken]);
    if (data.onlineId) pairs.push([KEY_ONLINE_ID, data.onlineId]);
    if (data.avatarUrl) pairs.push([KEY_AVATAR_URL, data.avatarUrl]);

    await AsyncStorage.multiSet(pairs);
  }, []);

  // 3. AUTO LOAD SESSION
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

        const [token, id, refresh, expiry, name, avatar] = values.map((v) => v[1]);

        if (token && id) {
          const now = Date.now();
          const expiresAt = expiry ? parseInt(expiry, 10) : 0;

          // Check Expiry
          if (refresh && now > expiresAt - 5 * 60 * 1000) {
            console.log("⚠️ Token Expired! Attempting Refresh...");
            try {
              const res = await fetch(`${PROXY_BASE_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: refresh }),
              });

              if (res.ok) {
                const newData = await res.json();
                console.log("✅ Session Refreshed Successfully!");
                await handleLoginResponse({ ...newData, accountId: id });
                return;
              } else {
                await logout();
                return;
              }
            } catch (err) {
              await logout();
              return;
            }
          }

          console.log("💾 PSN Session Valid");
          setAccessToken(token);
          setAccountId(id);
          setUser({ onlineId: name || "Loading...", avatarUrl: avatar });
        }
      } catch (e) {
        console.error("Failed to load PSN session", e);
      }
    };
    loadSession();
  }, [logout, handleLoginResponse]);

  return {
    accountId,
    setAccountId,
    accessToken,
    setAccessToken,
    user,
    setUser,
    logout,
    handleLoginResponse,
  };
}
