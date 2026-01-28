// components/trophies/TrophyCard.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
    alignItems: "center",
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#2a2a3d",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  // TITLE ROW
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  miniRankIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  name: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  description: {
    color: "#a0a0b0",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  // BOTTOM ROW
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusContainer: {
    flex: 1,
    marginRight: 12,
  },
  // PROGRESS BAR
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginRight: 8,
    maxWidth: 80,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4da3ff",
  },
  progressText: {
    color: "#ccc",
    fontSize: 10,
    fontWeight: "bold",
  },
  // STATUS TEXT
  earnedDate: {
    color: "#4caf50",
    fontSize: 11,
    fontWeight: "600",
  },
  lockedText: {
    color: "#666",
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: "500",
  },
  // RARITY
  rarityWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarity: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  // PYRAMID
  pyramidContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pyramidBar: {
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
});
