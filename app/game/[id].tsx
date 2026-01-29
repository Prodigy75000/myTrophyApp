import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrophy } from "../../providers/TrophyContext";
import TrophySkeleton from "../../src/components/skeletons/TrophySkeleton";
import GameHero from "../../src/components/trophies/GameHero";
import TrophyActionSheet from "../../src/components/trophies/TrophyActionSheet";
import TrophyCard from "../../src/components/trophies/TrophyCard";
import TrophyGroupHeader from "../../src/components/trophies/TrophyGroupHeader";
import TrophyListHeader, {
  TrophySortMode,
} from "../../src/components/trophies/TrophyListHeader";
import { useGameDetails } from "../../src/hooks/game-details/useGameDetails";
import { styles } from "../../src/styles/GameScreen.styles"; // 🟢 Imported Styles
import { normalizeTrophyType } from "../../src/utils/normalizeTrophy";

// ⚠️ IMPORT MASTER DATA
import masterGamesRaw from "../../data/master_games.json";

const HEADER_HEIGHT = 60;
const ZERO_COUNTS = { bronze: 0, silver: 0, gold: 0, platinum: 0 };

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
    isLoadingDetails,
    refreshing,
    onRefresh,
    processedTrophies,
    groupedData,
    justEarnedIds,
  } = useGameDetails(gameId, searchText, sortMode as any, sortDirection);

  // --- STALE DATA CHECK ---
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
  }, [gameId, scrollY]); // 🟢 FIXED: Added scrollY dependency

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
      // 🟢 FIXED: Replaced ternary with if/else to satisfy linter
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
        contentContainerStyle={[styles.listContent, { paddingTop: totalHeaderHeight }]}
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
        {/* 🟢 HERO: FIXED TYPES */}
        {game && (
          <GameHero
            iconUrl={game.trophyTitleIconUrl ?? ""} // 🟢 FIXED
            title={game.trophyTitleName ?? "Unknown Title"}
            platform={game.trophyTitlePlatform}
            progress={game.progress}
            earnedTrophies={game.earnedTrophies ?? ZERO_COUNTS} // 🟢 FIXED
            definedTrophies={game.definedTrophies ?? ZERO_COUNTS} // 🟢 FIXED
            displayArt={typeof artParam === "string" ? artParam : null}
            versions={versions}
            activeId={gameId}
            contextMode={contextModeStr}
          />
        )}

        {/* SKELETONS */}
        {showListSkeletons && (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 8 }).map((_, i) => (
              <TrophySkeleton key={i} />
            ))}
          </View>
        )}

        {/* TROPHY LIST */}
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

// 🟢 Helper to map props cleanly
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
