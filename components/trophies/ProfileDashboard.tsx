// components/trophies/ProfileDashboard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// TYPES & ASSETS
// ---------------------------------------------------------------------------

type DashboardProps = {
  username: string;
  avatarUrl?: string;
  isPlus?: boolean;
  totalTrophies: number; // Kept for potential future use
  counts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  level?: number;
};

const TROPHY_ICONS = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

const DEFAULT_AVATAR = "https://i.psnprofiles.com/avatars/l/G566B09312.png";

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Stat Item
// ---------------------------------------------------------------------------

type StatItemProps = {
  icon: ImageSourcePropType;
  count: number;
  color: string;
};

const StatItem = ({ icon, count, color }: StatItemProps) => (
  <View style={styles.statItem}>
    <Image source={icon} style={styles.statIcon} resizeMode="contain" />
    <Text style={[styles.statCount, { color }]}>{count}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

function ProfileDashboard({
  username,
  avatarUrl = DEFAULT_AVATAR,
  isPlus = false,
  counts,
  level,
}: DashboardProps) {
  return (
    <View style={styles.container}>
      {/* LEFT SECTION: Avatar & Identity */}
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />

          {/* PS Plus Badge (Top Left) */}
          {isPlus && (
            <View style={styles.plusOverlay}>
              <Ionicons name="add" size={8} color="black" style={styles.plusIcon} />
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

      {/* RIGHT SECTION: Compact Trophies */}
      <View style={styles.statsRow}>
        <StatItem icon={TROPHY_ICONS.platinum} count={counts.platinum} color="#E5E4E2" />
        <StatItem icon={TROPHY_ICONS.gold} count={counts.gold} color="#FFD700" />
        <StatItem icon={TROPHY_ICONS.silver} count={counts.silver} color="#C0C0C0" />
        <StatItem icon={TROPHY_ICONS.bronze} count={counts.bronze} color="#CD7F32" />
      </View>
    </View>
  );
}

// Export memoized component to prevent re-renders if props don't change
export default memo(ProfileDashboard);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#151b2b",
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#2a3449",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  // Avatar
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
  },
  // Badges
  plusOverlay: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#FFD700",
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#151b2b",
    zIndex: 2,
  },
  plusIcon: {
    fontWeight: "900",
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
    fontSize: 8,
    fontWeight: "bold",
  },
  username: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 1,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  statCount: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
