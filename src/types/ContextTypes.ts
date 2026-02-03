import { XboxProfile, XboxTitle } from "./XboxTypes";

export type UserProfile = {
  onlineId: string | null;
  avatarUrl?: string | null;
  trophyLevel?: number | null;
  progress?: number | null;
} | null;

export type TrophyData = {
  trophyTitles: {
    npCommunicationId: string;
    trophyTitleName: string;
    earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
    [key: string]: any;
  }[];
  [key: string]: any;
};

export type TrophyContextType = {
  // PSN State
  trophies: TrophyData | null;
  setTrophies: (data: any) => void;
  refreshAllTrophies: () => Promise<void>;
  refreshSingleGame: (npwr: string) => Promise<void>;
  accountId: string | null;
  setAccountId: (id: string | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  logout: () => Promise<void>;
  handleLoginResponse: (data: any) => Promise<void>;

  // Xbox State
  xboxTitles: XboxTitle[];
  setXboxTitles: (titles: XboxTitle[]) => void;
  xboxProfile: XboxProfile | null;
  setXboxProfile: (profile: XboxProfile | null) => void;
  handleXboxLogin: (data: any) => Promise<void>;
  fetchXboxGames: (overrides?: {
    xuid: string;
    xsts: string;
    hash: string;
  }) => Promise<void>;
};
