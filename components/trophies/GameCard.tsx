import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDate } from "../../utils/formatDate";
import ProgressCircle from "../ProgressCircle";

const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

type GameCardProps = {
  id: string;
  title: string;
  icon: string;
  art?: string;
  platform: string;
  progress: number;
  lastPlayed?: string;
  counts: {
    total: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    earnedBronze: number;
    earnedSilver: number;
    earnedGold: number;
    earnedPlatinum: number;
  };
};

const GameCard = ({
  id,
  title,
  icon,
  art,
  platform,
  progress,
  lastPlayed,
  counts,
}: GameCardProps) => {
  const router = useRouter();
  const [loadIcon, setLoadIcon] = useState(false);

  const displayImage = art || icon;
  // Ensure consistency
  const IMG_SIZE = 100;

  // 🧠 THE FIX: Determine rendering strategy based on platform
  const isPS5 = platform === "PS5";
  // PS5 -> Cover (Fill the square)
  // PS4/PS3 -> Contain (Fit inside the square, no zooming)
  const dynamicResizeMode = isPS5 ? "cover" : "contain";
  // Add a black background for non-PS5 games to letterbox nicely
  const imageBackgroundColor = isPS5 ? "#2a2a3a" : "#000000";

  useEffect(() => {
    const t = setTimeout(() => {
      setLoadIcon(true);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/game/[id]",
          params: { id },
        })
      }
    >
      <View style={styles.cardContainer}>
        {/* COLUMN 1: Image + Badge */}
        <View style={{ position: "relative", marginRight: 14 }}>
          {loadIcon ? (
            // 🖼️ Image Container for background color
            <View
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: 8,
                backgroundColor: imageBackgroundColor, // Dynamic background
                overflow: "hidden",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: displayImage }}
                style={{
                  width: IMG_SIZE,
                  height: IMG_SIZE,
                }}
                resizeMode={dynamicResizeMode} // 👈 Dynamic Mode
              />
            </View>
          ) : (
            // Placeholder
            <View
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: 8,
                backgroundColor: "#2a2a3a",
              }}
            />
          )}

          {/* Badge */}
          {platform ? (
            <View style={styles.platformBadge}>
              <Text style={styles.platformText}>{platform}</Text>
            </View>
          ) : null}
        </View>

        {/* COLUMN 2: Info */}
        <View style={[styles.infoColumn, { height: IMG_SIZE }]}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
            {title}
          </Text>

          <View style={{ flexDirection: "row", gap: 14 }}>
            <StatItem
              icon={trophyIcons.bronze}
              earned={counts.earnedBronze}
              total={counts.bronze}
            />
            <StatItem
              icon={trophyIcons.silver}
              earned={counts.earnedSilver}
              total={counts.silver}
            />
            <StatItem
              icon={trophyIcons.gold}
              earned={counts.earnedGold}
              total={counts.gold}
            />
            <StatItem
              icon={trophyIcons.platinum}
              earned={counts.earnedPlatinum}
              total={counts.platinum}
              size={22}
            />
          </View>

          <Text style={styles.dateText}>Last Earned: {formatDate(lastPlayed)}</Text>
        </View>

        {/* COLUMN 3: Circle */}
        <View style={styles.circleColumn}>
          <ProgressCircle progress={progress} size={42} strokeWidth={3} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ... StatItem and styles remain exactly the same as before ...
const StatItem = ({ icon, earned, total, size = 18 }: any) => (
  <View style={{ alignItems: "center" }}>
    <Image
      source={icon}
      style={{ width: size, height: size, marginBottom: 3 }}
      resizeMode="contain"
    />
    <Text style={styles.statText}>
      {earned}/{total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d",
    borderRadius: 12,
    padding: 8,
    marginVertical: 1,
    width: "100%",
    alignItems: "center",
  },
  infoColumn: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
    marginRight: 8,
  },
  circleColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 4,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  dateText: {
    color: "#888",
    fontSize: 11,
  },
  statText: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
  },
  platformBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  platformText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default React.memo(GameCard);
