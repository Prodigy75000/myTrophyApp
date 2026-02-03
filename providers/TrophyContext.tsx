import React, { createContext, useContext, useMemo } from "react";
import { usePsnAuth } from "../src/hooks/context/usePsnAuth";
import { useTrophyData } from "../src/hooks/context/useTrophyData";
import { useXboxLogic } from "../src/hooks/context/useXboxLogic";
import { TrophyContextType } from "../src/types/ContextTypes";

const TrophyContext = createContext<TrophyContextType | null>(null);

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Initialize Hooks
  const psn = usePsnAuth();
  const xbox = useXboxLogic();

  // 2. Data Hook depends on PSN Auth
  const data = useTrophyData(psn.accessToken, psn.accountId);

  // 3. Combine Wrapper for Logout (Clear everything)
  const handleLogout = async () => {
    await psn.logout();
    data.setTrophies(null);
    xbox.setXboxTitles([]);
    xbox.setXboxProfile(null);
  };

  // 4. Create Value Object
  const value = useMemo(
    () => ({
      ...psn, // accountId, accessToken, user, handleLoginResponse
      ...xbox, // xboxTitles, xboxProfile, handleXboxLogin, fetchXboxGames
      ...data, // trophies, refreshAllTrophies, refreshSingleGame
      logout: handleLogout, // Override logout to clear all states
    }),
    [psn, xbox, data]
  );

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => {
  const ctx = useContext(TrophyContext);
  if (!ctx) throw new Error("useTrophy must be used within TrophyProvider");
  return ctx;
};
