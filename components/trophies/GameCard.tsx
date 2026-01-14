import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { formatDate } from "../../utils/formatDate";
import ProgressCircle from "../ProgressCircle";

// Trophy icons (adjust the path depending on your folder depth)
const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

type GameCardProps = {
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

const GameCard = ({ id, title, icon, progress, lastPlayed, counts }: GameCardProps) => {
  const router = useRouter();
  const [loadIcon, setLoadIcon] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoadIcon(true);
    }, 50); // spreads icon loading over time

    return () => clearTimeout(t);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/game/[id]",
          params: { id },
        })
      }
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#1e1e2d",
          borderRadius: 8,
          paddingVertical: 4,
          paddingHorizontal: 0,
          marginVertical: 1.5,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 6,
          width: "100%",
        }}
      >
        {/* LEFT — Game Image */}
        {loadIcon ? (
          <Image
            source={{ uri: icon }}
            style={{
              width: 110,
              height: 110,
              aspectRatio: 1,
              borderRadius: 8,
              marginRight: 12,
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 8,
              marginRight: 12,
              backgroundColor: "#2a2a3a",
            }}
          />
        )}

        {/* RIGHT SIDE CONTENT */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          {/* TOP: Title */}
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

          {/* TROPHIES + PROGRESS */}
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
                <Image
                  // Trophy icon
                  source={trophyIcons.bronze}
                  style={{ width: 26, height: 26, marginBottom: 2 }}
                  resizeMode="contain"
                />
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedBronze}/{counts.bronze}
                </Text>
              </View>

              {/* Silver */}
              <View style={{ alignItems: "center" }}>
                <Image
                  source={trophyIcons.silver}
                  style={{ width: 26, height: 26, marginBottom: 2 }}
                  resizeMode="contain"
                />
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedSilver}/{counts.silver}
                </Text>
              </View>

              {/* Gold */}
              <View style={{ alignItems: "center" }}>
                <Image
                  source={trophyIcons.gold}
                  style={{ width: 26, height: 26, marginBottom: 2 }}
                  resizeMode="contain"
                />
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedGold}/{counts.gold}
                </Text>
              </View>

              {/* Platinum */}
              <View style={{ alignItems: "center" }}>
                <Image
                  source={trophyIcons.platinum}
                  style={{ width: 35, height: 35, marginBottom: 2 }}
                  resizeMode="contain"
                />
                <Text style={{ color: "#aaa", fontSize: 11 }}>
                  {counts.earnedPlatinum}/{counts.platinum}
                </Text>
              </View>

              {/* PROGRESS CIRCLE (right anchored) */}
              <View style={{ marginLeft: "auto", marginRight: 4 }}>
                <ProgressCircle progress={progress} />
              </View>
            </View>

            {/* Last Played */}
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
};
export default React.memo(GameCard);
