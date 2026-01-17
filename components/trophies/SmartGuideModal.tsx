import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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

type SmartGuideProps = {
  visible: boolean;
  onClose: () => void;
  gameName: string;
  trophyName: string;
  mode: "VIDEO" | "GUIDE" | null;
};

// 🛡️ The "Harmonizer" Script
// 1. Forces Dark Background immediately
// 2. Hides Ads & Clutter
// 3. Tries to blend the YouTube header with our app
const DARK_MODE_SCRIPT = `
  (function() {
    // Force Dark Background on Body & HTML
    document.documentElement.style.backgroundColor = '#151b2b';
    document.body.style.backgroundColor = '#151b2b';

    const style = document.createElement('style');
    style.innerHTML = \`
      /* 1. Global Dark Theme Override */
      body, html { background-color: #151b2b !important; color: white !important; }
      
      /* 2. YouTube Specific Cleanup */
      /* Make the top search bar blend in */
      .mobile-topbar-header, ytm-mobile-topbar-renderer { 
        background-color: #151b2b !important; 
        border-bottom: 1px solid #2a3449 !important;
      }
      /* Fix text colors in search bar */
      .mobile-topbar-header-content .search-mode .placeholder { color: #888 !important; }
      
      /* Hide the "Open App" promotions */
      .upsell-dialog-renderer, .big-yoodle, .smart-app-banner { display: none !important; }

      /* 3. Ad & Clutter Killers */
      .adsbygoogle, .ad-banner, .advertisement, [id^="google_ads"] { display: none !important; }
      #cookie-banner, #onetrust-banner-sdk { display: none !important; }
      
      /* 4. PSNProfiles Cleanup */
      #header, #footer { display: none !important; }
      .box.no-top-border { display: none !important; }
    \`;
    document.head.appendChild(style);
  })();
  true;
`;

export default function SmartGuideModal({
  visible,
  onClose,
  gameName,
  trophyName,
  mode,
}: SmartGuideProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  if (!mode) return null;

  // 1. Construct Query
  let url = "";
  if (mode === "VIDEO") {
    // Added quotes for precision search
    const query = encodeURIComponent(`${gameName} "${trophyName}" trophy guide`);
    url = `https://m.youtube.com/results?search_query=${query}`;
  } else {
    const query = encodeURIComponent(
      `${gameName} "${trophyName}" trophy guide psnprofiles`
    );
    url = `https://www.google.com/search?q=${query}`;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false} // 👈 Solid background prevents "see-through" glitches
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* 🟢 GLOBAL CONTAINER: Matches App Theme (#151b2b) */}
      <View style={[styles.container, { backgroundColor: "#151b2b" }]}>
        {/* Force Status Bar to match our dark header */}
        <StatusBar barStyle="light-content" backgroundColor="#151b2b" />

        {/* HEADER */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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

          {/* Spinner */}
          <View style={{ width: 40, alignItems: "center" }}>
            {loading && <ActivityIndicator size="small" color="#4da3ff" />}
          </View>
        </View>

        {/* WEBVIEW */}
        <WebView
          source={{ uri: url }}
          // 👈 Seamless Background Color
          style={{ flex: 1, backgroundColor: "#151b2b" }}
          containerStyle={{ backgroundColor: "#151b2b" }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={DARK_MODE_SCRIPT} // 💉 The "Harmonizer"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          // Force Android Dark Mode User Agent
          userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        />

        {/* 🟢 BOTTOM FILLER (Optional) */}
        {/* If there is still a tiny white line at the very bottom on some devices, 
            this ensures the container behind the webview is dark blue. */}
      </View>
    </Modal>
  );
}

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
    borderBottomColor: "#2a3449", // Subtle separator
    backgroundColor: "#151b2b",
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
});
