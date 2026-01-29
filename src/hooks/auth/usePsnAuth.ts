import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { handlePSNBootstrap } from "../../../api/handlePSNBootstrap";
import { PROXY_BASE_URL } from "../../../config/endpoints";
import { useTrophy } from "../../../providers/TrophyContext";

export function usePsnAuth() {
  const { handleLoginResponse, setTrophies } = useTrophy();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Guest Mode
  const loginGuest = useCallback(async () => {
    await handlePSNBootstrap({ handleLoginResponse, setTrophies });
  }, [handleLoginResponse, setTrophies]);

  // Real Login
  const onLoginSuccess = async (npsso: string) => {
    try {
      setShowLoginModal(false);
      const response = await fetch(`${PROXY_BASE_URL}/api/auth/npsso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsso }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Exchange failed");
      await handleLoginResponse(data);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return {
    showLoginModal,
    setShowLoginModal,
    loginGuest,
    onLoginSuccess,
  };
}
