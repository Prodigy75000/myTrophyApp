// src/hooks/auth/useXboxAuth.ts
import * as AuthSession from "expo-auth-session";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { useTrophy } from "../../../providers/TrophyContext";

const CLIENT_ID = "5e278654-b281-411b-85f4-eb7fb056e5ba";

// 🟢 Helper to match the redirect URI exactly
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "com.scee.psxandroid.scecompcall",
  path: "auth",
});

const DISCOVERY = {
  authorizationEndpoint:
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
  tokenEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
};

export function useXboxAuth() {
  const { setXboxProfile } = useTrophy();

  // 🟢 GUARD: Prevents the "Double-Exchange" bug in development
  const exchangingRef = useRef(false);

  // 🟢 HOOK: Expo handles the entire lifecycle (Key generation + Validation)
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["XboxLive.Signin", "offline_access"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true, // Automatically handles S256 Challenge & Verifier
      extraParams: { prompt: "select_account" },
    },
    DISCOVERY
  );

  useEffect(() => {
    const handleExchange = async () => {
      // 1. Validation Checks
      if (response?.type !== "success") return;
      if (exchangingRef.current) return; // 🛑 Stop if we are already exchanging

      const code = response.params.code;
      const codeVerifier = request?.codeVerifier;

      if (!codeVerifier) {
        Alert.alert("Login Error", "State mismatch: PKCE Verifier is missing.");
        return;
      }

      // 2. Lock the guard
      exchangingRef.current = true;

      try {
        console.log("🔄 Exchanging Code (Hook Managed)...");

        const res = await fetch(`${PROXY_BASE_URL}/xbox/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri: REDIRECT_URI,
            codeVerifier,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Exchange Failed");

        console.log("✅ Xbox Connected:", data.gamertag);

        setXboxProfile({
          gamertag: data.gamertag,
          gamerpic: data.gamerpic,
          xuid: data.xuid,
        });

        Alert.alert("Xbox Connected", `Logged in as ${data.gamertag}`);
      } catch (e: any) {
        console.error("Xbox Auth Error:", e);
        Alert.alert("Xbox Login Failed", e.message);
        // Unlock on error so user can try again
        exchangingRef.current = false;
      }
    };

    handleExchange();
  }, [response, request, setXboxProfile]);

  const login = useCallback(() => {
    if (request) {
      // Reset guard when user manually initiates a new login
      exchangingRef.current = false;
      promptAsync();
    }
  }, [request, promptAsync]);

  return { login };
}
