// components/trophies/SmartGuideModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type SmartGuideProps = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  mode: "VIDEO" | "GUIDE" | null;
};

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * The "Harmonizer" Script
 * Injects CSS to force dark mode and hide clutter/ads on 3rd party sites.
 */
const DARK_MODE_INJECTION = `
  (function() {
    try {
      // 1. Force Dark Background
      const darkColor = '#151b2b';
      document.documentElement.style.backgroundColor = darkColor;
      document.body.style.backgroundColor = darkColor;

      const style = document.createElement('style');
      style.innerHTML = \`
        /* Global Override */
        body, html { background-color: #151b2b !important; color: white !important; }
        
        /* YouTube Mobile Cleanup */
        .mobile-topbar-header, ytm-mobile-topbar-renderer { 
          background-color: #151b2b !important; 
          border-bottom: 1px solid #2a3449 !important;
        }
        .mobile-topbar-header-content .search-mode .placeholder { color: #888 !important; }
        
        /* Hide Annoyances (Open App banners, cookie popups) */
        .upsell-dialog-renderer, .big-yoodle, .smart-app-banner, .promotion { display: none !important; }
        #cookie-banner, #onetrust-banner-sdk { display: none !important; }
        
        /* Hide Ads */
        .adsbygoogle, .ad-banner, [id^="google_ads"] { display: none !important; }
        
        /* PSNProfiles Specifics */
        #header, #footer { display: none !important; }
        .box.no-top-border { display: none !important; }
      \`;
      document.head.appendChild(style);
    } catch (e) { console.error("Injection failed", e); }
  })();
  true; // Required for WebView
`;

// Force Android Dark Mode User Agent
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36";

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function SmartGuideModal({
  visible,
  onClose,
  gameName,
  trophyName,
  mode,
}: SmartGuideProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  // Memoize URL generation to prevent flicker on re-renders
  const targetUrl = useMemo(() => {
    if (!mode) return "";

    // Sanitize inputs
    const safeGame = encodeURIComponent(gameName);
    const safeTrophy = encodeURIComponent(`"${trophyName}"`); // Quotes for exact match

    if (mode === "VIDEO") {
      return `https://m.youtube.com/results?search_query=${safeGame}+${safeTrophy}+trophy+guide`;
    }
    return `https://www.google.com/search?q=${safeGame}+${safeTrophy}+trophy+guide+psnprofiles`;
  }, [gameName, trophyName, mode]);

  if (!mode) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* GLOBAL CONTAINER: Matches App Theme (#151b2b) */}
      <View style={[styles.container, { backgroundColor: "#151b2b" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#151b2b" />

        {/* HEADER */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={26} color="white" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {mode === "VIDEO" ? "Video Guide" : "Web Guide"}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {trophyName}
            </Text>
          </View>

          {/* Loading Indicator */}
          <View style={styles.loaderContainer}>
            {loading && <ActivityIndicator size="small" color="#4da3ff" />}
          </View>
        </View>

        {/* WEBVIEW */}
        <WebView
          source={{ uri: targetUrl }}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={DARK_MODE_INJECTION}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          userAgent={USER_AGENT}
          // Performance props
          startInLoadingState={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3449",
    backgroundColor: "#151b2b",
    height: 60, // Fixed height for consistency
  },
  closeBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#888",
    fontSize: 12,
  },
  loaderContainer: {
    width: 40,
    alignItems: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: "#151b2b",
  },
  webviewContainer: {
    backgroundColor: "#151b2b",
  },
});
