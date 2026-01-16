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
  const { latestGameRef } = useRecentGames();
  const inFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastEarnedRef = useRef<Map<string, number | null>>(new Map());
  useEffect(() => {
    if (!accessToken || !accountId) return;
    const performDeltaRefresh = async () => {
      if (inFlightRef.current) return;
      if (!accessToken || !accountId) return;

      const latest = latestGameRef.current;
      if (!latest) return;

      const games = [
        {
          npwr: latest.npwr,
          gameName: latest.gameName,
          platform: latest.platform,
        },
      ];

      console.log(
        "🔎 Delta refresh games:",
        games.map((g) => g.npwr)
      );

      if (games.length === 0) return;

      inFlightRef.current = true;

      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/trophies/refresh`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId, games }),
        });

        const json = await res.json();

        const meaningfulChanges = json.games.filter((g: any) => {
          const npwr = g.npwr;
          const earned =
            typeof g.trophies?.earned === "number" ? g.trophies.earned : null;

          const prevEarned = lastEarnedRef.current.get(npwr) ?? null;

          // ignore unhydrated → unhydrated
          if (earned === null && prevEarned === null) return false;

          // ignore hydration-only
          if (prevEarned === null && earned !== null) {
            lastEarnedRef.current.set(npwr, earned);
            return false;
          }

          // real delta
          if (earned !== prevEarned) {
            lastEarnedRef.current.set(npwr, earned);
            return true;
          }

          return false;
        });

        if (meaningfulChanges.length > 0) {
          onResults(meaningfulChanges);
        }
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
