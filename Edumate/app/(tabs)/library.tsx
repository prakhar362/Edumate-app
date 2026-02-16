import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PlaylistAPI } from "@/api/playlist.service";
import { SummaryAPI } from "@/api/summarize.service";

// --- Asset Constants (Replace with local require() if you have assets) ---
const IMAGES = {
  // Bookshelf/Library Icon for Playlists
  playlist: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png", 
  // Note/Paper Icon for Summaries
  summary: "https://thumbs.dreamstime.com/b/document-grammar-control-icon-white-background-53432685.jpg",
  // Empty State Illustration
  empty: "https://cdn-icons-png.flaticon.com/512/7486/7486744.png" 
};

// --- Component: Filter Pill ---
const FilterPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className={`px-6 py-2.5 rounded-full mr-3 border ${
      active
        ? "bg-violet-600 border-violet-600"
        : "bg-white border-slate-200"
    }`}
    style={!active ? { shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 } : {}}
  >
    <Text
      className={`font-bold text-sm ${
        active ? "text-white" : "text-slate-600"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function Library() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        try {
          const pRes = await PlaylistAPI.getPlayLists();
          setPlaylists(pRes?.data || []);
        } catch (err) {
          console.log("Playlist error", err);
        }

        try {
          if (
            SummaryAPI &&
            typeof SummaryAPI.getSummaries === "function"
          ) {
            const sRes = await SummaryAPI.getSummaries();
            setSummaries(sRes?.data || []);
          }
        } catch (err) {
          console.log("Summary error", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredData = () => {
    const normalizedPlaylists = playlists.map((p) => ({
      id: p._id || p.id,
      type: "playlist",
      title: p.title || p.name || "Untitled Playlist",
      subtitle: `${p.items?.length || 0} items`,
      image: IMAGES.playlist, // Using the Bookshelf Image
    }));

    const normalizedSummaries = summaries.map((s) => ({
      id: s._id || s.id,
      type: "summary",
      title: s.name || s.title || "Untitled Summary",
      subtitle: s.filename || "Audio File",
      image: IMAGES.summary, // Using the Note Image
    }));

    if (filter === "Playlists") return normalizedPlaylists;
    if (filter === "Summaries") return normalizedSummaries;

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
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="flex-1">

        {/* Header */}
        <View className="px-6 pt-6 pb-6 bg-slate-50">
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Library
          </Text>
          <Text className="text-slate-500 font-medium mt-1">
            Manage your learning collection
          </Text>
        </View>

        {/* Filters */}
        <View className="px-6 mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <FilterPill
              label="All"
              active={filter === "All"}
              onPress={() => setFilter("All")}
            />
            <FilterPill
              label="Playlists"
              active={filter === "Playlists"}
              onPress={() => setFilter("Playlists")}
            />
            <FilterPill
              label="Summaries"
              active={filter === "Summaries"}
              onPress={() => setFilter("Summaries")}
            />
          </ScrollView>
        </View>

        {/* List */}
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-10">
              <Image 
                source={{ uri: IMAGES.empty }}
                className="w-40 h-40 opacity-80 mb-6"
                resizeMode="contain"
              />
              <Text className="text-xl font-bold text-slate-800 text-center">
                It's empty here
              </Text>
              <Text className="text-slate-400 text-center mt-2 leading-5">
                Start by creating a new playlist or summarizing a lecture to fill up your library.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              className="flex-row items-center mb-4 bg-white p-4 rounded-3xl border border-slate-100"
              style={{
                shadowColor: "#64748b",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
              onPress={() =>
                router.push(
                  item.type === "playlist"
                    ? `/playlist/${item.id}`
                    : `/summary/${item.id}`
                )
              }
            >
              {/* Image Container */}
              <View
                className={`w-16 h-16 rounded-2xl mr-4 items-center justify-center ${
                  item.type === "playlist"
                    ? "bg-violet-50"
                    : "bg-emerald-50"
                }`}
              >
                <Image 
                    source={{ uri: item.image }}
                    className="w-10 h-10"
                    resizeMode="contain"
                />
              </View>

              {/* Text Content */}
              <View className="flex-1 justify-center">
                <Text className="text-[17px] font-bold text-slate-800 mb-1" numberOfLines={1}>
                  {item.title}
                </Text>
                
                <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                        {item.type}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300 mr-2" />
                    <Text className="text-xs text-slate-400 font-medium">
                        {item.subtitle}
                    </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Floating Add Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute bottom-8 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center"
          style={{
            shadowColor: "#0f172a",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {/* Using text for simplicity, or use an Icon */}
          <Text className="text-white text-3xl font-light mb-1">+</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}