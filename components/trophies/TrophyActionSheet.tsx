import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  trophyType: "bronze" | "silver" | "gold" | "platinum";
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
}: Props) {
  const handleGoogleSearch = () => {
    const query = encodeURIComponent(`${gameName} ${trophyName} trophy`);

    Linking.openURL(`https://www.google.com/search?q=${query}`);
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {/* Root */}
      <View style={{ flex: 1 }}>
        {/* Invisible backdrop (tap to close) */}
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        {/* Bottom anchor */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {/* Sheet */}
          <View
            style={{
              backgroundColor: "#12121a",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Image
                source={trophyTypeIcon[trophyType]}
                resizeMode="contain"
                style={{
                  width: 18,
                  height: 18,
                  marginRight: 8,
                  opacity: 0.9,
                }}
              />

              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "600",
                  flexShrink: 1,
                }}
                numberOfLines={2}
              >
                {trophyName}
              </Text>
            </View>

            <Pressable
              onPress={handleGoogleSearch}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <Image
                source={require("../../assets/icons/google.png")}
                style={{ width: 24, height: 24, marginRight: 12 }}
              />
              <Text style={{ color: "white", fontSize: 16 }}>Search on Google</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
