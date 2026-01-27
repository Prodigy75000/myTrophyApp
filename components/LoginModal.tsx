// components/LoginModal.tsx
import React, { useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { styles } from "./SideMenu.styles"; // Re-using your styles

// 🟢 CONFIG
const COOKIE_URL = "https://ca.account.sony.com/api/v1/ssocookie";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (npsso: string) => void;
}

export default function LoginModal({ visible, onClose, onSuccess }: LoginModalProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const isSwitchingRef = useRef(false);

  // 🟢 1. FORCE NAVIGATION (Manual "I'm Signed In")
  const switchToCookieJar = () => {
    console.log("🍪 Switching to Cookie Jar...");
    if (!isSwitchingRef.current) {
      isSwitchingRef.current = true;
      webViewRef.current?.injectJavaScript(`window.location.href = "${COOKIE_URL}";`);
    }
  };

  // 🟢 2. INTELLIGENT SCRIPT
  const INJECTED_JAVASCRIPT = `
    setInterval(function() {
      // A. Check for Token JSON (Goal)
      if (document.body.innerText.includes("npsso")) {
        window.ReactNativeWebView.postMessage(document.body.innerText);
      }
      // B. Check for "Stuck" Success Page
      if (document.body.innerText.includes("successfully signed in") || document.body.innerText.includes("Return to the previous application")) {
         window.ReactNativeWebView.postMessage(JSON.stringify({ type: "LOGIN_SUCCESS_DETECTED" }));
      }
    }, 1000);
  `;

  // 🟢 3. INTERCEPTOR
  const handleShouldStartLoad = (request: any) => {
    if (request.url.startsWith("com.scee.psxandroid")) {
      console.log("✅ URL Redirect Detected!");
      switchToCookieJar();
      return false;
    }
    return true;
  };

  // 🟢 4. MESSAGE HANDLER
  const handleWebViewMessage = (event: any) => {
    try {
      const text = event.nativeEvent.data;
      const json = JSON.parse(text);

      if (json.npsso) {
        console.log("✅ NPSSO Captured");
        onSuccess(json.npsso);
      } else if (json.type === "LOGIN_SUCCESS_DETECTED") {
        console.log("✅ Text Detection: Login Success!");
        switchToCookieJar();
      }
    } catch (e) {
      // Ignore non-JSON
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {/* 🟢 FIX: Apply Insets to padding so it pushes content down */}
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* HEADER */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>PlayStation Login</Text>

          <TouchableOpacity
            onPress={switchToCookieJar}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.modalClose}>I'm Signed In</Text>
          </TouchableOpacity>
        </View>

        {/* BROWSER */}
        <WebView
          ref={webViewRef}
          source={{ uri: COOKIE_URL }} // 🟢 Starts at Cookie Jar!
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={handleWebViewMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          domStorageEnabled={true}
          incognito={false}
          style={{ flex: 1, backgroundColor: "black" }}
        />
      </View>
    </Modal>
  );
}
