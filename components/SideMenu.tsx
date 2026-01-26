// components/SideMenu.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// 🟢 1. Remove WebBrowser, Add Linking
import React, { useCallback, useEffect } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROXY_BASE_URL } from "../config/endpoints";

// Context & API
import { handlePSNBootstrap } from "../api/handlePSNBootstrap";
import { useTrophy } from "../providers/TrophyContext";

// CONFIGURATION
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core psn:clientapp";

const ENCODED_URI = encodeURIComponent(REDIRECT_URI);
const ENCODED_SCOPE = encodeURIComponent(SCOPE);

// Global Login URL
const AUTH_URL = `https://my.account.sony.com/central/signin/?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${ENCODED_URI}&scope=${ENCODED_SCOPE}&access_type=offline&service_entity=urn:service-entity:psn`;

export default function SideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAccessToken, setAccountId, setTrophies } = useTrophy();

  // 1. BOOTSTRAP (Guest Mode)
  const onBootstrapPress = useCallback(async () => {
    await handlePSNBootstrap({
      setAccessToken,
      setAccountId,
      setTrophies,
    });
  }, [setAccessToken, setAccountId, setTrophies]);

  // 🟢 2. NEW: "Nuclear" Browser Launch
  const onSignInPress = async () => {
    try {
      console.log("🚀 Opening External Chrome...");
      // This forces the full browser app to open. Sony trusts this.
      await Linking.openURL(AUTH_URL);
    } catch (e: any) {
      console.error("Linking Error:", e.message);
      alert("Could not open browser: " + e.message);
    }
  };

  // 🟢 3. NEW: Deep Link Listener (Catches the user when they come back)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("🔗 Deep Link Received:", event.url);

      // Check if this is OUR redirect
      if (event.url.startsWith(REDIRECT_URI)) {
        // Parse the code
        // URL looks like: com.scee...://redirect?code=v3.xxxxx
        const params = new URLSearchParams(event.url.split("?")[1]);
        const code = params.get("code");

        if (code) {
          handleAuthCode(code);
        }
      }
    };

    // Listen for links while the app is in background
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if the app was opened FROM a link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 4. EXCHANGE CODE
  const handleAuthCode = async (code: string) => {
    try {
      console.log("🔄 Exchanging Auth Code...");
      const response = await fetch(`${PROXY_BASE_URL}/api/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Exchange failed");

      console.log("✅ Login Success:", data.onlineId);
      setAccessToken(data.accessToken);
      setAccountId(data.accountId);
    } catch (error: any) {
      console.error("❌ Login Failed:", error.message);
      alert("Login Failed: " + error.message);
    }
  };

  // ... RENDER ...
  const navigateHome = () => router.navigate("/");
  const avatarUrl = user?.avatarUrl ?? "https://i.imgur.com/6Cklq5z.png";
  const username = user?.onlineId ?? "Guest Player";
  const level = user?.trophyLevel ?? 1;
  const progress = user?.progress ?? 0;
  const isPlus = false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1e2535", "#0a0b0f"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            {isPlus && (
              <View style={styles.plusBadge}>
                <MaterialCommunityIcons name="plus" size={10} color="#000" />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {username}
            </Text>
            {user ? (
              <View style={styles.levelBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#ffd700" />
                <Text style={styles.levelText}>Level {level}</Text>
              </View>
            ) : (
              <Text style={styles.guestText}>Not synced</Text>
            )}
          </View>
        </View>

        {user && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        )}

        {/* 🟢 SIGN IN BUTTON */}
        {!user && (
          <TouchableOpacity
            style={styles.webButton}
            onPress={onSignInPress}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="sony-playstation"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.webButtonText}>Sign In with PSN</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Menu Items (Same as before) */}
      <ScrollView contentContainerStyle={styles.menuItems}>
        <Text style={styles.sectionLabel}>Menu</Text>
        <TouchableOpacity style={styles.menuRow} onPress={navigateHome}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(77, 163, 255, 0.1)" }]}>
            <Ionicons name="home" size={20} color="#4da3ff" />
          </View>
          <Text style={styles.menuText}>Home</Text>
          <Ionicons name="chevron-forward" size={16} color="#444" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Settings & Dev</Text>
        <TouchableOpacity style={styles.menuRow} onPress={onBootstrapPress}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(255, 215, 0, 0.1)" }]}>
            <Ionicons name="flash" size={20} color="#ffd700" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Bootstrap Data</Text>
            <Text style={styles.subText}>Load fetch_trophies.json</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} activeOpacity={0.5}>
          <View
            style={[styles.iconBox, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]}
          >
            <Ionicons name="settings-outline" size={20} color="#888" />
          </View>
          <Text style={[styles.menuText, { color: "#888" }]}>App Preferences</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.versionText}>TrophyHub v0.9 (Beta)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0b0f" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#4da3ff",
    backgroundColor: "#000",
  },
  plusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ffd700",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1e2535",
  },
  userInfo: { marginLeft: 16, flex: 1 },
  username: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  guestText: { color: "#888", fontSize: 14 },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  levelText: { color: "#ffd700", fontSize: 12, fontWeight: "800", marginLeft: 4 },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "white", fontSize: 16, fontWeight: "bold" },
  statLabel: { color: "#888", fontSize: 10, textTransform: "uppercase", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  webButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00439c",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  webButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  menuItems: { paddingTop: 20, paddingHorizontal: 16 },
  sectionLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuText: { flex: 1, color: "white", fontSize: 15, fontWeight: "500" },
  subText: { color: "#666", fontSize: 11, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 16,
    marginHorizontal: 4,
  },
  footer: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  versionText: { color: "#444", fontSize: 11 },
});
