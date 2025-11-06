import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import WebView from "react-native-webview";

export default function HomeScreen() {
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [trophies, setTrophies] = useState<any>(null);

  // 👉 Local backend during dev (make sure this matches your machine IP)
  const PROXY_BASE_URL = "http://192.168.1.151:4000";

  // ---- LOGIN & FETCH TROPHIES ----
const handlePSNLogin = async () => {
  try {
    setLoading(true);
    console.log("🔑 Connecting to PSN...");

    // Step 1️⃣ — Login to get access token + account ID
    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);
    const loginData = await loginRes.json();

    if (!loginData.accessToken) {
      throw new Error("No access token received from backend");
    }

    console.log("✅ Access Token:", loginData.accessToken);
    console.log("👤 Account ID:", loginData.accountId);

    setAccessToken(loginData.accessToken);
    setAccountId(loginData.accountId);

    // Step 2️⃣ — Fetch trophies from backend (which calls Sony)
    const trophiesRes = await fetch(
      `${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Accept-Language": "en-US", // sometimes required by Sony
        },
      }
    );

    const trophiesData = await trophiesRes.json();
    console.log("🏆 Trophy data:", trophiesData);

    // Handle known errors cleanly
    if (trophiesRes.status === 401 || trophiesData?.error?.includes("Invalid")) {
      console.warn("⚠️ Token expired or invalid — retrying login...");
      Alert.alert("Session expired", "Refreshing your login, please wait...");
      await handlePSNLogin(); // retry once
      return;
    }

    if (trophiesData?.error) {
      throw new Error(trophiesData.error.message || JSON.stringify(trophiesData));
    }

    // Success 🎉
    setTrophies(trophiesData);
    Alert.alert("PSN login success!", "Trophies successfully fetched!");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    Alert.alert("Login failed", err.message);
  } finally {
    setLoading(false);
  }
};

  // ---- Optional WebView (for future auth UX) ----
  if (showWebView) {
    return (
      <View style={{ flex: 1 }}>
        {loading && (
          <ActivityIndicator
            size="large"
            color="gold"
            style={{ position: "absolute", top: "50%", left: "50%" }}
          />
        )}
        <WebView
          source={{ uri: authUrl }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
        />
      </View>
    );
  }

  // ---- UI ----
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        paddingVertical: 40,
      }}
    >
      <Text style={{ fontSize: 24, color: "gold", marginBottom: 30 }}>
        🏆 Welcome to Trophy Hub
      </Text>

      {/* PlayStation */}
      <TouchableOpacity
        onPress={handlePSNLogin}
        style={{
          backgroundColor: "#003791",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image
          source={require("../assets/logos/ps.png")}
          style={{ width: 22, height: 22, marginRight: 10 }}
        />
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Sign in with PlayStation
        </Text>
      </TouchableOpacity>

      {/* Xbox */}
      <TouchableOpacity
        onPress={() => setAuthUrl("https://account.microsoft.com/account")}
        style={{
          backgroundColor: "#107C10",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image
          source={require("../assets/logos/xbox.png")}
          style={{ width: 22, height: 22, marginRight: 10 }}
        />
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Sign in with Xbox
        </Text>
      </TouchableOpacity>

      {/* Steam */}
      <TouchableOpacity
        onPress={() => setAuthUrl("https://store.steampowered.com/login/")}
        style={{
          backgroundColor: "#171A21",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image
          source={require("../assets/logos/steam.png")}
          style={{ width: 22, height: 22, marginRight: 10 }}
        />
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Sign in with Steam
        </Text>
      </TouchableOpacity>

      {/* Google Play */}
      <TouchableOpacity
        onPress={() =>
          setAuthUrl("https://play.google.com/store/myplayactivity/")
        }
        style={{
          backgroundColor: "#EFEFF0",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image
          source={require("../assets/logos/googleplay.png")}
          style={{ width: 22, height: 22, marginRight: 10 }}
        />
        <Text style={{ color: "black", fontWeight: "bold" }}>
          Sign in with Google Play
        </Text>
      </TouchableOpacity>

      {/* Trophies Preview */}
      {trophies && (
        <View style={{ marginTop: 30, alignItems: "flex-start", width: "90%" }}>
          <Text style={{ color: "gold", fontSize: 18, fontWeight: "bold" }}>
            Trophy Summary
          </Text>
          <Text style={{ color: "white", marginTop: 8 }}>
            Total Titles: {trophies.totalItemCount}
          </Text>
          {trophies.trophyTitles?.slice(0, 5).map((game: any, i: number) => (
            <Text key={i} style={{ color: "white", marginTop: 4 }}>
              • {game.trophyTitleName}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}