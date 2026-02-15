import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PlaylistAPI } from "@/api/playlist.service";
import { SummaryAPI } from "@/api/summarize.service";

// Simple Filter Pill Component (Inline for safety)
const FilterPill = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`px-6 py-2 rounded-full mr-3 border ${
      active 
        ? 'bg-violet-600 border-violet-600' 
        : 'bg-transparent border-gray-300'
    }`}
  >
    <Text className={`font-bold ${active ? 'text-white' : 'text-gray-500'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function Library() {
  const router = useRouter();
  const [filter, setFilter] = useState('All'); // 'All', 'Summaries', 'Playlists'
  const [loading, setLoading] = useState(true);
  
  // Store raw data
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Playlists safely
        try {
            const pRes = await PlaylistAPI.getPlayLists();
            setPlaylists(pRes?.data || []);
        } catch (err) {
            console.log("Library Playlist Error", err);
        }

        // 2. Fetch Summaries safely
        try {
             // Check if API exists to prevent crash
            if (SummaryAPI && typeof SummaryAPI.getSummaries === 'function') {
                const sRes = await SummaryAPI.getSummaries();
                setSummaries(sRes?.data || []);
            }
        } catch (err) {
            console.log("Library Summary Error", err);
        }

      } catch (e) {
        console.log("Library Load Error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute Filtered Data
  const getFilteredData = () => {
    // Normalize Playlists to common shape
    const normalizedPlaylists = playlists.map(p => ({
        id: p._id || p.id,
        type: 'playlist',
        title: p.title || p.name || 'Untitled Playlist',
        subtitle: `${p.items?.length || 0} items`,
        icon: 'musical-notes',
        color: '#7c3aed', // Violet
        raw: p
    }));

    // Normalize Summaries to common shape
    const normalizedSummaries = summaries.map(s => ({
        id: s._id || s.id,
        type: 'summary',
        title: s.name || s.title || 'Untitled Summary',
        subtitle: s.filename || 'Audio File',
        icon: 'book',
        color: '#10b981', // Emerald
        raw: s
    }));

    if (filter === 'Playlists') return normalizedPlaylists;
    if (filter === 'Summaries') return normalizedSummaries;
    
    // 'All' - Combine them
    return [...normalizedPlaylists, ...normalizedSummaries];
  };

  const displayData = getFilteredData();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
                 <View className="w-10 h-10 rounded-full bg-violet-100 items-center justify-center mr-3 border border-violet-200">
                    <Text className="text-violet-700 font-bold text-lg">P</Text>
                 </View>
                 <Text className="text-xl font-bold text-gray-900">Your Library</Text>
            </View>
            <TouchableOpacity className="bg-gray-50 p-2 rounded-full">
                <Ionicons name="add" size={24} color="#374151" />
            </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View className="px-6 mb-2 h-14">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                <FilterPill label="All" active={filter === 'All'} onPress={() => setFilter('All')} />
                <FilterPill label="Playlists" active={filter === 'Playlists'} onPress={() => setFilter('Playlists')} />
                <FilterPill label="Summaries" active={filter === 'Summaries'} onPress={() => setFilter('Summaries')} />
            </ScrollView>
        </View>

        {/* List Content */}
        <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 }}
            ListEmptyComponent={
                <View className="items-center justify-center py-20">
                    <Ionicons name="file-tray-outline" size={48} color="#e5e7eb" />
                    <Text className="text-gray-400 mt-2">No items found</Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity 
                    className="flex-row items-center mb-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
                    onPress={() => router.push(item.type === 'playlist' ? `/playlist/${item.id}` : `/summary/${item.id}`)}
                >
                    {/* Icon Box */}
                    <View className={`w-16 h-16 rounded-2xl bg-gray-50 mr-4 items-center justify-center`}>
                        <Ionicons 
                            name={item.icon as any} 
                            size={24} 
                            color={item.color} 
                        />
                    </View>
                    
                    {/* Text Info */}
                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-1">{item.title}</Text>
                        <View className="flex-row items-center">
                            <Text className={`text-xs font-bold mr-2 uppercase tracking-wider ${item.type === 'playlist' ? 'text-violet-500' : 'text-emerald-500'}`}>
                                {item.type}
                            </Text>
                            <Text className="text-xs text-gray-400">• {item.subtitle}</Text>
                        </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#e5e7eb" />
                </TouchableOpacity>
            )}
        />
      </SafeAreaView>
    </View>
  );
}