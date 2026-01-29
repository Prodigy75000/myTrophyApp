import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { PROXY_BASE_URL } from "../../config/endpoints";

type Props = {
  onSuccess: (data: any) => void;
};

const CLIENT_ID = "5e278654-b281-411b-85f4-eb7fb056e5ba"; // <-- put your real one here

// Use your app scheme (the one in app.json -> expo.scheme)
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "com.scee.psxandroid.scecompcall",
  path: "auth", // <--- This adds the "/auth" to match Azure
});

export default function XboxLoginButton({ onSuccess }: Props) {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["XboxLive.Signin", "offline_access"],
      responseType: AuthSession.ResponseType.Code,
      // For PKCE (recommended)
      usePKCE: true,
      extraParams: {
        // Azure v2 endpoint likes this
        prompt: "select_account",
      },
    },
    {
      authorizationEndpoint:
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
      tokenEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    }
  );

  useEffect(() => {
    const run = async () => {
      if (!response) return;

      if (response.type === "success") {
        const { code } = response.params;

        try {
          // Send code to YOUR server to exchange for tokens securely
          const res = await fetch(`${PROXY_BASE_URL}/xbox/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              redirectUri: REDIRECT_URI,
              // Include PKCE verifier if you use PKCE and do exchange server-side
              codeVerifier: request?.codeVerifier,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "Token exchange failed");
          }

          onSuccess(data);
        } catch (e: any) {
          Alert.alert("Xbox Login Failed", e?.message ?? "Unknown error");
        }
      } else if (response.type === "error") {
        Alert.alert("Xbox Login Error", JSON.stringify(response.params));
      }
    };

    run();
  }, [response, onSuccess, request?.codeVerifier]);

  return (
    <TouchableOpacity
      style={[styles.btn, !request && styles.btnDisabled]}
      disabled={!request}
      onPress={() => promptAsync()}
    >
      <Ionicons name="logo-xbox" size={18} color="white" />
      <Text style={styles.text}>Sign in with Xbox</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#107c10",
  },
  btnDisabled: { opacity: 0.5 },
  text: { color: "white", fontWeight: "700" },
});
