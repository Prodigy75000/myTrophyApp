import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
type HeaderActionBarProps = {
  onMenuPress: () => void;
  onLocalSearch: (text: string) => void;
  onGlobalSearch: () => void;
};
// Header Action Bar Component
export default function HeaderActionBar({
  onMenuPress,
  onLocalSearch,
  onGlobalSearch,
}: HeaderActionBarProps) {
  return (
    <View style={styles.container}>
      {/* Menu */}
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
        <Ionicons name="menu" size={26} color="white" />
      </TouchableOpacity>

      {/* Search Bar */}
      <TextInput
        placeholder="Search your games..."
        placeholderTextColor="#999"
        style={styles.searchInput}
        onChangeText={onLocalSearch}
      />

      {/* Global Search */}
      <TouchableOpacity onPress={onGlobalSearch} style={styles.iconButton}>
        <Text style={{ fontSize: 22 }}>🌍</Text>
      </TouchableOpacity>
    </View>
  );
}
// Styles
const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: "#0A0F1C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 0,
  },
  iconButton: {
    padding: 6,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: "#1B2333",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "white",
    marginRight: 8,
  },
});
