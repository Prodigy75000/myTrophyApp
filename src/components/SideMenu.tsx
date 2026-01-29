// components/SideMenu.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrophy } from "../../providers/TrophyContext";
import { usePsnAuth } from "../hooks/auth/usePsnAuth"; // 🟢 New Hook
import { useXboxAuth } from "../hooks/auth/useXboxAuth"; // 🟢 New Hook
import { styles } from "../styles/SideMenu.styles"; // 🟢 Correct Path
import LoginModal from "./LoginModal";

export default function SideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Context Data
  const { user, logout, accountId } = useTrophy();

  // Auth Hooks
  const { login: loginXbox } = useXboxAuth();
  const { showLoginModal, setShowLoginModal, loginGuest, onLoginSuccess } = usePsnAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to disconnect?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const navigateHome = () => router.navigate("/");

  // UI Helpers
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
              onPress={() => setShowLoginModal(true)}
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
              onPress={loginGuest}
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
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
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
          <View style={styles.devActions}>
            <TouchableOpacity style={styles.devButtonPSN} onPress={loginGuest}>
              <Ionicons name="flash" size={12} color="#4da3ff" />
              <Text style={styles.devTextPSN}>PSN</Text>
            </TouchableOpacity>

            {/* 🟢 CLEAN XBOX BUTTON CALL */}
            <TouchableOpacity style={styles.devButtonXbox} onPress={loginXbox}>
              <Ionicons name="flash" size={12} color="#107c10" />
              <Text style={styles.devTextXbox}>Xbox</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
