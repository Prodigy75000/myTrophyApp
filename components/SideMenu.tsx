// components/SideMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Context & API
import { handlePSNBootstrap } from "../api/handlePSNBootstrap";
import { useTrophy } from "../providers/TrophyContext";

export default function SideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAccessToken, setAccountId, setTrophies } = useTrophy();

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const onSyncPress = useCallback(async () => {
    // This calls the bootstrap helper we refactored earlier
    await handlePSNBootstrap({
      setAccessToken,
      setAccountId,
      setTrophies,
    });
  }, [setAccessToken, setAccountId, setTrophies]);

  const navigateHome = () => {
    // Navigate and strictly close the drawer (handled by router usually,
    // but good to be explicit if using standard drawer)
    router.navigate("/");
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* 1. HEADER / PROFILE SECTION */}
      <View style={styles.profileSection}>
        {user ? (
          <>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    user.avatarUrl ??
                    "https://i.psnprofiles.com/avatars/l/G566B09312.png",
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.username}>{user.onlineId}</Text>
            <Text style={styles.levelInfo}>
              Level {user.trophyLevel ?? 1} • {user.progress ?? 0}%
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.avatarContainer, styles.placeholderAvatar]}>
              <Ionicons name="person" size={40} color="#555" />
            </View>
            <Text style={styles.username}>Guest</Text>
            <Text style={styles.levelInfo}>Sign in to sync trophies</Text>
          </>
        )}
      </View>

      {/* 2. ACTIONS */}
      <View style={styles.actionSection}>
        {/* PSN Sync Button */}
        <TouchableOpacity
          style={styles.syncButton}
          onPress={onSyncPress}
          activeOpacity={0.8}
        >
          <Image
            source={require("../assets/logos/ps.png")}
            style={styles.psLogo}
            resizeMode="contain"
          />
          <Text style={styles.syncText}>
            {user ? "Refresh PSN Data" : "Sign in with PSN"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* 3. NAVIGATION ITEMS */}
      <View style={styles.navSection}>
        <TouchableOpacity style={styles.navItem} onPress={navigateHome}>
          <Ionicons name="home-outline" size={22} color="#ccc" style={styles.navIcon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        {/* Example: Add more menu items here later */}
        {/* <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={22} color="#ccc" style={styles.navIcon} />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity> 
        */}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151b2b", // Matches app theme
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#2a3449",
    backgroundColor: "#000",
  },
  placeholderAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1c1c26",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  levelInfo: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  // Actions
  actionSection: {
    marginBottom: 20,
  },
  syncButton: {
    backgroundColor: "#00439c", // Official PS Blue-ish
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  psLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  syncText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a3449",
    marginBottom: 20,
  },
  // Navigation
  navSection: {
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  navIcon: {
    marginRight: 14,
  },
  navText: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "500",
  },
});
