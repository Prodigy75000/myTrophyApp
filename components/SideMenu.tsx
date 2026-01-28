// components/SideMenu.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { handlePSNBootstrap } from "../api/handlePSNBootstrap";
import { handleXboxBootstrap } from "../api/handleXBOXBootstrap"; // 🟢 Import Xbox
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";
import LoginModal from "./LoginModal";
import { styles } from "./SideMenu.styles";

export default function SideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    user,
    handleLoginResponse,
    setTrophies,
    logout,
    accountId,
    // 🟢 Grab Xbox Setters
    setXboxTitles,
    setXboxProfile,
  } = useTrophy();

  const [showLogin, setShowLogin] = useState(false);

  // PSN
  const onPSNBootstrapPress = useCallback(async () => {
    await handlePSNBootstrap({ handleLoginResponse, setTrophies });
  }, [handleLoginResponse, setTrophies]);

  // 🟢 Xbox
  const onXboxBootstrapPress = useCallback(async () => {
    await handleXboxBootstrap({ setXboxTitles, setXboxProfile });
    Alert.alert("Xbox Loaded", "Mock Xbox data has been injected into the list.");
  }, [setXboxTitles, setXboxProfile]);

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

  const onLoginSuccess = async (npsso: string) => {
    try {
      setShowLogin(false);
      console.log("🔄 Sending NPSSO to Backend...");

      const response = await fetch(`${PROXY_BASE_URL}/api/auth/npsso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsso }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Exchange failed");

      console.log("✅ Login Complete:", data.onlineId);
      await handleLoginResponse(data);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const navigateHome = () => router.navigate("/");
  const avatarUrl = user?.avatarUrl ?? "https://i.imgur.com/6Cklq5z.png";
  const username = user?.onlineId ?? "Guest Player";
  const level = user?.trophyLevel ?? 1;
  const isLoggedIn = !!(user || accountId);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#1e2535", "#0a0b0f"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
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
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color="#ff8a80"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.signOutText}>Sign Out of PSN</Text>
          </TouchableOpacity>
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
              onPress={onPSNBootstrapPress}
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

        <Text style={styles.sectionLabel}>Settings</Text>
        <TouchableOpacity style={styles.menuRow} activeOpacity={0.5}>
          <View
            style={[styles.iconBox, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]}
          >
            <Ionicons name="settings-outline" size={20} color="#888" />
          </View>
          <Text style={[styles.menuText, { color: "#888" }]}>App Preferences</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.footerRow}>
          <Text style={styles.versionText}>TrophyHub v0.9 (Beta)</Text>

          {/* 🟢 DEV BUTTONS SIDE-BY-SIDE */}
          <View style={styles.devActions}>
            <TouchableOpacity style={styles.devButtonPSN} onPress={onPSNBootstrapPress}>
              <Ionicons name="flash" size={12} color="#4da3ff" />
              <Text style={styles.devTextPSN}>PSN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devButtonXbox} onPress={onXboxBootstrapPress}>
              <Ionicons name="flash" size={12} color="#107c10" />
              <Text style={styles.devTextXbox}>Xbox</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
