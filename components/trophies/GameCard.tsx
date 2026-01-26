// components/trophies/GameCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
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

// ... Assets ...
const ICONS = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};
const IMG_SIZE = 124;

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

export type GameVersion = {
  id: string;
  platform: string;
  progress: number;
  lastPlayed?: string;
  region?: string;
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
  isOwned: boolean;
};

type GameCardProps = {
  title: string;
  icon: string;
  art?: string;
  versions: GameVersion[];
  justUpdated?: boolean;
  isPinned?: boolean;
  onPin?: (id: string) => void;
  // 🟢 NEW PROP
  sourceMode?: "OWNED" | "GLOBAL" | "UNOWNED";
};

const GameCard = ({
  title,
  icon,
  art,
  versions,
  justUpdated,
  isPinned,
  onPin,
  sourceMode, // 🟢 Destructure
}: GameCardProps) => {
  const router = useRouter();

  const groupedVersions = useMemo(() => {
    const groups: Record<string, GameVersion[]> = {};
    versions.forEach((v) => {
      if (!groups[v.platform]) groups[v.platform] = [];
      groups[v.platform].push(v);
    });
    return groups;
  }, [versions]);

  const uniquePlatforms = Object.keys(groupedVersions).sort((a, b) => {
    if (a === "PS5") return -1;
    if (b === "PS5") return 1;
    return 0;
  });

  const [activePlatform, setActivePlatform] = useState(uniquePlatforms[0]);

  useEffect(() => {
    if (!uniquePlatforms.includes(activePlatform)) {
      setActivePlatform(uniquePlatforms[0]);
    }
  }, [uniquePlatforms]);

  const currentStack = groupedVersions[activePlatform] || [];
  const activeVer = currentStack[0] || versions[0];

  const [loadIcon, setLoadIcon] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const displayImage = icon;
  const heroArt = art || icon;

  const isSquareFormat = activeVer.platform === "PS5";
  const imageResizeMode = isSquareFormat ? "cover" : "contain";

  const totalEarned =
    activeVer.counts.earnedBronze +
    activeVer.counts.earnedSilver +
    activeVer.counts.earnedGold +
    activeVer.counts.earnedPlatinum;
  const hasStarted = totalEarned > 0;

  useEffect(() => {
    setTimeout(() => setLoadIcon(true), 50);
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
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/game/[id]",
            // 🟢 PASS THE MODE TO THE DETAILS SCREEN
            params: { id: activeVer.id, artParam: heroArt, contextMode: sourceMode },
          })
        }
      >
        <Animated.View style={[styles.cardContainer, { borderColor, borderWidth: 1 }]}>
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

            {/* Platform Badges */}
            <View style={styles.versionRow}>
              {uniquePlatforms.map((plat) => (
                <TouchableOpacity
                  key={plat}
                  style={[
                    styles.versionBadge,
                    activePlatform === plat
                      ? styles.versionActive
                      : styles.versionInactive,
                  ]}
                  onPress={() => setActivePlatform(plat)}
                >
                  <Text
                    style={[
                      styles.versionText,
                      activePlatform === plat ? { color: "white" } : { color: "#888" },
                    ]}
                  >
                    {plat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.infoColumn, { height: IMG_SIZE }]}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
              {title}
            </Text>
            <View style={styles.statsRow}>
              <StatItem
                icon={ICONS.platinum}
                earned={activeVer.counts.earnedPlatinum}
                total={activeVer.counts.platinum}
                disabled={activeVer.counts.platinum === 0}
              />
              <StatItem
                icon={ICONS.gold}
                earned={activeVer.counts.earnedGold}
                total={activeVer.counts.gold}
              />
              <StatItem
                icon={ICONS.silver}
                earned={activeVer.counts.earnedSilver}
                total={activeVer.counts.silver}
              />
              <StatItem
                icon={ICONS.bronze}
                earned={activeVer.counts.earnedBronze}
                total={activeVer.counts.bronze}
              />
            </View>
            {hasStarted ? (
              <Text style={styles.dateText}>
                Last Earned: {formatDate(activeVer.lastPlayed)}
              </Text>
            ) : (
              <Text style={[styles.dateText, { opacity: 0.5 }]}>
                {activeVer.isOwned ? "Not Started" : "Unowned"}
              </Text>
            )}
          </View>

          <View style={styles.circleColumn}>
            <ProgressCircle progress={activeVer.progress} size={42} strokeWidth={3} />
          </View>
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onPin?.(activeVer.id)}
        style={styles.pinButton}
        hitSlop={12}
      >
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

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d",
    borderRadius: 12,
    padding: 1,
    marginVertical: 1,
    width: "100%",
    alignItems: "center",
  },
  imageColumn: { position: "relative", marginRight: 14, alignItems: "center" },
  imageWrapper: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 8,
    backgroundColor: "#111",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },
  versionRow: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 4,
    padding: 2,
    gap: 2,
  },
  versionBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  versionActive: { backgroundColor: "#4da3ff" },
  versionInactive: { backgroundColor: "transparent" },
  versionText: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase" },
  infoColumn: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 6,
    marginRight: 8,
  },
  title: { color: "#fff", fontSize: 14, fontWeight: "700", paddingRight: 0 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
  },
  statItemContainer: { width: 44, alignItems: "center", marginRight: 4 },
  statItemDisabled: { opacity: 0.5 },
  statIcon: { width: 24, height: 24, marginBottom: 2 },
  statTotal: { color: "#666", fontSize: 11, fontWeight: "600" },
  statEarned: { fontWeight: "800", fontSize: 13 },
  circleColumn: { justifyContent: "center", alignItems: "center", paddingRight: 4 },
  dateText: { color: "#888", fontSize: 11 },
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
