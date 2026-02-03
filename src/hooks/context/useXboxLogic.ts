import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { XboxProfile, XboxTitle } from "../../types/XboxTypes";

const KEY_XBOX_XSTS = "xbox_xsts_token";
const KEY_XBOX_HASH = "xbox_user_hash";
const KEY_XBOX_XUID = "xbox_xuid";
const KEY_XBOX_GT = "xbox_gamertag";
const KEY_XBOX_PIC = "xbox_gamerpic";

export function useXboxLogic() {
  const [xboxTitles, setXboxTitles] = useState<XboxTitle[]>([]);
  const [xboxProfile, setXboxProfile] = useState<XboxProfile | null>(null);
  const [xboxTokens, setXboxTokens] = useState<{ xsts: string; hash: string } | null>(
    null
  );

  // 1. SAVE SESSION
  const handleXboxLogin = useCallback(async (data: any) => {
    setXboxProfile({
      gamertag: data.gamertag,
      gamerpic: data.gamerpic,
      xuid: data.xuid,
    });
    setXboxTokens({ xsts: data.xstsToken, hash: data.userHash });

    await AsyncStorage.multiSet([
      [KEY_XBOX_GT, data.gamertag],
      [KEY_XBOX_PIC, data.gamerpic],
      [KEY_XBOX_XUID, data.xuid],
      [KEY_XBOX_XSTS, data.xstsToken],
      [KEY_XBOX_HASH, data.userHash],
    ]);
  }, []);

  // 2. FETCH GAMES
  const fetchXboxGames = useCallback(
    async (overrides?: { xuid: string; xsts: string; hash: string }) => {
      const targetXuid = overrides?.xuid || xboxProfile?.xuid;
      const targetXsts = overrides?.xsts || xboxTokens?.xsts;
      const targetHash = overrides?.hash || xboxTokens?.hash;

      if (!targetXuid || !targetXsts || !targetHash) {
        console.log("⚠️ Xbox Fetch Aborted: Missing Credentials");
        return;
      }

      try {
        console.log(`🟢 Fetching Xbox Games for ${targetXuid}...`);
        const res = await fetch(`${PROXY_BASE_URL}/xbox/titles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            xuid: targetXuid,
            xstsToken: targetXsts,
            userHash: targetHash,
          }),
        });

        const data = await res.json();
        console.log(`✅ Xbox Games Fetched: ${data.titles?.length || 0} titles`);

        // If the API returns titles, we can save them to state here
        if (data.titles) setXboxTitles(data.titles);
      } catch (e) {
        console.error("Xbox Fetch Error:", e);
      }
    },
    [xboxProfile, xboxTokens]
  );

  // 3. RESTORE SESSION
  useEffect(() => {
    const loadSession = async () => {
      try {
        const values = await AsyncStorage.multiGet([
          KEY_XBOX_GT,
          KEY_XBOX_PIC,
          KEY_XBOX_XUID,
          KEY_XBOX_XSTS,
          KEY_XBOX_HASH,
        ]);

        const [gt, pic, xuid, xsts, hash] = values.map((v) => v[1]);

        if (gt && xuid && xsts && hash) {
          console.log("✅ Xbox Session Restored:", gt);
          setXboxProfile({ gamertag: gt, gamerpic: pic || "", xuid });
          setXboxTokens({ xsts, hash });
        }
      } catch (e) {
        console.error("Failed to load Xbox session", e);
      }
    };
    loadSession();
  }, []);

  return {
    xboxTitles,
    setXboxTitles,
    xboxProfile,
    setXboxProfile,
    handleXboxLogin,
    fetchXboxGames,
  };
}
