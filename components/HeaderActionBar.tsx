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
export type ViewMode = "LIST" | "GRID";
export type FilterMode = "ALL" | "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED";

type Props = {
  onMenuPress: () => void;
  onLocalSearch: (text: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
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
  filterMode,
  onFilterChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleSearch = (text: string) => {
    setSearchText(text);
    onLocalSearch(text);
  };

  const handleClearSearch = () => {
    setSearchText("");
    onLocalSearch("");
  };

  // Helper to get short label for the sort button
  const getSortLabel = () => {
    switch (sortMode) {
      case "TITLE":
        return "Name";
      case "PROGRESS":
        return "Prog";
      case "LAST_PLAYED":
      default:
        return "Recent";
    }
  };

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

  const FilterOption = ({ label, value, icon }: any) => (
    <TouchableOpacity
      style={[styles.optionRow, filterMode === value && styles.optionSelected]}
      onPress={() => {
        onFilterChange(value);
        setShowFilterMenu(false);
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={icon}
          size={20}
          color={filterMode === value ? "#4da3ff" : "#888"}
          style={{ marginRight: 12 }}
        />
        <Text
          style={[
            styles.optionText,
            filterMode === value && { color: "#4da3ff", fontWeight: "bold" },
          ]}
        >
          {label}
        </Text>
      </View>
      {filterMode === value && <Ionicons name="checkmark" size={20} color="#4da3ff" />}
    </TouchableOpacity>
  );

  const isFilterActive = filterMode !== "ALL";
  const isSortActive = sortMode !== "LAST_PLAYED";

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
            value={searchText}
            onChangeText={handleSearch}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* 1. VIEW MODE */}
        <TouchableOpacity
          onPress={() => onViewModeChange(viewMode === "LIST" ? "GRID" : "LIST")}
          style={[
            styles.iconBtn,
            { marginRight: 0 },
            viewMode === "GRID" && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <Ionicons
            name={viewMode === "LIST" ? "grid-outline" : "list-outline"}
            size={20}
            color={viewMode === "GRID" ? "#4da3ff" : "white"}
          />
        </TouchableOpacity>

        {/* 2. FILTER BUTTON (With Badge) */}
        <TouchableOpacity
          onPress={() => setShowFilterMenu(true)}
          style={[
            styles.iconBtn,
            { marginRight: 0 },
            isFilterActive && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <View>
            <Ionicons
              name="filter"
              size={20}
              color={isFilterActive ? "#4da3ff" : "white"}
            />
            {/* 🔴 ACTIVE BADGE */}
            {isFilterActive && <View style={styles.badge} />}
          </View>
        </TouchableOpacity>

        {/* 3. SORT BUTTON (With Tiny Label) */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={[
            styles.iconBtn,
            isSortActive && { backgroundColor: "rgba(77, 163, 255, 0.1)" },
          ]}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name="swap-vertical"
              size={16} // Reduced size slightly to fit text
              color={isSortActive ? "#4da3ff" : "white"}
            />
            {/* 🏷️ TINY LABEL */}
            <Text style={[styles.tinyLabel, isSortActive && { color: "#4da3ff" }]}>
              {getSortLabel()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 🟢 FILTER MENU MODAL */}
      <Modal
        transparent
        visible={showFilterMenu}
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterMenu(false)}>
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <Text style={styles.menuHeader}>Filter Games</Text>
            <FilterOption label="All Games" value="ALL" icon="apps-outline" />
            <FilterOption
              label="In Progress"
              value="IN_PROGRESS"
              icon="play-circle-outline"
            />
            <FilterOption
              label="Completed (100%)"
              value="COMPLETED"
              icon="trophy-outline"
            />
            <FilterOption
              label="Not Started (0%)"
              value="NOT_STARTED"
              icon="ellipse-outline"
            />
          </View>
        </Pressable>
      </Modal>

      {/* 🔵 SORT MENU MODAL */}
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
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    paddingBottom: 4,
    paddingTop: 0,
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
  // 👇 NEW STYLES
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4da3ff", // Cyan badge
    borderWidth: 1.5,
    borderColor: "#1c1c26", // Cutout effect
  },
  tinyLabel: {
    fontSize: 7,
    color: "#888",
    marginTop: 0,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
    maxWidth: 36, // Prevent overflow
  },
});
