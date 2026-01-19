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

export type TrophySortMode = "DEFAULT" | "NAME" | "RARITY" | "STATUS" | "DATE_EARNED";
export type SortDirection = "ASC" | "DESC";

type Props = {
  onBack: () => void;
  onSearch: (text: string) => void;
  sortMode: TrophySortMode;
  onSortChange: (mode: TrophySortMode) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
};

export default function TrophyListHeader({
  onBack,
  onSearch,
  sortMode,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
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
        {/* BACK BUTTON */}
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search trophies..."
            placeholderTextColor="#666"
            style={styles.input}
            onChangeText={onSearch}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
          />
        </View>

        {/* SORT BUTTON (Opens Modal) */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={[
            styles.iconBtn,
            sortMode !== "DEFAULT" && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <Ionicons
            name="filter" // Changed from "options" for clarity
            size={22}
            color={sortMode !== "DEFAULT" ? "#4da3ff" : "white"}
          />
        </TouchableOpacity>
      </View>

      {/* SORT MENU MODAL */}
      <Modal
        transparent
        visible={showSortMenu}
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <Text style={styles.menuHeader}>Sort Trophies</Text>

            <SortOption label="Default Order" value="DEFAULT" icon="list" />
            <SortOption label="Rarity" value="RARITY" icon="diamond-outline" />
            <SortOption label="Date Earned" value="DATE_EARNED" icon="calendar-outline" />
            <SortOption label="Earned Status" value="STATUS" icon="checkbox-outline" />

            <View style={styles.divider} />

            {/* 👇 SORT DIRECTION TOGGLE (Moved Inside) */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onSortDirectionChange();
                // Optional: Keep menu open or close it?
                // Closing it feels snappier.
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
    gap: 12,
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
