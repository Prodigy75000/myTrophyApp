// components/trophies/GameCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDate } from "../../utils/formatDate";
import ProgressCircle from "../ProgressCircle";

// Styles
import { IMG_SIZE, styles } from "../../styles/GameCard.styles";

// ... Assets ...
const ICONS = {
  bronze: require("../../../assets/icons/trophies/bronze.png"),
  silver: require("../../../assets/icons/trophies/silver.png"),
  gold: require("../../../assets/icons/trophies/gold.png"),
  platinum: require("../../../assets/icons/trophies/platinum.png"),
};

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
    // 🟢 ADDED: Optional generic 'earned' for Gamerscore
    earned?: number;
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
  sourceMode,
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

  // Check if started (Generic: Trophies OR Gamerscore)
  const totalEarned =
    (activeVer.counts.earned || 0) + // Check Gamerscore first
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

  // 🟢 1. RENDER STATS LOGIC
  const renderStats = () => {
    // A. XBOX MODE (Gamerscore)
    if (activeVer.platform === "XBOX") {
      return (
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}
        >
          {/* Gamerscore Badge */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "rgba(16, 124, 16, 0.2)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 6,
                borderWidth: 1,
                borderColor: "rgba(16, 124, 16, 0.3)",
              }}
            >
              <MaterialCommunityIcons name="trophy-variant" size={14} color="#107c10" />
            </View>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>
              {activeVer.counts.earned ?? 0}
              <Text style={{ color: "#666", fontSize: 11, fontWeight: "600" }}>
                {" "}
                / {activeVer.counts.total} G
              </Text>
            </Text>
          </View>

          {/* Completed Badge */}
          {activeVer.progress === 100 && (
            <View
              style={{
                backgroundColor: "rgba(16, 124, 16, 0.2)",
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "rgba(16, 124, 16, 0.3)",
              }}
            >
              <Text style={{ color: "#107c10", fontSize: 9, fontWeight: "bold" }}>
                COMPLETED
              </Text>
            </View>
          )}
        </View>
      );
    }

    // B. PSN MODE (Trophies)
    return (
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
    );
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/game/[id]",
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

            {/* 🟢 2. INJECT RENDER HELPER HERE */}
            {renderStats()}

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
