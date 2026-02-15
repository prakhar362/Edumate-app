import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
  const router = useRouter();

  // Reusable Section Component
  const Section = ({ title, data, horizontal = true }) => (
    <View className="mb-8">
      <Text className="text-gray-900 text-xl font-bold mb-4 px-6">{title}</Text>
      <ScrollView 
        horizontal={horizontal} 
        showshorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {data.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className={`mr-4 ${horizontal ? 'w-36' : 'w-full mb-4 flex-row items-center'}`}
            onPress={() => router.push(item.type === 'playlist' ? `/playlist/${item.id}` : `/summary/${item.id}`)}
          >
            <View className={`${horizontal ? 'w-36 h-36 mb-2' : 'w-16 h-16 mr-4'} bg-gray-200 rounded-xl overflow-hidden`}>
               {/* Replace with <Image source={{ uri: item.image }} /> */}
               <View className="w-full h-full bg-violet-100 items-center justify-center">
                  <Ionicons name="musical-notes" size={30} color="#7c3aed" />
               </View>
            </View>
            <View className={horizontal ? '' : 'flex-1'}>
                <Text className="font-bold text-gray-800" numberOfLines={1}>{item.title}</Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      {/* Header Background */}
      <LinearGradient
        colors={['#3b1f77', '#5e35b1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute top-0 w-full h-64 rounded-b-[40px]"
      />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="px-6 pt-4 pb-6 flex-row justify-between items-center">
            <View>
              <Text className="text-violet-200 font-bold text-lg">Good Morning</Text>
              <Text className="text-white text-3xl font-bold">Prakhar 👋</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
               <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md border border-white/30">
                 <Ionicons name="person" size={20} color="white" />
               </View>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="mx-6 mb-8 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex-row items-center backdrop-blur-md">
             <Ionicons name="search" size={20} color="white" />
             <Text className="ml-3 text-white/70 font-medium">What do you want to learn today?</Text>
          </View>

          {/* 1. Perfect For You (Playlists/Mixes) */}
          <Section 
            title="Perfect for you" 
            data={[
                { id: '1', title: 'Tech Trends', subtitle: 'Daily Mix 1', type: 'playlist' },
                { id: '2', title: 'Philosophy', subtitle: 'Deep Dive', type: 'playlist' },
                { id: '3', title: 'Startup 101', subtitle: 'Essential Listen', type: 'playlist' },
            ]} 
          />

          {/* 2. Your Top Mixes */}
          <Section 
            title="Your top mixes" 
            data={[
                { id: '4', title: 'Coding Chill', subtitle: 'Focus Mode', type: 'playlist' },
                { id: '5', title: 'React Native', subtitle: 'Mastery Series', type: 'playlist' },
            ]} 
          />

           {/* 3. Daily Playlist (Vertical List) */}
           <View className="px-6">
              <Text className="text-gray-900 text-xl font-bold mb-4">Daily Playlist</Text>
              {[1, 2, 3].map((i) => (
                  <TouchableOpacity 
                    key={i} 
                    className="flex-row items-center mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100"
                    onPress={() => router.push(`/summary/${i}`)}
                  >
                     <View className="w-14 h-14 bg-violet-100 rounded-xl items-center justify-center mr-4">
                        <Ionicons name="play" size={20} color="#7c3aed" />
                     </View>
                     <View className="flex-1">
                        <Text className="font-bold text-gray-800">Atomic Habits - Chapter {i}</Text>
                        <Text className="text-xs text-gray-500">James Clear • 15 mins</Text>
                     </View>
                     <Ionicons name="heart-outline" size={24} color="#9ca3af" />
                  </TouchableOpacity>
              ))}
           </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}