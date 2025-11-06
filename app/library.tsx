
// app/index.tsx
import { View, Text, TouchableOpacity, Linking } from "react-native";
import React from "react";

export default function HomeScreen() {
  const handlePSNLogin = async () => {
    const authUrl = "https://ca.account.sony.com/api/v1/oauth/authorize";
    const clientId = "<your-client-id>";
    const redirectUri = "https://trophyhub.app/auth/callback";
    const scope = "psn:s2s basic_profile trophies";

    const url = `${authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    await Linking.openURL(url);
  };

  const handleXboxLogin = async () => {
    await Linking.openURL("https://account.microsoft.com/account");
  };

  const handleSteamLogin = async () => {
    await Linking.openURL("https://store.steampowered.com/login/");
  };
  const handleGooglePlayLogin = async () => {
    await Linking.openURL("https://play.google.com/store/myplayactivity/");
  };
return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
      <Text style={{ fontSize: 24, color: "gold", marginBottom: 30 }}>
        🏆 Welcome to Trophy Hub
      </Text>

      {/* PlayStation */}
      <TouchableOpacity
        onPress={handlePSNLogin}
        style={{
          backgroundColor: "#003791",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image source={require("../assets/logos/ps.png")} style={{ width: 22, height: 22, marginRight: 10 }} />
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign in with PlayStation</Text>
      </TouchableOpacity>

      {/* Xbox */}
      <TouchableOpacity
        onPress={handleXboxLogin}
        style={{
          backgroundColor: "#107C10",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image source={require("../assets/logos/xbox.png")} style={{ width: 22, height: 22, marginRight: 10 }} />
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign in with Xbox</Text>
      </TouchableOpacity>

      {/* Steam */}
      <TouchableOpacity
        onPress={handleSteamLogin}
        style={{
          backgroundColor: "#171A21",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image source={require("../assets/logos/steam.png")} style={{ width: 22, height: 22, marginRight: 10 }} />
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign in with Steam</Text>
      </TouchableOpacity>

      {/* Google Play */}
      <TouchableOpacity
        onPress={handleGooglePlayLogin}
        style={{
          backgroundColor: "#EFEFF0",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 8,
          width: 250,
          marginBottom: 12,
        }}
      >
        <Image source={require("../assets/logos/googleplay.png")} style={{ width: 22, height: 22, marginRight: 10 }} />
        <Text style={{ color: "black", fontWeight: "bold" }}>Sign in with Google Play</Text>
      </TouchableOpacity>
    </View>
  );
}