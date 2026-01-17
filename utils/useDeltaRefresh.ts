import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useRecentGames } from "../context/RecentGamesContext";

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

  // 1. Keep a ref of the current titles so we don't need it in the useEffect deps
  const currentTitlesRef = useRef(trophyTitles);

  // 2. The map to track values
  const lastEarnedRef = useRef<Map<string, number | null>>(new Map());

  // 3. Sync Refs whenever props change
  useEffect(() => {
    currentTitlesRef.current = trophyTitles;

    // If we have titles but our Map is empty, initialize it to avoid false positives
    if (trophyTitles && trophyTitles.length > 0 && lastEarnedRef.current.size === 0) {
      trophyTitles.forEach((t) => {
        // Calculate total earned for this title to seed the cache
        const total = t.earnedTrophies
          ? t.earnedTrophies.bronze +
            t.earnedTrophies.silver +
            t.earnedTrophies.gold +
            t.earnedTrophies.platinum
          : 0;
        lastEarnedRef.current.set(String(t.npCommunicationId), total);
      });
      console.log("💧 Delta Cache Hydrated from Context");
    }
  }, [trophyTitles]);

  useEffect(() => {
    if (!accessToken || !accountId) return;

    const performDeltaRefresh = async () => {
      if (inFlightRef.current) return;

      // Use the Ref for the latest game to avoid stale closures
      const latest = latestGameRef.current;
      if (!latest) return;

      const games = [
        {
          npwr: latest.npwr,
          gameName: latest.gameName,
          platform: latest.platform,
        },
      ];

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
          const npwr = String(g.npwr);
          const earned =
            typeof g.trophies?.earned === "number" ? g.trophies.earned : null;

          const prevEarned = lastEarnedRef.current.get(npwr) ?? null;

          // 4. LOGIC FIX: If we have a new value and it's different, it's a change.
          // We removed the "ignore hydration" block.
          if (earned !== null && earned !== prevEarned) {
            console.log(`📈 Change detected for ${npwr}: ${prevEarned} -> ${earned}`);
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
    // 5. REMOVED trophyTitles from dependency array to keep interval stable
  }, [accessToken, accountId]);
}
