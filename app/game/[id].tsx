import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TrophyActionSheet from "../../components/trophies/TrophyActionSheet";
import TrophyCard from "../../components/trophies/TrophyCard";
import TrophyListHeader, {
  SortDirection,
  TrophySortMode,
} from "../../components/trophies/TrophyListHeader";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";
import { useMarkRecentGame } from "../../utils/makeRecent";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

const BASE_HEADER_HEIGHT = 56; // Base content height

// Type Definition
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

  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());
  const [selectedTrophy, setSelectedTrophy] = useState<any>(null);

  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<TrophySortMode>("DEFAULT");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");

  const prevTrophiesRef = useRef<Map<number, boolean>>(new Map());
  const npwr = Array.isArray(rawId) ? rawId[0] : rawId;

  // 1️⃣ CALCULATE TOTAL HEIGHT
  const totalHeaderHeight = BASE_HEADER_HEIGHT + insets.top;

  // 🎬 ANIMATION SETUP
  const scrollY = useRef(new Animated.Value(0)).current;

  // 2️⃣ UPDATE DIFFCLAMP
  const diffClamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, totalHeaderHeight),
    [scrollY, totalHeaderHeight]
  );

  const translateY = diffClamp.interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight], // Slide completely off-screen
  });

  // (Keep all your existing useEffects and useMemos exactly as they were...)
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const game = useMemo(() => {
    if (!npwr) return null;
    return trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(npwr)
    );
  }, [npwr, trophies]);

  const rawTrophyList: GameTrophy[] = useMemo(() => {
    if (game?.trophyList && game.trophyList.length > 0) return game.trophyList;
    return localTrophies;
  }, [game?.trophyList, localTrophies]);

  const processedTrophies = useMemo(() => {
    let list = [...rawTrophyList];
    if (searchText)
      list = list.filter((t) =>
        t.trophyName.toLowerCase().includes(searchText.toLowerCase())
      );

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

  useEffect(() => {
    if (game)
      markRecentGame({
        npwr: String(game.npCommunicationId),
        gameName: game.trophyTitleName,
        platform: game.trophyTitlePlatform,
      });
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
      `${PROXY_BASE_URL}/api/trophies/${accountId}/${game.npCommunicationId}?gameName=${encodeURIComponent(game.trophyTitleName)}&platform=${encodeURIComponent(game.trophyTitlePlatform)}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) setLocalTrophies(data.trophies ?? []);
      })
      .catch((e) => console.log("Fetch failed", e))
      .finally(() => {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      });
    return () => controller.abort();
  }, [accountId, accessToken, game?.npCommunicationId, game?.trophyList]);

  if (!game) return <View style={{ flex: 1, backgroundColor: "black" }} />;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSingleGame(npwr);
    await refreshAllTrophies();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* 🎬 HEADER */}
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
          height: totalHeaderHeight, // Explicit height
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

      {/* 🎬 SCROLLVIEW */}
      <Animated.ScrollView
        contentContainerStyle={{
          paddingTop: totalHeaderHeight, // Matches total height
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
        {/* HERO HEADER */}
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Image
            source={{ uri: game.trophyTitleIconUrl }}
            style={{ width: 120, height: 120, borderRadius: 12, marginBottom: 12 }}
          />
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {game.trophyTitleName}
          </Text>
          <Text style={{ color: "gold", marginTop: 4 }}>{game.progress}% Complete</Text>
          <Text style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
            {processedTrophies.length} Trophies
          </Text>
        </View>

        {isInitialLoading && (
          <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            Loading Trophies...
          </Text>
        )}

        <View style={{ paddingHorizontal: 12 }}>
          {processedTrophies.map((trophy) => (
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
