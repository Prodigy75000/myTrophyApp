import HeaderActionBar from "@/components/HeaderActionBar";
import { resolveGameIcon } from "@/utils/resolveIcon";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GameCard from "../components/trophies/GameCard";
import { useTrophy } from "../providers/TrophyContext";

 
export default function HomeScreen() {
  const [searchText, setSearchText] = useState("");
  const { trophies } = useTrophy();
  const filteredTrophies = React.useMemo(() => {
    if (!trophies?.trophyTitles) return [];
    return trophies.trophyTitles.filter((game: any) =>
      game.trophyTitleName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, trophies]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // RENDER MAIN HOME SCREEN
  // with fixed header and scrollable content below
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0b0fff",
        paddingTop: insets.top, // <--- This is the key!
      }}
    >
      {/* 🔥 Fixed Action Bar */}
      <HeaderActionBar
        onMenuPress={() => (navigation as any).openDrawer()}
        onLocalSearch={setSearchText}
        onGlobalSearch={() => console.log("go to global search")}
      />

      {/* 🔽 Scrollable content BELOW */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          paddingVertical: 20,
        }}
      >
        <Text style={{ fontSize: 24, color: "gold", marginBottom: 30 }}>
          🏆 Welcome to Trophy Hub
        </Text>

        {trophies && trophies.trophyTitles ? (
          <View
            style={{ marginTop: 10, alignItems: "flex-start", width: "100%" }}
          >
            <Text style={{ color: "gold", fontSize: 18, fontWeight: "bold" }}>
              Trophy Summary
            </Text>

            <Text style={{ color: "white", marginTop: 8 }}>
              Total Titles: {filteredTrophies.length}
            </Text>

            {filteredTrophies.map((game: any, i: number) => (
              <GameCard
                key={i}
                id={game.npCommunicationId}
                title={game.trophyTitleName}
                icon={resolveGameIcon(game.trophyTitleIconUrl)}
                progress={game.progress}
                lastPlayed={game.lastUpdatedDateTime}
                counts={{
                  total:
                    game.definedTrophies.bronze +
                    game.definedTrophies.silver +
                    game.definedTrophies.gold +
                    game.definedTrophies.platinum,
                  bronze: game.definedTrophies.bronze,
                  silver: game.definedTrophies.silver,
                  gold: game.definedTrophies.gold,
                  platinum: game.definedTrophies.platinum,
                  earnedBronze: game.earnedTrophies.bronze,
                  earnedSilver: game.earnedTrophies.silver,
                  earnedGold: game.earnedTrophies.gold,
                  earnedPlatinum: game.earnedTrophies.platinum,
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={{ color: "red", marginTop: 20 }}>
            ⚠️ No trophy data yet.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
