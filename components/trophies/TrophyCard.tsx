// components/trophies/TrophyCard.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Shared Utils
import { formatDate } from "../../utils/formatDate";
import { TrophyType } from "../../utils/normalizeTrophy";
import { getRarityTier, RARITY_TIERS } from "../../utils/rarity";

/**
 * Visual configuration for Trophy Side Badges.
 * Maps the TrophyType to a specific hex color.
 */
const TROPHY_STRIPE_COLORS: Record<TrophyType, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Rarity Pyramid
// ---------------------------------------------------------------------------
const RarityPyramid = ({ percentage }: { percentage: string }) => {
  // Memoize tier calculation so we don't recalculate on every render
  const tier = useMemo(() => getRarityTier(percentage), [percentage]);

  // Map Tier to a numeric level (1-4) for the visual stack
  const activeLevel = useMemo(() => {
    switch (tier) {
      case RARITY_TIERS.ULTRA_RARE:
        return 4;
      case RARITY_TIERS.VERY_RARE:
        return 3;
      case RARITY_TIERS.RARE:
        return 2;
      default:
        return 1; // Common
    }
  }, [tier]);

  return (
    <View style={styles.pyramidContainer}>
      {/* Bars stack from top (smallest) to bottom (widest) */}
      {[4, 3, 2, 1].map((level, index) => (
        <View
          key={level}
          style={[
            styles.pyramidBar,
            {
              width: (index + 1) * 4, // 4, 8, 12, 16 width
              opacity: activeLevel === level ? 1 : 0.2, // Light up ONLY the active tier
            },
          ]}
        />
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Progress Bar
// ---------------------------------------------------------------------------
const TrophyProgressBar = ({ current, target }: { current: string; target: string }) => {
  const percent = useMemo(() => {
    const c = parseInt(current, 10);
    const m = parseInt(target, 10);
    if (isNaN(c) || isNaN(m) || m === 0) return 0;
    return Math.min(100, Math.max(0, (c / m) * 100));
  }, [current, target]);

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {current} / {target}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

type Props = {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: TrophyType; // Uses strict type "bronze" | "silver" etc.
  earned: boolean;
  earnedAt?: string | null;
  rarity?: string;
  justEarned?: boolean;
  progressValue?: string;
  progressTarget?: string;
  onPress: () => void;
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

  // Handle the "Just Earned" flash effect
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
  }, [justEarned, glowAnim]);

  // Interpolated Styles
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

          {/* BOTTOM ROW: Status & Rarity */}
          <View style={styles.bottomRow}>
            {/* LEFT: Status (Progress OR Date OR Locked) */}
            <View style={styles.statusContainer}>
              {showProgress ? (
                <TrophyProgressBar current={progressValue} target={progressTarget!} />
              ) : earnedAt ? (
                <Text style={styles.earnedDate}>{formatDate(earnedAt)}</Text>
              ) : (
                <Text style={styles.lockedText}>Locked</Text>
              )}
            </View>

            {/* RIGHT: Rarity */}
            {rarity && (
              <View style={styles.rarityWrapper}>
                <RarityPyramid percentage={rarity} />
                <Text style={styles.rarity}>{rarity}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* COLORED SIDE STRIPE */}
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: TROPHY_STRIPE_COLORS[type] || "#fff" },
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
    marginBottom: 6,
    alignItems: "center",
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#2a2a3d", // placeholder bg
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  name: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    color: "#a0a0b0",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusContainer: {
    flex: 1,
    marginRight: 12,
  },
  // Progress Bar Styles
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
    maxWidth: 80,
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
  // Text Styles
  earnedDate: {
    color: "#4caf50",
    fontSize: 11,
    fontWeight: "600",
  },
  lockedText: {
    color: "#666",
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: "500",
  },
  // Rarity Styles
  rarityWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)", // Subtle background for rarity pill
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    gap: 2, // Slightly increased gap for visibility
  },
  pyramidBar: {
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  // Side Badge
  typeBadge: {
    width: 4,
    height: 32, // Fixed height looks cleaner than percentage
    borderRadius: 2,
    marginLeft: 10,
    alignSelf: "center",
    opacity: 0.8,
  },
});
