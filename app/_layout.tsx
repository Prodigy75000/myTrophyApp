import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SideMenu from "../components/SideMenu";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: "#0b0e13", width: 270 },
        }}
        drawerContent={(props) => <SideMenu {...props} />}
      />
    </GestureHandlerRootView>
  );
}