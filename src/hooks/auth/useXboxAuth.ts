// hooks/auth/useXboxAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { useCallback } from "react";
import { Alert } from "react-native";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { useTrophy } from "../../../providers/TrophyContext";
import { generatePKCE } from "../../utils/authHelpers"; // 🟢 Import Helper

const CLIENT_ID = "5e278654-b281-411b-85f4-eb7fb056e5ba";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://auth";
const STORAGE_KEY_VERIFIER = "xbox_auth_verifier";

const DISCOVERY = {
  authorizationEndpoint:
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
  tokenEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
};

export function useXboxAuth() {
  const { setXboxProfile } = useTrophy();

  const exchangeCode = useCallback(
    async (code: string) => {
      try {
        const storedVerifier = await AsyncStorage.getItem(STORAGE_KEY_VERIFIER);
        if (!storedVerifier) throw new Error("State Loss: Verifier missing.");

        console.log("🔄 Exchanging Code...");

        const res = await fetch(`${PROXY_BASE_URL}/xbox/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri: REDIRECT_URI,
            codeVerifier: storedVerifier,
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

        await AsyncStorage.removeItem(STORAGE_KEY_VERIFIER);
        Alert.alert("Xbox Connected", `Logged in as ${data.gamertag}`);
      } catch (e: any) {
        Alert.alert("Xbox Login Failed", e.message);
      }
    },
    [setXboxProfile]
  );

  const login = useCallback(async () => {
    try {
      // 🟢 1. USE NEW HELPER
      const { codeVerifier, codeChallenge } = await generatePKCE();

      console.log("💾 Saving Verifier:", codeVerifier.substring(0, 5) + "...");
      await AsyncStorage.setItem(STORAGE_KEY_VERIFIER, codeVerifier);

      // 🟢 2. CREATE REQUEST
      const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        scopes: ["XboxLive.Signin", "offline_access"],
        responseType: AuthSession.ResponseType.Code,
        codeChallenge: codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: { prompt: "select_account" },
      });

      const result = await request.promptAsync(DISCOVERY);

      if (result.type === "success") {
        await exchangeCode(result.params.code);
      }
    } catch (e: any) {
      console.error("Xbox Auth Error:", e);
      Alert.alert("Error", e.message);
    }
  }, [exchangeCode]);

  return { login };
}
