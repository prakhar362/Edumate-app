import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth.store';


export default function Index() {
   const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (token) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [hydrated]);

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      
      <LinearGradient
        // Updated colors to match the new background reference
        colors={['#3b1f77', '#5e35b1', '#311b92']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Decorative Background Lines */}
        <View className="absolute top-0 -left-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
        <View className="absolute top-40 -left-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
        <View className="absolute bottom-0 -right-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
        <View className="absolute bottom-40 -right-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
        
        {/* Decorative Background Shapes */}
        <View className="absolute top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-2xl" />
        <View className="absolute -bottom-32 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-2xl" />

        {/* Center Logo Section */}
        <View className="items-center justify-center space-y-6">
          
          {/* Logo Container */}
          <View className="w-60 h-60 items-center justify-center">
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: '90%', height: '90%' }}
            resizeMode="contain"
          />
          </View>

          {/* App Name */}
          <Text className="text-white text-5xl font-bold tracking-wider mt-4">
            Edumate
          </Text>
          
        </View>
      </LinearGradient>
    </View>
  );
}