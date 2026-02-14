import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hiding labels for a cleaner look, optional
        tabBarActiveTintColor: "#7c3aed", // Tailwind violet-600
        tabBarInactiveTintColor: "#9ca3af", // Tailwind gray-400
        
        // Floating Tab Bar Style
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 20,
          left: 20,
          right: 20,
          height: 60,
          backgroundColor: 'white',
          borderRadius: 25,
          borderTopWidth: 0,
          elevation: 10, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index" // Use 'index' for the default route in the folder
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center top-2">
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
              {/* Active Indicator Dot */}
              {focused && (
                <View className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1" />
              )}
            </View>
          ),
        }}
      />

      
    </Tabs>
  );
}