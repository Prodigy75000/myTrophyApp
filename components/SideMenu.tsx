import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { handlePSNLogin } from "../utils/_psnAuth"; // ✅ import the helper
/* eslint-disable @typescript-eslint/no-unused-vars */

export default function SideMenu({ navigation }: any) {
  const [psnConnected, setPsnConnected] = useState(false);
  const [steamConnected, setSteamConnected] = useState(false);
  const [xboxConnected, setXboxConnected] = useState(false);
  const PROXY_BASE_URL = "http://192.168.1.151:4000";
  
  const connectToPSN = async () => {
    const result = await handlePSNLogin(PROXY_BASE_URL);
    if (result.success) setPsnConnected(true);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b0e13", padding: 16 }}>
      {/* Profile Section */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ color: "#fff", fontSize: 20 }}>🏆 Trophy Hub</Text>
        <Text style={{ color: "#888", marginTop: 4 }}>Prodigy75000</Text>
      </View>

      {/* Account Sign-ins */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: "#fff", fontSize: 16, marginBottom: 10 }}>
          🎮 Accounts
        </Text>
         {/* Playstation */}
        <TouchableOpacity
          style={{
            backgroundColor: "#003791",
            paddingVertical: 10,
            borderRadius: 6,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={connectToPSN}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "bold",
              marginRight: 8,
            }}
          >
            Sign in with
          </Text>
          <Image
            source={require("../assets/logos/ps.png")}
            style={{ width: 22, height: 22 }}
          />
        </TouchableOpacity>
         {/* Xbox */}
        <TouchableOpacity
  style={{
    backgroundColor: "#107C10",
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: "row",              // arrange text and image in a row
    alignItems: "center",              // vertically center both
    justifyContent: "center",          // horizontally center the whole row
  }}
  onPress={() => setXboxConnected(true)}
>
  <Text
    style={{
      color: "#fff",
      textAlign: "center",
      fontWeight: "bold",
      marginRight: 8,                  // small gap before the logo
    }}
  >
    Sign in with
  </Text>

  <Image
    source={require("../assets/logos/xbox.png")}
    style={{ width: 22, height: 22 }}
  />
</TouchableOpacity>
        {/* Steam */}
        <TouchableOpacity
  style={{
    backgroundColor: "#171A21",
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: "row",              // arrange text and image in a row
    alignItems: "center",              // vertically center both
    justifyContent: "center",          // horizontally center the whole row
  }}
  onPress={() => setSteamConnected(true)}
>
  <Text
    style={{
      color: "#fff",
      textAlign: "center",
      fontWeight: "bold",
      marginRight: 8,                  // small gap before the logo
    }}
  >
    Sign in with
  </Text>

  <Image
    source={require("../assets/logos/steam.png")}
    style={{ width: 22, height: 22 }}
  />
</TouchableOpacity>

        {/* Google Play */}
        <TouchableOpacity
  style={{
    backgroundColor: "#ffffffff",
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: "row",              // arrange text and image in a row
    alignItems: "center",              // vertically center both
    justifyContent: "center",          // horizontally center the whole row
  }}
  onPress={() => setPsnConnected(true)}
>
  <Text
    style={{
      color: "#000000ff",
      textAlign: "center",
      fontWeight: "bold",
      marginRight: 8,                  // small gap before the logo
    }}
  >
    Sign in with
  </Text>

  <Image
    source={require("../assets/logos/googleplay.png")}
    style={{ width: 22, height: 22 }}
  />
</TouchableOpacity>
      </View>

      {/* Navigation Links */}
      <TouchableOpacity onPress={() => navigation.navigate("index")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          🏠 Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("library")}>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          🎮 Library
        </Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          ⭐ Favorites
        </Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 16, marginVertical: 8 }}>
          ⚙️ Settings
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
