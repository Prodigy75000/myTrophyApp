import { useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SortDirection, SortMode, ViewMode } from "../components/HeaderActionBar"; // 👈 Import new type
import HeaderActionBar from "../components/HeaderActionBar";
import GameCard from "../components/trophies/GameCard";
import GameGridItem from "../components/trophies/GameGridItem"; // 👈 Import new component
import ProfileDashboard from "../components/trophies/ProfileDashboard";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";

const BASE_HEADER_HEIGHT = 60;

export default function HomeScreen() {
  const [searchText, setSearchText] = useState("");
  const { trophies, accountId, accessToken, refreshAllTrophies } = useTrophy();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<{
    onlineId: string;
    avatarUrl: string;
    isPlus: boolean;
  } | null>(null);
  const [level, setLevel] = useState<number>(1);

  // Sorting State
  const [sortMode, setSortMode] = useState<SortMode>("LAST_PLAYED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");

  // 1. VIEW MODE STATE (List vs Grid)
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [gridColumns, setGridColumns] = useState(3); // Default to 3 columns

  // ... (Keep existing useEffect for profile fetching) ...
  useEffect(() => {
    if (!accountId || !accessToken) return;
    fetch(`${PROXY_BASE_URL}/api/user/profile/${accountId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const avatars = data.avatarUrls || data.avatars || [];
        const avatarItem = avatars.find((a: any) => a.size === "l") || avatars[0];
        const avatarUrl = avatarItem?.avatarUrl || avatarItem?.url;
        if (data.onlineId) {
          setProfile({ onlineId: data.onlineId, avatarUrl, isPlus: data.isPlus });
        }
      })
      .catch((err) => console.log("Profile fetch failed:", err));

    fetch(`${PROXY_BASE_URL}/api/user/summary/${accountId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.trophyLevel) setLevel(data.trophyLevel);
      })
      .catch((err) => console.log("Summary fetch failed:", err));
  }, [accountId, accessToken]);

  // ... (Keep existing stats calculation) ...
  const userStats = useMemo(() => {
    if (!trophies?.trophyTitles) return null;
    return trophies.trophyTitles.reduce(
      (acc: any, game: any) => {
        acc.bronze += game.earnedTrophies.bronze;
        acc.silver += game.earnedTrophies.silver;
        acc.gold += game.earnedTrophies.gold;
        acc.platinum += game.earnedTrophies.platinum;
        acc.total +=
          game.earnedTrophies.bronze +
          game.earnedTrophies.silver +
          game.earnedTrophies.gold +
          game.earnedTrophies.platinum;
        return acc;
      },
      { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 }
    );
  }, [trophies]);

  const totalHeaderHeight = BASE_HEADER_HEIGHT + insets.top;
  const scrollY = useRef(new Animated.Value(0)).current;
  const diffClamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, totalHeaderHeight),
    [scrollY, totalHeaderHeight]
  );
  const translateY = diffClamp.interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

  // Filter/Sort logic
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

  // 2. RENDER ITEM LOGIC
  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      // Common data extraction
      const progress = typeof item.progress === "number" ? item.progress : 0;
      const art = item.gameArtUrl || item.trophyTitleIconUrl;
      const platform = item.trophyTitlePlatform || ""; // 👈 Extract Platform

      // A) GRID VIEW
      if (viewMode === "GRID") {
        return (
          <GameGridItem
            id={item.npCommunicationId}
            art={art}
            platform={platform}
            progress={progress}
            numColumns={gridColumns}
          />
        );
      }

      // B) LIST VIEW (Existing)
      return (
        <GameCard
          id={item.npCommunicationId}
          title={item.trophyTitleName}
          icon={item.trophyTitleIconUrl}
          art={item.gameArtUrl || undefined}
          platform={platform} // 👈 Pass it
          progress={progress}
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
      );
    },
    [viewMode, gridColumns]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0b0fff" }}>
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
          height: totalHeaderHeight,
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
          // 👇 PASS VIEW MODE PROPS
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </Animated.View>

      {trophies && trophies.trophyTitles ? (
        <Animated.FlatList
          // ⚠️ KEY PROP is crucial for changing numColumns dynamically
          key={viewMode === "GRID" ? `grid-${gridColumns}` : "list"}
          data={sortedTrophies}
          keyExtractor={(item) => String(item.npCommunicationId)}
          renderItem={renderItem}
          // 👇 DYNAMIC COLUMNS
          numColumns={viewMode === "GRID" ? gridColumns : 1}
          // Optional: Add column wrapper style if needed for grid spacing
          columnWrapperStyle={viewMode === "GRID" ? { paddingHorizontal: 0 } : undefined}
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
          contentContainerStyle={{
            paddingTop: totalHeaderHeight,
            paddingBottom: 20,
            // Add padding for Grid mode to center items if needed
            paddingHorizontal: viewMode === "GRID" ? 2 : 0,
          }}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            userStats ? (
              <ProfileDashboard
                username={profile?.onlineId ?? accountId ?? "Loading..."}
                avatarUrl={profile?.avatarUrl}
                isPlus={profile?.isPlus}
                totalTrophies={userStats.total}
                counts={{
                  bronze: userStats.bronze,
                  silver: userStats.silver,
                  gold: userStats.gold,
                  platinum: userStats.platinum,
                }}
                level={level > 1 ? level : undefined}
              />
            ) : null
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
