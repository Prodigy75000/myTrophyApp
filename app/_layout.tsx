// app/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Providers (Order matters: Global -> Specific)
import { RecentGamesProvider } from "../context/RecentGamesContext";
import { TrophyProvider } from "../providers/TrophyContext";

// Components
import SideMenu from "../src/components/SideMenu";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Expo Router Error Handling
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Hide splash screen once fonts are ready
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    // GestureHandler is required for Drawer Navigation
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Global Status Bar Style */}
      <StatusBar barStyle="light-content" backgroundColor="#0b0e13" />

      {/* 1. Trophy Data (Auth & User) */}
      <TrophyProvider>
        {/* 2. Recent Games History */}
        <RecentGamesProvider>
          {/* 3. Navigation */}
          <Drawer
            // Connect our custom SideMenu
            drawerContent={() => <SideMenu />}
            screenOptions={{
              headerShown: false, // We use custom headers in our screens
              drawerType: "slide",
              overlayColor: "rgba(0,0,0,0.7)",
              drawerStyle: {
                backgroundColor: "#151b2b",
                width: 300,
              },
            }}
          >
            {/* REGISTER SCREENS */}

            {/* Home Screen */}
            <Drawer.Screen
              name="index"
              options={{
                title: "Home",
                drawerLabel: "Home",
              }}
            />

            {/* Game Details (Hidden from menu, but registered for navigation) */}
            <Drawer.Screen
              name="game/[id]"
              options={{
                drawerItemStyle: { display: "none" }, // Hide from auto-generated lists
                swipeEnabled: false, // Disable swipe-to-open on details page
              }}
            />
          </Drawer>
        </RecentGamesProvider>
      </TrophyProvider>
    </GestureHandlerRootView>
  );
}
