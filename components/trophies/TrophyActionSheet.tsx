// components/trophies/TrophyActionSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components & Utils
import { TrophyType } from "../../utils/normalizeTrophy"; // Ensure you have this exported in utils
import SmartGuideModal from "./SmartGuideModal";

// ---------------------------------------------------------------------------
// TYPES & ASSETS
// ---------------------------------------------------------------------------

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  trophyType: TrophyType; // Uses strict type "bronze" | "silver" etc.
  trophyIconUrl?: string;
};

const TROPHY_ICONS: Record<string, any> = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Action Row
// ---------------------------------------------------------------------------

type ActionRowProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

const ActionRow = ({
  iconName,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: ActionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
  >
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName} size={20} color={iconColor} />
    </View>
    <View style={styles.textColumn}>
      <Text style={[styles.actionText, !subtitle && { color: "#aaa" }]}>{title}</Text>
      {subtitle && <Text style={styles.subText}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={16} color={subtitle ? "#666" : "#444"} />
  </Pressable>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

function TrophyActionSheet({
  visible,
  onClose,
  gameName,
  trophyName,
  trophyType,
  trophyIconUrl,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeGuide, setActiveGuide] = useState<{
    mode: "VIDEO" | "GUIDE";
  } | null>(null);

  // --- Handlers ---

  const handleWatchGuide = () => {
    setActiveGuide({ mode: "VIDEO" });
    // Note: We don't close the modal yet, the SmartGuideModal sits on top
    // Alternatively, you can close this one if SmartGuideModal is a separate screen
  };

  const handleReadGuide = () => {
    setActiveGuide({ mode: "GUIDE" });
  };

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(`${gameName} ${trophyName} trophy`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
    onClose();
  };

  const closeAll = () => {
    setActiveGuide(null);
    onClose();
  };

  return (
    <>
      {/* 1. Guide Modal (Pops up over this sheet if active) */}
      <SmartGuideModal
        visible={!!activeGuide}
        onClose={() => setActiveGuide(null)}
        gameName={gameName}
        trophyName={trophyName}
        mode={activeGuide?.mode ?? null}
      />

      {/* 2. Action Sheet Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          {/* Backdrop tap to close */}
          <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

          <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 10 }]}>
            {/* HEADER */}
            <View style={styles.header}>
              <Image
                source={TROPHY_ICONS[trophyType] || TROPHY_ICONS.bronze}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.title} numberOfLines={2}>
                {trophyName}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* ACTIONS */}
            <ActionRow
              iconName="logo-youtube"
              iconColor="#FF0000"
              iconBg="rgba(255, 0, 0, 0.15)"
              title="Watch Video Guide"
              subtitle="Find best tutorial on YouTube"
              onPress={handleWatchGuide}
            />

            <ActionRow
              iconName="book"
              iconColor="#4da3ff"
              iconBg="rgba(77, 163, 255, 0.15)"
              title="Read Guide"
              subtitle="PSNProfiles • TrueAchievements"
              onPress={handleReadGuide}
            />

            <ActionRow
              iconName="logo-google"
              iconColor="#aaa"
              iconBg="#222"
              title="Google Search"
              onPress={handleGoogleSearch}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export default memo(TrophyActionSheet);

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

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
    // Shadows
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
  // Action Row Styles
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
