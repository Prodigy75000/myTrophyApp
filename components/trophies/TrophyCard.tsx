import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDate } from "../../utils/formatDate";

type TrophyCardProps = {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  earnedAt?: string;
  rarity?: string;
  justEarned?: boolean;
  onPress?: () => void;
};

// 🔹 Updated Pyramid: Position indicates Rarity (Single Bar Highlight)
const RarityPyramid = ({ percentage }: { percentage: string }) => {
  const p = parseFloat(percentage);

  // Determine which specific level is active (1=Bottom, 4=Top)
  let activeLevel = 1; // Default Common (Bottom)
  if (p <= 50) activeLevel = 2; // Rare
  if (p <= 15) activeLevel = 3; // Very Rare
  if (p <= 5) activeLevel = 4; // Ultra Rare (Top)

  // Levels: 4 (Top/Smallest) -> 1 (Bottom/Widest)
  const levels = [4, 3, 2, 1];
  const activeColor = "#ffffff"; // Gold for the active bar
  const inactiveColor = "#333"; // Dark grey for background bars

  return (
    <View style={styles.pyramidContainer}>
      <View style={styles.pyramidStack}>
        {levels.map((level) => {
          // Width gets wider as we go down (6 -> 18)
          const width = 6 + (4 - level) * 4;

          // Only highlight the specific bar for this rarity tier
          const isActive = level === activeLevel;

          return (
            <View
              key={level}
              style={[
                styles.pyramidBar,
                {
                  width,
                  backgroundColor: isActive ? activeColor : inactiveColor,
                  opacity: isActive ? 1 : 0.4, // Dim inactive bars slightly
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.rarityText, { color: activeColor }]}>{percentage}%</Text>
    </View>
  );
};

const trophyTypeIcon = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

export default function TrophyCard({
  name,
  description,
  icon,
  type,
  earned,
  earnedAt,
  justEarned,
  rarity,
  onPress,
}: TrophyCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#222" }}
      style={{
        flexDirection: "row",
        backgroundColor: "#1c1c26",
        borderRadius: 10,
        marginBottom: 3,
        padding: 12,
        opacity: earned ? 1 : 0.6,
        borderColor: justEarned ? "#00FF00" : "transparent",
        borderWidth: justEarned ? 1 : 0,
      }}
    >
      {/* 1. ICON */}
      <Image
        source={{ uri: icon }}
        style={{ width: 64, height: 64, marginRight: 14, borderRadius: 6 }}
      />

      {/* 2. MAIN CONTENT */}
      <View style={{ flex: 1 }}>
        {/* Header: Type + Name */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <Image
            source={trophyTypeIcon[type]}
            resizeMode="contain"
            style={{ width: 16, height: 16, marginRight: 6 }}
          />
          <Text
            style={{ color: "white", fontSize: 14, fontWeight: "600", flex: 1 }}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>

        {/* Description */}
        <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 8 }} numberOfLines={2}>
          {description}
        </Text>

        {/* Footer: Date (Left) & Rarity (Right) */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* LEFT: Date */}
          <View>
            {earned && earnedAt ? (
              <Text style={{ color: "#4caf50", fontSize: 11, fontWeight: "500" }}>
                Earned {formatDate(earnedAt)}
              </Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
          </View>

          {/* RIGHT: Pyramid */}
          {rarity ? <RarityPyramid percentage={rarity} /> : <View />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pyramidContainer: {
    alignItems: "flex-end",
  },
  pyramidStack: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pyramidBar: {
    height: 3,
    marginBottom: 2,
    borderRadius: 1,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
