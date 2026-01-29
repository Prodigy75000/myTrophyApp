// utils/makeRecent.ts

// 1. Import 'RecentGame' type from the context file
import { RecentGame, useRecentGames } from "../../context/RecentGamesContext";

/**
 * Hook that provides a function to update the global "Recent Games" history.
 * Updates are done via Refs to avoid unnecessary re-renders.
 */
export function useMarkRecentGame() {
  const { recentGamesRef, latestGameRef } = useRecentGames();

  /**
   * Updates the global reference to the latest played game.
   * @param game - The game object to mark as active/recent.
   */
  // 2. Use 'RecentGame' type here instead of 'GameRef'
  return (game: RecentGame) => {
    // Safety check: Don't process invalid data
    if (!game || !game.npwr) {
      console.warn("⚠️ useMarkRecentGame: Attempted to mark invalid game as recent.");
      return;
    }

    // 1️⃣ Keep history (Map preserves insertion order)
    recentGamesRef.current.set(game.npwr, game);

    // 2️⃣ Mark authoritative "latest game"
    latestGameRef.current = game;

    if (__DEV__) {
      console.log(`🧭 Marked latest game: "${game.gameName}" [${game.npwr}]`);
    }
  };
}
