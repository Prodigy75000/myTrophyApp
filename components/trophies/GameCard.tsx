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
  platform: string; // 👈 NEW PROP
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
  const IMG_SIZE = 100;

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
        {/* COLUMN 1: Image + Platform Badge */}
        <View style={{ position: "relative", marginRight: 14 }}>
          {loadIcon ? (
            <Image
              source={{ uri: displayImage }}
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: 8,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: 8,
                backgroundColor: "#2a2a3a",
              }}
            />
          )}

          {/* 🏷️ PLATFORM BADGE (Bottom Left) */}
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform}</Text>
          </View>
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
  // ✨ NEW BADGE STYLES
  platformBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.8)", // Dark backdrop
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 8, // Matches image corner
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  platformText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default React.memo(GameCard);
