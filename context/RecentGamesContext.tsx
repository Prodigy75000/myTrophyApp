// context/RecentGamesContext.tsx
import React, { createContext, useContext, useRef } from "react";

/**
 * Definition of a lightweight game reference.
 * We export this so other hooks (like useMarkRecentGame) can use the same shape.
 */
export type RecentGame = {
  npwr: string; // Unique Communication ID from PSN
  gameName: string;
  platform: string;
};

type RecentGamesContextType = {
  /**
   * Stores the history of games played in this session.
   * We use a Map to ensure uniqueness (no duplicate games in the list).
   */
  recentGamesRef: React.MutableRefObject<Map<string, RecentGame>>;

  /**
   * Tracks the absolute last game interacted with.
   */
  latestGameRef: React.MutableRefObject<RecentGame | null>;
};

const RecentGamesContext = createContext<RecentGamesContextType | null>(null);

export const RecentGamesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // NOTE: We use useRef here instead of useState.
  // This means updating these values will NOT trigger a re-render of the app.
  // This is excellent for performance (logging history silently), but if you need
  // the UI to update immediately when a game is added, you might need useState later.
  const recentGamesRef = useRef<Map<string, RecentGame>>(new Map());
  const latestGameRef = useRef<RecentGame | null>(null);

  return (
    <RecentGamesContext.Provider value={{ recentGamesRef, latestGameRef }}>
      {children}
    </RecentGamesContext.Provider>
  );
};

/**
 * Hook to consume the Recent Games data.
 * Throws an error if used outside the Provider to fail fast during development.
 */
export const useRecentGames = () => {
  const ctx = useContext(RecentGamesContext);
  if (!ctx) {
    throw new Error("useRecentGames must be used within a RecentGamesProvider");
  }
  return ctx;
};
