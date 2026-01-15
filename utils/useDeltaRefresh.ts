import { useEffect, useRef } from "react";
import { PROXY_BASE_URL } from "../config/endpoints";
import { useRecentGames } from "../context/RecentGamesContext";

export function useDeltaRefresh({
  accessToken,
  accountId,
  onResults,
}: {
  accessToken: string | null;
  accountId: string | null;
  onResults: (games: any[]) => void;
}) {
  const { recentGamesRef } = useRecentGames();
  const inFlightRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (inFlightRef.current) return;

      const games = Array.from(recentGamesRef.current.values());
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
    }, 60_000); // 60s

    return () => clearInterval(interval);
  }, [accessToken, accountId]);
}
