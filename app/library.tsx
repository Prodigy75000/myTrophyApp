import { useNavigation } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function LibraryScreen() {
  const navigation = useNavigation() as any;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#000",
        paddingVertical: 40,
      }}
    >
      {/* Drawer Menu Button */}
      <Pressable
        onPress={() => navigation.openDrawer()}
        style={{
          alignSelf: "flex-start",
          marginLeft: 20,
          marginBottom: 10,
          padding: 10,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20 }}>☰</Text>
      </Pressable>

      {/* Title */}
      <Text style={{ fontSize: 24, color: "gold", marginBottom: 30 }}>
        🎮 Library
      </Text>

      {/* Placeholder content */}
      <View
        style={{
          width: "90%",
          padding: 20,
          backgroundColor: "#111",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#333",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#aaa", fontSize: 16 }}>
          Your full trophy collection will appear here.
        </Text>
      </View>
    </ScrollView>
  );
}