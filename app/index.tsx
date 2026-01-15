import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SortMode } from "../components/HeaderActionBar"; // adjust path
import HeaderActionBar from "../components/HeaderActionBar";
import GameCard from "../components/trophies/GameCard";
import { useTrophy } from "../providers/TrophyContext";
import { resolveGameIcon } from "../utils/resolveIcon";

export default function HomeScreen() {
  const [searchText, setSearchText] = useState("");
  const { trophies } = useTrophy();
  const filteredTrophies = React.useMemo(() => {
    if (!trophies?.trophyTitles) return [];
    return trophies.trophyTitles.filter((game: any) =>
      game.trophyTitleName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, trophies]);
  const [sortMode, setSortMode] = useState<SortMode>("DEFAULT");
  const sortedTrophies = React.useMemo(() => {
    const list = [...filteredTrophies];

    switch (sortMode) {
      case "LAST_PLAYED":
        return list.sort(
          (a, b) =>
            new Date(b.lastUpdatedDateTime).getTime() -
            new Date(a.lastUpdatedDateTime).getTime()
        );

      case "TITLE":
        return list.sort((a, b) => a.trophyTitleName.localeCompare(b.trophyTitleName));

      case "PROGRESS":
        return list.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));

      case "DEFAULT":
      default:
        return list;
    }
  }, [filteredTrophies, sortMode]);

  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const renderGame = React.useCallback(
    ({ item }: { item: any }) => (
      <GameCard
        id={item.npCommunicationId}
        title={item.trophyTitleName}
        icon={resolveGameIcon(item.trophyTitleIconUrl)}
        progress={item.progress}
        lastPlayed={item.lastUpdatedDateTime}
        counts={{
          total:
            item.definedTrophies.bronze +
            item.definedTrophies.silver +
            item.definedTrophies.gold +
            item.definedTrophies.platinum,
          bronze: item.definedTrophies.bronze,
          silver: item.definedTrophies.silver,
          gold: item.definedTrophies.gold,
          platinum: item.definedTrophies.platinum,
          earnedBronze: item.earnedTrophies.bronze,
          earnedSilver: item.earnedTrophies.silver,
          earnedGold: item.earnedTrophies.gold,
          earnedPlatinum: item.earnedTrophies.platinum,
        }}
      />
    ),
    []
  );

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
        sortMode={sortMode}
        onSortChange={setSortMode}
      />

      {/* 🔽 Scrollable content BELOW */}
      {trophies && trophies.trophyTitles ? (
        <FlatList
          data={sortedTrophies}
          keyExtractor={(item) => item.npCommunicationId}
          renderItem={renderGame}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: "white" }}>
                Total Titles: {sortedTrophies.length}
              </Text>
            </View>
          }
        />
      ) : (
        <Text style={{ color: "red", marginTop: 20 }}>⚠️ No trophy data yet.</Text>
      )}
    </View>
  );
}
