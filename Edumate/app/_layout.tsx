import { Stack, Redirect } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";

export default function RootLayout() {
  const hydrate = useAuthStore((s: any) => s.hydrate);
  const token = useAuthStore((s: any) => s.token);
  const hydrated = useAuthStore((s: any) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, []);

  // ⏳ block navigation until auth is known
  if (!hydrated) return null;

  // ✅ logged in → tabs
  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  // ❌ not logged in → auth flow
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    </SafeAreaProvider>
  );
}
