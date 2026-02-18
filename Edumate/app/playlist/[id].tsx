import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlaylistAPI } from '@/api/playlist.service';
import { StatusBar } from 'expo-status-bar';

export default function PlaylistDetail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, title, description, count } = params;

    const [items, setItems] = useState<any[]>([]);
    const [playlistInfo, setPlaylistInfo] = useState<any>({
        title: title || 'Loading...',
        description: description || 'Your collection',
        count: count || 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlaylistData = async () => {
            try {
                setLoading(true);
                const playlistId = Array.isArray(id) ? id[0] : id;
                const res = await PlaylistAPI.getItems(playlistId);

                const fetchedItems = Array.isArray(res.data)
                    ? res.data
                    : res.data.items || [];

                setItems(fetchedItems);

                setPlaylistInfo((prev: any) => ({
                    ...prev,
                    count: fetchedItems.length,
                }));
            } catch (error) {
                console.log('Error fetching playlist items:', error);
                Alert.alert('Error', 'Could not load playlist items.');
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
                {/* ================= HEADER SECTION ================= */}
                <LinearGradient
                    colors={['#5b21b6', '#121212']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="pt-4 px-6 pb-10"
                >
                    <SafeAreaView edges={['top']}>

                        {/* 🔥 HEADER ROW */}
                        <View className="mb-6 flex-row items-center justify-between">

                            {/* Back Button (Left) */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 items-center justify-center"
                            >
                                <Ionicons name="chevron-back" size={28} color="white" />
                            </TouchableOpacity>

                            {/* Centered Title */}
                            <View className="absolute left-0 right-0 items-center">
                                <Text className="text-gray-200 text-base font-semibold tracking-wider uppercase">
                                    Your Playlists
                                </Text>
                            </View>

                            {/* Spacer to balance layout */}
                            <View className="w-10" />

                        </View>

                        {/* Playlist Cover */}
                        <View className="items-center mb-6">
                            <View className="w-52 h-52 bg-violet-800 rounded-3xl items-center justify-center shadow-2xl">
                                <LinearGradient
                                    colors={['#7c3aed', '#4c1d95']}
                                    className="w-full h-full rounded-3xl items-center justify-center"
                                >
                                    <Ionicons
                                        name="musical-notes"
                                        size={80}
                                        color="white"
                                        style={{ opacity: 0.85 }}
                                    />
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Playlist Info */}
                        <View>
                            <Text className="text-white text-3xl font-extrabold mb-2">
                                {playlistInfo.title}
                            </Text>

                            {/* ✅ Description + Items INLINE */}
                            <View className="flex-row items-center justify-between">
                                <Text
                                    className="text-gray-300 text-base flex-1"
                                    numberOfLines={1}
                                >
                                    {playlistInfo.description}
                                </Text>

                                <View className="bg-white/10 px-3 py-1 rounded-full ml-4">
                                    <Text className="text-white text-sm font-semibold">
                                        {playlistInfo.count} items
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Controls */}
                        <View className="flex-row items-center justify-between mt-6">
                            <View className="flex-row items-center gap-5">
                                <Ionicons name="heart-outline" size={26} color="#d1d5db" />
                                <Ionicons name="download-outline" size={26} color="#d1d5db" />
                                <Ionicons name="ellipsis-horizontal" size={26} color="#d1d5db" />
                            </View>

                            <TouchableOpacity className="w-14 h-14 bg-[#7c3aed] rounded-full items-center justify-center shadow-lg shadow-violet-500/40">
                                <Ionicons name="play" size={26} color="white" />
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </LinearGradient>

                {/* ================= ITEMS LIST ================= */}
                <View className="px-4 pb-24 bg-[#121212]">
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#7c3aed" />
                        </View>
                    ) : items.length > 0 ? (
                        items.map((item, index) => (
                            <TouchableOpacity
                                key={item.id || item._id || index}
                                onPress={() => {
                                    const targetId =
                                        item.summary_id || item._id || item.id;
                                    if (targetId) router.push(`/summary/${targetId}`);
                                }}
                                className="flex-row items-center py-4 mb-2 rounded-xl px-3 bg-white/5"
                            >
                                {/* Index */}
                                <View className="w-8 items-center mr-3">
                                    <Text className="text-gray-500 font-semibold">
                                        {index + 1}
                                    </Text>
                                </View>

                                {/* Info */}
                                <View className="flex-1">
                                    <Text
                                        className="text-white font-semibold text-base"
                                        numberOfLines={1}
                                    >
                                        {item.name || 'Untitled Item'}
                                    </Text>

                                    <View className="flex-row items-center mt-1">
                                        {item.score !== undefined &&
                                            item.score > 0 && (
                                                <View className="bg-emerald-500/20 px-2 py-0.5 rounded mr-2">
                                                    <Text className="text-emerald-400 text-xs font-bold">
                                                        QUIZ {item.score}
                                                    </Text>
                                                </View>
                                            )}

                                        <Text className="text-gray-400 text-xs">
                                            {item.pdf_url ? 'PDF Source' : 'Audio Source'}
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons
                                    name="ellipsis-vertical"
                                    size={18}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="items-center py-16 opacity-50">
                            <Feather name="inbox" size={40} color="white" />
                            <Text className="text-gray-400 mt-4">
                                No items in this playlist yet.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
