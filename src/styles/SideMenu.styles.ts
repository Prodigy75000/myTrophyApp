// components/SideMenu.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0b0f" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#4da3ff",
    backgroundColor: "#000",
  },
  userInfo: { marginLeft: 16, flex: 1 },
  username: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  guestText: { color: "#888", fontSize: 14 },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  levelText: { color: "#ffd700", fontSize: 12, fontWeight: "800", marginLeft: 4 },

  // --- Auth Buttons ---
  webButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00439c",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  webButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  guestButtonText: { color: "#ccc", fontSize: 14, fontWeight: "600" },

  // 🟢 RED SIGN OUT BUTTON (Restored)
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211, 47, 47, 0.15)", // Subtle red bg
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)", // Red border
  },
  signOutText: {
    color: "#ff8a80", // Red text
    fontSize: 14,
    fontWeight: "600",
  },

  // --- Menu List ---
  menuItems: { paddingTop: 20, paddingHorizontal: 16 },
  sectionLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuText: { flex: 1, color: "white", fontSize: 15, fontWeight: "500" },
  subText: { color: "#666", fontSize: 11, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 16,
    marginHorizontal: 4,
  },

  // --- Footer Area ---
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  devActions: {
    flexDirection: "row",
    gap: 8,
  },
  // 🟢 NEW: Specific Footer Buttons
  devButtonPSN: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 67, 156, 0.15)", // PS Blue tint
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 67, 156, 0.3)",
  },
  devButtonXbox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 124, 16, 0.15)", // Xbox Green tint
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 124, 16, 0.3)",
  },
  devTextPSN: {
    color: "#4da3ff",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },
  devTextXbox: {
    color: "#107c10", // Xbox Green
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },
  versionText: { color: "#444", fontSize: 11, textAlign: "center" },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#101010" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  modalTitle: { color: "white", fontWeight: "bold", fontSize: 16 },
  modalClose: { color: "#4da3ff", fontWeight: "bold", fontSize: 16 },
});
