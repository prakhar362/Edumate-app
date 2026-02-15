import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

const { height } = Dimensions.get('window');

export default function SummaryPlayer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Summary'); // 'Summary' or 'Audio' (Visualizer)

  return (
    <View className="flex-1 bg-[#1a1a2e]"> 
       {/* Dark Background for Player Mode */}
       <LinearGradient
        colors={['#4c1d95', '#1a1a2e']}
        className="absolute top-0 w-full h-full opacity-80"
       />

       <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-2 mb-6">
             <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-down" size={30} color="white" />
             </TouchableOpacity>
             <Text className="text-white font-bold text-xs uppercase tracking-widest">Playing From Playlist</Text>
             <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
             </TouchableOpacity>
          </View>

          {/* Album Art */}
          <View className="items-center justify-center mb-8 px-8">
             <View className="w-full aspect-square bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                {/* <Image source={{ uri: '...' }} className="w-full h-full" /> */}
                <View className="w-full h-full bg-violet-800 items-center justify-center">
                    <Ionicons name="book" size={80} color="white" />
                </View>
             </View>
          </View>

          {/* Title Info */}
          <View className="px-8 mb-6 flex-row justify-between items-center">
             <View>
                <Text className="text-white text-2xl font-bold mb-1">Atomic Habits</Text>
                <Text className="text-gray-400 text-lg">James Clear</Text>
             </View>
             <TouchableOpacity>
                <Ionicons name="heart" size={28} color="#10b981" /> 
             </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View className="px-8 mb-2">
             <Slider 
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#ffffff"
                maximumTrackTintColor="#555555"
                thumbTintColor="#ffffff"
             />
             <View className="flex-row justify-between -mt-2">
                <Text className="text-xs text-gray-400">1:13</Text>
                <Text className="text-xs text-gray-400">-2:47</Text>
             </View>
          </View>

          {/* Controls */}
          <View className="flex-row justify-between items-center px-8 mb-8">
             <Ionicons name="shuffle" size={24} color="#10b981" />
             <Ionicons name="play-skip-back" size={30} color="white" />
             <TouchableOpacity 
                onPress={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 bg-white rounded-full items-center justify-center"
             >
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="black" style={{marginLeft: isPlaying ? 0 : 4}}/>
             </TouchableOpacity>
             <Ionicons name="play-skip-forward" size={30} color="white" />
             <Ionicons name="repeat" size={24} color="gray" />
          </View>

          {/* Summary / Lyrics Section */}
          <View className="flex-1 bg-[#2D2245] rounded-t-3xl mx-4 p-6 shadow-2xl">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-bold uppercase tracking-widest">Summary</Text>
                <TouchableOpacity className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">Full Text</Text>
                </TouchableOpacity>
             </View>
             
             <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-white text-xl font-bold leading-8">
                    "Small changes often appear to make no difference until you cross a critical threshold. The most powerful outcomes of any compounding process are delayed. You need to be patient."
                </Text>
                <Text className="text-gray-400 text-lg leading-8 mt-4">
                    This implies that habits are the compound interest of self-improvement...
                </Text>
                <View className="h-20" /> 
             </ScrollView>
          </View>

          {/* QUIZ BUTTON (Floating) */}
          <View className="absolute bottom-8 w-full items-center">
             <TouchableOpacity 
                onPress={() => router.push(`/quiz/${id}`)}
                className="bg-violet-600 px-8 py-3 rounded-full shadow-lg shadow-violet-500 border border-violet-400"
             >
                <Text className="text-white font-bold text-lg">🧠 Take Quiz</Text>
             </TouchableOpacity>
          </View>

       </SafeAreaView>
    </View>
  );
}