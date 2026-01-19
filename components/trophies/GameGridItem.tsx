import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProgressCircle from "../ProgressCircle";

type Props = {
  id: string;
  art: string;
  platform: string;
  progress: number;
  numColumns: number;
  justUpdated?: boolean; // 👈 NEW PROP
};

const GameGridItem = ({
  id,
  art,
  platform,
  progress,
  numColumns,
  justUpdated,
}: Props) => {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get("window").width;
  const size = (screenWidth - (numColumns + 1) * 4) / numColumns;

  const isPS5 = platform === "PS5";
  const dynamicResizeMode = isPS5 ? "cover" : "contain";
  const imageBackgroundColor = isPS5 ? "#1e1e2d" : "#000000";

  // ⚡ TRIGGER ANIMATION
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
    outputRange: ["rgba(0,0,0,0)", "rgba(255, 215, 0, 1)"], // Gold border
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/game/[id]",
          params: { id },
        })
      }
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          marginBottom: 4,
          marginHorizontal: 2,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: imageBackgroundColor,
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2, // Explicit border width
          borderColor: borderColor, // Animated Color
        }}
      >
        <Image
          source={{ uri: art }}
          style={{ width: size, height: size }}
          resizeMode={dynamicResizeMode}
          onLoad={() => setLoaded(true)}
        />

        {isPS5 && <View style={styles.overlay} />}

        {platform ? (
          <View style={styles.platformBadge}>
            <Text style={styles.badgeText}>{platform}</Text>
          </View>
        ) : null}

        <View style={styles.progressContainer}>
          <ProgressCircle progress={progress} size={36} strokeWidth={3} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

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
});

export default React.memo(GameGridItem);
