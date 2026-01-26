// components/trophies/TrophyActionSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components & Utils
import { TrophyType } from "../../utils/normalizeTrophy";
import SmartGuideModal from "./SmartGuideModal";

// ---------------------------------------------------------------------------
// TYPES & ASSETS
// ---------------------------------------------------------------------------

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  trophyType: TrophyType;
  trophyIconUrl?: string;
  trophyDetail?: string;
};

const TROPHY_ICONS: Record<string, any> = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

const RANK_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Action Button
// ---------------------------------------------------------------------------

type ActionButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
};

const ActionButton = ({ iconName, color, label, onPress }: ActionButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionBtn,
      { backgroundColor: pressed ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)" },
    ]}
  >
    <View style={[styles.actionIconCircle, { backgroundColor: `${color}20` }]}>
      <Ionicons name={iconName} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
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
  trophyDetail,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeGuide, setActiveGuide] = useState<{
    mode: "VIDEO" | "GUIDE";
  } | null>(null);

  // --- Handlers ---
  const handleWatchGuide = () => setActiveGuide({ mode: "VIDEO" });
  const handleReadGuide = () => setActiveGuide({ mode: "GUIDE" });

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(`${gameName} ${trophyName} trophy guide`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
    onClose();
  };

  // 1. Large Art (Left Side): Use specific art if available, otherwise rank icon
  const displayArt = trophyIconUrl
    ? { uri: trophyIconUrl }
    : TROPHY_ICONS[trophyType] || TROPHY_ICONS.bronze;

  // 2. Small Icon (Title Row): Always show the rank icon (Bronze/Silver/...)
  const rankIcon = TROPHY_ICONS[trophyType] || TROPHY_ICONS.bronze;
  const rankColor = RANK_COLORS[trophyType] || "#ffffff";

  return (
    <>
      <SmartGuideModal
        visible={!!activeGuide}
        onClose={() => setActiveGuide(null)}
        gameName={gameName}
        trophyName={trophyName}
        mode={activeGuide?.mode ?? null}
      />

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

          <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.dragHandle} />

            {/* HEADER */}
            <View style={styles.headerRow}>
              {/* Left: Large Square Art */}
              <View style={[styles.largeIconContainer, { borderColor: rankColor }]}>
                <Image source={displayArt} style={styles.largeIcon} resizeMode="cover" />
              </View>

              {/* Right: Info Column */}
              <View style={styles.headerTextCol}>
                {/* 🟢 Title Row: Rarity Icon + Trophy Name */}
                <View style={styles.titleRow}>
                  <Image
                    source={rankIcon}
                    style={styles.rarityIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.trophyTitle} numberOfLines={2}>
                    {trophyName}
                  </Text>
                </View>

                <Text style={styles.gameTitle} numberOfLines={1}>
                  {gameName}
                </Text>
                {trophyDetail ? (
                  <Text style={styles.trophyDesc} numberOfLines={2}>
                    {trophyDetail}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.actionsGrid}>
              <ActionButton
                iconName="logo-youtube"
                color="#ff4444"
                label="Video"
                onPress={handleWatchGuide}
              />
              <ActionButton
                iconName="book"
                color="#4da3ff"
                label="Guide"
                onPress={handleReadGuide}
              />
              <ActionButton
                iconName="search"
                color="#aaaaaa"
                label="Google"
                onPress={handleGoogleSearch}
              />
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#151b2b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  largeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#000",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  largeIcon: {
    width: "100%",
    height: "100%",
  },
  headerTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rarityIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  trophyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    flex: 1, // Ensure text wraps correctly next to icon
  },
  gameTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  trophyDesc: {
    color: "#aaa",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    color: "#ddd",
    fontSize: 13,
    fontWeight: "600",
  },
});
