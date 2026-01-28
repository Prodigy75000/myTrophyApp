// utils/trophyCalculations.ts

export const calculateTotalTrophies = (trophyTitles: any[]) => {
  if (!trophyTitles) return 0;
  return trophyTitles.reduce((acc, t) => {
    if (!t.earnedTrophies) return acc;
    return (
      acc +
      (t.earnedTrophies.bronze || 0) +
      (t.earnedTrophies.silver || 0) +
      (t.earnedTrophies.gold || 0) +
      (t.earnedTrophies.platinum || 0)
    );
  }, 0);
};

export const calculateUserStats = (trophyTitles: any[]) => {
  if (!trophyTitles) return { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 };

  return trophyTitles.reduce(
    (acc, game) => {
      const earned = game.earnedTrophies || {};
      acc.bronze += earned.bronze || 0;
      acc.silver += earned.silver || 0;
      acc.gold += earned.gold || 0;
      acc.platinum += earned.platinum || 0;
      acc.total +=
        (earned.bronze || 0) +
        (earned.silver || 0) +
        (earned.gold || 0) +
        (earned.platinum || 0);
      return acc;
    },
    { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0 }
  );
};
