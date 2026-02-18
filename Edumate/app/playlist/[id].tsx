import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlaylistAPI } from '@/api/playlist.service';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function PlaylistDetail() {
    const router = useRouter();

    // 1. Get params passed from the previous screen
    // These come as strings. If you pass objects, you might need to JSON.parse them, 
    // but for simple fields like title/count, direct access works.
    const params = useLocalSearchParams();
    const { id, title, description, count } = params;

    const [items, setItems] = useState<any[]>([]);
    // Initialize info with passed params (instant load) or defaults
    const [playlistInfo, setPlaylistInfo] = useState<any>({
        title: title || "Loading...",
        description: description || "Your collection",
        count: count || 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlaylistData = async () => {
            try {
                setLoading(true);
                const playlistId = Array.isArray(id) ? id[0] : id;

                // 2. Fetch Items from API
                const res = await PlaylistAPI.getItems(playlistId);

                // Handle different response structures (Array vs Object with items key)
                const fetchedItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
                setItems(fetchedItems);

                // If API provides fresh metadata, update the state
                if (!Array.isArray(res.data) && res.data.title) {
                    setPlaylistInfo({
                        title: res.data.title,
                        description: res.data.description,
                        count: fetchedItems.length
                    });
                } else {
                    // Update count based on actual fetched items
                    setPlaylistInfo((prev: any) => ({ ...prev, count: fetchedItems.length }));
                }

            } catch (error) {
                console.log("Error fetching playlist items:", error);
                Alert.alert("Error", "Could not load playlist items.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPlaylistData();
    }, [id]);

    return (
        <View className="flex-1 bg-[#121212]">
            <StatusBar style="light" />

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* --- HEADER SECTION --- */}
                <LinearGradient
                    colors={['#5b21b6', '#121212']} // Deep Violet to Black
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="pt-4 px-6 pb-8"
                >
                    <SafeAreaView edges={['top']}>
                        {/* Back Button */}
                        <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10">
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>

                        {/* Album Art / Playlist Cover */}
                        <View className="items-center mb-6 shadow-2xl shadow-black">
                            <View className="w-56 h-56 bg-violet-800 rounded-xl items-center justify-center border border-white/10 shadow-xl">
                                <LinearGradient
                                    colors={['#7c3aed', '#4c1d95']}
                                    className="w-full h-full rounded-xl items-center justify-center"
                                >
                                    <Ionicons name="musical-notes" size={80} color="white" style={{ opacity: 0.8 }} />
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Playlist Info */}
                        <View className="mb-2">
                            <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
                                {playlistInfo.title}
                            </Text>
                            <View className="flex-row items-center">
                                <View className="w-5 h-5 bg-[#7c3aed] rounded-full items-center justify-center mr-2">
                                    <Text className="text-white font-bold text-[10px]">E</Text>
                                </View>
                                <Text className="text-gray-400 font-medium text-sm">
                                    Edumate • {playlistInfo.count} items
                                </Text>
                            </View>
                        </View>

                        {/* Controls Row */}
                        <View className="flex-row items-center justify-between mt-4">
                            <View className="flex-row items-center gap-5">
                                <TouchableOpacity>
                                    <Ionicons name="heart-outline" size={28} color="#d1d5db" />
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Ionicons name="download-outline" size={28} color="#d1d5db" />
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Ionicons name="ellipsis-horizontal" size={28} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>

                            {/* Big Play Button */}
                            <View className="flex-row items-center gap-4">
                                <TouchableOpacity>
                                    <Ionicons name="shuffle" size={28} color="#d1d5db" />
                                </TouchableOpacity>
                                <TouchableOpacity className="w-14 h-14 bg-[#7c3aed] rounded-full items-center justify-center shadow-lg shadow-violet-500/40">
                                    <Ionicons name="play" size={28} color="white" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* --- ITEMS LIST --- */}
                <View className="px-4 pb-20 bg-[#121212]">
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#7c3aed" />
                        </View>
                    ) : items.length > 0 ? (
                        items.map((item, index) => (
                            <TouchableOpacity
                                key={item.id || item._id || index}
                                onPress={() => {
                                    // Navigate to Summary Page with the ID
                                    // 'item.summary_id' is preferred if it exists, otherwise fallback to item._id
                                    const targetId = item.summary_id || item._id || item.id;
                                    if (targetId) router.push(`/summary/${targetId}`);
                                }}
                                className="flex-row items-center py-3 mb-2 active:bg-white/5 rounded-lg px-2"
                            >
                                {/* Number / Playing Indicator */}
                                <View className="w-8 items-center justify-center mr-2">
                                    <Text className="text-gray-500 font-medium text-sm">{index + 1}</Text>
                                </View>

                                {/* Text Info */}
                                <View className="flex-1">
                                    <Text
                                        className="text-white font-semibold text-base mb-1"
                                        numberOfLines={1}
                                    >
                                        {item.name || "Untitled Item"}
                                    </Text>
                                    <View className="flex-row items-center">
                                        {/* Optional: Show if it has a quiz score */}
                                        {item.score !== undefined && item.score > 0 && (
                                            <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded mr-2">
                                                <Text className="text-emerald-400 text-[10px] font-bold">QUIZ: {item.score}</Text>
                                            </View>
                                        )}
                                        <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                            {item.pdf_url ? "PDF Source" : "Audio Source"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action Icon */}
                                <TouchableOpacity className="p-2">
                                    <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="items-center py-10 opacity-50">
                            <Feather name="inbox" size={40} color="white" />
                            <Text className="text-gray-400 mt-4">No items in this playlist yet.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}