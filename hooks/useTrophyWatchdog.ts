// hooks/useTrophyWatchdog.ts
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { PROXY_BASE_URL } from "../config/endpoints";

type WatchdogProps = {
  accessToken: string | null;
  accountId: string | null;
  onNewTrophyDetected: () => void;
};

/**
 * Polls the backend every 30s to check if the total trophy count has changed.
 * If changed, it triggers a refresh callback.
 */
export function useTrophyWatchdog({
  accessToken,
  accountId,
  onNewTrophyDetected,
}: WatchdogProps) {
  const lastTotalTrophiesRef = useRef<number>(-1);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!accessToken || !accountId) return;

    const checkTrophyCount = async () => {
      try {
        // Lightweight fetch just to check numbers
        const res = await fetch(`${PROXY_BASE_URL}/api/user/summary/${accountId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (data.earnedTrophies) {
          const newTotal =
            data.earnedTrophies.bronze +
            data.earnedTrophies.silver +
            data.earnedTrophies.gold +
            data.earnedTrophies.platinum;

          const oldTotal = lastTotalTrophiesRef.current;

          // Initialize baseline on first run
          if (oldTotal === -1) {
            lastTotalTrophiesRef.current = newTotal;
            return;
          }

          // 🚨 CHANGE DETECTED
          if (newTotal > oldTotal) {
            console.log(`🏆 [Watchdog] Change detected: ${oldTotal} -> ${newTotal}`);
            lastTotalTrophiesRef.current = newTotal;
            onNewTrophyDetected();
          }
        }
      } catch (e) {
        // Silent fail expected on network glitches
        // console.warn("[Watchdog] Poll failed", e);
      }
    };

    // 1. Run immediately
    checkTrophyCount();

    // 2. Poll every 30 seconds
    const interval = setInterval(checkTrophyCount, 30000);

    // 3. Check immediately when App comes to foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        console.log("📱 [Watchdog] App resumed, checking...");
        checkTrophyCount();
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken, accountId, onNewTrophyDetected]);

  // Expose a helper to manually update the baseline if we know we just fetched data
  const updateBaseline = (total: number) => {
    lastTotalTrophiesRef.current = total;
  };

  return { updateBaseline };
}
