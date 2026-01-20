// components/skeletons/TrophySkeleton.tsx
import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  style?: ViewStyle;
};

function TrophySkeleton({ style }: Props) {
  // Pulse Animation Ref
  const opacity = useRef(new Animated.Value(0.3)).current;

  // Setup Loop
  useEffect(() => {
    const pulse = Animated.sequence([
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
    ]);

    const loop = Animated.loop(pulse);
    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={[styles.container, style]}>
      {/* Icon Placeholder (80x80) */}
      <Animated.View style={[styles.icon, { opacity }]} />

      <View style={styles.info}>
        {/* Title Bar */}
        <Animated.View style={[styles.bar, styles.titleBar, { opacity }]} />

        {/* Description Bar */}
        <Animated.View style={[styles.bar, styles.descBar, { opacity }]} />

        {/* Bottom Row (Status + Rarity) */}
        <View style={styles.bottomRow}>
          <Animated.View style={[styles.bar, styles.statusBar, { opacity }]} />
          <Animated.View style={[styles.bar, styles.rarityBar, { opacity }]} />
        </View>
      </View>

      {/* Right Side Stripe */}
      <Animated.View style={[styles.stripe, { opacity }]} />
    </View>
  );
}

export default memo(TrophySkeleton);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1e1e2d", // Matches Card BG
    borderRadius: 12,
    padding: 8,
    marginBottom: 4, // Slightly increased spacing
    alignItems: "center",
  },
  // Icon
  icon: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: "#2a2a3a",
  },
  // Layout
  info: {
    flex: 1,
    justifyContent: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  // Shared Bar Style
  bar: {
    backgroundColor: "#2a2a3a",
    borderRadius: 4,
  },
  // Specific Bars
  titleBar: {
    width: "60%",
    height: 14,
    marginBottom: 8,
  },
  descBar: {
    width: "90%",
    height: 12,
    marginBottom: 12,
  },
  statusBar: {
    width: "25%",
    height: 10,
  },
  rarityBar: {
    width: "15%",
    height: 10,
  },
  // Side Stripe
  stripe: {
    width: 4,
    height: "60%",
    borderRadius: 2,
    marginLeft: 10,
    backgroundColor: "#2a2a3a",
  },
});
