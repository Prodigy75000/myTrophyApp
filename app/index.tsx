import { DrawerToggleButton } from "@react-navigation/drawer";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import WebView from "react-native-webview";
import TrophyCard from "../components/TrophyCard";
import { useTrophy } from "../TrophyContext";
/* eslint-disable @typescript-eslint/no-unused-vars */
export default function HomeScreen() {
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  // ✅ Use shared context
  const { trophies, setTrophies } = useTrophy();
const [refreshKey, setRefreshKey] = useState(0);

// whenever trophies updates in context, force re-render
React.useEffect(() => {
  if (trophies) setRefreshKey((k) => k + 1);
}, [trophies]);
  const PROXY_BASE_URL = "http://192.168.1.151:4000";

  const handlePSNLogin = async () => {
    try {
      setLoading(true);
      console.log("🔑 Connecting to PSN...");

      const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);
      const loginData = await loginRes.json();

      if (!loginData.accessToken) {
        throw new Error("No access token received from backend");
      }

      console.log("✅ Access Token:", loginData.accessToken);
      console.log("👤 Account ID:", loginData.accountId);

      setAccessToken(loginData.accessToken);
      setAccountId(loginData.accountId);

      const trophiesRes = await fetch(
        `${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Accept-Language": "en-US",
          },
        }
      );

      const trophiesData = await trophiesRes.json();
      console.log("🏆 Trophy data:", trophiesData);

      if (trophiesRes.status === 401 || trophiesData?.error?.includes("Invalid")) {
        console.warn("⚠️ Token expired or invalid — retrying login...");
        Alert.alert("Session expired", "Refreshing your login, please wait...");
        await handlePSNLogin();
        return;
      }

      if (trophiesData?.error) {
        throw new Error(trophiesData.error.message || JSON.stringify(trophiesData));
      }

      // ✅ Correct structure assignment
      console.log("🎯 trophiesData keys:", Object.keys(trophiesData));
      if (trophiesData.trophyTitles) {
        console.log("✅ Setting trophies (has trophyTitles)");
        setTrophies({
  trophyTitles: [...trophiesData.trophyTitles],
  totalItemCount: trophiesData.totalItemCount,
  nextOffset: trophiesData.nextOffset,
});
      } else {
        console.log("⚠️ trophiesData missing trophyTitles");
        setTrophies(trophiesData);
      }

      Alert.alert("PSN login success!", "Trophies successfully fetched!");
    } catch (err: any) {
      console.error("❌ Error:", err.message);
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

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

  console.log("🎯 HomeScreen trophies length:", trophies?.trophyTitles?.length);

  return (
    <ScrollView
    key={refreshKey}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#000",
        paddingVertical: 40,
      }}
    >
      <View style={{ alignSelf: "flex-start", marginLeft: 20, marginBottom: 10 }}>
        <DrawerToggleButton tintColor="#fff" />
      </View>

      <Text style={{ fontSize: 24, color: "gold", marginBottom: 30 }}>
        🏆 Welcome to Trophy Hub
      </Text>

      {/* ✅ Trophy summary */}
      {trophies && trophies.trophyTitles ? (
        <View style={{ marginTop: 30, alignItems: "flex-start", width: "90%" }}>
          <Text style={{ color: "gold", fontSize: 18, fontWeight: "bold" }}>
            Trophy Summary
          </Text>

          <Text style={{ color: "white", marginTop: 8 }}>
            Total Titles: {trophies?.totalItemCount ?? "?"}
          </Text>
<View style={{ marginTop: 20, width: "95%", alignItems: "center" }}></View>
          {trophies.trophyTitles.slice(0, 5).map((game: any, i: number) => (
  <TrophyCard
    key={i}
    title={game.trophyTitleName}
    icon={game.trophyTitleIconUrl}
    progress={game.progress}
    counts={{
      total:
        game.definedTrophies.bronze +
        game.definedTrophies.silver +
        game.definedTrophies.gold +
        game.definedTrophies.platinum,
      bronze: game.definedTrophies.bronze,
      silver: game.definedTrophies.silver,
      gold: game.definedTrophies.gold,
      platinum: game.definedTrophies.platinum,
    }}
  />
))}
        </View>
      ) : (
        <Text style={{ color: "red", marginTop: 20 }}>⚠️ No trophy data yet.</Text>
      )}
    </ScrollView>
  );
}