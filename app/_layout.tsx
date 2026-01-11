import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SideMenu from "../components/SideMenu";
import { TrophyProvider } from "../providers/TrophyContext";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TrophyProvider>
        <Drawer
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            drawerStyle: { backgroundColor: "#0b0e13", width: 270 },
          }}
          drawerContent={() => <SideMenu />}
        />
      </TrophyProvider>
    </GestureHandlerRootView>
  );
}
