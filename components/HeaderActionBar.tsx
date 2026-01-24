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
export type OwnershipMode = "OWNED" | "UNOWNED" | "GLOBAL";

// New type for Platform State
export type PlatformFilter = {
  PS3: boolean;
  PS4: boolean;
  PS5: boolean;
  PSVITA: boolean;
};

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
  ownershipMode: OwnershipMode;
  onOwnershipChange: (mode: OwnershipMode) => void;

  // Content Filters
  showShovelware: boolean;
  onToggleShovelware: () => void;

  // 🔽 NEW PLATFORM PROPS
  platforms: PlatformFilter;
  onTogglePlatform: (key: keyof PlatformFilter) => void;
};

type MenuOptionProps<T> = {
  label: string;
  value: T;
  icon: keyof typeof Ionicons.glyphMap;
  currentValue?: T;
  isChecked?: boolean;
  onSelect: (val: T) => void;
};

function MenuOption<T>({
  label,
  value,
  icon,
  currentValue,
  isChecked,
  onSelect,
}: MenuOptionProps<T>) {
  const isSelected = isChecked !== undefined ? isChecked : currentValue === value;
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
  ownershipMode,
  onOwnershipChange,
  showShovelware,
  onToggleShovelware,
  platforms, // 👈
  onTogglePlatform, // 👈
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleSearch = (text: string) => {
    setSearchText(text);
    onLocalSearch(text);
  };
  const handleClearSearch = () => {
    setSearchText("");
    onLocalSearch("");
  };

  const isFilterActive = filterMode !== "ALL" || ownershipMode !== "OWNED";
  const isSortActive = sortMode !== "LAST_PLAYED";
  const sortLabelMap: Record<SortMode, string> = {
    TITLE: "Name",
    PROGRESS: "Prog",
    LAST_PLAYED: "Recent",
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* MENU */}
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={
              ownershipMode === "GLOBAL" ? "Search PSN..." : "Search Library..."
            }
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

        {/* VIEW MODE */}
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

        {/* FILTER */}
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

        {/* SORT */}
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
            <Text style={styles.menuHeader}>Source</Text>
            <MenuOption<OwnershipMode>
              label="My Library"
              value="OWNED"
              icon="library-outline"
              currentValue={ownershipMode}
              onSelect={onOwnershipChange}
            />
            <MenuOption<OwnershipMode>
              label="Discover (Unowned)"
              value="UNOWNED"
              icon="globe-outline"
              currentValue={ownershipMode}
              onSelect={onOwnershipChange}
            />
            <MenuOption<OwnershipMode>
              label="Global Search"
              value="GLOBAL"
              icon="infinite-outline"
              currentValue={ownershipMode}
              onSelect={onOwnershipChange}
            />

            <View style={styles.divider} />

            {/* 🔽 NEW: PLATFORM FILTERS */}
            <Text style={styles.menuHeader}>Platforms</Text>
            <View style={styles.platformRow}>
              <PlatformToggle
                label="PS5"
                active={platforms.PS5}
                onPress={() => onTogglePlatform("PS5")}
              />
              <PlatformToggle
                label="PS4"
                active={platforms.PS4}
                onPress={() => onTogglePlatform("PS4")}
              />
              <PlatformToggle
                label="PS3"
                active={platforms.PS3}
                onPress={() => onTogglePlatform("PS3")}
              />
              <PlatformToggle
                label="VITA"
                active={platforms.PSVITA}
                onPress={() => onTogglePlatform("PSVITA")}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.menuHeader}>Content</Text>
            <MenuOption
              label="Hide Shovelware"
              value="SHOVEL"
              icon="trash-outline"
              isChecked={!showShovelware}
              onSelect={onToggleShovelware}
            />

            <View style={styles.divider} />

            <Text style={styles.menuHeader}>Status</Text>
            <MenuOption<FilterMode>
              label="All"
              value="ALL"
              icon="apps-outline"
              currentValue={filterMode}
              onSelect={onFilterChange}
            />
            <MenuOption<FilterMode>
              label="In Progress"
              value="IN_PROGRESS"
              icon="play-circle-outline"
              currentValue={filterMode}
              onSelect={onFilterChange}
            />
            <MenuOption<FilterMode>
              label="Completed"
              value="COMPLETED"
              icon="trophy-outline"
              currentValue={filterMode}
              onSelect={onFilterChange}
            />
            <MenuOption<FilterMode>
              label="Not Started"
              value="NOT_STARTED"
              icon="ellipse-outline"
              currentValue={filterMode}
              onSelect={onFilterChange}
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

            <MenuOption<SortMode>
              label="Last Played"
              value="LAST_PLAYED"
              icon="time-outline"
              currentValue={sortMode}
              onSelect={(val) => {
                onSortChange(val);
                setShowSortMenu(false);
              }}
            />
            <MenuOption<SortMode>
              label="Name (A-Z)"
              value="TITLE"
              icon="text-outline"
              currentValue={sortMode}
              onSelect={(val) => {
                onSortChange(val);
                setShowSortMenu(false);
              }}
            />
            <MenuOption<SortMode>
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

// Helper for Platform Bubbles
const PlatformToggle = ({ label, active, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.platToggle,
      active
        ? { backgroundColor: "#4da3ff" }
        : { backgroundColor: "#1c1c26", borderWidth: 1, borderColor: "#333" },
    ]}
  >
    <Text style={[styles.platText, active ? { color: "white" } : { color: "#888" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default memo(HeaderActionBar);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  btnActive: { backgroundColor: "rgba(77, 163, 255, 0.1)", borderColor: "#4da3ff" },
  centered: { alignItems: "center", justifyContent: "center" },
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
  input: { flex: 1, color: "white", paddingBottom: 4, paddingTop: 0, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
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
  divider: { height: 1, backgroundColor: "#333", marginVertical: 4, marginHorizontal: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionSelected: { backgroundColor: "rgba(77, 163, 255, 0.1)" },
  optionContent: { flexDirection: "row", alignItems: "center" },
  optionIcon: { marginRight: 12 },
  optionText: { color: "white", fontSize: 15 },
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

  // Platform Toggle Styles
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  platToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 48,
    alignItems: "center",
  },
  platText: {
    fontWeight: "bold",
    fontSize: 11,
  },
});
