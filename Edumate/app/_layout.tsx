import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from "@/store/auth.store";

import "../global.css";

export default function RootLayout() {
    const hydrate = useAuthStore((s:any) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, []);
  
  return (
    
      <SafeAreaProvider>
         <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} /> 
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
      </SafeAreaProvider>
    
  );
  
}
