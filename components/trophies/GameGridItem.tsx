import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
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

// Import icons locally
const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

type Props = {
  id: string;
  art: string;
  platform: string;
  progress: number;
  numColumns: number;
  justUpdated?: boolean;
  counts?: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    earnedBronze: number;
    earnedSilver: number;
    earnedGold: number;
    earnedPlatinum: number;
  };
  isPinned?: boolean;
  onPin?: () => void;
  isPeeking?: boolean;
  onTogglePeek?: () => void;
};

const GameGridItem = ({
  id,
  art,
  platform,
  progress,
  numColumns,
  justUpdated,
  counts = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    earnedBronze: 0,
    earnedSilver: 0,
    earnedGold: 0,
    earnedPlatinum: 0,
  },
  isPinned,
  onPin,
  isPeeking = false,
  onTogglePeek,
}: Props) => {
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ⏱️ TIMING REF for Double Tap
  const lastTapRef = useRef<number>(0);

  const screenWidth = Dimensions.get("window").width;
  const size = (screenWidth - (numColumns + 1) * 4) / numColumns;

  const isPS5 = platform === "PS5";
  const dynamicResizeMode = isPS5 ? "cover" : "contain";

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

  // ⚡ INTERACTION LOGIC
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 800;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // ✅ DOUBLE TAP -> Navigate
      router.push({
        pathname: "/game/[id]",
        params: { id, artParam: art },
      });
      lastTapRef.current = 0;
    } else {
      // ✅ SINGLE TAP -> Toggle Peek
      if (onTogglePeek) onTogglePeek();
      lastTapRef.current = now;
    }
  };

  return (
    <View style={{ position: "relative" }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Animated.View
          style={{
            width: size,
            height: size,
            marginBottom: 4,
            marginHorizontal: 2,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#000",
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: borderColor,
          }}
        >
          <Image
            source={{ uri: art }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={dynamicResizeMode}
          />

          {isPS5 && <View style={styles.overlay} />}

          {/* 👁️ PEEK OVERLAY */}
          {isPeeking && (
            <View style={styles.peekOverlay}>
              <View style={styles.peekContent}>
                {counts.platinum > 0 && (
                  <PeekRow
                    icon={trophyIcons.platinum}
                    earned={counts.earnedPlatinum}
                    total={counts.platinum}
                  />
                )}
                <PeekRow
                  icon={trophyIcons.gold}
                  earned={counts.earnedGold}
                  total={counts.gold}
                />
                <PeekRow
                  icon={trophyIcons.silver}
                  earned={counts.earnedSilver}
                  total={counts.silver}
                />
                <PeekRow
                  icon={trophyIcons.bronze}
                  earned={counts.earnedBronze}
                  total={counts.bronze}
                />
              </View>
            </View>
          )}

          {/* Standard UI (Hidden while peeking) */}
          {!isPeeking && platform ? (
            <View style={styles.platformBadge}>
              <Text style={styles.badgeText}>{platform}</Text>
            </View>
          ) : null}

          {!isPeeking && (
            <View style={styles.progressContainer}>
              <ProgressCircle progress={progress} size={36} strokeWidth={3} />
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* 📌 PIN ICON */}
      {!isPeeking && (
        <TouchableOpacity onPress={onPin} style={styles.pinButton} hitSlop={10}>
          <MaterialCommunityIcons
            name={isPinned ? "pin" : "pin-outline"}
            size={16}
            color={isPinned ? "#4da3ff" : "#fff"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// 🎨 UPDATED PEEK ROW: Neutral Colors
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  platformBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  progressContainer: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 2,
  },
  peekOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  peekContent: {
    gap: 6,
    alignItems: "flex-start",
  },
  peekRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  peekIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  peekText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pinButton: {
    position: "absolute",
    top: 4,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    zIndex: 50,
  },
});

export default React.memo(GameGridItem);
