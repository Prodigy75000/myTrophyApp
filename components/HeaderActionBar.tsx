import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SortMode = "LAST_PLAYED" | "TITLE" | "PROGRESS";
export type SortDirection = "ASC" | "DESC";
export type ViewMode = "LIST" | "GRID"; // 👈 NEW TYPE

type Props = {
  onMenuPress: () => void;
  onLocalSearch: (text: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;

  // 👇 NEW PROPS
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export default function HeaderActionBar({
  onMenuPress,
  onLocalSearch,
  sortMode,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  viewMode,
  onViewModeChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Helper to render sort options
  const SortOption = ({ label, value, icon }: any) => (
    <TouchableOpacity
      style={[styles.optionRow, sortMode === value && styles.optionSelected]}
      onPress={() => {
        onSortChange(value);
        setShowSortMenu(false);
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={icon}
          size={20}
          color={sortMode === value ? "#4da3ff" : "#888"}
          style={{ marginRight: 12 }}
        />
        <Text
          style={[
            styles.optionText,
            sortMode === value && { color: "#4da3ff", fontWeight: "bold" },
          ]}
        >
          {label}
        </Text>
      </View>
      {sortMode === value && <Ionicons name="checkmark" size={20} color="#4da3ff" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* MENU BUTTON */}
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search games..."
            placeholderTextColor="#666"
            style={styles.input}
            onChangeText={onLocalSearch}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
          />
        </View>

        {/* 1. VIEW TOGGLE BUTTON (Grid/List) */}
        <TouchableOpacity
          onPress={() => onViewModeChange(viewMode === "LIST" ? "GRID" : "LIST")}
          style={[
            styles.iconBtn,
            { marginRight: 0 }, // Adjust spacing
            viewMode === "GRID" && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <Ionicons
            name={viewMode === "LIST" ? "grid-outline" : "list-outline"}
            size={20}
            color={viewMode === "GRID" ? "#4da3ff" : "white"}
          />
        </TouchableOpacity>

        {/* 2. FILTER BUTTON (Opens Modal) */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={[
            styles.iconBtn,
            sortMode !== "LAST_PLAYED" && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <Ionicons
            name="filter"
            size={22}
            color={sortMode !== "LAST_PLAYED" ? "#4da3ff" : "white"}
          />
        </TouchableOpacity>
      </View>

      {/* SORT MENU MODAL (Existing code...) */}
      <Modal
        transparent
        visible={showSortMenu}
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <Text style={styles.menuHeader}>Sort Games</Text>

            <SortOption label="Last Played" value="LAST_PLAYED" icon="time-outline" />
            <SortOption label="Name (A-Z)" value="TITLE" icon="text-outline" />
            <SortOption label="Progress (%)" value="PROGRESS" icon="pie-chart-outline" />

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onSortDirectionChange();
                setShowSortMenu(false);
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="swap-vertical"
                  size={20}
                  color="white"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.optionText}>
                  Order: {sortDirection === "ASC" ? "Ascending ⬆️" : "Descending ⬇️"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Tighter gap to fit 4 elements
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1c1c26",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c26",
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    right: 16,
    width: 250,
    backgroundColor: "#151b2b",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 12,
    marginVertical: 8,
    textTransform: "uppercase",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: "rgba(77, 163, 255, 0.1)",
  },
  optionText: {
    color: "white",
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
