import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0–100
};

export default function ProgressCircle({ size = 34, strokeWidth = 4, progress }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // 🎨 THEME: PlayStation Blue Gradient
  // From bright cyan (#00CEFF) to deep blue (#006FCD)
  const isComplete = progress === 100;

  // Option: Turn Gold if 100%? Or stick to Blue?
  // Let's stick to Blue for consistency, or use Gold for Platinum feel.
  // For now, let's do the Premium Blue.
  const GRADIENT_ID = "blueGradient";

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        {/* ✨ DEFINITIONS FOR GRADIENT */}
        <Defs>
          <LinearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4da3ff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#006FCD" stopOpacity="1" />
          </LinearGradient>

          {/* Optional: Gold Gradient for 100% */}
          <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFA500" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background ring (Dark Grey) */}
        <Circle
          stroke="#333"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Progress ring (Uses Gradient) */}
        <Circle
          stroke={isComplete ? "url(#goldGradient)" : `url(#${GRADIENT_ID})`} // Gold if 100%, Blue otherwise
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

      {/* Percentage text */}
      <Text
        style={{
          color: isComplete ? "#FFD700" : "#fff", // Gold text if 100%
          fontSize: size * 0.28, // Dynamic font size based on circle size
          fontWeight: "700",
        }}
      >
        {Math.round(progress)}%
      </Text>
    </View>
  );
}
