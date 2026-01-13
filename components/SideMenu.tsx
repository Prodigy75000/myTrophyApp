import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { handlePSNBootstrap } from "../api/handlePSNBootstrap";
import { useTrophy } from "../providers/TrophyContext";

export default function SideMenu() {
  const router = useRouter();
  const { user, setAccessToken, setAccountId, setTrophies } = useTrophy();
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b0e13", padding: 16 }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {user ? (
          <>
            {/* Show avatar */}
            {user.avatarUrl && (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 6,
                }}
              />
            )}

            <Text style={{ color: "#fff", fontSize: 20 }}>{user.onlineId}</Text>

            <Text style={{ color: "#888" }}>
              Level {user.trophyLevel} ({user.progress}%)
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: "#fff", fontSize: 20 }}>🏆 Trophy Hub</Text>
            <Text style={{ color: "#888", marginTop: 4 }}>Prodigy75000</Text>
          </>
        )}
      </View>

      {/* PSN Login */}
      <TouchableOpacity
  style={{
    backgroundColor: "#003791",
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }}
  onPress={() =>
  handlePSNBootstrap({
    setAccessToken,
    setAccountId,
    setTrophies,
  })
}
>
  <Text style={{ color: "#fff", fontWeight: "bold", marginRight: 8 }}>
    {user ? "Refresh PSN Data" : "Sign in with"}
  </Text>
  <Image
    source={require("../assets/logos/ps.png")}
    style={{ width: 22, height: 22 }}
  />
</TouchableOpacity>

      {/* Navigation */}
      <TouchableOpacity onPress={() => router.navigate("/")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          🏠 Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.navigate("/library")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          🎮 Library
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
