import * as Crypto from "expo-crypto";

/**
 * Generates a random string for the code_verifier
 * Uses Expo's native random generator for safety
 */
function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";

  // 🟢 FIX 1: Use expo-crypto instead of global.crypto to prevent crashes
  const values = Crypto.getRandomBytes(length);

  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

/**
 * Generates the Code Challenge (SHA256 hash of the verifier)
 */
export async function generatePKCE() {
  // 1. Generate Verifier
  const codeVerifier = generateRandomString(64);

  // 2. Hash it (SHA256)
  const hashed = await Crypto.digestStringAsync(
    // 🟢 FIX 2: Use the new Enum name
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );

  // 3. Base64 URL Encode (Replace +/ with -_ and remove =)
  const codeChallenge = hashed.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return { codeVerifier, codeChallenge };
}
