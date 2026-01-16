import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, RefreshControl, ScrollView, Text, View } from "react-native";
import TrophyActionSheet from "../../components/trophies/TrophyActionSheet";
import TrophyCard from "../../components/trophies/TrophyCard";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";
import { useMarkRecentGame } from "../../utils/makeRecent";
import { normalizeTrophyType } from "../../utils/normalizeTrophy";

type GameTrophy = {
  trophyId: number;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyType: string;
  earned?: boolean;
  earnedDateTime?: string | null;
};

export default function GameScreen() {
  const { id: rawId } = useLocalSearchParams();
  const { trophies, accessToken, accountId } = useTrophy();
  const markRecentGame = useMarkRecentGame();

  const [gameTrophies, setGameTrophies] = useState<GameTrophy[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { refreshSingleGame, refreshAllTrophies } = useTrophy();
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justEarnedIds, setJustEarnedIds] = useState<Set<number>>(new Set());
  const [selectedTrophy, setSelectedTrophy] = useState<{
    name: string;
    type: "bronze" | "silver" | "gold" | "platinum";
  } | null>(null);

  const npwr = Array.isArray(rawId) ? rawId[0] : rawId;
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSingleGame(npwr);
    await refreshAllTrophies();
    setRefreshing(false);
  };
  const game = useMemo(() => {
    if (!npwr) return null;
    return trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(npwr)
    );
  }, [npwr, trophies]);
  // ---- Reset state when switching games
  useEffect(() => {
    setGameTrophies([]);
    setJustEarnedIds(new Set());
    setIsInitialLoading(true);
    setSelectedTrophy(null);
  }, [npwr]);
  // ---- Mark recent game (once per game change)
  useEffect(() => {
    if (!game) return;

    markRecentGame({
      npwr: String(game.npCommunicationId),
      gameName: game.trophyTitleName,
      platform: game.trophyTitlePlatform,
    });
  }, [game, markRecentGame]);

  // ---- Fetch trophies for this game
  useEffect(() => {
    if (!accountId || !accessToken || !game) {
      setIsInitialLoading(false); // ✅ SAFETY
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    if (gameTrophies.length === 0) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    fetch(
      `${PROXY_BASE_URL}/api/trophies/${accountId}/${game.npCommunicationId}` +
        `?gameName=${encodeURIComponent(game.trophyTitleName)}` +
        `&platform=${encodeURIComponent(game.trophyTitlePlatform)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      }
    )
      .then((r) => r.json())
      .then((data) => {
        if (signal.aborted) return;

        const incoming: GameTrophy[] = data.trophies ?? [];

        setGameTrophies((prev) => {
          if (prev.length === 0) {
            return incoming;
          }

          const prevMap = new Map(prev.map((t) => [t.trophyId, t]));
          const nextJustEarned = new Set<number>();

          const merged = incoming.map((t) => {
            const old = prevMap.get(t.trophyId);

            if (old && !old.earned && t.earned) {
              nextJustEarned.add(t.trophyId);
            }

            if (
              old &&
              old.earned === t.earned &&
              old.earnedDateTime === t.earnedDateTime
            ) {
              return old;
            }

            return t;
          });

          if (nextJustEarned.size > 0) {
            setJustEarnedIds(nextJustEarned);
            setTimeout(() => setJustEarnedIds(new Set()), 2000);
          }

          return merged;
        });
      })
      .catch((e) => {
        if (!signal.aborted) {
          console.log("❌ GAME TROPHIES FETCH FAILED", e);
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setIsInitialLoading(false); // 👈 THIS removes the skeleton
          setIsRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [accountId, accessToken, game]);

  // ---- Skeleton
  const TrophySkeleton = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          backgroundColor: "#222",
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 12,
            width: "70%",
            backgroundColor: "#222",
            borderRadius: 4,
            marginBottom: 6,
          }}
        />
        <View
          style={{
            height: 10,
            width: "50%",
            backgroundColor: "#222",
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );

  // ---- Guards (after hooks)
  if (!npwr) {
    return (
      <View>
        <Text>Missing game id</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View>
        <Text>Game not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#000" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white" // iOS spinner color
            colors={["#fff"]} // Android spinner color
          />
        }
      >
        <Image
          source={{ uri: game.trophyTitleIconUrl }}
          style={{
            width: 180,
            height: 180,
            borderRadius: 12,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />

        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {game.trophyTitleName}
        </Text>

        <Text style={{ color: "gold", textAlign: "center", marginBottom: 24 }}>
          {game.progress}% Complete
        </Text>

        {isInitialLoading &&
          Array.from({ length: 7 }).map((_, i) => <TrophySkeleton key={i} />)}

        {!isInitialLoading && gameTrophies.length === 0 && (
          <Text style={{ color: "#999", textAlign: "center" }}>No trophies found.</Text>
        )}

        {gameTrophies.map((trophy) => (
          <TrophyCard
            key={String(trophy.trophyId)}
            id={trophy.trophyId}
            name={trophy.trophyName}
            description={trophy.trophyDetail}
            icon={trophy.trophyIconUrl}
            type={normalizeTrophyType(trophy.trophyType)}
            earned={!!trophy.earned}
            earnedAt={trophy.earnedDateTime ?? undefined}
            justEarned={justEarnedIds.has(trophy.trophyId)}
            onPress={() =>
              setSelectedTrophy({
                name: trophy.trophyName,
                type: normalizeTrophyType(trophy.trophyType),
              })
            }
          />
        ))}
      </ScrollView>

      {/* ✅ THIS is where the overlay goes */}
      <TrophyActionSheet
        visible={!!selectedTrophy}
        onClose={() => setSelectedTrophy(null)}
        gameName={game.trophyTitleName}
        trophyName={selectedTrophy?.name ?? ""}
        trophyType={selectedTrophy?.type ?? "bronze"}
      />
    </>
  );
}
