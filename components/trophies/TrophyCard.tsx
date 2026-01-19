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
  // 👇 NEW PROPS
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

  // 🧮 CALCULATE PROGRESS
  // Only show tracking if we have a target and it's not earned yet
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
            // If earned, full opacity. If unearned, dimmed slightly
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

          {/* 📊 PROGRESS BAR ROW */}
          {showProgress ? (
            <View style={styles.progressRow}>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {progressValue} / {progressTarget}
              </Text>
            </View>
          ) : (
            // STANDARD META ROW (Date & Rarity)
            <View style={styles.metaRow}>
              {earnedAt ? (
                <Text style={styles.earnedDate}>
                  {new Date(earnedAt).toLocaleDateString()}
                </Text>
              ) : (
                <Text style={styles.lockedText}>Locked</Text>
              )}
              {rarity && <Text style={styles.rarity}>{rarity}%</Text>}
            </View>
          )}
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
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  description: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
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
  rarity: {
    color: "#888",
    fontSize: 11,
  },
  typeBadge: {
    width: 4,
    height: "80%",
    borderRadius: 2,
    marginLeft: 8,
  },
  // ✨ PROGRESS BAR STYLES
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginRight: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4da3ff", // PlayStation Blue
  },
  progressText: {
    color: "#ccc",
    fontSize: 10,
    fontWeight: "bold",
  },
});
