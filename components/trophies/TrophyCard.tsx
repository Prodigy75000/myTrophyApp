import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  earnedAt?: string;
  rarity?: string;
  justEarned?: boolean;
  progressValue?: string;
  progressTarget?: string;
  onPress: () => void;
};

const trophyTypeColors = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

// ✨ UPDATED: Rarity Pyramid (Single Tier Highlight)
const RarityPyramid = ({ rarity }: { rarity: string }) => {
  const r = parseFloat(rarity);

  // Determine Tier Level (1 = Common, 4 = Ultra Rare)
  let level = 1;
  if (r <= 5)
    level = 4; // Ultra Rare
  else if (r <= 15)
    level = 3; // Very Rare
  else if (r <= 50)
    level = 2; // Rare
  else level = 1; // Common

  // Render 4 stacked bars (Top to Bottom)
  // 🎯 FIX: Used '===' instead of '>=' to light up ONLY the specific bar
  return (
    <View style={styles.pyramidContainer}>
      {/* Tier 4 (Top - Smallest) -> Active if Ultra Rare */}
      <View style={[styles.pyramidBar, { width: 4, opacity: level === 4 ? 1 : 0.2 }]} />

      {/* Tier 3 -> Active if Very Rare */}
      <View style={[styles.pyramidBar, { width: 8, opacity: level === 3 ? 1 : 0.2 }]} />

      {/* Tier 2 -> Active if Rare */}
      <View style={[styles.pyramidBar, { width: 12, opacity: level === 2 ? 1 : 0.2 }]} />

      {/* Tier 1 (Bottom - Widest) -> Active if Common */}
      <View style={[styles.pyramidBar, { width: 16, opacity: level === 1 ? 1 : 0.2 }]} />
    </View>
  );
};

export default function TrophyCard({
  name,
  description,
  icon,
  type,
  earned,
  earnedAt,
  rarity,
  justEarned,
  progressValue,
  progressTarget,
  onPress,
}: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  const showProgress = progressValue && progressTarget;
  let progressPercent = 0;

  if (showProgress) {
    const curr = parseInt(progressValue ?? "0", 10);
    const max = parseInt(progressTarget ?? "1", 10);
    if (max > 0) {
      progressPercent = Math.min(100, Math.max(0, (curr / max) * 100));
    }
  }

  useEffect(() => {
    if (justEarned) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [justEarned]);

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1e1e2d", "#3a3a50"],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#ffd700"],
  });

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            borderWidth: 1,
            opacity: earned ? 1 : 0.7,
          },
        ]}
      >
        <Image source={{ uri: icon }} style={styles.icon} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>

          {/* BOTTOM ROW */}
          <View style={styles.bottomRow}>
            {/* LEFT: Status / Progress */}
            <View style={styles.statusContainer}>
              {showProgress ? (
                <View style={styles.progressWrapper}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progressValue} / {progressTarget}
                  </Text>
                </View>
              ) : earnedAt ? (
                <Text style={styles.earnedDate}>
                  {new Date(earnedAt).toLocaleDateString()}
                </Text>
              ) : (
                <Text style={styles.lockedText}>Locked</Text>
              )}
            </View>

            {/* RIGHT: Rarity Pyramid */}
            {rarity && (
              <View style={styles.rarityWrapper}>
                <RarityPyramid rarity={rarity} />
                <Text style={styles.rarity}>{rarity}%</Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.typeBadge,
            { backgroundColor: trophyTypeColors[type] || "#fff" },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 8,
    marginBottom: 3,
    alignItems: "center",
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  description: {
    color: "#aaa",
    fontSize: 12,
    minHeight: 28,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  statusContainer: {
    flex: 1,
    marginRight: 12,
  },
  // Progress
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginRight: 8,
    maxWidth: 100,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4da3ff",
  },
  progressText: {
    color: "#ccc",
    fontSize: 10,
    fontWeight: "bold",
  },
  // Text
  earnedDate: {
    color: "#4caf50",
    fontSize: 11,
    fontWeight: "bold",
  },
  lockedText: {
    color: "#555",
    fontSize: 11,
    fontStyle: "italic",
  },
  // Rarity
  rarityWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rarity: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Pyramid Styles
  pyramidContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  pyramidBar: {
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  typeBadge: {
    width: 4,
    height: "60%",
    borderRadius: 2,
    marginLeft: 10,
    alignSelf: "center",
  },
});
