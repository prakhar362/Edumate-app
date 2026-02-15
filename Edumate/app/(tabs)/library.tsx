import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FilterPill from "@/components/filterPill";

// Mock Data
const ALL_ITEMS = [
  { id: '1', type: 'playlist', title: 'Liked Summaries', subtitle: 'Playlist • 12 items' },
  { id: '2', type: 'summary', title: 'The Lean Startup', subtitle: 'Summary • Eric Ries' },
  { id: '3', type: 'playlist', title: 'Web Development', subtitle: 'Playlist • 8 items' },
  { id: '4', type: 'summary', title: 'Sapiens', subtitle: 'Summary • Yuval Noah Harari' },
];

export default function Library() {
  const router = useRouter();
  const [filter, setFilter] = useState('All'); // 'All', 'Summaries', 'Playlists'

  const filteredData = ALL_ITEMS.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Summaries') return item.type === 'summary';
    if (filter === 'Playlists') return item.type === 'playlist';
    return true;
  });

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
                 <View className="w-8 h-8 rounded-full bg-violet-600 items-center justify-center mr-3">
                    <Text className="text-white font-bold">P</Text>
                 </View>
                 <Text className="text-2xl font-bold text-gray-900">Your Library</Text>
            </View>
            <Ionicons name="add" size={28} color="#4b5563" />
        </View>

        {/* Filter Pills */}
        <View className="px-6 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterPill label="All" active={filter === 'All'} onPress={() => setFilter('All')} />
                <FilterPill label="Summaries" active={filter === 'Summaries'} onPress={() => setFilter('Summaries')} />
                <FilterPill label="Playlists" active={filter === 'Playlists'} onPress={() => setFilter('Playlists')} />
            </ScrollView>
        </View>

        {/* List Content */}
        <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    className="flex-row items-center mb-5"
                    onPress={() => router.push(item.type === 'playlist' ? `/playlist/${item.id}` : `/summary/${item.id}`)}
                >
                    <View className={`w-16 h-16 ${item.type === 'playlist' ? 'rounded-lg' : 'rounded-full'} bg-gray-100 mr-4 items-center justify-center overflow-hidden`}>
                        <Ionicons 
                            name={item.type === 'playlist' ? "musical-notes" : "book"} 
                            size={24} 
                            color={item.type === 'playlist' ? "#7c3aed" : "#10b981"} 
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900">{item.title}</Text>
                        <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                    </View>
                </TouchableOpacity>
            )}
        />
      </SafeAreaView>
    </View>
  );
}