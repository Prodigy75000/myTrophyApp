// api/handleXBOXBootstrap.ts
import { XboxTitle } from "../src/types/XboxTypes";

const MOCK_XBOX_GAMES: XboxTitle[] = [
  // 1. ELDEN RING (Overlap Test)
  // If you have this on PSN, they should merge into one card.
  {
    titleId: "123456",
    name: "Elden Ring",
    displayImage:
      "https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png",
    devices: ["SeriesX"],
    achievement: {
      currentAchievements: 38,
      totalAchievements: 42,
      currentGamerscore: 850,
      totalGamerscore: 1000,
      progressPercentage: 85,
    },
    lastUnlock: "2024-02-10T12:00:00Z",
  },
  // 2. HALO INFINITE (Exclusive - 100% Completed)
  {
    titleId: "987654",
    name: "Halo Infinite",
    displayImage:
      "https://store-images.s-microsoft.com/image/apps.50670.13727851868390641.c9cc5f66-aff8-406c-af6b-440838730be0.d205e025-bd06-4e64-96e9-6d8494799f2c",
    devices: ["SeriesX", "PC"],
    achievement: {
      currentAchievements: 119,
      totalAchievements: 119,
      currentGamerscore: 2000,
      totalGamerscore: 2000,
      progressPercentage: 100, // 🟢 This should visually act like a Platinum
    },
    lastUnlock: "2023-12-25T10:30:00Z",
  },
  // 3. SEA OF THIEVES (Huge Gamerscore)
  {
    titleId: "555888",
    name: "Sea of Thieves",
    displayImage:
      "https://store-images.s-microsoft.com/image/apps.17647.13510798887560396.9da3690d-7730-4e3d-8b02-763b069d300e.973400a4-3729-4d6b-967b-23f2b43b9c6b",
    devices: ["XboxOne", "SeriesX"],
    achievement: {
      currentAchievements: 150,
      totalAchievements: 400,
      currentGamerscore: 2500,
      totalGamerscore: 5000,
      progressPercentage: 50,
    },
    lastUnlock: "2024-03-01T20:15:00Z",
  },
  // 4. CELESTE (Indie 100%)
  {
    titleId: "777111",
    name: "Celeste",
    displayImage:
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Celeste_box_art.png",
    devices: ["XboxOne"],
    achievement: {
      currentAchievements: 30,
      totalAchievements: 30,
      currentGamerscore: 1000,
      totalGamerscore: 1000,
      progressPercentage: 100, // 🟢 Another pseudo-Platinum
    },
    lastUnlock: "2022-06-15T14:00:00Z",
  },
];

type BootstrapDeps = {
  setXboxTitles: (data: XboxTitle[]) => void;
  setXboxProfile: (data: any) => void;
};

export async function handleXboxBootstrap({
  setXboxTitles,
  setXboxProfile,
}: BootstrapDeps) {
  try {
    console.log("🟢 [Xbox Bootstrap] Injecting Rich Data...");

    // Simulate Auth
    const mockProfile = {
      xuid: "x123",
      gamertag: "Spartan-117",
      gamerpic: "https://avatar-ssl.xboxlive.com/global/t.4354/avatar.png",
    };

    // Set Data
    setXboxProfile(mockProfile);
    setXboxTitles(MOCK_XBOX_GAMES);

    console.log(`✅ [Xbox Bootstrap] Loaded ${MOCK_XBOX_GAMES.length} titles.`);
    return { success: true };
  } catch (error) {
    console.error("❌ Xbox Bootstrap failed:", error);
    return { success: false };
  }
}
