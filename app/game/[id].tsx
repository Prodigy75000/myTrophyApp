import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import TrophyItemCard from "../../components/trophies/TrophyItemCard";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";

export default function GameScreen() {
  const params = useLocalSearchParams();
  const { trophies, accessToken, accountId } = useTrophy();

  const [gameTrophies, setGameTrophies] = useState<any[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState(false);

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const game = trophies?.trophyTitles?.find(
    (g: any) => String(g.npCommunicationId) === String(id)
  );

  // ✅ HOOKS ALWAYS RUN — NO RETURNS ABOVE
  useEffect(() => {
    if (!accountId || !accessToken || !game) return;
    console.log("🚀 FETCH EFFECT RUNNING");
    setLoadingTrophies(true);
/**
 * Fetch per-game trophy details.
 * NOTE: Kept local to this screen (route-specific data).
 * May move to a dedicated data layer later if reused.
 */
    fetch(
      `${PROXY_BASE_URL}/api/trophies/${accountId}/${game.npCommunicationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        console.log("✅ GAME TROPHIES RESPONSE", data);
        setGameTrophies(data.trophies ?? []);
      })
      .catch((e) => console.log("❌ FETCH FAILED", e))
      .finally(() => setLoadingTrophies(false));
  }, [accountId, accessToken, trophies, game]);

  // ⛔ EARLY RETURNS ONLY AFTER HOOKS
  if (!id) {
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
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }} contentContainerStyle={{ padding: 16 }}>
      <Image
        source={{ uri: game.trophyTitleIconUrl }}
        style={{ width: 180, height: 180, borderRadius: 12, alignSelf: "center", marginBottom: 16 }}
      />

      <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
        {game.trophyTitleName}
      </Text>

      <Text style={{ color: "gold", textAlign: "center", marginBottom: 24 }}>
        {game.progress}% Complete
      </Text>

      <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
        Trophy List
      </Text>

      {loadingTrophies && <Text style={{ color: "#999" }}>Loading trophies…</Text>}

      {!loadingTrophies && gameTrophies.length === 0 && (
        <Text style={{ color: "#999" }}>No trophies found.</Text>
      )}

      {gameTrophies.map((trophy: any) => (
        <TrophyItemCard
          key={String(trophy.trophyId)}
          id={trophy.trophyId}
          name={trophy.trophyName}
          description={trophy.trophyDetail}
          icon={trophy.trophyIconUrl}
          type={trophy.trophyType}
          earned={!!trophy.earned}
          earnedAt={trophy.earnedDateTime ?? undefined}
        />
      ))}
    </ScrollView>
  );
}