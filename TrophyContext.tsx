import React, { createContext, useContext, useMemo, useState } from "react";

export type UserProfile = {
  onlineId: string;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;

type TrophyContextType = {
  trophies: any;
  setTrophies: (data: any) => void;

  accountId: string | null;
  setAccountId: (id: string | null) => void;

  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  user: UserProfile;
  setUser: (u: UserProfile) => void;
};

const TrophyContext = createContext<TrophyContextType>({
  trophies: null,
  setTrophies: () => {},

  accountId: null,
  setAccountId: () => {},

  accessToken: null,
  setAccessToken: () => {},

  user: null,
  setUser: () => {},
});

console.log("🧩 Provider instance loaded");

export const TrophyProvider = ({ children }: { children: React.ReactNode }) => {
  const [trophies, setTrophies] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);

  const value = useMemo(
    () => ({
      trophies,
      setTrophies,
      accountId,
      setAccountId,
      accessToken,
      setAccessToken,
      user,
      setUser,
    }),
    [trophies, accountId, accessToken, user]
  );

  console.log("🧩 Provider trophies updated:", trophies?.trophyTitles?.length);

  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
};

export const useTrophy = () => useContext(TrophyContext);