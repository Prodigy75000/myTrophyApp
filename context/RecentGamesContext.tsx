import React, { createContext, useContext, useRef } from "react";

type RecentGame = {
  npwr: string;
  gameName: string;
  platform: string;
};

type RecentGamesContextType = {
  recentGamesRef: React.MutableRefObject<Map<string, RecentGame>>;
  latestGameRef: React.MutableRefObject<RecentGame | null>;
};

const RecentGamesContext = createContext<RecentGamesContextType | null>(null);

export const RecentGamesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const recentGamesRef = useRef<Map<string, RecentGame>>(new Map());
  const latestGameRef = useRef<RecentGame | null>(null);

  return (
    <RecentGamesContext.Provider value={{ recentGamesRef, latestGameRef }}>
      {children}
    </RecentGamesContext.Provider>
  );
};

export const useRecentGames = () => {
  const ctx = useContext(RecentGamesContext);
  if (!ctx) {
    throw new Error("useRecentGames must be used within RecentGamesProvider");
  }
  return ctx;
};
