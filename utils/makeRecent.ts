import { useRecentGames } from "../context/RecentGamesContext";

type GameRef = {
  npwr: string;
  gameName: string;
  platform: string;
};

export function useMarkRecentGame() {
  const { recentGamesRef, latestGameRef } = useRecentGames();

  return (game: GameRef) => {
    // 1️⃣ Keep history (for UI, analytics, future features)
    recentGamesRef.current.set(game.npwr, game);

    // 2️⃣ Mark authoritative "latest game"
    latestGameRef.current = game;

    if (__DEV__) {
      console.log("🧭 Marked latest game:", game.npwr);
    }
  };
}
