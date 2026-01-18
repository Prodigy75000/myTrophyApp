import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  username: string;
  avatarUrl?: string;
  isPlus?: boolean;
  totalTrophies: number;
  counts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  level?: number;
};

const icons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

export default function ProfileDashboard({
  username,
  avatarUrl,
  isPlus,
  totalTrophies,
  counts,
  level,
}: Props) {
  return (
    <View style={styles.container}>
      {/* 1. TOP ROW */}
      <View style={styles.profileRow}>
        {/* AVATAR + PLUS BADGE */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: avatarUrl ?? "https://i.psnprofiles.com/avatars/l/G566B09312.png",
            }}
            style={styles.avatar}
          />

          {/* 🛡️ SAFE PLUS OVERLAY: Top-Left Corner */}
          {isPlus && (
            <View style={styles.plusOverlay}>
              <Ionicons
                name="add"
                size={10}
                color="black"
                style={{ fontWeight: "900" }}
              />
            </View>
          )}

          {level ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.totalText}>{totalTrophies} Total Trophies</Text>
        </View>
      </View>

      {/* 2. STATS ROW */}
      <View style={styles.statsRow}>
        <StatItem icon={icons.platinum} count={counts.platinum} color="#E5E4E2" />
        <StatItem icon={icons.gold} count={counts.gold} color="#FFD700" />
        <StatItem icon={icons.silver} count={counts.silver} color="#C0C0C0" />
        <StatItem icon={icons.bronze} count={counts.bronze} color="#CD7F32" />
      </View>
    </View>
  );
}

const StatItem = ({ icon, count, color }: any) => (
  <View style={styles.statItem}>
    <Image source={icon} style={styles.statIcon} resizeMode="contain" />
    <Text style={[styles.statCount, { color }]}>{count}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#151b2b",
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a3449",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#222",
  },
  // ✨ THE NEW PLUS BADGE (Looks official, but is 100% CSS)
  plusOverlay: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#FFD700", // PlayStation Gold
    width: 16,
    height: 16,
    borderRadius: 8, // Circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#151b2b", // Matches background to create a "cutout" effect
    zIndex: 2,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#DAA520",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#151b2b",
    zIndex: 2,
  },
  levelText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  totalText: {
    color: "#888",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0a0f1c",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: "center",
    width: 50,
  },
  statIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
