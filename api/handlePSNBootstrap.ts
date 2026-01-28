// api/handlePSNBootstrap.ts
import { PROXY_BASE_URL } from "../config/endpoints";

/**
 * Expected shape from backend.
 * Now supports optional refreshToken (User) vs no refreshToken (Guest).
 */
interface LoginResponse {
  accessToken: string;
  accountId: string;
  expiresIn: number; // 🟢 Critical for the new Auto-Refresh logic
  refreshToken?: string;
}

/**
 * 🟢 UPDATED DEPS:
 * We replaced individual setters with the robust 'handleLoginResponse' helper.
 */
type BootstrapDeps = {
  handleLoginResponse: (data: any) => Promise<void>; // Handles Storage + State
  setTrophies: (data: unknown) => void;
};

type BootstrapResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

export async function handlePSNBootstrap({
  handleLoginResponse,
  setTrophies,
}: BootstrapDeps): Promise<BootstrapResult> {
  try {
    // --------------------------------------------------
    // STEP 1: Backend Authentication
    // --------------------------------------------------
    console.log("🌍 [PSN Bootstrap] Initiating Guest Login...");
    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);

    if (!loginRes.ok) {
      throw new Error(`Guest Login failed with status: ${loginRes.status}`);
    }

    const loginData = (await loginRes.json()) as LoginResponse;

    // Validate critical fields
    if (!loginData.accessToken || !loginData.accountId) {
      throw new Error("Malformed bootstrap response: Missing token or account ID.");
    }

    console.log("✅ [PSN Bootstrap] Guest Auth Successful.");

    // --------------------------------------------------
    // STEP 2: Persist Session (The New Logic)
    // --------------------------------------------------
    // 🟢 This saves to AsyncStorage AND sets the "expiresAt" timer.
    // This treats Guest sessions as "First Class Citizens" so they persist on restart.
    await handleLoginResponse(loginData);

    // --------------------------------------------------
    // STEP 3: Fetch Trophies
    // --------------------------------------------------
    console.log("🏆 [PSN Bootstrap] Fetching initial trophy data...");

    const trophiesRes = await fetch(
      `${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Accept-Language": "en-US",
        },
      }
    );

    if (!trophiesRes.ok) {
      throw new Error(`Trophy fetch failed: ${trophiesRes.status}`);
    }

    const trophiesData = await trophiesRes.json();

    // --------------------------------------------------
    // STEP 4: Update UI Data
    // --------------------------------------------------
    setTrophies(trophiesData);

    return { success: true, data: trophiesData };
  } catch (error: any) {
    console.error("❌ [PSN Bootstrap] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bootstrap failed",
    };
  }
}
