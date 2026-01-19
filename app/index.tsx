import { useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SortDirection, SortMode, ViewMode } from "../components/HeaderActionBar";
import HeaderActionBar from "../components/HeaderActionBar";
import GameCard from "../components/trophies/GameCard";
import GameGridItem from "../components/trophies/GameGridItem";
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

  // Sorting / View State
  const [sortMode, setSortMode] = useState<SortMode>("LAST_PLAYED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [gridColumns, setGridColumns] = useState(3);

  // ⚡ WATCHDOG STATE: Tracks games that just updated
  const [justUpdatedIds, setJustUpdatedIds] = useState<Set<string>>(new Set());
  // Store previous counts to detect changes
  const prevCountsRef = useRef<Map<string, number>>(new Map());

  // Watchdog Effect
  useEffect(() => {
    if (!trophies?.trophyTitles) return;

    const newUpdates = new Set<string>();
    let hasUpdates = false;

    trophies.trophyTitles.forEach((game: any) => {
      const id = game.npCommunicationId;
      const currentTotal =
        game.earnedTrophies.bronze +
        game.earnedTrophies.silver +
        game.earnedTrophies.gold +
        game.earnedTrophies.platinum;

      const prevTotal = prevCountsRef.current.get(id);

      // Detect Increase (Only if we had a previous value, so it doesn't flash on first load)
      if (prevTotal !== undefined && currentTotal > prevTotal) {
        newUpdates.add(id);
        hasUpdates = true;
      }

      // Update ref for next time
      prevCountsRef.current.set(id, currentTotal);
    });

    if (hasUpdates) {
      // Add new IDs to the set
      setJustUpdatedIds((prev) => {
        const next = new Set(prev);
        newUpdates.forEach((id) => next.add(id));
        return next;
      });

      // Remove them after 3 seconds
      setTimeout(() => {
        setJustUpdatedIds((prev) => {
          const next = new Set(prev);
          newUpdates.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);
    }
  }, [trophies]);

  // Fetch Profile & Level ... (Existing code)
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

  const totalHeaderHeight = BASE_HEADER_HEIGHT + insets.top;

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

  const scrollY = useRef(new Animated.Value(0)).current;
  const diffClamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, totalHeaderHeight),
    [scrollY, totalHeaderHeight]
  );
  const translateY = diffClamp.interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

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

  // 2️⃣ MERGED RENDER ITEM
  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const progress = item.progress;
      const art = item.gameArtUrl || item.trophyTitleIconUrl;
      const isJustUpdated = justUpdatedIds.has(item.npCommunicationId);

      // 👻 GHOST EFFECT: Mute games with 0% progress
      const wrapperStyle = progress === 0 ? { opacity: 0.5 } : { opacity: 1 };

      // A) GRID VIEW
      if (viewMode === "GRID") {
        return (
          <View style={wrapperStyle}>
            <GameGridItem
              id={item.npCommunicationId}
              art={art}
              platform={item.trophyTitlePlatform}
              progress={progress}
              numColumns={gridColumns}
              justUpdated={isJustUpdated} // 👈 PASS TRIGGER
            />
          </View>
        );
      }

      // B) LIST VIEW
      return (
        <View style={wrapperStyle}>
          <GameCard
            id={item.npCommunicationId}
            title={item.trophyTitleName}
            icon={item.trophyTitleIconUrl}
            art={item.gameArtUrl || undefined}
            platform={item.trophyTitlePlatform}
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
            justUpdated={isJustUpdated} // 👈 PASS TRIGGER
          />
        </View>
      );
    },
    [viewMode, gridColumns, justUpdatedIds] // Add dependency
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </Animated.View>

      {trophies && trophies.trophyTitles ? (
        <Animated.FlatList
          key={viewMode === "GRID" ? `grid-${gridColumns}` : "list"}
          data={sortedTrophies}
          keyExtractor={(item) => String(item.npCommunicationId)}
          renderItem={renderItem}
          numColumns={viewMode === "GRID" ? gridColumns : 1}
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
            paddingTop: totalHeaderHeight + 10,
            paddingBottom: 20,
            paddingHorizontal: viewMode === "GRID" ? 2 : 0,
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            userStats ? (
              <ProfileDashboard
                username={profile?.onlineId ?? accountId ?? "Loading..."}
                avatarUrl={profile?.avatarUrl}
                isPlus={profile?.isPlus}
                counts={{
                  bronze: userStats.bronze,
                  silver: userStats.silver,
                  gold: userStats.gold,
                  platinum: userStats.platinum,
                }}
                level={level > 1 ? level : undefined}
                totalTrophies={0}
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
