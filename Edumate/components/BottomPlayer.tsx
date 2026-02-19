// components/BottomPlayer.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { usePlayerStore } from '@/store/player.store';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BottomPlayer() {
    const router = useRouter();
    const pathname = usePathname();
    const segments = useSegments(); // Helps detect if we are inside (tabs)

    const { currentTrack, isPlaying, togglePlayPause, seekBy, position, duration } = usePlayerStore();

    // 1. Hide completely if we are currently on the full Summary player screen
    if (pathname.includes('/summary')) return null;
    // 2. Hide if nothing is playing
    if (!currentTrack) return null;

    // 3. Dynamic Bottom Spacing: If inside tabs, float above tab bar (~85px). If in a stack, float near bottom (24px).
    const isTabs = segments[0] === '(tabs)';
    const bottomOffset = isTabs ? 70 : 10;

    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    const handleOpenSummary = () => {
        if (currentTrack.id) router.push(`/summary/${currentTrack.id}`);
    };

    return (

        <View
            className="absolute left-2 right-2 z-50"
            style={{ bottom: bottomOffset }}
        >
            <SafeAreaView>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleOpenSummary}
                    className="bg-[#141429] rounded-2xl overflow-hidden shadow-xl shadow-black/50 border border-white/10"
                    style={{ height: 64 }}
                >
                    <View className="flex-row items-center h-full px-3">

                        {/* Track Image */}
                        <View className="w-10 h-10 rounded-lg overflow-hidden mr-3 bg-violet-800 items-center justify-center">
                            <LinearGradient colors={['#621cdbff', '#4c1d95']} className="w-full h-full items-center justify-center">
                                <Ionicons name="book" size={20} color="white" />
                            </LinearGradient>
                        </View>

                        {/* Title & Subtitle */}
                        <View className="flex-1 justify-center mr-2">
                            <Text className="text-white font-bold text-sm leading-tight" numberOfLines={1}>
                                {currentTrack.title}
                            </Text>
                            <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                {currentTrack.subtitle || "Audio Summary"}
                            </Text>
                        </View>

                        {/* Controls */}
                        <View className="flex-row items-center gap-4 pr-1">
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); seekBy(-10); }}>
                                <MaterialIcons name="replay-10" size={24} color="#d1d5db" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="white" />
                            </TouchableOpacity>

                            {/* Expand / Maximize Icon */}
                            <TouchableOpacity onPress={handleOpenSummary} className="ml-2">
                                <Ionicons name="chevron-up" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom Progress Bar */}
                    <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-700">
                        <View className="h-full bg-[#7c3aed]" style={{ width: `${progressPercent}%` }} />
                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        </View>

    );
}