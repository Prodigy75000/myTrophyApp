import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function TrophySkeleton() {
  // Pulse Animation
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {/* Icon Placeholder (Matches 80x80) */}
      <Animated.View style={[styles.icon, { opacity }]} />

      <View style={styles.info}>
        {/* Title Placeholder */}
        <Animated.View
          style={[styles.bar, { width: "60%", height: 14, marginBottom: 8 }, { opacity }]}
        />
        {/* Description Placeholder */}
        <Animated.View
          style={[
            styles.bar,
            { width: "90%", height: 12, marginBottom: 12 },
            { opacity },
          ]}
        />

        {/* Bottom Row (Status vs Rarity) */}
        <View style={styles.bottomRow}>
          <Animated.View
            style={[styles.bar, { width: "25%", height: 10 }, { opacity }]}
          />
          <Animated.View
            style={[styles.bar, { width: "15%", height: 10 }, { opacity }]}
          />
        </View>
      </View>

      {/* Right Stripe Placeholder */}
      <Animated.View style={[styles.stripe, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d", // Matches Card BG
    borderRadius: 12,
    padding: 8,
    marginBottom: 3,
    alignItems: "center",
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: "#2a2a3a",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  bar: {
    backgroundColor: "#2a2a3a",
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  stripe: {
    width: 4,
    height: "60%",
    borderRadius: 2,
    marginLeft: 10,
    backgroundColor: "#2a2a3a",
  },
});
