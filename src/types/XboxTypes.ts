export interface XboxTitle {
  titleId: string; // The unique ID
  name: string;
  displayImage: string; // Box Art URL
  devices: string[]; // ["XboxOne", "SeriesX"]
  achievement: {
    currentAchievements: number;
    totalAchievements: number;
    currentGamerscore: number;
    totalGamerscore: number;
    progressPercentage: number;
  };
  lastUnlock: string; // ISO Date String
}

export interface XboxProfile {
  xuid: string;
  gamertag: string;
  gamerpic: string;
}
