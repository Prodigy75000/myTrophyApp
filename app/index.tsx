// app/index.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexts & Config
import { PROXY_BASE_URL } from "../config/endpoints";
import { useTrophy } from "../providers/TrophyContext";

// Custom Hooks
import { PlatformFilter } from "../components/HeaderActionBar"; // Import type
import { useTrophyFilter } from "../hooks/useTrophyFilter";
// ⚠️ LOAD MASTER JSON
// For now, assume it's in ../data/master_games.json
// If it's too huge, we might need to lazy load it later.
import masterGamesRaw from "../data/master_games.json";

// Components
import HeaderActionBar, {
  FilterMode,
  OwnershipMode,
  SortDirection,
  SortMode,
  ViewMode,
} from "../components/HeaderActionBar";
import GameCard from "../components/trophies/GameCard";
import GameGridItem from "../components/trophies/GameGridItem";
import ProfileDashboard from "../components/trophies/ProfileDashboard";

const BASE_HEADER_HEIGHT = 60;
const STORAGE_KEY_GRID = "USER_GRID_COLUMNS";

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trophies, accountId, accessToken, refreshAllTrophies } = useTrophy();

  // --- 1. UI STATE ---
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // View Options
  const [sortMode, setSortMode] = useState<SortMode>("LAST_PLAYED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [gridColumns, setGridColumns] = useState(3);

  // Interaction State
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [activePeekId, setActivePeekId] = useState<string | null>(null);

  // User Data State
  const [profile, setProfile] = useState<{
    onlineId: string;
    avatarUrl: string;
    isPlus: boolean;
  } | null>(null);
  const [level, setLevel] = useState<number>(1);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>("OWNED");
  const [showShovelware, setShowShovelware] = useState(false); // Default: Hidden

  const [platforms, setPlatforms] = useState<PlatformFilter>({
    PS5: true,
    PS4: true,
    PS3: true,
    PSVITA: true,
  });

  // --- 2. LOGIC HOOKS ---
  // We offload the heavy filtering/sorting to our custom hook
  const { userStats, sortedList } = useTrophyFilter(
    trophies,
    masterGamesRaw as unknown as any[],
    searchText,
    filterMode,
    ownershipMode,
    sortMode,
    sortDirection,
    pinnedIds,
    showShovelware,
    platforms
  );
  // Helper to toggle platform
  const togglePlatform = (key: keyof PlatformFilter) => {
    setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- 3. EFFECTS ---

  // Load Grid Settings
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_GRID).then((saved) => {
      const parsed = parseInt(saved || "3", 10);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 4) setGridColumns(parsed);
    });
  }, []);

  // Fetch Profile & Summary
  useEffect(() => {
    if (!accountId || !accessToken) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/user/profile/${accountId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const avatars = data.avatarUrls || data.avatars || [];
        const avatarItem = avatars.find((a: any) => a.size === "l") || avatars[0];
        setProfile({
          onlineId: data.onlineId,
          avatarUrl: avatarItem?.avatarUrl || avatarItem?.url,
          isPlus: data.isPlus,
        });
      } catch (e) {
        console.warn("Profile fetch failed", e);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await fetch(`${PROXY_BASE_URL}/api/user/summary/${accountId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.trophyLevel) setLevel(data.trophyLevel);
      } catch (e) {
        console.warn("Summary fetch failed", e);
      }
    };

    fetchProfile();
    fetchSummary();
  }, [accountId, accessToken]);

  // --- 4. HELPERS ---

  const showToast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(text);
    // @ts-ignore
    toastTimer.current = setTimeout(() => setToastMsg(null), 1200);
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyPinchScale = (scale: number) => {
    let newCols = gridColumns;

    const MIN_COLS = 1;
    const MAX_COLS = 4;

    if (scale > 1.2)
      newCols = Math.max(MIN_COLS, gridColumns - 1); // Zoom in -> bigger
    else if (scale < 0.8) newCols = Math.min(MAX_COLS, gridColumns + 1); // Zoom out -> smaller

    if (newCols !== gridColumns) {
      setGridColumns(newCols);
      AsyncStorage.setItem(STORAGE_KEY_GRID, String(newCols));
      showToast(`Grid: ${newCols === 2 ? "Large" : newCols === 3 ? "Medium" : "Small"}`);
    }
  };
  const pinchGesture = Gesture.Pinch()
    .enabled(viewMode === "GRID")
    .onEnd((e) => {
      runOnJS(applyPinchScale)(e.scale);
    });

  // Header Animation
  const totalHeaderHeight = BASE_HEADER_HEIGHT + insets.top;
  const translateY = Animated.diffClamp(scrollY, 0, totalHeaderHeight).interpolate({
    inputRange: [0, totalHeaderHeight],
    outputRange: [0, -totalHeaderHeight],
  });

  // --- 5. RENDER ---
  const renderItem = ({ item }: { item: any }) => {
    // 'item' is now a GROUP: { title, icon, art, versions: [...] }

    // Check if ANY version in the stack is pinned
    const isPinned = item.versions.some((v: any) => pinnedIds.has(v.id));

    // For GRID view: We need to pick one version to display (e.g. highest progress or PS5)
    // We sort versions to find the "Best" one to show on the grid tile
    const bestVersion = [...item.versions].sort((a, b) => b.progress - a.progress)[0];

    if (viewMode === "GRID") {
      return (
        <GameGridItem
          versions={item.versions} // The component calculates the best version itself now
          numColumns={gridColumns}
          justUpdated={false}
          isPinned={isPinned}
          onPin={() => togglePin(item.id)} // Use Group ID
          isPeeking={activePeekId === item.id}
          title={item.title}
          icon={item.icon} // 🟢 SQUARE (Display)
          heroArt={item.art} // 🟢 16:9 (For Navigation)
          onTogglePeek={() =>
            setActivePeekId((prev) => (prev === item.id ? null : item.id))
          }
          sourceMode={ownershipMode}
        />
      );
    }

    // LIST view (GameCard handles the stack internally)
    return (
      <GameCard
        title={item.title}
        icon={item.icon}
        art={item.art}
        versions={item.versions} // 👈 Passing the full stack
        isPinned={isPinned}
        onPin={(id) => togglePin(id)}
        sourceMode={ownershipMode}
      />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a0b0fff" }}>
      {/* HEADER */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: "#0a0b0fff",
          transform: [{ translateY }],
          height: totalHeaderHeight,
        }}
      >
        <HeaderActionBar
          onMenuPress={() => (navigation as any).openDrawer()}
          onLocalSearch={setSearchText}
          sortMode={sortMode}
          onSortChange={setSortMode}
          sortDirection={sortDirection}
          onSortDirectionChange={() =>
            setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"))
          }
          ownershipMode={ownershipMode} // 👈 Pass it
          onOwnershipChange={setOwnershipMode} // 👈 Pass setter
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFilterChange={setFilterMode}
          filterMode={filterMode}
          showShovelware={showShovelware}
          onToggleShovelware={() => setShowShovelware((prev) => !prev)}
          platforms={platforms}
          onTogglePlatform={togglePlatform}
        />
      </Animated.View>

      {/* CONTENT */}
      {trophies?.trophyTitles ? (
        <GestureDetector gesture={pinchGesture}>
          <Animated.FlatList
            ref={flatListRef}
            key={viewMode === "GRID" ? `grid-${gridColumns}` : "list"}
            data={sortedList}
            keyExtractor={(item: any) => item.id}
            renderItem={renderItem}
            numColumns={viewMode === "GRID" ? gridColumns : 1}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refreshAllTrophies();
              setRefreshing(false);
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              {
                useNativeDriver: true,
                listener: (e: any) =>
                  setShowScrollTop(e.nativeEvent.contentOffset.y > 300),
              }
            )}
            contentContainerStyle={{
              paddingTop: totalHeaderHeight + 10,
              paddingBottom: 80,
            }}
            ListHeaderComponent={
              userStats ? (
                <ProfileDashboard
                  username={profile?.onlineId ?? accountId ?? "Loading..."}
                  avatarUrl={profile?.avatarUrl}
                  isPlus={profile?.isPlus}
                  counts={userStats}
                  level={level > 1 ? level : undefined}
                  totalTrophies={0}
                />
              ) : null
            }
          />
        </GestureDetector>
      ) : (
        <Text style={{ color: "red", marginTop: 100, textAlign: "center" }}>
          ⚠️ No trophy data available.
        </Text>
      )}

      {/* TOAST */}
      {toastMsg && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* FAB */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
        >
          <MaterialCommunityIcons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4da3ff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  toastContainer: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(30, 30, 45, 0.95)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 2000,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
