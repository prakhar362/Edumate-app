import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

// Option Data
const ACTIONS = [
  {
    id: "create_playlist",
    title: "New Playlist",
    description: "Create a collection to organize your learning resources.",
    icon: "library",
    color: "#8b5cf6", // Violet
    gradient: ["#8b5cf6", "#7c3aed"],
    route: "/create/playlist", // Change to your actual route
  },
  {
    id: "add_item",
    title: "Add Item",
    description: "Save a video, article, or link to an existing playlist.",
    icon: "add-circle",
    color: "#06b6d4", // Cyan
    gradient: ["#22d3ee", "#0891b2"],
    route: "/create/add-item", 
  },
  {
    id: "create_summary",
    title: "Generate Summary",
    description: "Turn lectures or long videos into concise AI notes.",
    icon: "sparkles",
    color: "#10b981", // Emerald
    gradient: ["#34d399", "#059669"],
    route: "/create/summary", 
  },
];

export default function CreateScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        
        {/* Header Section */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">
            Create New
          </Text>
          <Text className="text-slate-500 text-lg mt-2 font-medium">
            What would you like to do today?
          </Text>
        </View>

        {/* Action Cards */}
        <ScrollView 
          className="flex-1 px-6 pt-6" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.9}
              onPress={() => router.push(action.route)}
              className="mb-6 bg-white rounded-3xl p-5 border border-slate-100"
              style={{
                shadowColor: action.color,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row">
                {/* Icon Box with Gradient */}
                <LinearGradient
                  colors={action.gradient}
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-5 shadow-sm"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon as any} size={28} color="white" />
                </LinearGradient>

                {/* Text Content */}
                <View className="flex-1 justify-center">
                  <Text className="text-xl font-bold text-slate-900 mb-1">
                    {action.title}
                  </Text>
                  <Text className="text-slate-400 text-sm leading-5 pr-2">
                    {action.description}
                  </Text>
                </View>

                {/* Arrow Indicator */}
                <View className="justify-center">
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color="#cbd5e1" 
                  />
                </View>
              </View>

              {/* Decorative "Go" Button (Visual only) */}
              <View className="mt-4 flex-row justify-end">
                 <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-full">
                    <Text 
                        style={{ color: action.color }} 
                        className="font-bold text-xs uppercase tracking-wider mr-1"
                    >
                        Start
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={action.color} />
                 </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Bottom Help Text */}
          <View className="mt-4 items-center">
            <Text className="text-slate-400 text-center text-sm">
                Need help? <Text className="text-violet-600 font-bold">View Tutorials</Text>
            </Text>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}