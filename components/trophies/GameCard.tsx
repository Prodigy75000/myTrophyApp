import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDate } from "../../utils/formatDate";
import ProgressCircle from "../ProgressCircle";

// Trophy icons
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
  justUpdated?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
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
  justUpdated,
  isPinned,
  onPin,
}: GameCardProps) => {
  const router = useRouter();
  const [loadIcon, setLoadIcon] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ｧ SMART ART LOGIC
  const displayImage = art || icon;
  const isSpecialArt = art && art !== icon;
  const isSquareFormat = platform === "PS5" || isSpecialArt;
  const imageResizeMode = isSquareFormat ? "cover" : "contain";
  const IMG_SIZE = 124;

  useEffect(() => {
    const t = setTimeout(() => setLoadIcon(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (justUpdated) {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.delay(2000),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]).start();
    }
  }, [justUpdated]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", "rgba(255, 215, 0, 0.8)"],
  });

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/game/[id]",
            params: { id, artParam: displayImage },
          })
        }
      >
        <Animated.View style={[styles.cardContainer, { borderColor, borderWidth: 1 }]}>
          {/* COLUMN 1: Image */}
          <View style={{ position: "relative", marginRight: 14 }}>
            <View style={styles.imageWrapper}>
              {loadIcon ? (
                <Image
                  source={{ uri: displayImage }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={imageResizeMode}
                />
              ) : null}
            </View>
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

            {/* TROPHY STATS ROW */}
            <View style={styles.statsRow}>
              {counts.platinum > 0 ? (
                <StatItem
                  icon={trophyIcons.platinum}
                  earned={counts.earnedPlatinum}
                  total={counts.platinum}
                />
              ) : (
                <View style={styles.statItemContainer}>
                  <Image
                    source={trophyIcons.platinum}
                    style={{
                      width: 24,
                      height: 24,
                      marginBottom: 2,
                      opacity: 0.1,
                      tintColor: "#888",
                    }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.statTotal, { opacity: 0 }]}>0/0</Text>
                </View>
              )}
              <StatItem
                icon={trophyIcons.gold}
                earned={counts.earnedGold}
                total={counts.gold}
              />
              <StatItem
                icon={trophyIcons.silver}
                earned={counts.earnedSilver}
                total={counts.silver}
              />
              <StatItem
                icon={trophyIcons.bronze}
                earned={counts.earnedBronze}
                total={counts.bronze}
              />
            </View>

            <Text style={styles.dateText}>Last Earned: {formatDate(lastPlayed)}</Text>
          </View>

          {/* COLUMN 3: Progress Circle */}
          <View style={styles.circleColumn}>
            <ProgressCircle progress={progress} size={42} strokeWidth={3} />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* PIN COMPONENT */}
      <TouchableOpacity onPress={onPin} style={styles.pinButton} hitSlop={12}>
        <MaterialCommunityIcons
          name={isPinned ? "pin" : "pin-outline"}
          size={16}
          color={isPinned ? "#4da3ff" : "#555"}
        />
      </TouchableOpacity>
    </View>
  );
};

// 🎨 UPDATED STAT ITEM: Neutral Colors
const StatItem = ({ icon, earned, total }: any) => (
  <View style={styles.statItemContainer}>
    <Image
      source={icon}
      style={{ width: 24, height: 24, marginBottom: 2 }}
      resizeMode="contain"
    />
    <Text style={styles.statTotal}>
      {/* Forced White for Earned, Gray for Total via parent style */}
      <Text style={[styles.statEarned, { color: "#fff" }]}>{earned}</Text>/{total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d",
    borderRadius: 12,
    padding: 1,
    marginVertical: 1,
    width: "100%",
    alignItems: "center",
  },
  imageWrapper: {
    width: 124,
    height: 124,
    borderRadius: 8,
    backgroundColor: "transparent",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  infoColumn: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 6,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    paddingRight: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
  },
  statItemContainer: {
    width: 44,
    alignItems: "center",
    marginRight: 4,
  },
  statEarned: {
    fontWeight: "800",
    fontSize: 13,
  },
  statTotal: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  circleColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 4,
  },
  dateText: {
    color: "#888",
    fontSize: 11,
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
  pinButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: "rgba(20, 20, 30, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
});

export default React.memo(GameCard);
