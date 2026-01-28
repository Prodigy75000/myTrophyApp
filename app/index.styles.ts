// app/index.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4da3ff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  toastContainer: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(30, 30, 45, 0.95)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 2000,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
