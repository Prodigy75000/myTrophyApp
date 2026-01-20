// components/trophies/GameCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDate } from "../../utils/formatDate";
import ProgressCircle from "../ProgressCircle";

// ---------------------------------------------------------------------------
// ASSETS
// ---------------------------------------------------------------------------
const ICONS = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

const IMG_SIZE = 124;

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Stat Item
// ---------------------------------------------------------------------------

type StatItemProps = {
  icon: ImageSourcePropType;
  earned: number;
  total: number;
  disabled?: boolean;
};

const StatItem = ({ icon, earned, total, disabled = false }: StatItemProps) => (
  <View style={[styles.statItemContainer, disabled && styles.statItemDisabled]}>
    <Image
      source={icon}
      style={[styles.statIcon, disabled && { tintColor: "#888", opacity: 0.3 }]}
      resizeMode="contain"
    />
    <Text style={[styles.statTotal, disabled && { opacity: 0 }]}>
      <Text style={[styles.statEarned, { color: "#fff" }]}>{earned}</Text>/{total}
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

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

  // Smart Art Logic
  const displayImage = art || icon;
  const isSpecialArt = art && art !== icon;
  const isSquareFormat = platform === "PS5" || isSpecialArt;
  const imageResizeMode = isSquareFormat ? "cover" : "contain";

  // Lazy load image delay (performance optimization for long lists)
  useEffect(() => {
    const t = setTimeout(() => setLoadIcon(true), 50);
    return () => clearTimeout(t);
  }, []);

  // "Just Updated" Flash Animation
  useEffect(() => {
    if (justUpdated) {
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
  }, [justUpdated]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", "rgba(255, 215, 0, 0.8)"],
  });

  return (
    <View style={styles.wrapper}>
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
          {/* COLUMN 1: Image & Platform */}
          <View style={styles.imageColumn}>
            <View style={styles.imageWrapper}>
              {loadIcon && (
                <Image
                  source={{ uri: displayImage }}
                  style={styles.image}
                  resizeMode={imageResizeMode}
                />
              )}
            </View>
            {platform ? (
              <View style={styles.platformBadge}>
                <Text style={styles.platformText}>{platform}</Text>
              </View>
            ) : null}
          </View>

          {/* COLUMN 2: Info & Stats */}
          <View style={[styles.infoColumn, { height: IMG_SIZE }]}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
              {title}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Platinum (Ghost if 0) */}
              <StatItem
                icon={ICONS.platinum}
                earned={counts.earnedPlatinum}
                total={counts.platinum}
                disabled={counts.platinum === 0}
              />
              <StatItem
                icon={ICONS.gold}
                earned={counts.earnedGold}
                total={counts.gold}
              />
              <StatItem
                icon={ICONS.silver}
                earned={counts.earnedSilver}
                total={counts.silver}
              />
              <StatItem
                icon={ICONS.bronze}
                earned={counts.earnedBronze}
                total={counts.bronze}
              />
            </View>

            <Text style={styles.dateText}>Last Earned: {formatDate(lastPlayed)}</Text>
          </View>

          {/* COLUMN 3: Progress */}
          <View style={styles.circleColumn}>
            <ProgressCircle progress={progress} size={42} strokeWidth={3} />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Pin Button */}
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

export default memo(GameCard);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d",
    borderRadius: 12,
    padding: 1,
    marginVertical: 1,
    width: "100%",
    alignItems: "center",
  },
  // Column 1
  imageColumn: {
    position: "relative",
    marginRight: 14,
  },
  imageWrapper: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 8,
    backgroundColor: "#111", // darker placeholder
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
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
  // Column 2
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
  // Stat Item
  statItemContainer: {
    width: 44,
    alignItems: "center",
    marginRight: 4,
  },
  statItemDisabled: {
    opacity: 0.5,
  },
  statIcon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  statTotal: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  statEarned: {
    fontWeight: "800",
    fontSize: 13,
  },
  // Column 3 & Misc
  circleColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 4,
  },
  dateText: {
    color: "#888",
    fontSize: 11,
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
    zIndex: 10,
  },
});
