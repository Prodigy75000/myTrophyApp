// components/trophies/TrophyGroupHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// ASSETS & TYPES
// ---------------------------------------------------------------------------

const ICONS = {
  bronze: require("../../../assets/icons/trophies/bronze.png"),
  silver: require("../../../assets/icons/trophies/silver.png"),
  gold: require("../../../assets/icons/trophies/gold.png"),
  platinum: require("../../../assets/icons/trophies/platinum.png"),
};

type CountSet = {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
};

type Props = {
  title: string;
  image?: string;
  isBaseGame: boolean;
  counts: CountSet;
  earnedCounts: CountSet;
  progress?: number;
  collapsed: boolean;
  onToggle: () => void;
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Stat Item
// ---------------------------------------------------------------------------

type StatProps = {
  icon: ImageSourcePropType;
  earned: number;
  total: number;
};

const Stat = ({ icon, earned, total }: StatProps) => (
  <View style={styles.statContainer}>
    <Image source={icon} style={styles.statIcon} resizeMode="contain" />
    <Text style={styles.statText}>
      <Text style={styles.statEarned}>{earned}</Text>/{total}
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

function TrophyGroupHeader({
  title,
  isBaseGame,
  counts,
  earnedCounts,
  progress,
  collapsed,
  onToggle,
}: Props) {
  // 1. Calculate Totals
  const totalCount = counts.bronze + counts.silver + counts.gold + counts.platinum;
  const earnedCount =
    earnedCounts.bronze + earnedCounts.silver + earnedCounts.gold + earnedCounts.platinum;

  // 2. Determine Display Percentage
  const displayPercent =
    progress !== undefined
      ? progress
      : totalCount > 0
        ? Math.round((earnedCount / totalCount) * 100)
        : 0;

  const isCompleted = displayPercent === 100;

  return (
    <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
      {/* TOP ROW: Title & Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text
            style={[styles.title, isBaseGame && styles.baseGameTitle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={styles.subtitle}>
            {isBaseGame ? "Base Game" : "DLC"} • {earnedCount}/{totalCount} Trophies
          </Text>
        </View>

        {/* Right Side: Badge + Chevron */}
        <View style={styles.rightSide}>
          <View style={[styles.badge, isCompleted && styles.completedBadge]}>
            <Text style={[styles.badgeText, isCompleted && styles.completedText]}>
              {displayPercent}%
            </Text>
          </View>

          <Ionicons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color="#888"
          />
        </View>
      </View>

      {/* BOTTOM ROW: Stats Summary */}
      {/* We keep this visible even when collapsed for quick info access */}
      <View style={styles.statsRow}>
        <Stat icon={ICONS.bronze} earned={earnedCounts.bronze} total={counts.bronze} />
        <Stat icon={ICONS.silver} earned={earnedCounts.silver} total={counts.silver} />
        <Stat icon={ICONS.gold} earned={earnedCounts.gold} total={counts.gold} />
        {counts.platinum > 0 && (
          <Stat
            icon={ICONS.platinum}
            earned={earnedCounts.platinum}
            total={counts.platinum}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(TrophyGroupHeader);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#151b2b",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4da3ff",
    borderRadius: 4,
    // Optional: Add subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "#ddd", // Slightly softer white for DLCs
    fontSize: 15,
    fontWeight: "bold",
  },
  baseGameTitle: {
    fontSize: 17,
    color: "#fff", // Bright white for Base Game
  },
  subtitle: {
    color: "#666",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  // Stat Item Styles
  statContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  statText: {
    color: "#666", // Total count color
    fontSize: 12,
  },
  statEarned: {
    color: "#ccc", // Earned count color (brighter)
    fontWeight: "600",
  },
  // Badge Styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#2a3449",
    minWidth: 40,
    alignItems: "center",
  },
  completedBadge: {
    backgroundColor: "#4caf50",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  completedText: {
    color: "#000",
  },
});
