import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#000",
  },
  skeletonContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
});
