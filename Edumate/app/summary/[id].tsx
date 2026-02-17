import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { SummaryAPI } from '@/api/summarize.service'; // Ensure path is correct

const { height } = Dimensions.get('window');

// Helper: Format milliseconds to MM:SS
const formatTime = (millis: number) => {
  if (!millis) return "0:00";
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

export default function SummaryPlayer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // --- Data State ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Audio State ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // 1. Fetch Data & Load Audio
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const summaryId = Array.isArray(id) ? id[0] : id;
        
        // Fetch from API
        const res = await SummaryAPI.getSummary(summaryId);
        const summaryData = res.data;
        setData(summaryData);

        // Load Audio if available
        if (summaryData?.audio_path) {
          await loadAudio(summaryData.audio_path);
        }
      } catch (error) {
        console.error("Error loading summary:", error);
        Alert.alert("Error", "Could not load summary.");
      } finally {
        setLoading(false);
      }
    };

    if (id) init();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [id]);

  // 2. Audio Helpers
  const loadAudio = async (url: string) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (e) {
      console.log("Audio Load Error:", e);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      if (!isSeeking) setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const skipTime = async (seconds: number) => {
    if (!sound) return;
    const newPos = position + seconds * 1000;
    await sound.setPositionAsync(Math.max(0, Math.min(newPos, duration)));
  };

  const handleSeek = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
    setIsSeeking(false);
  };

  const addToPlaylist = () => {
    Alert.alert("Add to Playlist", "Opening playlist selection...");
    // router.push(`/create/add-item?summaryId=${data._id}`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#1a1a2e] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1a1a2e]"> 
       {/* Background */}
       <LinearGradient
        colors={['#4c1d95', '#1a1a2e']}
        className="absolute top-0 w-full h-full opacity-80"
       />

       <SafeAreaView className="flex-1">
          {/* --- Header --- */}
          <View className="flex-row justify-between items-center px-6 pt-2 mb-6">
             <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-down" size={30} color="white" />
             </TouchableOpacity>
             
             <Text className="text-white/70 font-bold text-xs uppercase tracking-widest">
                AI Audio Summary
             </Text>

             {/* Quiz Button (Top Right - Replacing 3 dots) */}
             <TouchableOpacity 
                onPress={() => router.push(`/quiz/${id}`)}
                className="bg-emerald-500 px-3 py-1.5 rounded-full flex-row items-center"
             >
                <Ionicons name="school" size={14} color="white" style={{marginRight: 4}} />
                <Text className="text-white font-bold text-xs">Quiz</Text>
             </TouchableOpacity>
          </View>

          {/* --- Album Art --- */}
          <View className="items-center justify-center mb-6 px-8">
             <View className="w-full aspect-square bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                <View className="w-full h-full bg-violet-800 items-center justify-center">
                    <Ionicons name="book" size={80} color="white" />
                </View>
             </View>
          </View>

          {/* --- Title & Add Button --- */}
          <View className="px-8 mb-6 flex-row justify-between items-center">
             <View className="flex-1 mr-4">
                <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>
                    {data?.name || "Untitled"}
                </Text>
                <Text className="text-gray-400 text-sm font-medium">
                    AI Generated • {data?.pdf_url ? "PDF Source" : "Text Source"}
                </Text>
             </View>
             
             {/* Add to Playlist (+ Icon replacing Heart) */}
             <TouchableOpacity onPress={addToPlaylist}>
                <View className="w-10 h-10 rounded-full border border-gray-400 items-center justify-center">
                    <Ionicons name="add" size={24} color="white" />
                </View>
             </TouchableOpacity>
          </View>

          {/* --- Progress Bar --- */}
          <View className="px-8 mb-2">
             <Slider 
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onValueChange={(val) => { setIsSeeking(true); setPosition(val); }}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#ffffff"
                maximumTrackTintColor="#555555"
                thumbTintColor="#ffffff"
             />
             <View className="flex-row justify-between -mt-2">
                <Text className="text-xs text-gray-400 font-medium">{formatTime(position)}</Text>
                <Text className="text-xs text-gray-400 font-medium">-{formatTime(duration - position)}</Text>
             </View>
          </View>

          {/* --- Controls (+10 / -10) --- */}
          <View className="flex-row justify-center items-center gap-8 px-8 mb-8">
             {/* -10 Seconds */}
             <TouchableOpacity onPress={() => skipTime(-10)}>
                <Ionicons name="play-back" size={28} color="white" />
                <Text className="text-[10px] text-gray-400 text-center -mt-1">-10s</Text>
             </TouchableOpacity>

             {/* Play/Pause */}
             <TouchableOpacity 
                onPress={togglePlayback}
                className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg shadow-white/20"
             >
                <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={32} 
                    color="black" 
                    style={{marginLeft: isPlaying ? 0 : 4}}
                />
             </TouchableOpacity>

             {/* +10 Seconds */}
             <TouchableOpacity onPress={() => skipTime(10)}>
                <Ionicons name="play-forward" size={28} color="white" />
                <Text className="text-[10px] text-gray-400 text-center -mt-1">+10s</Text>
             </TouchableOpacity>
          </View>

          {/* --- Summary / Text Section --- */}
          <View className="flex-1 bg-[#2D2245] rounded-t-3xl mx-4 p-6 shadow-2xl">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-bold uppercase tracking-widest text-xs">
                    Summary Text
                </Text>
                <TouchableOpacity className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-bold">Auto-Scroll</Text>
                </TouchableOpacity>
             </View>
             
             <ScrollView showsVerticalScrollIndicator={false}>
                {data?.summary ? (
                    <Text className="text-white text-lg font-medium leading-8">
                        {data.summary.replace(/\*/g, '•').replace(/\n\n/g, '\n')}
                    </Text>
                ) : (
                    <Text className="text-gray-400 text-center mt-4">No text content available.</Text>
                )}
                <View className="h-20" /> 
             </ScrollView>
          </View>

       </SafeAreaView>
    </View>
  );
}