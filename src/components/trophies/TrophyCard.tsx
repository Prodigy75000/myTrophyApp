// components/trophies/TrophyCard.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";

// Shared Utils
import { formatDate } from "../../utils/formatDate";
import { TrophyType } from "../../utils/normalizeTrophy";
import { getRarityTier, RARITY_TIERS } from "../../utils/rarity";

// Styles
import { styles } from "../../styles/TrophyCard.styles";

const ICONS = {
  bronze: require("../../../assets/icons/trophies/bronze.png"),
  silver: require("../../../assets/icons/trophies/silver.png"),
  gold: require("../../../assets/icons/trophies/gold.png"),
  platinum: require("../../../assets/icons/trophies/platinum.png"),
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Rarity Pyramid
// ---------------------------------------------------------------------------
const RarityPyramid = ({ percentage }: { percentage: string }) => {
  const tier = useMemo(() => getRarityTier(percentage), [percentage]);
  const activeLevel = useMemo(() => {
    switch (tier) {
      case RARITY_TIERS.ULTRA_RARE:
        return 4;
      case RARITY_TIERS.VERY_RARE:
        return 3;
      case RARITY_TIERS.RARE:
        return 2;
      default:
        return 1;
    }
  }, [tier]);

  return (
    <View style={styles.pyramidContainer}>
      {[4, 3, 2, 1].map((level, index) => (
        <View
          key={level}
          style={[
            styles.pyramidBar,
            {
              width: (index + 1) * 4,
              opacity: activeLevel === level ? 1 : 0.2,
            },
          ]}
        />
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Progress Bar
// ---------------------------------------------------------------------------
const TrophyProgressBar = ({ current, target }: { current: string; target: string }) => {
  const percent = useMemo(() => {
    const c = parseInt(current, 10);
    const m = parseInt(target, 10);
    if (isNaN(c) || isNaN(m) || m === 0) return 0;
    return Math.min(100, Math.max(0, (c / m) * 100));
  }, [current, target]);

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {current} / {target}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

type Props = {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: TrophyType;
  earned: boolean;
  earnedAt?: string | null;
  rarity?: string;
  justEarned?: boolean;
  progressValue?: string;
  progressTarget?: string;
  onPress: () => void;
};

export default function TrophyCard({
  name,
  description,
  icon,
  type,
  earned,
  earnedAt,
  rarity,
  justEarned,
  progressValue,
  progressTarget,
  onPress,
}: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const showProgress = progressValue && progressTarget;

  useEffect(() => {
    if (justEarned) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [justEarned, glowAnim]);

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1e1e2d", "#3a3a50"],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#ffd700"],
  });

  const rarityIcon = ICONS[type] || ICONS.bronze;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            borderWidth: 1,
            opacity: earned ? 1 : 0.7,
          },
        ]}
      >
        <Image source={{ uri: icon }} style={styles.icon} />

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Image source={rarityIcon} style={styles.miniRankIcon} resizeMode="contain" />
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.statusContainer}>
              {showProgress ? (
                <TrophyProgressBar current={progressValue} target={progressTarget!} />
              ) : earnedAt ? (
                <Text style={styles.earnedDate}>{formatDate(earnedAt)}</Text>
              ) : (
                <Text style={styles.lockedText}>Locked</Text>
              )}
            </View>

            {rarity && (
              <View style={styles.rarityWrapper}>
                <RarityPyramid percentage={rarity} />
                <Text style={styles.rarity}>{rarity}%</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
