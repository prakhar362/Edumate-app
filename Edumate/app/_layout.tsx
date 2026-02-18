import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomPlayer from "@/components/BottomPlayer"; // Import the component
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="summary/[id]" />
          <Stack.Screen name="quiz/[id]" />
          <Stack.Screen name="playlist/[id]" />
        </Stack>

        {/* GLOBAL BOTTOM PLAYER */}
        {/* It sits absolutely positioned above the tab bar via its own styles */}
        <BottomPlayer />
      </View>
    </SafeAreaProvider>
  );
}