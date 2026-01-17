import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

/* ================= TYPES ================= */

export type TrophySortMode = "DEFAULT" | "DATE_EARNED" | "STATUS" | "RARITY" | "NAME";
export type SortDirection = "ASC" | "DESC";

type Props = {
  onBack: () => void;
  onSearch: (text: string) => void;
  sortMode: TrophySortMode;
  onSortChange: (mode: TrophySortMode) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
};

/* ================= COMPONENT ================= */

export default function TrophyListHeader({
  onBack,
  onSearch,
  sortMode,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search trophies..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleChange("")} style={styles.clearButton}>
              <Ionicons name="close" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Direction Toggle */}
        <TouchableOpacity onPress={onSortDirectionChange} style={styles.iconButton}>
          <Ionicons
            name={sortDirection === "ASC" ? "arrow-up" : "arrow-down"}
            size={20}
            color="#aaa"
          />
        </TouchableOpacity>

        {/* Filter Menu */}
        <TouchableOpacity
          onPress={() => setFiltersOpen(true)}
          style={[styles.iconButton, filtersOpen && styles.activeIcon]}
        >
          <Ionicons
            name={filtersOpen ? "filter" : "filter-outline"}
            size={20}
            color={filtersOpen ? "#4da3ff" : "#aaa"}
          />
        </TouchableOpacity>
      </View>

      {/* OVERLAY MODAL */}
      <Modal
        visible={filtersOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFiltersOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>
                <Text style={styles.menuHeader}>Sort Trophies By</Text>
                {[
                  { key: "DEFAULT", label: "Default Order" },
                  { key: "DATE_EARNED", label: "Date Earned" },
                  { key: "STATUS", label: "Status (Earned)" },
                  { key: "RARITY", label: "Rarity %" },
                  { key: "NAME", label: "Name (A-Z)" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.sortRow, sortMode === item.key && styles.selectedRow]}
                    onPress={() => {
                      onSortChange(item.key as TrophySortMode);
                      setFiltersOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortText,
                        sortMode === item.key && styles.selectedText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {sortMode === item.key && (
                      <Ionicons name="checkmark" size={18} color="#4da3ff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: { zIndex: 10 },
  container: {
    height: 56,
    backgroundColor: "#0A0F1C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2333",
  },
  iconButton: { padding: 8 },
  activeIcon: { backgroundColor: "rgba(77, 163, 255, 0.1)", borderRadius: 8 },
  searchContainer: {
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  searchInput: {
    height: 40,
    backgroundColor: "#1B2333",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "white",
    fontSize: 14,
  },
  clearButton: { position: "absolute", right: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100, // adjust for status bar
    paddingRight: 12,
  },
  dropdownCard: {
    width: 190,
    backgroundColor: "#151b2b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a3449",
    paddingVertical: 6,
  },
  menuHeader: {
    color: "#666",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  selectedRow: { backgroundColor: "rgba(77, 163, 255, 0.08)" },
  sortText: { color: "#ccc", fontSize: 14 },
  selectedText: { color: "white", fontWeight: "600" },
});
