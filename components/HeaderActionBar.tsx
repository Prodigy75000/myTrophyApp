// components/HeaderActionBar.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
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

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type SortMode = "LAST_PLAYED" | "TITLE" | "PROGRESS";
export type SortDirection = "ASC" | "DESC";
export type ViewMode = "LIST" | "GRID";
export type FilterMode = "ALL" | "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED";

type HeaderProps = {
  onMenuPress: () => void;
  onLocalSearch: (text: string) => void;
  // Sort
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
  // View
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Filter
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Menu Option (Reusable)
// ---------------------------------------------------------------------------

type MenuOptionProps<T extends string> = {
  label: string;
  value: T;
  icon: keyof typeof Ionicons.glyphMap;
  currentValue: T;
  onSelect: (val: T) => void;
};

function MenuOption<T extends string>({
  label,
  value,
  icon,
  currentValue,
  onSelect,
}: MenuOptionProps<T>) {
  const isSelected = currentValue === value;
  const activeColor = "#4da3ff";

  return (
    <TouchableOpacity
      style={[styles.optionRow, isSelected && styles.optionSelected]}
      onPress={() => onSelect(value)}
    >
      <View style={styles.optionContent}>
        <Ionicons
          name={icon}
          size={20}
          color={isSelected ? activeColor : "#888"}
          style={styles.optionIcon}
        />
        <Text
          style={[
            styles.optionText,
            isSelected && { color: activeColor, fontWeight: "bold" },
          ]}
        >
          {label}
        </Text>
      </View>
      {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

function HeaderActionBar({
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
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Handlers
  const handleSearch = (text: string) => {
    setSearchText(text);
    onLocalSearch(text);
  };

  const handleClearSearch = () => {
    setSearchText("");
    onLocalSearch("");
  };

  // Derived State
  const isFilterActive = filterMode !== "ALL";
  const isSortActive = sortMode !== "LAST_PLAYED";

  const sortLabelMap: Record<SortMode, string> = {
    TITLE: "Name",
    PROGRESS: "Prog",
    LAST_PLAYED: "Recent",
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* 1. MENU BUTTON */}
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>

        {/* 2. SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search games..."
            placeholderTextColor="#666"
            style={styles.input}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. VIEW MODE TOGGLE */}
        <TouchableOpacity
          onPress={() => onViewModeChange(viewMode === "LIST" ? "GRID" : "LIST")}
          style={[
            styles.iconBtn,
            { marginRight: 0 },
            viewMode === "GRID" && styles.btnActive,
          ]}
        >
          <Ionicons
            name={viewMode === "LIST" ? "grid-outline" : "list-outline"}
            size={20}
            color={viewMode === "GRID" ? "#4da3ff" : "white"}
          />
        </TouchableOpacity>

        {/* 4. FILTER BUTTON */}
        <TouchableOpacity
          onPress={() => setShowFilterMenu(true)}
          style={[styles.iconBtn, { marginRight: 0 }, isFilterActive && styles.btnActive]}
        >
          <View>
            <Ionicons
              name="filter"
              size={20}
              color={isFilterActive ? "#4da3ff" : "white"}
            />
            {isFilterActive && <View style={styles.badge} />}
          </View>
        </TouchableOpacity>

        {/* 5. SORT BUTTON */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={[styles.iconBtn, isSortActive && styles.btnActive]}
        >
          <View style={styles.centered}>
            <Ionicons
              name="swap-vertical"
              size={16}
              color={isSortActive ? "#4da3ff" : "white"}
            />
            <Text style={[styles.tinyLabel, isSortActive && { color: "#4da3ff" }]}>
              {sortLabelMap[sortMode]}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 🟢 FILTER MODAL */}
      <Modal
        transparent
        visible={showFilterMenu}
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterMenu(false)}>
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <Text style={styles.menuHeader}>Filter Games</Text>

            <MenuOption
              label="All Games"
              value="ALL"
              icon="apps-outline"
              currentValue={filterMode}
              onSelect={(val) => {
                onFilterChange(val);
                setShowFilterMenu(false);
              }}
            />
            <MenuOption
              label="In Progress"
              value="IN_PROGRESS"
              icon="play-circle-outline"
              currentValue={filterMode}
              onSelect={(val) => {
                onFilterChange(val);
                setShowFilterMenu(false);
              }}
            />
            <MenuOption
              label="Completed (100%)"
              value="COMPLETED"
              icon="trophy-outline"
              currentValue={filterMode}
              onSelect={(val) => {
                onFilterChange(val);
                setShowFilterMenu(false);
              }}
            />
            <MenuOption
              label="Not Started (0%)"
              value="NOT_STARTED"
              icon="ellipse-outline"
              currentValue={filterMode}
              onSelect={(val) => {
                onFilterChange(val);
                setShowFilterMenu(false);
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* 🔵 SORT MODAL */}
      <Modal
        transparent
        visible={showSortMenu}
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            <Text style={styles.menuHeader}>Sort Games</Text>

            <MenuOption
              label="Last Played"
              value="LAST_PLAYED"
              icon="time-outline"
              currentValue={sortMode}
              onSelect={(val) => {
                onSortChange(val);
                setShowSortMenu(false);
              }}
            />
            <MenuOption
              label="Name (A-Z)"
              value="TITLE"
              icon="text-outline"
              currentValue={sortMode}
              onSelect={(val) => {
                onSortChange(val);
                setShowSortMenu(false);
              }}
            />
            <MenuOption
              label="Progress (%)"
              value="PROGRESS"
              icon="pie-chart-outline"
              currentValue={sortMode}
              onSelect={(val) => {
                onSortChange(val);
                setShowSortMenu(false);
              }}
            />

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onSortDirectionChange();
                setShowSortMenu(false);
              }}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name="swap-vertical"
                  size={20}
                  color="white"
                  style={styles.optionIcon}
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

export default memo(HeaderActionBar);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

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
  // Buttons
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
  btnActive: {
    backgroundColor: "rgba(77, 163, 255, 0.1)",
    borderColor: "#4da3ff",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Search
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
  // Menus
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
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 4,
    marginHorizontal: 8,
  },
  // Options
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
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    color: "white",
    fontSize: 15,
  },
  // Badges
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4da3ff",
    borderWidth: 1.5,
    borderColor: "#1c1c26",
  },
  tinyLabel: {
    fontSize: 7,
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
    maxWidth: 36,
  },
});
