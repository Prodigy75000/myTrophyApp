import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useRecentGames } from "../context/RecentGamesContext";

function getLastUpdatedGame(trophyTitles: any[]) {
  return trophyTitles
    .filter((t) => t.lastUpdatedDateTime)
    .sort(
      (a, b) =>
        new Date(b.lastUpdatedDateTime).getTime() -
        new Date(a.lastUpdatedDateTime).getTime()
    )[0];
}

export function useDeltaRefresh({
  accessToken,
  accountId,
  trophyTitles,
  onResults,
}: {
  accessToken: string | null;
  accountId: string | null;
  trophyTitles: any[] | null;
  onResults: (games: any[]) => void;
}) {
  const { recentGamesRef } = useRecentGames();
  const inFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (!accessToken || !accountId) return;
    const performDeltaRefresh = async () => {
      if (inFlightRef.current) return;
      if (!accessToken || !accountId) return;

      const recentGames = Array.from(recentGamesRef.current.values());

      const tier1Game =
        trophyTitles && trophyTitles.length > 0 ? getLastUpdatedGame(trophyTitles) : null;

      const gamesToRefreshMap = new Map<string, any>();

      // Tier-1 (mandatory)
      if (tier1Game) {
        gamesToRefreshMap.set(tier1Game.npCommunicationId, {
          npwr: tier1Game.npCommunicationId,
          gameName: tier1Game.trophyTitleName,
          platform: tier1Game.trophyTitlePlatform,
        });
      }

      // Tier-2 (recently opened, capped)
      for (const g of recentGames) {
        if (gamesToRefreshMap.size >= 3) break;
        gamesToRefreshMap.set(g.npwr, g);
      }

      const games = Array.from(gamesToRefreshMap.values());
      if (games.length === 0) return;

      inFlightRef.current = true;

      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/trophies/refresh`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            games,
          }),
        });

        const json = await res.json();
        onResults(json.games);
      } catch (e) {
        console.warn("Delta refresh failed", e);
      } finally {
        inFlightRef.current = false;
      }
    };
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = appStateRef.current;

      if (prevState.match(/inactive|background/) && nextState === "active") {
        console.log("🔁 App resumed → immediate Tier-1 refresh");
        performDeltaRefresh();
      }

      appStateRef.current = nextState;
    });

    const interval = setInterval(performDeltaRefresh, 60_000);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken, accountId, trophyTitles]);
}
