// components/trophies/GameHero.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Added for icons
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProgressCircle from "../ProgressCircle";

const SCREEN_W = Dimensions.get("window").width;
const ICON_SIZE = 100;

type HeroProps = {
  iconUrl: string;
  title: string;
  platform: string;
  progress: number;
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  definedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  displayArt?: string | null;
  versions?: { id: string; platform: string; region?: string }[];
  activeId?: string;
};

export default function GameHero({
  iconUrl,
  title,
  platform,
  progress,
  earnedTrophies,
  definedTrophies,
  displayArt,
  versions = [],
  activeId,
}: HeroProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // -------------------------------------------------------------------------
  // 1. SMART GROUPING (The Core Logic)
  // -------------------------------------------------------------------------
  const grouped = useMemo(() => {
    // 🔴 OLD: const map: Record<string, { id: string; platform: string }[]> = {};
    // 🟢 NEW: Add 'region?: string' to the type definition
    const map: Record<string, { id: string; platform: string; region?: string }[]> = {};

    versions.forEach((v) => {
      if (!map[v.platform]) map[v.platform] = [];
      map[v.platform].push(v);
    });
    return map;
  }, [versions]);

  const uniquePlatforms = Object.keys(grouped).sort((a, b) => {
    if (a === "PS5") return -1;
    if (b === "PS5") return 1;
    return 0;
  });

  // -------------------------------------------------------------------------
  // 2. STATE INITIALIZATION (Sync with activeId)
  // -------------------------------------------------------------------------
  // Find which platform/variant corresponds to the incoming activeId
  const initialSetup = useMemo(() => {
    if (!activeId) return { plat: uniquePlatforms[0] || platform, idx: 0 };

    for (const plat of uniquePlatforms) {
      const idx = grouped[plat].findIndex((v) => v.id === activeId);
      if (idx !== -1) return { plat, idx };
    }
    return { plat: uniquePlatforms[0] || platform, idx: 0 };
  }, [activeId, grouped, uniquePlatforms, platform]);

  const [activePlatform, setActivePlatform] = useState(initialSetup.plat);
  const [variantIndex, setVariantIndex] = useState(initialSetup.idx);

  // Sync state if external activeId changes (rare, but good practice)
  useEffect(() => {
    setActivePlatform(initialSetup.plat);
    setVariantIndex(initialSetup.idx);
  }, [initialSetup]);

  // -------------------------------------------------------------------------
  // 3. INTERACTION HANDLERS
  // -------------------------------------------------------------------------

  // Switch Platform (Tier 1)
  const handlePlatformSwitch = (plat: string) => {
    if (plat === activePlatform) return;

    // Switch UI immediately
    setActivePlatform(plat);
    setVariantIndex(0); // Reset to first variant of new platform

    // Navigate to the ID of the first variant
    const newId = grouped[plat][0].id;
    router.replace({
      pathname: "/game/[id]",
      params: { id: newId, artParam: displayArt },
    });
  };

  // Switch Variant (Tier 2) - Cycle through regions
  const handleVariantCycle = () => {
    const stack = grouped[activePlatform] || [];
    if (stack.length <= 1) return;

    const nextIndex = (variantIndex + 1) % stack.length;
    setVariantIndex(nextIndex);

    // Navigate to the specific variant ID
    const newId = stack[nextIndex].id;
    router.replace({
      pathname: "/game/[id]",
      params: { id: newId, artParam: displayArt },
    });
  };

  // -------------------------------------------------------------------------
  // 4. RENDER HELPERS
  // -------------------------------------------------------------------------
  const totalEarned =
    earnedTrophies.bronze +
    earnedTrophies.silver +
    earnedTrophies.gold +
    earnedTrophies.platinum;

  const totalDefined =
    definedTrophies.bronze +
    definedTrophies.silver +
    definedTrophies.gold +
    definedTrophies.platinum;

  const currentStack = grouped[activePlatform] || [];
  const hasVariants = currentStack.length > 1;

  return (
    <View style={styles.container}>
      {/* BACKGROUND ART */}
      <View style={styles.artContainer}>
        <Image
          source={{ uri: displayArt || iconUrl }}
          style={styles.artImage}
          blurRadius={displayArt ? 0 : 30}
          resizeMode="cover"
        />
        <LinearGradient colors={["transparent", "#000"]} style={styles.gradient} />
      </View>

      {/* 🔽 TIER 1: PLATFORM BADGES (Top Left) 🔽 */}
      <View style={styles.topBadgesContainer}>
        <View style={styles.platformRow}>
          {uniquePlatforms.length > 0 ? (
            uniquePlatforms.map((plat) => (
              <TouchableOpacity
                key={plat}
                style={[
                  styles.versionBadge,
                  plat === activePlatform ? styles.versionActive : styles.versionInactive,
                ]}
                onPress={() => handlePlatformSwitch(plat)}
              >
                <Text
                  style={[
                    styles.versionText,
                    plat === activePlatform ? { color: "white" } : { color: "#888" },
                  ]}
                >
                  {plat}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            // Fallback if no versions array (rare)
            <View style={styles.platformBadgeFallback}>
              <Text style={styles.versionText}>{platform}</Text>
            </View>
          )}
        </View>

        {/* 🔽 TIER 2: VARIANT SWITCHER 🔽 */}
        {hasVariants && (
          <TouchableOpacity
            style={styles.variantSwitcher}
            onPress={handleVariantCycle}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="earth" size={12} color="#ccc" />
            <Text style={styles.variantText}>
              {currentStack[variantIndex].region || `Variant ${variantIndex + 1}`}
              {/* Small Counter (1/3) */}
              <Text style={{ fontSize: 9, color: "#888", fontWeight: "400" }}>
                {"  "}({variantIndex + 1}/{currentStack.length})
              </Text>{" "}
              {/* 👈 THIS WAS MISSING */}
            </Text>
            <MaterialCommunityIcons name="swap-horizontal" size={12} color="#4da3ff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* ROW: Icon + Info */}
        <View style={styles.headerRow}>
          {/* ICON (Clean) */}
          <View style={styles.iconWrapper}>
            <Image
              source={{ uri: iconUrl }}
              style={styles.icon}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          </View>

          {/* TITLE & PROGRESS */}
          <View style={styles.infoWrapper}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.trophyCount}>
                <Text style={styles.trophyLabel}>Trophies</Text>
                <Text style={styles.trophyValue}>
                  {totalEarned} <Text style={styles.totalText}>/ {totalDefined}</Text>
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.trophyCount}>
                <Text style={styles.trophyLabel}>Progress</Text>
                <Text style={styles.trophyValue}>{progress}%</Text>
              </View>
            </View>
          </View>

          {/* CIRCLE */}
          <View style={styles.circleWrapper}>
            <ProgressCircle progress={progress} size={50} strokeWidth={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: "relative",
  },
  artContainer: {
    height: 200,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
    opacity: 0.6,
  },
  artImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // --- TOP LEFT BADGES ---
  topBadgesContainer: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 10,
    alignItems: "flex-start", // Align left
    gap: 6, // Space between Platform Row and Variant Row
  },
  platformRow: {
    flexDirection: "row",
    gap: 8,
  },

  // Platform Badge Styles
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  versionActive: {
    backgroundColor: "#4da3ff", // Bright Blue for Active
    borderColor: "#4da3ff",
  },
  versionInactive: {
    backgroundColor: "rgba(0,0,0,0.6)", // Darker for inactive
  },
  versionText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  platformBadgeFallback: {
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },

  // Variant Switcher (Tier 2)
  variantSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    gap: 6,
  },
  variantText: {
    color: "#ddd",
    fontSize: 10,
    fontWeight: "600",
  },

  // --- CONTENT ---
  content: {
    marginTop: 120,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#000",
    overflow: "hidden",
    marginRight: 16,
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  infoWrapper: {
    flex: 1,
    paddingBottom: 4,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trophyCount: {
    marginRight: 12,
  },
  trophyLabel: {
    color: "#aaa",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  trophyValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  totalText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#444",
    marginRight: 12,
  },
  circleWrapper: {
    paddingBottom: 4,
  },
});
