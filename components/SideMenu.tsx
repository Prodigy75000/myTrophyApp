import { DrawerContentComponentProps } from "@react-navigation/drawer";
import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTrophy } from "../TrophyContext";

export default function SideMenu(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const [psnConnected, setPsnConnected] = useState(false);
  const [steamConnected, setSteamConnected] = useState(false);
  const [xboxConnected, setXboxConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  const { user, setTrophies, setUser } = useTrophy();
  const PROXY_BASE_URL = "http://192.168.1.151:4000";

  const handlePSNLogin = async () => {
    try {
      setLoading(true);
      console.log("🔑 Connecting to PSN...");

      // 1️⃣ Login to get tokens
      const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);
      const loginData = await loginRes.json();
      if (!loginData.accessToken) throw new Error("No access token received");

      // 2️⃣ Fetch trophies
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

      if (trophiesData.trophyTitles) {
        setTrophies({
          trophyTitles: [...trophiesData.trophyTitles],
          totalItemCount: trophiesData.totalItemCount,
          nextOffset: trophiesData.nextOffset,
        });
        setPsnConnected(true);
        console.log("✅ PSN trophies stored in context");
      } else {
        console.warn("⚠️ Missing trophyTitles", trophiesData);
      }

      // 3️⃣ 🧩 Fetch user profile (avatar, name, level)
      const profileRes = await fetch(
        `${PROXY_BASE_URL}/api/profile/${loginData.accountId}`,
        {
          headers: { Authorization: `Bearer ${loginData.accessToken}` },
        }
      );
      const profileData = await profileRes.json();
      console.log("👤 PSN Profile:", profileData);

      if (profileData?.profile) {
        setUser({
          onlineId: profileData.profile.onlineId,
          avatarUrl: profileData.profile.avatarUrls?.[0]?.avatarUrl,
          trophyLevel: profileData.profile.trophySummary.level,
          progress: profileData.profile.trophySummary.progress,
        });
      }
    } catch (e: any) {
      console.error("❌ PSN login failed", e);
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Display
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b0e13", padding: 16 }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {/* Show avatar if available */}
        {psnConnected ? (
          <>
            {/* Profile avatar */}
            {/* Uncomment this once context user is working */}
            {/* <Image
              source={{ uri: user?.avatarUrl }}
              style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }}
            /> */}
            <Text style={{ color: "#fff", fontSize: 20 }}>
              {user?.onlineId || "PSN User"}
            </Text>
            <Text style={{ color: "#888" }}>
              Level {user?.trophyLevel ?? "?"} ({user?.progress ?? 0}%)
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: "#fff", fontSize: 20 }}>🏆 Trophy Hub</Text>
            <Text style={{ color: "#888", marginTop: 4 }}>Prodigy75000</Text>
          </>
        )}
      </View>

      {/* PlayStation button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#003791",
          paddingVertical: 10,
          borderRadius: 6,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={handlePSNLogin}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", marginRight: 8 }}>
          {psnConnected ? "Refresh PSN Data" : "Sign in with"}
        </Text>
        <Image
          source={require("../assets/logos/ps.png")}
          style={{ width: 22, height: 22 }}
        />
      </TouchableOpacity>

      {/* Navigation */}
      <TouchableOpacity onPress={() => navigation.navigate("index")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>🏠 Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("library")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>🎮 Library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}