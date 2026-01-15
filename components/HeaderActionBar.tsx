import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/* ================= TYPES ================= */

export type SortMode = "DEFAULT" | "LAST_PLAYED" | "TITLE" | "PROGRESS";

type HeaderActionBarProps = {
  onMenuPress: () => void;
  onLocalSearch: (text: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
};

/* ================= COMPONENT ================= */

export default function HeaderActionBar({
  onMenuPress,
  onLocalSearch,
  sortMode,
  onSortChange,
}: HeaderActionBarProps) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleChange = (text: string) => {
    setQuery(text);
    onLocalSearch(text);
  };

  const clearSearch = () => {
    setQuery("");
    onLocalSearch("");
  };

  return (
    <View>
      {/* HEADER BAR */}
      <View style={styles.container}>
        {/* Menu */}
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
          <Ionicons name="menu" size={26} color="white" />
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search your games..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
          />

          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort / Filter */}
        <TouchableOpacity
          onPress={() => setFiltersOpen((v) => !v)}
          style={styles.iconButton}
        >
          <Ionicons name="filter-outline" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* SORT DROPDOWN */}
      {filtersOpen && (
        <View style={styles.sortPanel}>
          {[
            { key: "DEFAULT", label: "Default" },
            { key: "LAST_PLAYED", label: "Last played" },
            { key: "TITLE", label: "Title name" },
            { key: "PROGRESS", label: "Progress" },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.sortRow}
              onPress={() => {
                onSortChange(item.key as SortMode);
                setFiltersOpen(false);
              }}
            >
              <Text style={styles.sortText}>{item.label}</Text>

              {sortMode === item.key && (
                <Ionicons name="checkmark" size={18} color="#4da3ff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: "#0A0F1C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconButton: {
    padding: 6,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    position: "relative",
    marginRight: 8,
  },
  searchInput: {
    height: 38,
    backgroundColor: "#1B2333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingRight: 32,
    color: "white",
  },
  clearButton: {
    position: "absolute",
    right: 8,
    top: 8,
  },

  /* DROPDOWN */
  sortPanel: {
    backgroundColor: "#0F1626",
    borderBottomWidth: 1,
    borderBottomColor: "#1B2333",
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sortText: {
    color: "white",
    fontSize: 14,
  },
});
