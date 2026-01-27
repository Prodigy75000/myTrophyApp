// components/SideMenu.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { handlePSNBootstrap } from "../api/handlePSNBootstrap";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";
import LoginModal from "./LoginModal"; // 🟢 Import the helper
import { styles } from "./SideMenu.styles";

export default function SideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAccessToken, setAccountId, setTrophies, logout, accountId } =
    useTrophy();
  const [showLogin, setShowLogin] = useState(false);

  const onBootstrapPress = useCallback(async () => {
    await handlePSNBootstrap({ setAccessToken, setAccountId, setTrophies });
  }, [setAccessToken, setAccountId, setTrophies]);

  // 🟢 LOGOUT LOGIC
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to disconnect?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // 🟢 LOGIN SUCCESS HANDLER
  const onLoginSuccess = async (npsso: string) => {
    try {
      setShowLogin(false); // Close Modal immediately
      console.log("🔄 Sending NPSSO to Backend...");

      const response = await fetch(`${PROXY_BASE_URL}/api/auth/npsso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsso }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Exchange failed");

      console.log("✅ Login Complete:", data.onlineId);
      setAccessToken(data.accessToken);
      setAccountId(data.accountId);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const navigateHome = () => router.navigate("/");
  const avatarUrl = user?.avatarUrl ?? "https://i.imgur.com/6Cklq5z.png";
  const username = user?.onlineId ?? "Guest Player";
  const level = user?.trophyLevel ?? 1;

  // Determine if User is Logged In
  const isLoggedIn = !!(user || accountId);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1e2535", "#0a0b0f"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        {/* PROFILE HEADER */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {username}
            </Text>
            {isLoggedIn ? (
              <View style={styles.levelBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#ffd700" />
                <Text style={styles.levelText}>Level {level}</Text>
              </View>
            ) : (
              <Text style={styles.guestText}>Not synced</Text>
            )}
          </View>
        </View>

        {/* AUTH BUTTONS */}
        {isLoggedIn ? (
          <View>
            {/* Connected Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#4caf50"
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: "#4caf50", fontWeight: "bold", fontSize: 13 }}>
                Connected to PSN
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(211, 47, 47, 0.15)",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(211, 47, 47, 0.3)",
              }}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color="#ff8a80"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#ff8a80", fontSize: 14, fontWeight: "600" }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={styles.webButton}
              onPress={() => setShowLogin(true)}
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

            <TouchableOpacity
              style={styles.guestButton}
              onPress={onBootstrapPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color="#888"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* 🟢 THE HELPER COMPONENT */}
      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={onLoginSuccess}
      />

      {/* MENU LIST */}
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
