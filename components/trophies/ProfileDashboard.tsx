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
  counts,
  level,
}: Props) {
  return (
    <View style={styles.container}>
      {/* LEFT: Avatar & Identity */}
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: avatarUrl ?? "https://i.psnprofiles.com/avatars/l/G566B09312.png",
            }}
            style={styles.avatar}
          />

          {/* Plus Badge (Top Left) */}
          {isPlus && (
            <View style={styles.plusOverlay}>
              <Ionicons name="add" size={8} color="black" style={{ fontWeight: "900" }} />
            </View>
          )}

          {/* Level Badge (Bottom Right) */}
          {level ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.username} numberOfLines={1}>
          {username}
        </Text>
      </View>

      {/* RIGHT: Compact Trophies */}
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
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#2a3449",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow username to take available space
    marginRight: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 36, // Smaller Avatar (was 50)
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
  },
  plusOverlay: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#FFD700",
    width: 12, // Smaller badge
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#151b2b",
    zIndex: 2,
  },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#DAA520",
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderWidth: 1,
    borderColor: "#151b2b",
    zIndex: 2,
  },
  levelText: {
    color: "#000",
    fontSize: 8, // Smaller text
    fontWeight: "bold",
  },
  username: {
    color: "white",
    fontSize: 14, // Slightly smaller font
    fontWeight: "bold",
    flexShrink: 1, // Allows truncation if name is too long
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Space between trophy counts
  },
  statItem: {
    flexDirection: "row", // 👈 Side-by-side Icon + Number
    alignItems: "center",
  },
  statIcon: {
    width: 14, // Mini Icons
    height: 14,
    marginRight: 4,
  },
  statCount: {
    fontSize: 12, // Mini Numbers
    fontWeight: "bold",
  },
});
