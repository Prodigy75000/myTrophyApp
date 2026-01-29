// src/hooks/game-details/types.ts

// 1. Xbox Types
export interface XboxTitle {
  titleId: string;
  name: string;
  displayImage: string;
  devices: string[];
  achievement: {
    currentAchievements: number;
    totalAchievements: number;
    currentGamerscore: number;
    totalGamerscore: number;
    progressPercentage: number;
  };
  lastUnlock: string;
}

// 2. Master DB Types
export interface MasterGameEntry {
  canonicalId: string;
  displayName: string;
  iconUrl?: string;
  art?: {
    hero?: string;
    store?: string;
    [key: string]: string | undefined;
  };
  linkedVersions?: {
    platform: string;
    npCommunicationId?: string;
    titleId?: string;
    region?: string;
  }[];
  tags?: string[];
}

// 3. Trophy Data Types
export interface GameTrophy {
  trophyId: number;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyType: string;
  earned: boolean;
  earnedDateTime?: string;
  trophyEarnedRate?: string;
  trophyProgressValue?: number;
  trophyProgressTargetValue?: number;
}

export interface TrophyGroup {
  trophyGroupId: string;
  trophyGroupName: string;
  trophyGroupIconUrl: string;
  trophyIds: number[];
}

// 🟢 4. EXPORTED HELPER TYPES (Fixes useTrophyFilter errors)
export interface GameCounts {
  total: number;
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  earnedBronze: number;
  earnedSilver: number;
  earnedGold: number;
  earnedPlatinum: number;
  earned?: number; // Gamerscore
}

export interface GameVersion {
  id: string;
  platform: string;
  region?: string;
  progress: number;
  lastPlayed?: string | null;
  counts: GameCounts;
  isOwned: boolean;
}

// 🟢 5. THE UNIFIED GAME TYPE (Fixes [id].tsx errors)
// This matches what useGameDetails returns and what your UI expects.
export interface UnifiedGame {
  source: "USER" | "MASTER" | "XBOX";
  id: string; // Generic ID (NPWR or TitleID)

  // Display Info
  trophyTitleName: string;
  trophyTitlePlatform: string;
  trophyTitleIconUrl?: string;

  // Data Lists
  trophyList?: GameTrophy[];

  // PSN Specifics (Optional but accessed by UI)
  npCommunicationId?: string;
  definedTrophies?: { bronze: number; silver: number; gold: number; platinum: number };
  earnedTrophies?: { bronze: number; silver: number; gold: number; platinum: number };

  // Shared
  progress: number;

  // Xbox Specifics (Optional)
  originalXbox?: XboxTitle;
  masterData?: MasterGameEntry;
}
