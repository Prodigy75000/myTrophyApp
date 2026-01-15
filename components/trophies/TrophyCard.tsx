import { Image, Pressable, Text, View } from "react-native";
import { formatDate } from "../../utils/formatDate";

type TrophyCardProps = {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  earnedAt?: string;
  rarity?: number;
  justEarned?: boolean;
  onPress?: () => void;
};
const trophyTypeIcon = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};
export default function TrophyCard({
  name,
  description,
  icon,
  type,
  earned,
  earnedAt,
  rarity,
  onPress,
}: TrophyCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#222" }}
      style={{
        flexDirection: "row",
        backgroundColor: "#1c1c26",
        borderRadius: 10,
        marginBottom: 3,
        opacity: earned ? 1 : 0.55,
      }}
    >
      {/* ICON */}
      <Image
        source={{ uri: icon }}
        style={{ width: 96, height: 96, marginRight: 14, borderRadius: 6 }}
      />

      {/* CONTENT */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={trophyTypeIcon[type]}
            resizeMode="contain"
            style={{
              width: 18,
              height: 18,
              marginRight: 6,
              opacity: earned ? 1 : 0.6,
            }}
          />

          <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>{name}</Text>
        </View>

        <Text style={{ color: "#ccc", fontSize: 12, marginTop: 3 }}>{description}</Text>

        {/* TAG LANE (reserved for master JSON tags) */}
        <View style={{ height: 14, marginTop: 6 }} />

        {earned && earnedAt && (
          <Text style={{ color: "#4caf50", fontSize: 11 }}>
            Earned on {formatDate(earnedAt)}
          </Text>
        )}
      </View>

      {/* METADATA COLUMN (rarity pyramid later) */}
      <View
        style={{
          width: 44, // give text breathing room
          alignItems: "flex-end",
          justifyContent: "flex-end",
          paddingRight: 6,
          paddingBottom: 6,
        }}
      >
        {typeof rarity === "number" && (
          <Text
            style={{
              fontSize: 11,
              color: "#aaa",
            }}
          >
            {`rarity ${rarity}%`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
