// components/trophies/GameGridItem.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProgressCircle from "../ProgressCircle";
import { GameVersion } from "./GameCard";

const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

type Props = {
  title: string;
  icon: string;
  heroArt?: string;
  versions: GameVersion[];
  numColumns: number;
  justUpdated?: boolean;
  isPinned?: boolean;
  onPin?: (id: string) => void;
  isPeeking?: boolean;
  onTogglePeek?: () => void;
  // 🟢 NEW PROP
  sourceMode?: "OWNED" | "GLOBAL" | "UNOWNED";
};

const GameGridItem = ({
  title,
  icon,
  heroArt,
  versions,
  numColumns,
  justUpdated,
  isPinned,
  onPin,
  isPeeking = false,
  onTogglePeek,
  sourceMode, // 🟢 Destructure
}: Props) => {
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0)).current;

  // --- Smart Grouping ---
  const groupedVersions = useMemo(() => {
    const groups: Record<string, GameVersion[]> = {};
    if (!versions) return {};
    versions.forEach((v) => {
      if (!groups[v.platform]) groups[v.platform] = [];
      groups[v.platform].push(v);
    });
    Object.keys(groups).forEach((plat) => {
      groups[plat].sort((a, b) => b.progress - a.progress);
    });
    return groups;
  }, [versions]);

  const uniquePlatforms = Object.keys(groupedVersions).sort((a, b) => {
    if (a === "PS5") return -1;
    if (b === "PS5") return 1;
    return 0;
  });

  const [activePlatform, setActivePlatform] = useState(uniquePlatforms[0] || "PS4");
  const activeVer = groupedVersions[activePlatform]?.[0] || versions[0];

  const handlePlatformPress = (e: any, plat: string) => {
    e.stopPropagation();
    setActivePlatform(plat);
  };

  const lastTapRef = useRef<number>(0);
  const screenWidth = Dimensions.get("window").width;
  const size = screenWidth / numColumns;

  const isPS5 = activeVer?.platform === "PS5";
  const dynamicResizeMode = "contain";

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
    outputRange: ["rgba(0,0,0,0)", "rgba(255, 215, 0, 1)"],
  });

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 800;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      router.push({
        pathname: "/game/[id]",
        // 🟢 PASS THE MODE
        params: { id: activeVer.id, artParam: heroArt || icon, contextMode: sourceMode },
      });
      lastTapRef.current = 0;
    } else {
      if (onTogglePeek) onTogglePeek();
      lastTapRef.current = now;
    }
  };

  if (!activeVer) return null;

  return (
    <View style={{ width: size, height: size, padding: 0.5 }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        <Animated.View
          style={{
            flex: 1,
            borderRadius: 0,
            overflow: "hidden",
            backgroundColor: "#000",
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: justUpdated ? 2 : 0,
            borderColor: borderColor,
          }}
        >
          <Image
            source={{ uri: icon }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={dynamicResizeMode}
          />
          {isPS5 && <View style={styles.overlay} />}

          {!isPeeking && (
            <View style={styles.titleBadge}>
              <Text numberOfLines={2} style={styles.titleText}>
                {title}
              </Text>
            </View>
          )}

          {isPeeking && (
            <View style={styles.peekOverlay}>
              <View style={styles.peekContent}>
                {activeVer.counts.platinum > 0 && (
                  <PeekRow
                    icon={trophyIcons.platinum}
                    earned={activeVer.counts.earnedPlatinum}
                    total={activeVer.counts.platinum}
                  />
                )}
                <PeekRow
                  icon={trophyIcons.gold}
                  earned={activeVer.counts.earnedGold}
                  total={activeVer.counts.gold}
                />
                <PeekRow
                  icon={trophyIcons.silver}
                  earned={activeVer.counts.earnedSilver}
                  total={activeVer.counts.silver}
                />
                <PeekRow
                  icon={trophyIcons.bronze}
                  earned={activeVer.counts.earnedBronze}
                  total={activeVer.counts.bronze}
                />
              </View>
            </View>
          )}

          {!isPeeking && (
            <View style={styles.versionRow}>
              {uniquePlatforms.map((plat) => {
                const isActive = activePlatform === plat;
                return (
                  <Pressable
                    key={plat}
                    style={[
                      styles.versionBadge,
                      isActive ? styles.versionActive : styles.versionInactive,
                    ]}
                    onPress={(e) => handlePlatformPress(e, plat)}
                  >
                    <Text
                      style={[
                        styles.versionText,
                        isActive ? { color: "white" } : { color: "#888" },
                      ]}
                    >
                      {plat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!isPeeking && (
            <View style={styles.progressContainer}>
              <ProgressCircle progress={activeVer.progress} size={36} strokeWidth={3} />
            </View>
          )}
        </Animated.View>
      </Pressable>

      {(isPinned || isPeeking) && (
        <TouchableOpacity
          onPress={() => onPin?.(activeVer.id)}
          style={styles.pinButton}
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name={isPinned ? "pin" : "pin-outline"}
            size={14}
            color={isPinned ? "#4da3ff" : "#fff"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const PeekRow = ({ icon, earned, total }: any) => (
  <View style={styles.peekRow}>
    <Image source={icon} style={styles.peekIcon} resizeMode="contain" />
    <Text style={styles.peekText}>
      <Text style={{ color: "#fff", fontWeight: "bold" }}>{earned}</Text>
      <Text style={{ color: "#aaa" }}>/{total}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" },
  titleBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 28,
    zIndex: 5,
  },
  titleText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  versionRow: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 4,
    padding: 2,
    gap: 2,
    zIndex: 10,
  },
  versionBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  versionActive: { backgroundColor: "#4da3ff" },
  versionInactive: { backgroundColor: "transparent" },
  versionText: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase" },
  progressContainer: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 1,
  },
  peekOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  peekContent: { gap: 4, alignItems: "flex-start" },
  peekRow: { flexDirection: "row", alignItems: "center" },
  peekIcon: { width: 16, height: 16, marginRight: 6 },
  peekText: { fontSize: 12, fontWeight: "600" },
  pinButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});

export default React.memo(GameGridItem);
