import { Image, Text, View } from "react-native";

type TrophyCardProps = {
  title: string;
  icon: string;
  progress: number;
  counts: {
    total: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
};

export default function TrophyCard({ title, icon, progress, counts }: TrophyCardProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1e1e2d",
        borderRadius: 10,
        marginVertical: 1.5,
        marginHorizontal: 0,
        padding: 8,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }}
    >
      {/* Left: Game Icon */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 6,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#2a2a3d",
          marginRight: 12,
        }}
      >
        <Image
          source={{ uri: icon }}
          style={{
            width: "100%",
            height: "100%",
            resizeMode: "contain", // keeps proper aspect ratio
          }}
        />
      </View>

      {/* Right: Game Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 6,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        <View
          style={{
            height: 6,
            backgroundColor: "#333",
            borderRadius: 3,
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              backgroundColor: "#4caf50",
              height: "100%",
              borderRadius: 3,
            }}
          />
        </View>

        <Text style={{ color: "#aaa", fontSize: 13 }}>
          🏆 {counts.total} | 🥇 {counts.gold} 🥈 {counts.silver} 🥉 {counts.bronze} 💎{" "}
          {counts.platinum}
        </Text>
      </View>
    </View>
  );
}