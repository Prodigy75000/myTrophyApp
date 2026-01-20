import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SmartGuideModal from "./SmartGuideModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  trophyType: "bronze" | "silver" | "gold" | "platinum";
  trophyIconUrl?: string; // 👈 ADD THIS LINE to fix the [id].tsx error
};

const trophyTypeIcon = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

export default function TrophyActionSheet({
  visible,
  onClose,
  gameName,
  trophyName,
  trophyType,
  trophyIconUrl, // 👈 Add this here too (destructure it)
}: Props) {
  const insets = useSafeAreaInsets();

  // ... (Keep the rest of the component exactly as is)
  const [activeGuide, setActiveGuide] = useState<{
    game: string;
    trophy: string;
    mode: "VIDEO" | "GUIDE";
  } | null>(null);

  const handleWatchGuide = () => {
    setActiveGuide({ game: gameName, trophy: trophyName, mode: "VIDEO" });
    onClose();
  };

  const handleReadGuide = () => {
    setActiveGuide({ game: gameName, trophy: trophyName, mode: "GUIDE" });
    onClose();
  };

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(`${gameName} ${trophyName} trophy`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
    onClose();
  };

  return (
    <>
      <SmartGuideModal
        visible={!!activeGuide}
        onClose={() => setActiveGuide(null)}
        gameName={activeGuide?.game ?? ""}
        trophyName={activeGuide?.trophy ?? ""}
        mode={activeGuide?.mode ?? null}
      />

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

          <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 10 }]}>
            {/* HEADER */}
            <View style={styles.header}>
              <Image
                source={trophyTypeIcon[trophyType]}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.title} numberOfLines={2}>
                {trophyName}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* ACTIONS */}
            <Pressable
              onPress={handleWatchGuide}
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            >
              <View
                style={[styles.iconBox, { backgroundColor: "rgba(255, 0, 0, 0.15)" }]}
              >
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.actionText}>Watch Video Guide</Text>
                <Text style={styles.subText}>Find best tutorial on YouTube</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </Pressable>

            <Pressable
              onPress={handleReadGuide}
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            >
              <View
                style={[styles.iconBox, { backgroundColor: "rgba(77, 163, 255, 0.15)" }]}
              >
                <Ionicons name="book" size={20} color="#4da3ff" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.actionText}>Read Guide</Text>
                <Text style={styles.subText}>PSNProfiles • TrueAchievements</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </Pressable>

            <Pressable
              onPress={handleGoogleSearch}
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            >
              <View style={[styles.iconBox, { backgroundColor: "#222" }]}>
                <Ionicons name="logo-google" size={20} color="#aaa" />
              </View>
              <View style={styles.textColumn}>
                <Text style={[styles.actionText, { color: "#aaa" }]}>Google Search</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#151b2b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a3449",
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 4,
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a3449",
    marginBottom: 8,
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  actionPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textColumn: {
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  subText: {
    color: "#888",
    fontSize: 12,
  },
});
