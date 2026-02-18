import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { PlaylistAPI } from "@/api/playlist.service";
import { SummaryAPI } from "@/api/summarize.service";
import { useAuthStore } from "@/store/auth.store";

const { width } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [userdetails, setUserDetails] = useState<any>([]);
  const [playlistdata, setPlaylistData] = useState<any>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch Playlists
        let playlistData = [];
        try {
          const pRes = await PlaylistAPI.getPlayLists();
          playlistData = pRes?.data || [];
          setPlaylistData(playlistData);
        } catch (err) {
          console.log("Playlist API Error:", err);
        }

        // Fetch Summaries
        let summaryData = [];
        try {
          if (SummaryAPI && typeof SummaryAPI.getSummaries === "function") {
            const sRes = await SummaryAPI.getSummaries();
            summaryData = sRes?.data || [];
          }
        } catch (err) {
          console.log("Summary API Error:", err);
        }

        //getting user details and showing it.
        if (user) {
          //console.log("User details:", user);
        }

        setUserDetails(user);
        console.log("User details from variable:", userdetails);
        setPlaylists(playlistData);
        setSummaries(summaryData);
      } catch (e) {
        Alert.alert("Error", "Could not load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // -- Component: Filter Pill --
  const FilterPill = ({ title }: { title: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(title)}
      className={`px-5 py-2.5 rounded-full mr-3 shadow-sm ${activeTab === title
        ? "bg-violet-600"
        : "bg-white border border-gray-100"
        }`}
    >
      <Text
        className={`font-semibold text-sm ${activeTab === title ? "text-white" : "text-gray-600"
          }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">

      <StatusBar style="light" />

      {/* Background Decorative Mesh Gradient (Subtle) */}
      <View className="absolute top-0 left-0 right-0 h-96 overflow-hidden">
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.15)", "transparent"]}
          style={{ width: "100%", height: "100%" }}
        />
        <View className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <View className="absolute top-10 -left-10 w-48 h-48 bg-violet-200/30 rounded-full blur-3xl" />
      </View>

      <SafeAreaView className="flex-1 " edges={['top']}>
        {/* --- Header --- */}
        <View className="px-6 pt-2 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 font-medium text-sm mb-0.5 uppercase tracking-wider">
              Welcome Back,
            </Text>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">
              {userdetails?.name || "Learner"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <View className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-md shadow-violet-100 border border-violet-50">
              <Ionicons name="person" size={20} color="#7c3aed" />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Search Bar --- */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-1 shadow-sm shadow-gray-200 border border-gray-100">
            <Ionicons name="search" size={22} color="#94a3b8" />
            <TextInput
              placeholder="What do you want to learn?"
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-3 text-slate-700 font-medium text-base"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >

          {/* --- Horizontal Playlists --- */}
          <View className="mb-8">
            <View className="px-6 flex-row justify-between items-end mb-4">
              <Text className="text-slate-900 text-xl font-bold">
                Your Playlists
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {playlists?.length > 0 ? (
                playlists.map((p: any, i: any) => (
                  <TouchableOpacity
                    key={p.id || p._id}
                    onPress={() => router.push({
                      pathname: `/playlist/${p.id || p._id}`,
                      params: {
                        title: p.title,
                        description: p.description,
                        count: p.count // or p.items?.length
                      }
                    })}
                    className="mr-5 w-40"
                  >
                    {/* Card Image */}
                    <View className="w-40 h-40 rounded-2xl shadow-lg shadow-violet-200 mb-3 overflow-hidden bg-white">
                      <LinearGradient
                        colors={i % 2 === 0 ? ["#a78bfa", "#7c3aed"] : ["#c084fc", "#9333ea"]}
                        className="w-full h-full items-center justify-center p-4 relative"
                      >
                        <View className="absolute bottom-2 left-2 right-2">
                          <Text className="text-white/90 font-bold text-xs uppercase tracking-widest">Playlist</Text>
                          <Text className="text-white font-extrabold text-lg leading-6 mt-1" numberOfLines={2}>
                            {p.title || "Daily Mix"}
                          </Text>
                        </View>
                        {/* Decorative Icon */}
                        <View className="absolute top-2 right-2 opacity-30">
                          <Ionicons name="headset" size={40} color="white" />
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Meta */}
                    <Text
                      className="text-slate-800 font-bold text-sm"
                      numberOfLines={1}
                    >
                      {p.title || "My Playlist"}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      Updated today
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="w-full h-32 items-center justify-center">
                  <Text className="text-gray-400">No playlists found</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* --- Vertical Summaries List --- */}
          <View className="px-6">
            <Text className="text-slate-900 text-xl font-bold mb-4">
              Your Summaries
            </Text>

            {summaries?.map((s, index) => (
              <TouchableOpacity
                key={s._id || s.id}
                onPress={() => router.push(`/summary/${s._id || s.id}`)}
                className="flex-row items-center mb-4 bg-white p-3 rounded-2xl shadow-sm shadow-gray-100 border border-gray-50"
              >

                {/* Thumb */}
                <View className="w-14 h-14 rounded-xl bg-violet-50 items-center justify-center mr-4 relative">
                  <Ionicons name="play" size={20} color="#7c3aed" />
                  {/* Progress Bar Mock */}
                  <View className="absolute bottom-0 left-0 h-1 bg-violet-600 rounded-bl-xl rounded-br-xl w-1/2" />
                </View>

                {/* Info */}
                <View className="flex-1 justify-center">
                  <Text
                    className="text-slate-800 font-bold text-[15px] mb-1"
                    numberOfLines={1}
                  >
                    {s.name || s.title || "Untitled Summary"}
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-green-100 px-2 py-0.5 rounded-md mr-2">
                      <Text className="text-green-700 text-[10px] font-bold">NEW</Text>
                    </View>
                    <Text className="text-gray-400 text-xs">
                      {s.filename || "Audio File"}
                    </Text>
                  </View>
                </View>

                {/* Score / Action */}
                <View className="items-end pl-2">
                  {s.score > 0 && (
                    <View className="flex-row items-center bg-violet-50 px-2 py-1 rounded-lg">
                      <Ionicons name="star" size={10} color="#7c3aed" />
                      <Text className="text-violet-700 text-xs font-bold ml-1">{s.score}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}