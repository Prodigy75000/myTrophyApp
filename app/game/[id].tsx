import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressCircle from "../../components/ProgressCircle";
import TrophyActionSheet from "../../components/trophies/TrophyActionSheet";
import TrophyCard from "../../components/trophies/TrophyCard";
import TrophyGroupHeader from "../../components/trophies/TrophyGroupHeader";
import TrophyListHeader, {
  TrophySortMode,
} from "../../components/trophies/TrophyListHeader";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";
import { useMarkRecentGame } from "../../utils/makeRecent";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

// 🎯 FIX: Harmonized Height (was 56, now 60 to match index.tsx)
const HEADER_HEIGHT = 60;

const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

// ... Types (GameTrophy, TrophyGroup) remain the same ...
type GameTrophy = {
  trophyId: number;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyType: string;
  earned?: boolean;
  earnedDateTime?: string | null;
  trophyEarnedRate?: string;
  trophyProgressTargetValue?: string;
  trophyProgressValue?: string;
};
type TrophyGroup = {
  trophyGroupId: string;
  trophyGroupName: string;
  trophyGroupIconUrl?: string;
};

export default function GameScreen() {
  const { id: rawId } = useLocalSearchParams();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trophies, accessToken, accountId, refreshSingleGame, refreshAllTrophies } =
    useTrophy();
  const markRecentGame = useMarkRecentGame();

  const [localTrophies, setLocalTrophies] = useState<GameTrophy[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trophyGroups, setTrophyGroups] = useState<TrophyGroup[]>([]);
  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<TrophySortMode>("DEFAULT");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");

  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());
  const npwr = Array.isArray(rawId) ? rawId[0] : rawId;

  // Header Animation
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const diffClamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, totalHeaderHeight),
    [scrollY, totalHeaderHeight]
  );
  const translateY = diffClamp.interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

  useEffect(() => {
    // 🧹 FORCE CLEAR STATE ON ID CHANGE
    // This prevents "Flash of Old Content" when navigating between games
    setLocalTrophies([]);
    setTrophyGroups([]);
    setIsInitialLoading(true);

    // Reset Scroll Position
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.setValue(0);
  }, [npwr]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // 1. Get Game from Context
  const game = useMemo(() => {
    if (!npwr) return null;
    return trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(npwr)
    );
  }, [npwr, trophies]);

  // Watchdog & Fetch Effects (Same as before)...
  useEffect(() => {
    if (!game) return;
    const localEarnedCount = localTrophies.filter((t) => t.earned).length;
    const globalEarnedCount =
      (game.earnedTrophies.bronze || 0) +
      (game.earnedTrophies.silver || 0) +
      (game.earnedTrophies.gold || 0) +
      (game.earnedTrophies.platinum || 0);

    if (globalEarnedCount > localEarnedCount && localTrophies.length > 0) {
      console.log("🔄 Local Watchdog Refreshing...");
      refreshSingleGame(npwr);
      const controller = new AbortController();
      fetch(
        `${PROXY_BASE_URL}/api/trophies/${accountId}/${game.npCommunicationId}` +
          `?gameName=${encodeURIComponent(game.trophyTitleName)}` +
          `&platform=${encodeURIComponent(game.trophyTitlePlatform)}`,
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal }
      )
        .then((r) => r.json())
        .then((data) => {
          setLocalTrophies(data.trophies ?? []);
          setTrophyGroups(data.groups ?? []);
        });
    }
  }, [game, localTrophies]);

  // List processing (Same as before)...
  const rawTrophyList: GameTrophy[] = useMemo(() => {
    if (game?.trophyList && game.trophyList.length > 0) return game.trophyList;
    return localTrophies;
  }, [game?.trophyList, localTrophies]);

  const processedTrophies = useMemo(() => {
    let list = [...rawTrophyList];
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter((t) => t.trophyName.toLowerCase().includes(q));
    }
    const dir = sortDirection === "ASC" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortMode) {
        case "NAME":
          return a.trophyName.localeCompare(b.trophyName) * dir;
        case "RARITY":
          return (
            (parseFloat(a.trophyEarnedRate ?? "0") -
              parseFloat(b.trophyEarnedRate ?? "0")) *
            dir
          );
        case "STATUS":
          return ((a.earned ? 1 : 0) - (b.earned ? 1 : 0)) * dir;
        case "DATE_EARNED":
          const dA = a.earnedDateTime ? new Date(a.earnedDateTime).getTime() : 0;
          const dB = b.earnedDateTime ? new Date(b.earnedDateTime).getTime() : 0;
          return (dA - dB) * dir;
        default:
          return (a.trophyId - b.trophyId) * dir;
      }
    });
    return list;
  }, [rawTrophyList, searchText, sortMode, sortDirection]);

  useEffect(() => {
    if (game) {
      markRecentGame({
        npwr: String(game.npCommunicationId),
        gameName: game.trophyTitleName,
        platform: game.trophyTitlePlatform,
      });
    }
  }, [game?.npCommunicationId]);

  useEffect(() => {
    if (processedTrophies.length === 0) return;
    const nextJustEarned = new Set<number>();
    processedTrophies.forEach((t) => {
      const wasEarned = prevTrophiesRef.current.get(t.trophyId);
      if (wasEarned === false && t.earned) nextJustEarned.add(t.trophyId);
      prevTrophiesRef.current.set(t.trophyId, !!t.earned);
    });
    if (nextJustEarned.size > 0) {
      setJustEarnedIds(nextJustEarned);
      setTimeout(() => setJustEarnedIds(new Set()), 3000);
    }
  }, [rawTrophyList]);

  useEffect(() => {
    if (game?.trophyList) {
      setIsInitialLoading(false);
      return;
    }
    if (!accountId || !accessToken || !game) return;
    const controller = new AbortController();
    fetch(
      `${PROXY_BASE_URL}/api/trophies/${accountId}/${game.npCommunicationId}` +
        `?gameName=${encodeURIComponent(game.trophyTitleName)}` +
        `&platform=${encodeURIComponent(game.trophyTitlePlatform)}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setLocalTrophies(data.trophies ?? []);
          setTrophyGroups(data.groups ?? []);
        }
      })
      .catch((e) => console.log("Fetch failed", e))
      .finally(() => {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      });
    return () => controller.abort();
  }, [accountId, accessToken, game?.npCommunicationId, game?.trophyList]);

  const groupedData = useMemo(() => {
    if (sortMode !== "DEFAULT") return null;
    const groups: any[] = [];
    const groupMap = new Map();
    trophyGroups.forEach((g) => groupMap.set(g.trophyGroupId, g));
    const buckets = new Map<string, typeof processedTrophies>();
    processedTrophies.forEach((t) => {
      const gid = (t as any).trophyGroupId ?? "default";
      if (!buckets.has(gid)) buckets.set(gid, []);
      buckets.get(gid)?.push(t);
    });
    const keys = Array.from(buckets.keys());
    const hasDefault = keys.includes("default");
    const sortedKeys = keys.sort((a, b) => {
      if (a === "default") return -1;
      if (b === "default") return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
    sortedKeys.forEach((key) => {
      const list = buckets.get(key) || [];
      const info = groupMap.get(key);
      let isBaseGame = false;
      let name = info?.trophyGroupName;
      if (key === "default") {
        isBaseGame = true;
        name = name || "Base Game";
      } else if (!hasDefault && key === "001") {
        isBaseGame = true;
        name = name || "Base Game";
      } else {
        isBaseGame = false;
        name = name || `Add-on Pack ${key}`;
      }
      const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      const earnedCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      list.forEach((t: any) => {
        const type = normalizeTrophyType(t.trophyType);
        counts[type]++;
        if (t.earned) earnedCounts[type]++;
      });
      groups.push({ id: key, name, isBaseGame, trophies: list, counts, earnedCounts });
    });
    return groups;
  }, [processedTrophies, trophyGroups, sortMode]);

  if (!game) return <View style={{ flex: 1, backgroundColor: "black" }} />;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSingleGame(npwr);
    await refreshAllTrophies();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          // Harmonized with index.tsx (you can change to #0a0b0fff if you want color match too)
          backgroundColor: "#000",
          transform: [{ translateY }],
          height: totalHeaderHeight,
        }}
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
        ref={scrollViewRef}
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
        {/* 🔥 HERO HEADER */}
        <View style={styles.heroContainer}>
          {/* WRAPPER FOR BADGE POSITIONING */}
          <View style={styles.iconWrapper}>
            {/* 🖼️ IMAGE CONTAINER (Black background) */}
            <View style={styles.gameIconContainer}>
              <Image
                source={{ uri: game.trophyTitleIconUrl }}
                style={{ width: "100%", height: "100%" }}
                // ✅ FIX: Use 'cover' for PS5, 'contain' for PS4 (same logic as GameCard)
                // For simplicity here, we can stick to 'contain' + black BG as it's the safest global header style
                // Or use dynamic logic if you passed 'platform' into a prop.
                resizeMode="contain"
              />
            </View>

            {/* 🏷️ FLOATING BADGE */}
            {game.trophyTitlePlatform && (
              <View style={styles.platformBadge}>
                <Text style={styles.platformText}>{game.trophyTitlePlatform}</Text>
              </View>
            )}
          </View>

          <Text style={styles.gameTitle}>{game.trophyTitleName}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.progressWrapper}>
              <ProgressCircle progress={game.progress} size={50} strokeWidth={5} />
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <StatColumn
                icon={trophyIcons.bronze}
                earned={game.earnedTrophies.bronze}
                total={game.definedTrophies.bronze}
                color="#CD7F32"
              />
              <StatColumn
                icon={trophyIcons.silver}
                earned={game.earnedTrophies.silver}
                total={game.definedTrophies.silver}
                color="#C0C0C0"
              />
              <StatColumn
                icon={trophyIcons.gold}
                earned={game.earnedTrophies.gold}
                total={game.definedTrophies.gold}
                color="#FFD700"
              />
              <StatColumn
                icon={trophyIcons.platinum}
                earned={game.earnedTrophies.platinum}
                total={game.definedTrophies.platinum}
                color="#E5E4E2"
              />
            </View>
          </View>
        </View>

        {isInitialLoading && (
          <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            Loading Trophies...
          </Text>
        )}

        <View style={{ paddingHorizontal: 12 }}>
          {/* Grouped vs Flat List Logic */}
          {sortMode === "DEFAULT" && groupedData
            ? groupedData.map((group) => (
                <View key={group.id}>
                  <TrophyGroupHeader
                    title={group.name}
                    isBaseGame={group.isBaseGame}
                    counts={group.counts}
                    earnedCounts={group.earnedCounts}
                  />
                  {group.trophies.map((trophy: any) => (
                    <TrophyCard
                      key={String(trophy.trophyId)}
                      id={trophy.trophyId}
                      name={trophy.trophyName}
                      description={trophy.trophyDetail}
                      icon={trophy.trophyIconUrl}
                      type={normalizeTrophyType(trophy.trophyType)}
                      earned={!!trophy.earned}
                      earnedAt={trophy.earnedDateTime ?? undefined}
                      rarity={trophy.trophyEarnedRate}
                      justEarned={justEarnedIds.has(trophy.trophyId)}
                      onPress={() =>
                        setSelectedTrophy({
                          name: trophy.trophyName,
                          type: normalizeTrophyType(trophy.trophyType),
                        })
                      }
                    />
                  ))}
                </View>
              ))
            : processedTrophies.map((trophy) => (
                <TrophyCard
                  key={String(trophy.trophyId)}
                  id={trophy.trophyId}
                  name={trophy.trophyName}
                  description={trophy.trophyDetail}
                  icon={trophy.trophyIconUrl}
                  type={normalizeTrophyType(trophy.trophyType)}
                  earned={!!trophy.earned}
                  earnedAt={trophy.earnedDateTime ?? undefined}
                  rarity={trophy.trophyEarnedRate}
                  justEarned={justEarnedIds.has(trophy.trophyId)}
                  onPress={() =>
                    setSelectedTrophy({
                      name: trophy.trophyName,
                      type: normalizeTrophyType(trophy.trophyType),
                    })
                  }
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
      />
    </View>
  );
}

const StatColumn = ({ icon, earned, total, color }: any) => (
  <View style={styles.statColumn}>
    <Image source={icon} style={styles.statIcon} resizeMode="contain" />
    <Text style={[styles.statText, { color }]}>
      {earned}/{total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#050508",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c26",
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 8,
    width: 148,
    height: 148,
  },
  // Replaces old gameIcon
  gameIconContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#000",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  platformBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  platformText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gameTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c26",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  progressWrapper: { marginRight: 16 },
  divider: { width: 1, height: 40, backgroundColor: "#444", marginRight: 16 },
  breakdownRow: { flexDirection: "row", gap: 16 },
  statColumn: { alignItems: "center" },
  statIcon: { width: 20, height: 20, marginBottom: 4 },
  statText: { fontSize: 12, fontWeight: "bold" },
});
