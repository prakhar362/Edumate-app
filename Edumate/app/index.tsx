import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return; // 👈 ensures router is mounted
    if (!hydrated) return;

    if (token) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [hydrated, navigationState]);

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#3b1f77', '#5e35b1', '#311b92']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <View className="items-center justify-center">
          <View className="w-60 h-60 items-center justify-center">
            <Image
              source={require("../assets/images/logo.png")}
              style={{ width: '90%', height: '90%' }}
              resizeMode="contain"
            />
          </View>

          <Text className="text-white text-5xl font-bold tracking-wider mt-4">
            Edumate
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
