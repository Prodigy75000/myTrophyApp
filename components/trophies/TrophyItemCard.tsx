import { Image, Text, View } from "react-native";
import { formatDate } from "../../utils/formatDate";

type TrophyItemCardProps = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  earnedAt?: string;
};

const typeDot = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#00e5ff",
};

export default function TrophyItemCard({
  name,
  description,
  icon,
  type,
  earned,
  earnedAt,
}: TrophyItemCardProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#1c1c26",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        opacity: earned ? 1 : 0.55,
      }}
    >
      <Image
        source={{ uri: icon }}
        style={{ width: 48, height: 48, marginRight: 12, borderRadius: 6 }}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
          {name}
        </Text>

        <Text style={{ color: "#ccc", fontSize: 12, marginTop: 2 }}>
          {description}
        </Text>

       <Text
  style={{
    color: earned ? "#4caf50" : "#888",
    fontSize: 11,
    marginTop: 6,
  }}
>
  {earned && earnedAt
    ? `Earned on ${formatDate(earnedAt)}`
    : "Not earned"}
</Text>
      </View>

      <View
        style={{
          width: 8,
          borderRadius: 4,
          backgroundColor: typeDot[type],
        }}
      />
    </View>
  );
}