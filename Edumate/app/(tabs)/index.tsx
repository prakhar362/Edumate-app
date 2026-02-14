import React from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function Home() {
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* 1. Gradient Header Background */}
      <View className="absolute top-0 w-full h-72 bg-violet-600 rounded-b-[40px]" />

      <SafeAreaView className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // Padding for floating tab bar
        >
          {/* Header Content */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-violet-200 text-sm font-medium">Welcome back,</Text>
                <Text className="text-white text-2xl font-bold">Prakhar 👋</Text>
              </View>
              <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md">
                <Ionicons name="notifications-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput 
                placeholder="Search courses, mentors..." 
                className="flex-1 ml-3 text-gray-700 font-medium"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity>
                <Ionicons name="filter" size={20} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          </View>

         
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}