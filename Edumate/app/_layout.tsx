import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomPlayer from "@/components/BottomPlayer"; // Import the component
import "../global.css";

export default function RootLayout() {
  const segments = useSegments();

  // 1. Check if we are inside the (auth) folder
  const isAuthRoute = segments[0] === "(auth)";

  // 2. Check if we are on the root index page 
  // FIX: Removed segments.length === 0 to satisfy Expo Router's strict TS types
  const isRootIndex = !segments[0] || segments[0] === "index";

  // Hide the player if either condition is true
  const hidePlayer = isAuthRoute || isRootIndex;

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

        {/* GLOBAL BOTTOM PLAYER (Hidden on auth & index screens) */}
        {!hidePlayer && <BottomPlayer />}
      </View>
    </SafeAreaProvider>
  );
}