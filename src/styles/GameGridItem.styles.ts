import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
