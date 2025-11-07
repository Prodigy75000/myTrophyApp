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
        backgroundColor: "#1e1e2d",
        borderRadius: 16,
        padding: 12,
        margin: 8,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        width: "95%",
      }}
    >
      <Image source={{ uri: icon }} style={{ width: 64, height: 64, borderRadius: 8 }} />
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 8 }}>
        {title}
      </Text>
      <View
        style={{
          height: 6,
          backgroundColor: "#333",
          borderRadius: 3,
          marginVertical: 8,
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
      <Text style={{ color: "#aaa" }}>
        🏆 {counts.total} | 🥇 {counts.gold} 🥈 {counts.silver} 🥉 {counts.bronze} 💎{" "}
        {counts.platinum}
      </Text>
    </View>
  );
}
