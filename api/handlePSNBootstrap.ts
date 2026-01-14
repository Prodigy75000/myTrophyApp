// app/utils/handlePSNBootstrap.ts

/**
 * PSN Bootstrap Helper (TEMPORARY)
 * ---------------------------------------------------
 * Purpose:
 * - Perform initial authentication against the backend
 * - Retrieve a valid PSN access token + accountId
 * - Fetch the user's initial trophy payload
 *
 * Scope & Limitations:
 * - This is NOT a reusable auth layer
 * - This is NOT meant for token refresh
 * - This is a one-shot bootstrap used at app start
 *
 * Future:
 * - Will eventually be replaced by a proper Auth / Session manager
 */

import { Alert } from "react-native";
import { PROXY_BASE_URL } from "../config/endpoints";

/**
 * Dependencies injected from React state
 * (keeps this helper UI-agnostic and testable)
 */
type BootstrapDeps = {
  setAccessToken: (token: string) => void;
  setAccountId: (id: string) => void;
  setTrophies: (data: any) => void;
};

/**
 * Handles the full PSN bootstrap flow:
 * 1. Call backend login endpoint
 * 2. Validate access token + accountId
 * 3. Fetch trophies for the authenticated account
 * 4. Hydrate app state
 */
export async function handlePSNBootstrap({
  setAccessToken,
  setAccountId,
  setTrophies,
}: BootstrapDeps) {
  try {
    // --------------------------------------------------
    // STEP 1 — Backend login
    // --------------------------------------------------
    console.log("[PSN bootstrap] Connecting to backend");

    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);

    console.log("🔎 login status:", loginRes.status);

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login HTTP ${loginRes.status}: ${text}`);
    }

    const loginData = await loginRes.json();

    // Defensive validation: never trust backend blindly
    if (!loginData.accessToken || !loginData.accountId) {
      throw new Error("Invalid login payload");
    }

    console.log("✅ Access token received");

    // --------------------------------------------------
    // STEP 2 — Fetch trophies for this account
    // --------------------------------------------------
    const trophiesRes = await fetch(
      `${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Accept-Language": "en-US",
        },
      }
    );

    console.log("🔎 trophies status:", trophiesRes.status);

    if (!trophiesRes.ok) {
      const text = await trophiesRes.text();
      throw new Error(`Trophies HTTP ${trophiesRes.status}: ${text}`);
    }

    const trophiesData = await trophiesRes.json();

    // --------------------------------------------------
    // STEP 3 — Hydrate application state
    // --------------------------------------------------
    setAccessToken(loginData.accessToken);
    setAccountId(loginData.accountId);
    setTrophies(trophiesData);

    // Success response (useful for caller-side UX decisions)
    return {
      success: true,
      data: trophiesData,
    };
  } catch (err: any) {
    // --------------------------------------------------
    // ERROR HANDLING
    // --------------------------------------------------
    console.error("❌ LOGIN FLOW ERROR:", err);

    // User-facing error (only failure should be noisy)
    Alert.alert("Login failed", err.message ?? "Unknown error");

    return {
      success: false,
      error: err.message,
    };
  }
}
