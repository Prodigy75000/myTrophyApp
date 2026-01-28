// hooks/game-details/useGameFetcher.ts
import { useEffect, useState } from "react";
import { PROXY_BASE_URL } from "../../config/endpoints";
import { useTrophy } from "../../providers/TrophyContext";
import { useMarkRecentGame } from "../../utils/makeRecent";
import { GameTrophy, TrophyGroup, UnifiedGame } from "./types";

export function useGameFetcher(gameId: string, gameObject: UnifiedGame | null) {
  const { accessToken, accountId } = useTrophy();
  const markRecentGame = useMarkRecentGame();

  const [localTrophies, setLocalTrophies] = useState<GameTrophy[]>([]);
  const [trophyGroups, setTrophyGroups] = useState<TrophyGroup[]>([]);
  const [fetchedId, setFetchedId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Mark Recent
  useEffect(() => {
    if (gameObject && gameObject.source === "USER") {
      markRecentGame({
        npwr: String(gameObject.npCommunicationId),
        gameName: gameObject.trophyTitleName,
        platform: gameObject.trophyTitlePlatform,
      });
    }
  }, [gameObject?.npCommunicationId, gameObject?.source]);

  // Fetch Logic
  useEffect(() => {
    setIsInitialLoading(true);

    if (!gameObject) return;

    // A. Master Data (No Fetch Needed)
    if (gameObject.source === "MASTER") {
      setIsInitialLoading(false);
      return;
    }

    // B. User Data - Cached (No Fetch Needed)
    if (
      gameObject.source === "USER" &&
      gameObject.trophyList &&
      gameObject.trophyList.length > 0
    ) {
      setIsInitialLoading(false);
      return;
    }

    // C. User Data - Needs Fetch
    if (!accountId || !accessToken) return;

    const controller = new AbortController();
    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `${PROXY_BASE_URL}/api/trophies/${accountId}/${gameId}` +
            `?gameName=${encodeURIComponent(gameObject.trophyTitleName)}` +
            `&platform=${encodeURIComponent(gameObject.trophyTitlePlatform)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        const data = await res.json();
        if (!controller.signal.aborted) {
          setLocalTrophies(data.trophies ?? []);
          setTrophyGroups(data.groups ?? []);
          setFetchedId(gameId);
        }
      } catch (e) {
        console.warn("Game details fetch failed", e);
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      }
    };

    fetchDetails();
    return () => {
      controller.abort();
    };
  }, [accountId, accessToken, gameId, gameObject]);

  return { localTrophies, trophyGroups, fetchedId, isInitialLoading };
}
