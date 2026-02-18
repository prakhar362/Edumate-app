import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { usePlayerStore } from '@/store/player.store';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function BottomPlayer() {
    const router = useRouter();

    // Connect to Zustand Store
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
    const seekBy = usePlayerStore((s) => s.seekBy);
    const position = usePlayerStore((s) => s.position);
    const duration = usePlayerStore((s) => s.duration);

    // If no track is loaded, don't render anything
    if (!currentTrack) return null;

    const progressPercent = (position / duration) * 100;

    const handleOpenSummary = () => {
        if (currentTrack.id) {
            router.push(`/summary/${currentTrack.id}`);
        }
    };

    return (
        <View className="absolute bottom-[85px] left-2 right-2 z-50">
            {/* Container with Shadow & Rounded Corners */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleOpenSummary}
                className="bg-[#2d2d44] rounded-2xl overflow-hidden shadow-lg shadow-black/40 border border-white/5"
                style={{ height: 64 }}
            >
                <View className="flex-row items-center h-full px-3">

                    {/* 1. Track Image (Miniature of Summary View) */}
                    <View className="w-10 h-10 rounded-lg overflow-hidden mr-3 bg-violet-800 items-center justify-center border border-white/10">
                        <LinearGradient
                            colors={['#7c3aed', '#4c1d95']}
                            className="w-full h-full items-center justify-center"
                        >
                            <Ionicons name="book" size={20} color="white" />
                        </LinearGradient>
                    </View>

                    {/* 2. Title & Subtitle */}
                    <View className="flex-1 justify-center mr-2">
                        <Text className="text-white font-bold text-sm leading-tight" numberOfLines={1}>
                            {currentTrack.title}
                        </Text>
                        <Text className="text-gray-400 text-xs" numberOfLines={1}>
                            {currentTrack.subtitle || "Audio Summary"}
                        </Text>
                    </View>

                    {/* 3. Controls */}
                    <View className="flex-row items-center gap-3">
                        {/* Rewind 10s */}
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); seekBy(-10); }}>
                            <MaterialIcons name="replay-10" size={22} color="#9ca3af" />
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}>
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={28}
                                color="white"
                            />
                        </TouchableOpacity>

                        {/* Forward 10s */}
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); seekBy(10); }}>
                            <MaterialIcons name="forward-10" size={22} color="#9ca3af" />
                        </TouchableOpacity>

                        {/* Expand Chevron (Optional visual cue) */}
                        <TouchableOpacity onPress={handleOpenSummary} className="ml-1">
                            <Ionicons name="chevron-up" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. Progress Bar (Bottom Line) */}
                <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-700">
                    <View
                        className="h-full bg-[#7c3aed]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </View>

            </TouchableOpacity>
        </View>
    );
}