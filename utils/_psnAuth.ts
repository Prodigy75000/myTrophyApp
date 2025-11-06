// app/utils/psnAuth.ts
import { Alert } from "react-native";

export async function handlePSNLogin(PROXY_BASE_URL: string) {
  try {
    console.log("🔑 Connecting to PSN...");
    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);
    const loginData = await loginRes.json();

    if (!loginData.accessToken) throw new Error("No access token received");

    const trophiesRes = await fetch(
      `${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Accept-Language": "en-US",
        },
      }
    );

    const trophiesData = await trophiesRes.json();
    Alert.alert("PSN login success!", "Trophies fetched!");
    return { success: true, data: trophiesData };
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    Alert.alert("Login failed", err.message);
    return { success: false, error: err.message };
  }
}