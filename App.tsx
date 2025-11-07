import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import HomeScreen from "./app/index";
import LibraryScreen from "./app/library";
import SideMenu from "./components/SideMenu";
import { TrophyProvider } from "./TrophyContext";

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <TrophyProvider>
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="index"
          drawerContent={(props) => <SideMenu {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: { backgroundColor: "#0b0e13" },
            drawerInactiveTintColor: "#fff",
          }}
        >
          <Drawer.Screen name="index" component={HomeScreen} />
          <Drawer.Screen name="library" component={LibraryScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </TrophyProvider>
  );
}