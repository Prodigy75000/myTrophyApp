import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  id: string;
  art: string;
  platform: string;
  progress: number;
  numColumns: number;
};

const GameGridItem = ({ id, art, platform, progress, numColumns }: Props) => {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const size = (screenWidth - (numColumns + 1) * 4) / numColumns;

  // 🧠 THE FIX (Same as GameCard)
  const isPS5 = platform === "PS5";
  const dynamicResizeMode = isPS5 ? "cover" : "contain";
  const imageBackgroundColor = isPS5 ? "#1e1e2d" : "#000000";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/game/[id]",
          params: { id },
        })
      }
      style={{
        width: size,
        height: size,
        marginBottom: 4,
        marginHorizontal: 2,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: imageBackgroundColor, // Dynamic Background
        position: "relative",
        justifyContent: "center", // Center contained images
        alignItems: "center",
      }}
    >
      <Image
        source={{ uri: art }}
        style={{ width: size, height: size }}
        resizeMode={dynamicResizeMode} // Dynamic Mode
        onLoad={() => setLoaded(true)}
      />

      {/* Dim Overlay (Only needed for PS5 cover art) */}
      {isPS5 && <View style={styles.overlay} />}

      {/* Badges */}
      {platform ? (
        <View style={styles.platformBadge}>
          <Text style={styles.badgeText}>{platform}</Text>
        </View>
      ) : null}

      <View style={styles.progressBadge}>
        <Text style={styles.badgeText}>{progress}%</Text>
      </View>
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
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  progressBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default React.memo(GameGridItem);
