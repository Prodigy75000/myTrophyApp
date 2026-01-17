import { useNavigation } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SortDirection, SortMode } from "../components/HeaderActionBar";
import HeaderActionBar from "../components/HeaderActionBar";
import GameCard from "../components/trophies/GameCard";
import { useTrophy } from "../providers/TrophyContext";
import { resolveGameIcon } from "../utils/resolveIcon";

const BASE_HEADER_HEIGHT = 60; // Just the content height

export default function HomeScreen() {
  const [searchText, setSearchText] = useState("");
  const { trophies, refreshAllTrophies } = useTrophy();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Sort State
  const [sortMode, setSortMode] = useState<SortMode>("LAST_PLAYED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");

  // 1️⃣ CALCULATE TOTAL HEIGHT (Content + Status Bar)
  const totalHeaderHeight = BASE_HEADER_HEIGHT + insets.top;

  // 🎬 ANIMATION SETUP
  const scrollY = useRef(new Animated.Value(0)).current;

  // 2️⃣ UPDATE DIFFCLAMP TO USE TOTAL HEIGHT
  const diffClamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, totalHeaderHeight),
    [scrollY, totalHeaderHeight]
  );

  const translateY = diffClamp.interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight], // Slide up completely off-screen
  });

  // Filter & Sort Logic (Keep existing logic)
  const filteredTrophies = React.useMemo(() => {
    if (!trophies?.trophyTitles) return [];
    return trophies.trophyTitles.filter((game: any) =>
      game.trophyTitleName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, trophies]);

  const sortedTrophies = React.useMemo(() => {
    const list = [...filteredTrophies];
    const dir = sortDirection === "ASC" ? 1 : -1;

    return list.sort((a, b) => {
      if (sortMode === "TITLE")
        return a.trophyTitleName.localeCompare(b.trophyTitleName) * dir;
      if (sortMode === "PROGRESS")
        return (
          ((typeof a.progress === "number" ? a.progress : -1) -
            (typeof b.progress === "number" ? b.progress : -1)) *
          dir
        );
      const timeA = new Date(a.lastUpdatedDateTime).getTime();
      const timeB = new Date(b.lastUpdatedDateTime).getTime();
      return (timeA - timeB) * dir;
    });
  }, [filteredTrophies, sortMode, sortDirection]);

  const renderGame = React.useCallback(
    ({ item }: { item: any }) => (
      <GameCard
        id={item.npCommunicationId}
        title={item.trophyTitleName}
        icon={resolveGameIcon(item.trophyTitleIconUrl)}
        progress={typeof item.progress === "number" ? item.progress : undefined}
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0b0fff" }}>
      {/* 🎬 HEADER WRAPPER */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: "#0a0b0fff",
          transform: [{ translateY }],
          height: totalHeaderHeight, // Enforce explicit height
        }}
      >
        <HeaderActionBar
          onMenuPress={() => (navigation as any).openDrawer()}
          onLocalSearch={setSearchText}
          sortMode={sortMode}
          onSortChange={setSortMode}
          sortDirection={sortDirection}
          onSortDirectionChange={() =>
            setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"))
          }
        />
      </Animated.View>

      {/* LIST CONTENT */}
      {trophies && trophies.trophyTitles ? (
        <Animated.FlatList
          data={sortedTrophies}
          keyExtractor={(item) => String(item.npCommunicationId)}
          renderItem={renderGame}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refreshAllTrophies();
            setRefreshing(false);
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          // 3️⃣ PADDING MUST MATCH TOTAL HEIGHT
          contentContainerStyle={{
            paddingTop: totalHeaderHeight + 20,
            paddingBottom: 20,
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: "white" }}>
                Total Titles: {sortedTrophies.length}
              </Text>
            </View>
          }
        />
      ) : (
        <Text style={{ color: "red", marginTop: 100, textAlign: "center" }}>
          ⚠️ No trophy data yet.
        </Text>
      )}
    </View>
  );
}
