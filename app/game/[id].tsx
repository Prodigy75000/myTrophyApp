import { useLocalSearchParams } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { useTrophy } from "../../providers/TrophyContext";

export default function GameScreen() {
  const { id } = useLocalSearchParams(); // dynamic route param
  const { trophies } = useTrophy();

  // Find the selected game using npCommunicationId
  const game = trophies?.trophyTitles?.find(
    (g: any) => g.npCommunicationId === id
  );

  if (!game) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white" }}>Game not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Game Cover */}
      <Image
        source={{ uri: game.trophyTitleIconUrl }}
        style={{
          width: 180,
          height: 180,
          borderRadius: 12,
          alignSelf: "center",
          marginBottom: 16,
        }}
      />

      {/* Game Title */}
      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {game.trophyTitleName}
      </Text>

      {/* Progress Summary */}
      <Text
        style={{
          color: "gold",
          fontSize: 16,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 24,
        }}
      >
        {game.progress}% Complete
      </Text>

      {/* Trophy List Header */}
      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        Trophy List
      </Text>

      {/* Trophy List Items */}
      {game.trophies?.map((trophy: any, i: number) => (
        <View
          key={i}
          style={{
            backgroundColor: "#1c1c26",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Trophy Icon */}
          <Image
            source={{ uri: trophy.trophyIconUrl }}
            style={{
              width: 50,
              height: 50,
              marginRight: 12,
              borderRadius: 6,
            }}
          />

          {/* Trophy Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              {trophy.trophyName}
            </Text>
            <Text style={{ color: "#ccc", fontSize: 12 }}>
              {trophy.trophyDetail}
            </Text>

            <Text
              style={{
                color: trophy.earned ? "#4caf50" : "#999",
                marginTop: 4,
                fontSize: 12,
              }}
            >
              {trophy.earned
                ? `Earned on ${trophy.earnedDateTime}`
                : "Not earned"}
            </Text>
          </View>

          {/* Trophy Type */}
          <Text style={{ color: "white", marginLeft: 10 }}>
            {trophy.trophyType === "bronze" && "🥉"}
            {trophy.trophyType === "silver" && "🥈"}
            {trophy.trophyType === "gold" && "🥇"}
            {trophy.trophyType === "platinum" && "💎"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
