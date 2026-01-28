// hooks/game-details/types.ts
export type UnifiedGame = {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string;
  progress: number;
  earnedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  definedTrophies: { bronze: number; silver: number; gold: number; platinum: number };
  lastUpdatedDateTime: string | null;
  source: "USER" | "MASTER";
  trophyList?: any[];
  rawTrophyList?: any[];
};

export type GameTrophy = {
  trophyId: number;
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyType: string;
  earned?: boolean;
  earnedDateTime?: string | null;
  trophyEarnedRate?: string;
  trophyProgressTargetValue?: string;
  trophyProgressValue?: string;
  trophyGroupId?: string;
  trophyHidden?: boolean;
};

export type TrophyGroup = {
  trophyGroupId: string;
  trophyGroupName: string;
  trophyGroupIconUrl?: string;
};
