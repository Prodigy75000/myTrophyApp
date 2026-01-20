// components/trophies/GameHero.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ProgressCircle from "../ProgressCircle";

const ICONS = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

type Props = {
  iconUrl: string;
  title: string;
  platform?: string;
  progress: number;
  earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  definedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  displayArt?: string | null;
};

export default function GameHero({
  iconUrl,
  title,
  platform,
  progress,
  earnedTrophies,
  definedTrophies,
  displayArt,
}: Props) {
  // Determine resize mode based on if art is standard icon or custom art
  const isSpecialArt = displayArt && displayArt !== iconUrl;
  const isPS5 = platform === "PS5";
  const heroResizeMode = isPS5 || isSpecialArt ? "cover" : "contain";

  return (
    <View style={styles.heroContainer}>
      {/* Icon / Art */}
      <View style={styles.iconWrapper}>
        <View style={styles.gameIconContainer}>
          <Image
            source={{ uri: displayArt || iconUrl }}
            style={styles.image}
            resizeMode={heroResizeMode}
          />
        </View>
        {platform && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.gameTitle}>{title}</Text>

      {/* Stats Board */}
      <View style={styles.statsContainer}>
        <View style={styles.progressWrapper}>
          <ProgressCircle progress={progress} size={50} strokeWidth={5} />
        </View>
        <View style={styles.divider} />
        <View style={styles.breakdownRow}>
          <StatColumn
            icon={ICONS.bronze}
            earned={earnedTrophies.bronze}
            total={definedTrophies.bronze}
          />
          <StatColumn
            icon={ICONS.silver}
            earned={earnedTrophies.silver}
            total={definedTrophies.silver}
          />
          <StatColumn
            icon={ICONS.gold}
            earned={earnedTrophies.gold}
            total={definedTrophies.gold}
          />
          {definedTrophies.platinum > 0 && (
            <StatColumn
              icon={ICONS.platinum}
              earned={earnedTrophies.platinum}
              total={definedTrophies.platinum}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const StatColumn = ({ icon, earned, total }: any) => (
  <View style={{ alignItems: "center" }}>
    <Image
      source={icon}
      style={{ width: 20, height: 20, marginBottom: 4 }}
      resizeMode="contain"
    />
    <Text style={{ fontSize: 12, color: "#888" }}>
      <Text style={{ color: "#fff", fontWeight: "bold" }}>{earned}</Text>/{total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#050508",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c26",
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 12,
    width: 120, // Slightly smaller for better proportion
    height: 120,
  },
  gameIconContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  platformBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#555",
  },
  platformText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gameTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c26",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  progressWrapper: { marginRight: 16 },
  divider: { width: 1, height: 32, backgroundColor: "#444", marginRight: 16 },
  breakdownRow: { flexDirection: "row", gap: 16 },
});
