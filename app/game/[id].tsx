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
import { useTrophy } from "../../providers/TrophyContext";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

// ⚠️ IMPORT MASTER DATA
import masterGamesRaw from "../../data/master_games.json";

const HEADER_HEIGHT = 60;

export default function GameScreen() {
  const { id: rawId, artParam, contextMode } = useLocalSearchParams();
  const gameId = Array.isArray(rawId) ? rawId[0] : rawId;
  const contextModeStr = Array.isArray(contextMode) ? contextMode[0] : contextMode;

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trophies } = useTrophy();

  // --- UI STATE ---
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<TrophySortMode>("DEFAULT");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);

  // --- DATA HOOK ---
  const {
    game,
    isLoadingDetails, // 🟢 Renamed for clarity: Only affects the list!
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  } = useGameDetails(gameId, searchText, sortMode as any, sortDirection);

  // --- 🟢 STALE DATA CHECK ---
  // If we have a game object, but its ID doesn't match the URL,
  // it means the hook hasn't updated yet. We show skeletons for the LIST only.
  const isDataStale = game && String(game.npCommunicationId) !== String(gameId);
  const showListSkeletons = isLoadingDetails || isDataStale || !game;

  // --- MEMOIZED LOGIC (Versions) ---
  const versions = useMemo(() => {
    if (!gameId) return [];
    const entry = (masterGamesRaw as any[]).find((g) =>
      g.linkedVersions?.some((v: any) => v.npCommunicationId === gameId)
    );

    let rawList: any[] = [];
    if (entry && entry.linkedVersions) {
      rawList = entry.linkedVersions.map((v: any) => ({
        id: v.npCommunicationId,
        platform: v.platform,
        region: v.region,
      }));
    } else {
      rawList = [{ id: gameId, platform: game ? game.trophyTitlePlatform : "PSN" }];
    }

    const uniqueMap = new Map();
    rawList.forEach((v: any) => {
      if (!uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
    });
    const uniqueList = Array.from(uniqueMap.values());

    const isDiscoverMode = contextModeStr === "GLOBAL";
    if (!isDiscoverMode && trophies?.trophyTitles) {
      return uniqueList.filter((v: any) => {
        return trophies.trophyTitles.some(
          (owned: any) => String(owned.npCommunicationId) === String(v.id)
        );
      });
    }
    return uniqueList;
  }, [gameId, game, trophies, contextModeStr]);

  // --- ANIMATION ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const translateY = Animated.diffClamp(scrollY, 0, totalHeaderHeight).interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

  // --- EFFECTS ---
  useEffect(() => {
    scrollY.setValue(0);
    setCollapsedGroups(new Set());
  }, [gameId]);

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
        {/* 🟢 HERO: Render IMMEDIATELY if 'game' exists (Cached Data) */}
        {game && (
          <GameHero
            iconUrl={game.trophyTitleIconUrl}
            title={game.trophyTitleName}
            platform={game.trophyTitlePlatform}
            progress={game.progress}
            earnedTrophies={game.earnedTrophies}
            definedTrophies={game.definedTrophies}
            displayArt={typeof artParam === "string" ? artParam : null}
            versions={versions}
            activeId={gameId}
            contextMode={contextModeStr}
          />
        )}

        {/* 🟢 SKELETONS: Only for the list area while details fetch */}
        {showListSkeletons && (
          <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <TrophySkeleton key={i} />
            ))}
          </View>
        )}

        {/* 🟢 TROPHY LIST: Show only when data is ready */}
        {!showListSkeletons && (
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
                            {...mapTrophyToProps(
                              trophy,
                              justEarnedIds,
                              setSelectedTrophy
                            )}
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
        )}
      </Animated.ScrollView>

      <TrophyActionSheet
        visible={!!selectedTrophy}
        onClose={() => setSelectedTrophy(null)}
        gameName={game?.trophyTitleName ?? ""}
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
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#000",
  },
});
