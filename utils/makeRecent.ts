import { useRecentGames } from "../context/RecentGamesContext";
export function useMarkRecentGame() {
  const { recentGamesRef } = useRecentGames();

  return (game: { npwr: string; gameName: string; platform: string }) => {
    recentGamesRef.current.set(game.npwr, game);
  };
}
