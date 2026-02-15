import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { PlaylistAPI } from "@/api/playlist.service";
import { SummaryAPI } from "@/api/summarize.service";

export default function Home() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch Playlists
        let playlistData = [];
        try {
          const pRes = await PlaylistAPI.getPlayLists();
          playlistData = pRes?.data || [];
        } catch (err) {
          console.log("Playlist API Error:", err);
        }

        // Fetch Summaries
        let summaryData = [];
        try {
          // Double check if getSummaries exists before calling
          if (SummaryAPI && typeof SummaryAPI.getSummaries === 'function') {
             const sRes = await SummaryAPI.getSummaries();
             summaryData = sRes?.data || [];
          } else {
             console.error("SummaryAPI.getSummaries is not defined correctly:", SummaryAPI);
          }
        } catch (err) {
          console.log("Summary API Error:", err);
        }

        setPlaylists(playlistData);
        setSummaries(summaryData);

      } catch (e) {
        console.error("Global Home load error", e);
        Alert.alert("Error", "Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View className="mb-8">
      <Text className="text-gray-900 text-xl font-bold mb-4 px-6">
        {title}
      </Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#311b92]">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Gradient Header */}
      <LinearGradient
        colors={["#3b1f77", "#5e35b1"]}
        className="absolute top-0 w-full h-64 rounded-b-[40px]"
      />
          {/* Header */}
          <View className="px-6 pt-4 pb-6 flex-row justify-between items-center">
            <View>
              <Text className="text-violet-200 font-bold text-lg">
                Welcome back
              </Text>
              <Text className="text-white text-3xl font-bold">
                Learn Mode 🎧
              </Text>
            </View>

            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/30">
                <Ionicons name="person" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="mx-6 mb-8 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex-row items-center">
            <Ionicons name="search" size={20} color="white" />
            <Text className="ml-3 text-white/70">
              Search summaries or playlists
            </Text>
          </View>

          {/* Playlists Section */}
          <Section title="Made for you">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {playlists?.length > 0 ? (
                playlists.map((p) => (
                  <TouchableOpacity
                    key={p.id || p._id}
                    onPress={() => router.push(`/playlist/${p.id || p._id}`)}
                    className="mr-4 w-36"
                  >
                    <View className="w-36 h-36 rounded-2xl bg-violet-100 items-center justify-center mb-2">
                      <Ionicons
                        name="headset"
                        size={30}
                        color="#7c3aed"
                      />
                    </View>
                    <Text
                      className="font-bold text-gray-800"
                      numberOfLines={1}
                    >
                      {p.title || p.name || "Untitled"}
                    </Text>
                    <Text
                      className="text-xs text-gray-500"
                      numberOfLines={1}
                    >
                      {p.description || "Playlist"}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                 // Empty State for Playlists
                 <View className="w-64 h-32 bg-gray-50 rounded-2xl items-center justify-center border border-dashed border-gray-300">
                    <Text className="text-gray-400">No playlists found</Text>
                 </View>
              )}
            </ScrollView>
          </Section>

          {/* Summaries Section */}
          <Section title="Your summaries">
            <View className="px-6">
              {summaries?.length > 0 ? (
                summaries.map((s) => (
                  <TouchableOpacity
                    key={s._id || s.id}
                    onPress={() => router.push(`/summary/${s._id || s.id}`)}
                    className="flex-row items-center mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    {/* Play Icon */}
                    <View className="w-14 h-14 bg-violet-100 rounded-xl items-center justify-center mr-4">
                      <Ionicons name="play" size={22} color="#7c3aed" />
                    </View>

                    {/* Text Info */}
                    <View className="flex-1">
                      <Text
                        className="font-bold text-gray-900 text-base"
                        numberOfLines={1}
                      >
                        {s.name || s.title || "Untitled Summary"}
                      </Text>

                      <Text
                        className="text-xs text-gray-500 mt-1"
                        numberOfLines={1}
                      >
                        {s.filename || "Audio File"} • AI Summary
                      </Text>
                    </View>

                    {/* Action Arrow / Score */}
                    <View className="items-end">
                      {s.score > 0 && (
                        <View className="flex-row items-center mb-1">
                          <Ionicons
                            name="sparkles"
                            size={14}
                            color="#a78bfa"
                          />
                          <Text className="text-xs text-violet-500 ml-1 font-bold">
                            {s.score}
                          </Text>
                        </View>
                      )}

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#d1d5db"
                      />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                // Empty State for Summaries
                <View className="py-8 items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Ionicons name="document-text-outline" size={32} color="#cbd5e1" />
                    <Text className="text-gray-400 mt-2">No summaries yet</Text>
                </View>
              )}
            </View>
          </Section>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}