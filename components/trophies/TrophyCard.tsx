import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import ProgressCircle from "../ProgressCircle";

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";

  const date = new Date(iso);

  const formattedDate = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} • ${formattedTime}`;
};

type TrophyCardProps = {
  id: string;
  title: string;
  icon: string;
  progress: number;
  lastPlayed?: string;
  counts: {
    total: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    earnedBronze: number;
    earnedSilver: number;
    earnedGold: number;
    earnedPlatinum: number;
  };
};

export default function TrophyCard({
  id,
  title,
  icon,
  progress,
  lastPlayed,
  counts,
}: TrophyCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/game/[id]",
          params: { id }, // now using NPWRxxxxxx_00
        })
      }
      // TEMPORARY: we will replace `title` with the real ID later
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#1e1e2d",
          borderRadius: 8,
          paddingVertical: 4,
          paddingHorizontal: 0,
          marginVertical: 2,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 6,
          width: "100%",
        }}
      >
        {/* LEFT — Game Image */}
        <Image
          source={{ uri: icon }}
          style={{
            width: 110,
            height: 110,
            borderRadius: 8,
            marginRight: 12,
          }}
        />

        {/* MIDDLE COLUMN (title at top, trophies & bar centered) */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          {/* TOP: Title anchored at the top */}
          <View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              {title}
            </Text>
          </View>

          {/* CENTER: trophies + progress bar */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                marginRight: 6,
              }}
            >
              {/* Bronze */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18 }}>🥉</Text>
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedBronze}/{counts.bronze}
                </Text>
              </View>

              {/* Silver */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18 }}>🥈</Text>
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedSilver}/{counts.silver}
                </Text>
              </View>

              {/* Gold */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18 }}>🥇</Text>
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedGold}/{counts.gold}
                </Text>
              </View>

              {/* Platinum */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18 }}>💎</Text>
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedPlatinum}/{counts.platinum}
                </Text>
              </View>

              {/* Right-anchored progress circle */}
              <View style={{ marginLeft: "auto", marginRight: 4 }}>
                <ProgressCircle progress={progress} />
              </View>
            </View>

            <Text
              style={{
                marginTop: 6,
                color: "#999",
                fontSize: 11,
              }}
            >
              Last Played : {formatDate(lastPlayed)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
