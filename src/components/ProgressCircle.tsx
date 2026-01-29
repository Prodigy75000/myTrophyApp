// components/ProgressCircle.tsx
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0–100
};

function ProgressCircle({ size = 34, strokeWidth = 4, progress }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Ensure progress stays between 0-100 to prevent visual glitches
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  const isComplete = clampedProgress === 100;

  // Unique IDs for gradients (scoped to this file context mostly)
  const BLUE_GRADIENT_ID = "blueGradient";
  const GOLD_GRADIENT_ID = "goldGradient";

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          {/* Standard Blue Gradient */}
          <LinearGradient id={BLUE_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4da3ff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#006FCD" stopOpacity="1" />
          </LinearGradient>

          {/* Platinum/Gold Gradient for 100% */}
          <LinearGradient id={GOLD_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFA500" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background Track (Dark Grey) */}
        <Circle
          stroke="#333"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Progress Indicator */}
        <Circle
          stroke={isComplete ? `url(#${GOLD_GRADIENT_ID})` : `url(#${BLUE_GRADIENT_ID})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Percentage Text */}
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.28,
            color: isComplete ? "#FFD700" : "#fff",
          },
        ]}
      >
        {Math.round(clampedProgress)}%
      </Text>
    </View>
  );
}

export default memo(ProgressCircle);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }], // Rotate so progress starts at top
  },
  text: {
    fontWeight: "700",
  },
});
