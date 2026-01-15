import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
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
  const [loading, setLoading] = useState(false);

  const npwr = Array.isArray(rawId) ? rawId[0] : rawId;

  const game = useMemo(() => {
    if (!npwr) return null;
    return trophies?.trophyTitles?.find(
      (g: any) => String(g.npCommunicationId) === String(npwr)
    );
  }, [npwr, trophies]);

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
    if (!accountId || !accessToken || !game) return;

    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);

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
        if (!signal.aborted) {
          setGameTrophies(data.trophies ?? []);
        }
      })
      .catch((e) => {
        if (!signal.aborted) {
          console.log("❌ GAME TROPHIES FETCH FAILED", e);
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
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
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }}>
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

      {loading && Array.from({ length: 7 }).map((_, i) => <TrophySkeleton key={i} />)}

      {!loading && gameTrophies.length === 0 && (
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
        />
      ))}
    </ScrollView>
  );
}
