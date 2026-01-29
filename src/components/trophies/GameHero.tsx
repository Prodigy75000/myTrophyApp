// components/trophies/GameHero.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import ProgressCircle from "../ProgressCircle";

// Styles
import { BASE_ICON_HEIGHT, styles } from "../../styles/GameHero.styles";

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
  contextMode?: string;
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
  contextMode,
}: HeroProps) {
  const router = useRouter();

  // 1. ASPECT RATIO LOGIC
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (iconUrl) {
      Image.getSize(
        iconUrl,
        (width, height) => {
          if (width && height) {
            setAspectRatio(width / height);
          }
        },
        (error) => console.log("Image size error:", error)
      );
    }
  }, [iconUrl]);

  const isLandscape = aspectRatio > 1.2;
  const iconStyle = {
    height: BASE_ICON_HEIGHT,
    width: isLandscape ? BASE_ICON_HEIGHT * aspectRatio : BASE_ICON_HEIGHT,
    maxWidth: 180,
  };

  // --- Smart Grouping & State ---
  const grouped = useMemo(() => {
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

  useEffect(() => {
    setActivePlatform(initialSetup.plat);
    setVariantIndex(initialSetup.idx);
  }, [initialSetup]);

  const handlePlatformSwitch = (plat: string) => {
    if (plat === activePlatform) return;
    setActivePlatform(plat);
    setVariantIndex(0);
    const newId = grouped[plat][0].id;
    router.replace({
      pathname: "/game/[id]",
      params: { id: newId, artParam: displayArt, contextMode },
    });
  };

  const handleVariantCycle = () => {
    const stack = grouped[activePlatform] || [];
    if (stack.length <= 1) return;
    const nextIndex = (variantIndex + 1) % stack.length;
    setVariantIndex(nextIndex);
    const newId = stack[nextIndex].id;
    router.replace({
      pathname: "/game/[id]",
      params: { id: newId, artParam: displayArt, contextMode },
    });
  };

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
  const currentRegion = currentStack[variantIndex]?.region || "Unknown Region";

  return (
    <View style={styles.container}>
      {/* ARTWORK BACKGROUND */}
      <View style={styles.artContainer}>
        <Image
          source={{ uri: displayArt || iconUrl }}
          style={styles.artImage}
          blurRadius={displayArt ? 0 : 30}
          resizeMode="cover"
        />
        <LinearGradient colors={["transparent", "#000"]} style={styles.gradient} />
      </View>

      {/* TOP LEFT: Platform Badges */}
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
            <View style={styles.platformBadgeFallback}>
              <Text style={styles.versionText}>{platform}</Text>
            </View>
          )}
        </View>
      </View>

      {/* TOP RIGHT: Region Switcher */}
      {hasVariants && (
        <TouchableOpacity
          style={styles.regionBtn}
          onPress={handleVariantCycle}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="earth" size={14} color="#4da3ff" />
          <Text style={styles.regionBtnText}>
            {currentRegion}
            <Text style={styles.regionCounterText}>
              {" "}
              ({variantIndex + 1}/{currentStack.length})
            </Text>
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#aaa" />
        </TouchableOpacity>
      )}

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {/* ICON */}
          <View
            style={[
              styles.iconWrapperBase,
              { width: iconStyle.width, height: iconStyle.height },
            ]}
          >
            <Image source={{ uri: iconUrl }} style={styles.icon} resizeMode="cover" />
          </View>

          {/* TITLE & STATS */}
          <View style={styles.rightColumn}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.trophyCount}>
                <Text style={styles.trophyLabel}>Trophies Earned</Text>
                <Text style={styles.trophyValue}>
                  {totalEarned} <Text style={styles.totalText}>/ {totalDefined}</Text>
                </Text>
              </View>

              <View style={styles.circleWrapper}>
                <ProgressCircle progress={progress} size={46} strokeWidth={4} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
