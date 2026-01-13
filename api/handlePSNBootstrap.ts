// app/utils/handlePSNBootstrap.ts
/**
 * TEMP bootstrap helper
 * - Calls backend login
 * - Fetches initial trophies payload
 * - NOT a reusable auth layer
 */
import { Alert } from 'react-native';
import { PROXY_BASE_URL } from "../config/endpoints";
type BootstrapDeps = {
  setAccessToken: (token: string) => void;
  setAccountId: (id: string) => void;
  setTrophies: (data: any) => void;
};

export async function handlePSNBootstrap({
  setAccessToken,
  setAccountId,
  setTrophies,
}: BootstrapDeps) {
  try {
    console.log('[PSN bootstrap] Connecting to backend');

    const loginRes = await fetch(`${PROXY_BASE_URL}/api/login`);

    console.log('🔎 login status:', loginRes.status);

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login HTTP ${loginRes.status}: ${text}`);
    }

    const loginData = await loginRes.json();

    if (!loginData.accessToken || !loginData.accountId) {
      throw new Error('Invalid login payload');
    }

    console.log('✅ Access token received');

    const trophiesRes =
        await fetch(`${PROXY_BASE_URL}/api/trophies/${loginData.accountId}`, {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            'Accept-Language': 'en-US',
          },
        });
        

    console.log('🔎 trophies status:', trophiesRes.status);

    if (!trophiesRes.ok) {
      const text = await trophiesRes.text();
      throw new Error(`Trophies HTTP ${trophiesRes.status}: ${text}`);
    }

    const trophiesData = await trophiesRes.json();
setAccessToken(loginData.accessToken);
setAccountId(loginData.accountId);
setTrophies(trophiesData);
    Alert.alert('PSN login success!', 'Trophies fetched!');
    return {success: true, data: trophiesData};

  } catch (err: any) {
    console.error('❌ LOGIN FLOW ERROR:', err);
    Alert.alert('Login failed', err.message ?? 'Unknown error');
    return {success: false, error: err.message};
  }
  
}