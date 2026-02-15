import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SummaryCardProps {
  id: string;
  title: string;
  author: string;
  duration: string;
  image?: any; // Using 'any' for require() images, strict type is ImageSourcePropType
  onPress: () => void;
  onPlayPress: () => void;
}

export default function SummaryCard({ title, author, duration, image, onPress, onPlayPress }: SummaryCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-4 flex-row items-center shadow-sm border border-gray-100"
    >
      {/* Thumbnail */}
      <View className="w-16 h-16 bg-gray-200 rounded-xl mr-4 overflow-hidden relative">
        {image ? (
            <Image source={image} className="w-full h-full" resizeMode="cover" />
        ) : (
            <View className="w-full h-full bg-violet-100 items-center justify-center">
                <Ionicons name="musical-note" size={24} color="#7c3aed" />
            </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 pr-2">
        <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={1}>{title}</Text>
        <Text className="text-gray-500 text-xs font-medium mb-2">{author}</Text>
        
        {/* Duration / Progress Mini Visual */}
        <View className="flex-row items-center">
            <Text className="text-gray-400 text-[10px] font-bold mr-2">{duration}</Text>
            <View className="flex-1 h-1 bg-gray-100 rounded-full">
                <View className="w-[30%] h-full bg-violet-400 rounded-full" />
            </View>
        </View>
      </View>

      {/* Play Button (Spotify Style) */}
      <TouchableOpacity 
        onPress={onPlayPress}
        className="w-10 h-10 bg-violet-600 rounded-full items-center justify-center shadow-md shadow-violet-300"
      >
        <Ionicons name="play" size={20} color="white" style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}