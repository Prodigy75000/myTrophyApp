// components/trophies/GameHero.styles.ts
import { StyleSheet } from "react-native";

export const BASE_ICON_HEIGHT = 100;

export const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: "relative",
  },
  artContainer: {
    height: 200,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
    opacity: 0.6,
  },
  artImage: { width: "100%", height: "100%" },
  gradient: { ...StyleSheet.absoluteFillObject },

  // --- Top Left ---
  topBadgesContainer: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 10,
    alignItems: "flex-start",
  },
  platformRow: { flexDirection: "row", gap: 8 },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  versionActive: { backgroundColor: "#4da3ff", borderColor: "#4da3ff" },
  versionInactive: { backgroundColor: "rgba(0,0,0,0.6)" },
  versionText: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  platformBadgeFallback: {
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },

  // --- Top Right Region Button ---
  regionBtn: {
    position: "absolute",
    top: 10,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)", // Glassy dark background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  regionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  regionCounterText: {
    color: "#888",
    fontSize: 10,
    fontWeight: "400",
  },

  // --- Content ---
  content: { marginTop: 120, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  rightColumn: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: BASE_ICON_HEIGHT,
    paddingBottom: 4,
  },
  iconWrapperBase: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#000",
    overflow: "hidden",
    marginRight: 16,
  },
  icon: { width: "100%", height: "100%" },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  trophyCount: {},
  trophyLabel: {
    color: "#aaa",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  trophyValue: { color: "white", fontSize: 16, fontWeight: "800" },
  totalText: { color: "#666", fontSize: 12, fontWeight: "600" },
  circleWrapper: {},
});
