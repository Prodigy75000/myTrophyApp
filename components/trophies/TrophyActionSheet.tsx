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
  trophyIconUrl?: string; // 👈 This fixes the red squiggly line!
};

export default function TrophyActionSheet({
  visible,
  onClose,
  gameName,
  trophyName,
  trophyType,
  trophyIconUrl,
}: Props) {
  const insets = useSafeAreaInsets();
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
        animationType="slide"
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

          {/* Compact Sheet */}
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {/* Visual Drag Handle */}
            <View style={styles.dragHandle} />

            <View style={styles.container}>
              {/* 1. LEFT: Big Trophy Art (72px) for Art Lovers */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: trophyIconUrl }}
                  resizeMode="cover"
                  style={styles.largeIcon}
                />
              </View>

              {/* 2. CENTER: Info */}
              <View style={styles.textColumn}>
                <Text style={styles.title} numberOfLines={2}>
                  {trophyName}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {gameName}
                </Text>
              </View>

              {/* 3. RIGHT: 3 Compact Actions */}
              <View style={styles.actionsRow}>
                <ActionButton
                  icon="logo-youtube"
                  color="#FF0000"
                  bg="rgba(255, 0, 0, 0.15)"
                  onPress={handleWatchGuide}
                />
                <ActionButton
                  icon="book"
                  color="#4da3ff"
                  bg="rgba(77, 163, 255, 0.15)"
                  onPress={handleReadGuide}
                />
                <ActionButton
                  icon="logo-google"
                  color="#aaa"
                  bg="rgba(255, 255, 255, 0.1)"
                  onPress={handleGoogleSearch}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Compact Button Helper
const ActionButton = ({
  icon,
  color,
  bg,
  onPress,
}: {
  icon: any;
  color: string;
  bg: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? color : bg }]}
  >
    {({ pressed }) => <Ionicons name={icon} size={18} color={pressed ? "#fff" : color} />}
  </Pressable>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#151b2b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#2a3449",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#2a3449",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  imageContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 14,
  },
  largeIcon: {
    width: 100, // Big icon request
    height: 100,
    borderRadius: 12,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  textColumn: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    lineHeight: 20,
  },
  subtitle: {
    color: "#888",
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36, // Compact circles
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
