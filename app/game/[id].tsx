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
  SortDirection,
  TrophySortMode,
} from "../../components/trophies/TrophyListHeader";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";
import { useMarkRecentGame } from "../../utils/makeRecent";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

const HEADER_HEIGHT = 56;

// Icons for the breakdown
const trophyIcons = {
  bronze: require("../../assets/icons/trophies/bronze.png"),
  silver: require("../../assets/icons/trophies/silver.png"),
  gold: require("../../assets/icons/trophies/gold.png"),
  platinum: require("../../assets/icons/trophies/platinum.png"),
};

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
// 👇 ADD GROUP TYPE
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
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");

  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());
  const npwr = Array.isArray(rawId) ? rawId[0] : rawId;

  // Animation & Header
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
  // 2️⃣ RESET SCROLL WHEN GAME ID (npwr) CHANGES
  useEffect(() => {
    // Scroll to top immediately (no animation) so it feels like a fresh screen
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    // Also reset the header animation state so it expands
    scrollY.setValue(0);
  }, [npwr]); // 👈 Trigger this whenever the Game ID changes
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
  // 🐶 LOCAL WATCHDOG: If the global game stats change, re-fetch the details!
  useEffect(() => {
    if (!game) return;

    // Calculate how many trophies we currently have loaded locally
    const localEarnedCount = localTrophies.filter((t) => t.earned).length;

    // Calculate how many the global context thinks we have
    const globalEarnedCount =
      (game.earnedTrophies.bronze || 0) +
      (game.earnedTrophies.silver || 0) +
      (game.earnedTrophies.gold || 0) +
      (game.earnedTrophies.platinum || 0);

    // If global says we have more than local, fetch the details!
    if (globalEarnedCount > localEarnedCount && localTrophies.length > 0) {
      console.log("🔄 Local Watchdog: Context has newer data. Refreshing list...");
      refreshSingleGame(npwr);
      // We also re-fetch the list explicitly to be safe
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
  }, [game, localTrophies]); // Run whenever 'game' (context) or 'localTrophies' changes
  // 2. Base List
  const rawTrophyList: GameTrophy[] = useMemo(() => {
    if (game?.trophyList && game.trophyList.length > 0) {
      return game.trophyList;
    }
    return localTrophies;
  }, [game?.trophyList, localTrophies]);

  // 3. Process List
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
          const rA = parseFloat(a.trophyEarnedRate ?? "0");
          const rB = parseFloat(b.trophyEarnedRate ?? "0");
          return (rA - rB) * dir;
        case "STATUS":
          return ((a.earned ? 1 : 0) - (b.earned ? 1 : 0)) * dir;
        case "DATE_EARNED":
          const dateA = a.earnedDateTime ? new Date(a.earnedDateTime).getTime() : 0;
          const dateB = b.earnedDateTime ? new Date(b.earnedDateTime).getTime() : 0;
          return (dateA - dateB) * dir;
        default:
          return (a.trophyId - b.trophyId) * dir;
      }
    });
    return list;
  }, [rawTrophyList, searchText, sortMode, sortDirection]);

  // 4. Mark Recent
  useEffect(() => {
    if (game) {
      markRecentGame({
        npwr: String(game.npCommunicationId),
        gameName: game.trophyTitleName,
        platform: game.trophyTitlePlatform,
      });
    }
  }, [game?.npCommunicationId]);

  // 5. Just Earned Animation
  useEffect(() => {
    if (processedTrophies.length === 0) return;
    const nextJustEarned = new Set<number>();
    processedTrophies.forEach((t) => {
      const wasEarned = prevTrophiesRef.current.get(t.trophyId);
      if (wasEarned === false && t.earned) {
        nextJustEarned.add(t.trophyId);
      }
      prevTrophiesRef.current.set(t.trophyId, !!t.earned);
    });
    if (nextJustEarned.size > 0) {
      setJustEarnedIds(nextJustEarned);
      setTimeout(() => setJustEarnedIds(new Set()), 3000);
    }
  }, [rawTrophyList]);

  // 6. Fetch Logic
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
  // 2. THE GROUPING LOGIC (The Magic ✨)
  const groupedData = useMemo(() => {
    // If not using DEFAULT sort, flattening is usually better UX
    // But let's support grouping for 'DEFAULT' mode
    if (sortMode !== "DEFAULT") return null;

    const groups: any[] = [];

    // Map of GroupID -> Group Info
    const groupMap = new Map();
    // Pre-fill with fetched groups (to get names)
    trophyGroups.forEach((g) => groupMap.set(g.trophyGroupId, g));

    // Bucket trophies
    const buckets = new Map<string, typeof processedTrophies>();

    processedTrophies.forEach((t) => {
      // API returns 'trophyGroupId' on each trophy
      const gid = (t as any).trophyGroupId ?? "default";
      if (!buckets.has(gid)) buckets.set(gid, []);
      buckets.get(gid)?.push(t);
    });

    // 1. Get all keys
    const keys = Array.from(buckets.keys());

    // 2. Check if "default" exists in this game
    const hasDefault = keys.includes("default");

    // 3. Custom Sort: "default" always wins, otherwise alphanumeric
    const sortedKeys = keys.sort((a, b) => {
      if (a === "default") return -1; // "default" jumps to top
      if (b === "default") return 1;
      return a.localeCompare(b, undefined, { numeric: true }); // "001" before "002"
    });
    sortedKeys.forEach((key) => {
      const list = buckets.get(key) || [];
      const info = groupMap.get(key);

      // 4. Smart Labeling Logic
      let isBaseGame = false;
      let name = info?.trophyGroupName;

      if (key === "default") {
        // Case A: Explicit default group
        isBaseGame = true;
        name = name || "Base Game";
      } else if (!hasDefault && key === "001") {
        // Case B: No default, so 001 is the Base Game (Common in newer games)
        isBaseGame = true;
        name = name || "Base Game";
      } else {
        // Case C: DLC (It's 001 but default exists, OR it's 002+)
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

      groups.push({
        id: key,
        name,
        isBaseGame,
        trophies: list,
        counts,
        earnedCounts,
      });
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
      {/* HEADER */}

      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
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

      {/* CONTENT */}
      <Animated.ScrollView
        ref={scrollViewRef} // 👈 MOVED THE REF HERE (The Main Fix)
        contentContainerStyle={{
          paddingTop: totalHeaderHeight,
          paddingBottom: 40,
        }}
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
        {/* 🔥 NEW HERO HEADER */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: game.trophyTitleIconUrl }} style={styles.gameIcon} />
          <Text style={styles.gameTitle}>{game.trophyTitleName}</Text>

          {/* STATS ROW */}
          <View style={styles.statsContainer}>
            {/* 1. Progress Circle */}
            <View style={styles.progressWrapper}>
              <ProgressCircle progress={game.progress} size={50} strokeWidth={5} />
            </View>

            {/* 2. Vertical Divider */}
            <View style={styles.divider} />

            {/* 3. Trophy Breakdown */}
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
          {/* A) GROUPED VIEW (Default Sort) */}
          {sortMode === "DEFAULT" && groupedData
            ? groupedData.map((group) => (
                <View key={group.id}>
                  {/* The Fancy Header */}
                  <TrophyGroupHeader
                    title={group.name}
                    isBaseGame={group.isBaseGame}
                    counts={group.counts}
                    earnedCounts={group.earnedCounts}
                  />
                  {/* The Trophies */}
                  {group.trophies.map((trophy: any) => (
                    <TrophyCard
                      key={String(trophy.trophyId)}
                      id={trophy.trophyId}
                      name={trophy.trophyName}
                      description={trophy.trophyDetail}
                      icon={trophy.trophyIconUrl}
                      type={normalizeTrophyType(trophy.trophyType)}
                      earned={!!trophy.earned}
                      // 🛡️ FIX: Handle null here (Grouped View)
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
            : // B) FLAT VIEW (For Search / Date Sort / Rarity Sort)
              processedTrophies.map((trophy) => (
                <TrophyCard
                  key={String(trophy.trophyId)}
                  // ... existing props ...
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

// 🟢 HELPER COMPONENT: Single Column (Icon + Count)
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
    paddingVertical: 24,
    backgroundColor: "#050508", // Slightly darker hero background
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c26",
  },
  gameIcon: {
    width: 170,
    height: 170,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  gameTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "normal",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
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
  progressWrapper: {
    marginRight: 16,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#444",
    marginRight: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 16, // Use gap for spacing between columns
  },
  statColumn: {
    alignItems: "center",
  },
  statIcon: {
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
