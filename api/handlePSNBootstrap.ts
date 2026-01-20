// api/handlePSNBootstrap.ts
import { PROXY_BASE_URL } from "../config/endpoints";

/**
 * Expected shape of the login response from the backend.
 */
interface LoginResponse {
  accessToken: string;
  accountId: string;
  expiresIn?: number;
}

/**
 * Dependencies injected to keep this function pure and testable.
 * Using generic 'unknown' for trophies data until the shape is strictly defined.
 */
type BootstrapDeps = {
  setAccessToken: (token: string) => void;
  setAccountId: (id: string) => void;
  setTrophies: (data: unknown) => void;
};

/**
 * Return type to let the caller handle UI feedback (Alerts, Toasts, etc.)
 */
type BootstrapResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

/**
 * Handles the full PSN bootstrap flow:
 * 1. Authenticate with backend
 * 2. Fetch initial trophy data
 * 3. Update application state
 *
 * @returns A promise resolving to the operation result.
 */
export async function handlePSNBootstrap({
  setAccessToken,
  setAccountId,
  setTrophies,
}: BootstrapDeps): Promise<BootstrapResult> {
  try {
    // --------------------------------------------------
    // STEP 1: Backend Authentication
    // --------------------------------------------------
    console.log("🔐 [PSN Bootstrap] Initiating login...");
    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);

    if (!loginRes.ok) {
      throw new Error(`Login failed with status: ${loginRes.status}`);
    }

    const loginData = (await loginRes.json()) as LoginResponse;

    // Validate critical fields before proceeding
    if (!loginData.accessToken || !loginData.accountId) {
      throw new Error("Malformed login response: Missing token or account ID.");
    }

    console.log("✅ [PSN Bootstrap] Login successful.");

    // --------------------------------------------------
    // STEP 2: Fetch Trophies
    // --------------------------------------------------
    console.log("🏆 [PSN Bootstrap] Fetching trophy data...");
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
      throw new Error(`Trophy fetch failed with status: ${trophiesRes.status}`);
    }

    const trophiesData = await trophiesRes.json();

    // --------------------------------------------------
    // STEP 3: State Hydration
    // --------------------------------------------------
    setAccessToken(loginData.accessToken);
    setAccountId(loginData.accountId);
    setTrophies(trophiesData);

    return { success: true, data: trophiesData };
  } catch (error: any) {
    console.error("❌ [PSN Bootstrap] Error:", error);

    // Return the error so the UI can decide whether to Alert or show a message
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
