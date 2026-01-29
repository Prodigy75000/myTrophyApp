// components/LoginModal.tsx
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { styles } from "../styles/SideMenu.styles";

// 🟢 1. CONSTANTS (Clean Configuration)
const AUTHORIZE_URL = "https://ca.account.sony.com/api/authz/v3/oauth/authorize";
const COOKIE_URL = "https://ca.account.sony.com/api/v1/ssocookie";
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (npsso: string) => void;
}

export default function LoginModal({ visible, onClose, onSuccess }: LoginModalProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // Refs replace State to prevent re-render timing issues
  const isSwitchingRef = useRef(false);
  const hasInjectedRef = useRef(false);
  const targetUrlRef = useRef("");

  // 🟢 2. SETUP ON OPEN
  useEffect(() => {
    if (visible) {
      isSwitchingRef.current = false;
      hasInjectedRef.current = false;

      // Build Target URL
      const params = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        scope: SCOPE,
        access_type: "offline",
        service_entity: "urn:service-entity:psn",
        redirect_uri: REDIRECT_URI, // Encoded automatically by URLSearchParams
      });

      targetUrlRef.current = `${AUTHORIZE_URL}?${params.toString()}`;
      console.log("🔗 TARGET URL PREPARED");
    }
  }, [visible]);

  // 🟢 3. CLEANER SCRIPTS
  // Parse JSON inside the WebView. Only return if valid.
  const READ_COOKIE_SCRIPT = `
    (function() {
      try {
        const t = document.body.innerText;
        // Check if it looks like JSON before parsing
        if (t.includes("npsso")) {
            const j = JSON.parse(t);
            if (j.npsso) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ npsso: j.npsso }));
            }
        }
      } catch(e) {}
      true;
    })();
  `;

  // Only detects specific Sony error text
  const DETECT_ERROR_SCRIPT = `
    (function() {
      const t = document.body ? document.body.innerText : "";
      if (t.includes("A connection to the server could not be established")) {
         window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SONY_ERROR" }));
      }
      true;
    })();
  `;

  // 🟢 4. LOGIC
  const switchToCookieJar = () => {
    if (!isSwitchingRef.current) {
      console.log("🍪 Switching to Cookie Jar...");
      isSwitchingRef.current = true;
      webViewRef.current?.injectJavaScript(
        `window.location.href = "${COOKIE_URL}"; true;`
      );
    }
  };

  const handleShouldStartLoad = (request: any) => {
    // Primary Interceptor
    if (request.url.startsWith("com.scee.psxandroid")) {
      console.log("✅ Redirect Intercepted (ShouldStart)");
      switchToCookieJar();
      return false;
    }
    return true;
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;

    // Safety Net: Catch redirect if JS navigation bypassed ShouldStartLoad
    if (url.startsWith("com.scee.psxandroid")) {
      console.log("✅ Redirect Detected (NavState)");
      switchToCookieJar();
      return;
    }

    if (url.includes("ssocookie")) {
      console.log("🔍 Reading Cookie...");
      webViewRef.current?.injectJavaScript(READ_COOKIE_SCRIPT);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const json = JSON.parse(event.nativeEvent.data);

      if (json.npsso) {
        console.log("✅ NPSSO Captured");
        onSuccess(json.npsso);
      } else if (json.type === "SONY_ERROR") {
        console.log("❌ Detected Sony Error - Consider Reloading");
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>PlayStation Login</Text>
          <View style={{ width: 50 }} />
        </View>

        <WebView
          ref={webViewRef}
          key={visible ? "open" : "closed"}
          // 🟢 CLEAN START: Uses about:blank instead of HTML string
          source={{ uri: "about:blank" }}
          onLoadEnd={(e) => {
            // 1. Inject Navigation (The Trojan Horse)
            if (!hasInjectedRef.current && targetUrlRef.current) {
              console.log("🚀 Injecting Navigation...");
              hasInjectedRef.current = true;
              webViewRef.current?.injectJavaScript(
                `window.location.replace("${targetUrlRef.current}"); true;`
              );
            }

            // 2. Inject Error Detector (Only on Sony Login pages, NOT Cookie Jar)
            const url = e.nativeEvent.url;
            if (
              !isSwitchingRef.current &&
              url.includes("account.sony.com") &&
              !url.includes("ssocookie")
            ) {
              webViewRef.current?.injectJavaScript(DETECT_ERROR_SCRIPT);
            }
          }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          incognito={true}
          cacheEnabled={false}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          domStorageEnabled={true}
          style={{ flex: 1, backgroundColor: "black" }}
        />

        {/* Optional: Overlay while switching to make it feel responsive */}
        {isSwitchingRef.current && (
          <View
            style={{
              position: "absolute",
              top: 100,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="small" color="#4da3ff" />
            <Text style={{ color: "#4da3ff", marginTop: 10 }}>Finishing login...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
