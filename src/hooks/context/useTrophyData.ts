import { useCallback, useEffect, useState } from "react";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { TrophyData } from "../../types/ContextTypes";
import { calculateTotalTrophies } from "../../utils/trophyCalculations";
import { useTrophyWatchdog } from "../useTrophyWatchdog";

export function useTrophyData(accessToken: string | null, accountId: string | null) {
  const [trophies, setTrophies] = useState<TrophyData | null>(null);

  const refreshAllTrophies = useCallback(async () => {
    if (!accessToken || !accountId) return;
    try {
      console.log("♻️ [TrophyContext] Refreshing all trophies...");
      const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setTrophies(data);
    } catch (err) {
      console.error("❌ [TrophyContext] Full refresh failed", err);
    }
  }, [accessToken, accountId]);

  const refreshSingleGame = useCallback(
    async (npwr: string) => {
      if (!accessToken || !accountId) return;
      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/trophies/${accountId}/${npwr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const gameData = await res.json();

        // Update local state without full refresh
        setTrophies((prev) => {
          if (!prev || !Array.isArray(prev.trophyTitles)) return prev;
          const trophyList = gameData.trophies || [];
          const earned = trophyList.filter((t: any) => t.earned).length;
          const total = trophyList.length;
          const progress = total > 0 ? Math.floor((earned / total) * 100) : 0;

          return {
            ...prev,
            trophyTitles: prev.trophyTitles.map((t) =>
              String(t.npCommunicationId) === String(npwr)
                ? { ...t, trophies: gameData.trophies, progress }
                : t
            ),
          };
        });
      } catch (err) {
        console.error("❌ [TrophyContext] Game refresh failed", err);
      }
    },
    [accessToken, accountId]
  );

  // Watchdog integration
  const watchdog = useTrophyWatchdog({
    accessToken,
    accountId,
    isReady: !!trophies,
    onNewTrophyDetected: refreshAllTrophies,
  });

  useEffect(() => {
    if (trophies?.trophyTitles) {
      const total = calculateTotalTrophies(trophies.trophyTitles);
      watchdog.updateBaseline(total);
    }
  }, [trophies, watchdog]);

  return { trophies, setTrophies, refreshAllTrophies, refreshSingleGame };
}
