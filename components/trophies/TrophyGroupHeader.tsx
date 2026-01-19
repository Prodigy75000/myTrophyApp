import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  image?: string;
  isBaseGame: boolean;
  counts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  earnedCounts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  progress?: number; // 👈 New Prop for Sony Point-Based %
};

const icons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

export default function TrophyGroupHeader({
  title,
  isBaseGame,
  counts,
  earnedCounts,
  progress,
}: Props) {
  // 1. Calculate Count-Based stats for display text (e.g. "5/10 Trophies")
  const totalCount = counts.bronze + counts.silver + counts.gold + counts.platinum;
  const earnedCount =
    earnedCounts.bronze + earnedCounts.silver + earnedCounts.gold + earnedCounts.platinum;

  // 2. Determine Display Percentage
  // If 'progress' (Points) is passed from parent, use it.
  // Otherwise fall back to count (Simple Math).
  const displayPercent =
    progress !== undefined
      ? progress
      : totalCount > 0
        ? Math.round((earnedCount / totalCount) * 100)
        : 0;

  const isCompleted = displayPercent === 100;

  return (
    <View style={styles.container}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isBaseGame && styles.baseGameTitle]}>{title}</Text>
          <Text style={styles.subtitle}>
            {isBaseGame ? "Base Game" : "DLC"} • {earnedCount}/{totalCount} Trophies
          </Text>
        </View>

        {/* PERCENTAGE BADGE */}
        <View style={[styles.badge, isCompleted && styles.completedBadge]}>
          <Text style={[styles.badgeText, isCompleted && { color: "#000" }]}>
            {displayPercent}%
          </Text>
        </View>
      </View>

      {/* STATS ROW (Mini) */}
      <View style={styles.statsRow}>
        <Stat icon={icons.bronze} earned={earnedCounts.bronze} total={counts.bronze} />
        <Stat icon={icons.silver} earned={earnedCounts.silver} total={counts.silver} />
        <Stat icon={icons.gold} earned={earnedCounts.gold} total={counts.gold} />
        {/* Only show Platinum if the DLC/Game actually has one */}
        {counts.platinum > 0 && (
          <Stat
            icon={icons.platinum}
            earned={earnedCounts.platinum}
            total={counts.platinum}
          />
        )}
      </View>
    </View>
  );
}

const Stat = ({ icon, earned, total }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
    <Image source={icon} style={{ width: 14, height: 14, marginRight: 6 }} />
    <Text style={{ color: "#888", fontSize: 12 }}>
      {earned}/{total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#151b2b", // Distinct header bg
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4da3ff", // Accent color line
    borderRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  baseGameTitle: {
    fontSize: 17, // Base game slightly larger
    color: "#fff",
  },
  subtitle: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#2a3449",
  },
  completedBadge: {
    backgroundColor: "#4caf50", // Green when done
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
