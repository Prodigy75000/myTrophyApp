// app/game/[id].tsx
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TrophySkeleton from "../../components/skeletons/TrophySkeleton";
import GameHero from "../../components/trophies/GameHero";
import TrophyActionSheet from "../../components/trophies/TrophyActionSheet";
import TrophyCard from "../../components/trophies/TrophyCard";
import TrophyGroupHeader from "../../components/trophies/TrophyGroupHeader";
import TrophyListHeader, {
  TrophySortMode,
} from "../../components/trophies/TrophyListHeader";
import { useGameDetails } from "../../hooks/useGameDetails";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

// ⚠️ IMPORT MASTER DATA (Essential for Sibling/Region Lookup)
import masterGamesRaw from "../../data/master_games.json";

const HEADER_HEIGHT = 60;

export default function GameScreen() {
  const { id: rawId, artParam } = useLocalSearchParams();
  const gameId = Array.isArray(rawId) ? rawId[0] : rawId;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // --- UI STATE ---
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<TrophySortMode>("DEFAULT");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);

  // --- DATA HOOK ---
  const {
    game,
    isInitialLoading,
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  } = useGameDetails(gameId, searchText, sortMode, sortDirection);

  // --- 🧠 SIBLING & REGION LOGIC ---
  const versions = useMemo(() => {
    if (!gameId) return [];

    // 1. Find Master Entry
    const entry = (masterGamesRaw as any[]).find((g) =>
      g.linkedVersions?.some((v: any) => v.npCommunicationId === gameId)
    );

    let rawList = [];

    if (entry && entry.linkedVersions) {
      // 2. Map Data (INCLUDING REGION!)
      rawList = entry.linkedVersions.map((v: any) => ({
        id: v.npCommunicationId,
        platform: v.platform,
        region: v.region, // 👈 THIS IS THE MISSING LINK
      }));
    } else {
      // Fallback
      rawList = [
        {
          id: gameId,
          platform: game ? game.trophyTitlePlatform : "PSN",
        },
      ];
    }

    // 3. Deduplicate (Just in case)
    const uniqueMap = new Map();
    rawList.forEach((v: any) => {
      if (!uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
    });

    return Array.from(uniqueMap.values());
  }, [gameId, game]);

  // --- ANIMATION ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const translateY = Animated.diffClamp(scrollY, 0, totalHeaderHeight).interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

  // --- EFFECTS ---
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!groupedData) return;
    const completed = new Set<string>();
    groupedData.forEach((g: any) => {
      if (g.progress === 100) completed.add(g.id);
    });
    setCollapsedGroups(completed);
  }, [groupedData]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!game) return <View style={styles.loadingContainer} />;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: totalHeaderHeight,
            paddingTop: insets.top,
            transform: [{ translateY }],
          },
        ]}
      >
        <TrophyListHeader
          onBack={() => navigation.goBack()}
          onSearch={setSearchText}
          sortMode={sortMode}
          onSortChange={setSortMode}
          sortDirection={sortDirection}
          onSortDirectionChange={() =>
            setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"))
          }
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: totalHeaderHeight, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <GameHero
          iconUrl={game.trophyTitleIconUrl}
          title={game.trophyTitleName}
          platform={game.trophyTitlePlatform}
          progress={game.progress}
          earnedTrophies={game.earnedTrophies}
          definedTrophies={game.definedTrophies}
          displayArt={typeof artParam === "string" ? artParam : null}
          // 🔽 PASSING THE VERSIONS (Now with regions!)
          versions={versions}
          activeId={gameId}
        />

        {isInitialLoading && (
          <View>
            {Array.from({ length: 6 }).map((_, i) => (
              <TrophySkeleton key={i} />
            ))}
          </View>
        )}

        <View>
          {sortMode === "DEFAULT" && groupedData
            ? groupedData.map((group: any) => {
                const isCollapsed = collapsedGroups.has(group.id);
                return (
                  <View key={group.id}>
                    <TrophyGroupHeader
                      title={group.name}
                      isBaseGame={group.isBaseGame}
                      counts={group.counts}
                      earnedCounts={group.earnedCounts}
                      progress={group.progress}
                      collapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.id)}
                    />
                    {!isCollapsed &&
                      group.trophies.map((trophy: any) => (
                        <TrophyCard
                          key={trophy.trophyId}
                          {...mapTrophyToProps(trophy, justEarnedIds, setSelectedTrophy)}
                        />
                      ))}
                  </View>
                );
              })
            : processedTrophies.map((trophy: any) => (
                <TrophyCard
                  key={trophy.trophyId}
                  {...mapTrophyToProps(trophy, justEarnedIds, setSelectedTrophy)}
                />
              ))}
        </View>
      </Animated.ScrollView>

      <TrophyActionSheet
        visible={!!selectedTrophy}
        onClose={() => setSelectedTrophy(null)}
        gameName={game.trophyTitleName}
        trophyName={selectedTrophy?.name ?? ""}
        trophyType={selectedTrophy?.type ?? "bronze"}
        trophyIconUrl={selectedTrophy?.iconUrl}
      />
    </View>
  );
}

const mapTrophyToProps = (
  trophy: any,
  justEarnedIds: Set<number>,
  onSelect: Function
) => ({
  id: trophy.trophyId,
  name: trophy.trophyName,
  description: trophy.trophyDetail,
  icon: trophy.trophyIconUrl,
  type: normalizeTrophyType(trophy.trophyType),
  earned: !!trophy.earned,
  earnedAt: trophy.earnedDateTime,
  rarity: trophy.trophyEarnedRate,
  justEarned: justEarnedIds.has(trophy.trophyId),
  progressValue: trophy.trophyProgressValue,
  progressTarget: trophy.trophyProgressTargetValue,
  onPress: () =>
    onSelect({
      name: trophy.trophyName,
      type: normalizeTrophyType(trophy.trophyType),
      iconUrl: trophy.trophyIconUrl,
    }),
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, backgroundColor: "#000" },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#000",
  },
});
