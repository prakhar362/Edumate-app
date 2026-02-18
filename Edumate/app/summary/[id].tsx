import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { SummaryAPI } from '@/api/summarize.service';

const { height } = Dimensions.get('window');

const formatTime = (millis: number) => {
  if (!millis) return "0:00";
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

export default function SummaryPlayer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const lyricsScrollRef = useRef<ScrollView>(null);

  // ---------------- STATE ----------------
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const animatedValues = useRef<Animated.Value[]>([]).current;

  // ---------------- FETCH + LOAD ----------------
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const summaryId = Array.isArray(id) ? id[0] : id;
        const res = await SummaryAPI.getSummary(summaryId);
        const summaryData = res.data;
        setData(summaryData);

        if (summaryData?.audio_path) {
          await loadAudio(summaryData.audio_path);
        }
      } catch (error) {
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

  // ---------------- AUDIO ----------------
  const loadAudio = async (url: string) => {
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
  };

  // ---------------- LINE SYNC LOGIC ----------------
  const lines =
    data?.summary
      ?.replace(/\*/g, '')
      ?.split('\n')
      ?.filter((line: string) => line.trim() !== '') || [];

  const lineDuration =
    duration && lines.length ? duration / lines.length : 0;

  const currentLineIndex =
    lineDuration ? Math.floor(position / lineDuration) : 0;

  // Initialize animated values
  useEffect(() => {
    if (lines.length > 0) {
      animatedValues.length = 0;
      lines.forEach(() => {
        animatedValues.push(new Animated.Value(0)); // 0 = inactive, 1 = active
      });
    }
  }, [lines.length]);

  // Animate highlight + auto scroll
  useEffect(() => {
    animatedValues.forEach((anim, index) => {
      const isActive = index === currentLineIndex;

      Animated.timing(anim, {
        toValue: isActive ? 1 : 0,
        duration: 400, // Smooth transition
        useNativeDriver: true,
      }).start();
    });

    // Auto-scroll logic to keep active line near top/middle
    if (lyricsScrollRef.current && currentLineIndex >= 0) {
      // Approximate height of a line (font size + margin) ~ 50px
      // We subtract a buffer to keep the active line not at the very top
      const scrollPos = currentLineIndex * 50;
      lyricsScrollRef.current.scrollTo({
        y: Math.max(0, scrollPos - 100), // Keep active line slightly down from top
        animated: true,
      });
    }
  }, [currentLineIndex]);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <View className="flex-1 bg-[#1a1a2e] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  // ---------------- UI ----------------
  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient
        colors={['#4c1d95', '#1a1a2e']}
        className="absolute top-0 w-full h-full opacity-80"
      />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <SafeAreaView className="flex-1">

          {/* HEADER */}
          <View className="flex-row justify-between items-center px-6 pt-2 mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-down" size={30} color="white" />
            </TouchableOpacity>

            <Text className="text-white/70 font-bold text-xs uppercase tracking-widest">
              AI Audio Summary
            </Text>

            <TouchableOpacity
              onPress={() => router.push(`/quiz/${id}`)}
              className="bg-emerald-500 px-3 py-1.5 rounded-full flex-row items-center"
            >
              <Ionicons name="school" size={14} color="white" style={{ marginRight: 4 }} />
              <Text className="text-white font-bold text-xs">Quiz</Text>
            </TouchableOpacity>
          </View>

          {/* ALBUM */}
          <View className="items-center justify-center mb-6 px-8">
            <View className="w-full aspect-square bg-gray-800 rounded-2xl overflow-hidden border border-white/10">
              <View className="w-full h-full bg-violet-800 items-center justify-center">
                <Ionicons name="book" size={80} color="white" />
              </View>
            </View>
          </View>

          {/* TITLE */}
          <View className="px-8 mb-6 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>
                {data?.name || "Untitled"}
              </Text>
              <Text className="text-gray-400 text-sm font-medium">
                AI Generated • {data?.pdf_url ? "PDF Source" : "Text Source"}
              </Text>
            </View>

            <TouchableOpacity onPress={addToPlaylist}>
              <View className="w-10 h-10 rounded-full border border-gray-400 items-center justify-center">
                <Ionicons name="add" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* PROGRESS */}
          <View className="px-8 mb-2">
            <Slider
              style={{ width: '100%', height: 40 }}
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
              <Text className="text-xs text-gray-400 font-medium">
                {formatTime(position)}
              </Text>
              <Text className="text-xs text-gray-400 font-medium">
                -{formatTime(duration - position)}
              </Text>
            </View>
          </View>

          {/* CONTROLS */}
          <View className="flex-row justify-center items-center gap-8 px-8 mb-8">
            <TouchableOpacity onPress={() => skipTime(-10)}>
              <Ionicons name="play-back" size={28} color="white" />
              <Text className="text-[10px] text-gray-400 text-center -mt-1">-10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayback}
              className="w-16 h-16 bg-white rounded-full items-center justify-center"
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color="black"
                style={{ marginLeft: isPlaying ? 0 : 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => skipTime(10)}>
              <Ionicons name="play-forward" size={28} color="white" />
              <Text className="text-[10px] text-gray-400 text-center -mt-1">+10s</Text>
            </TouchableOpacity>
          </View>

          {/* SUMMARY SECTION */}
          {/* LYRICS CARD (The requested UI improvement) */}
          <View
            className="mx-4 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#4c1d95', // The specific slate/teal from the image
              minHeight: height * 0.10
            }}
          >
            {/* Card Header */}
            <View className="flex-row justify-between items-center px-5 pt-5 pb-2">
              <Text className="text-white font-bold text-lg">Lyrics</Text>

              <View className="bg-black/30 flex-row items-center px-3 py-1.5 rounded-full">
                <Text className="text-white text-[10px] font-bold tracking-wider mr-1">MORE</Text>
                <Ionicons name="expand-outline" size={16} color="white" />
              </View>
            </View>

            {/* Scrollable Text Area */}
            <ScrollView
              ref={lyricsScrollRef}
              nestedScrollEnabled={true}
              className="px-5 mb-5"
              showsVerticalScrollIndicator={false}
            >
              {lines.length > 0 ? (
                lines.map((line: string, index: number) => {
                  // Interpolate values for smooth transitions
                  const opacity = animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1], // Inactive 0.5, Active 1.0
                  });

                  const scale = animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1.05], // Subtle scale up for active
                  });

                  // Conditional styling for the "Active" line color/shadow
                  const color = animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#A0B3BB', '#FFFFFF'] // Grey-ish blue to Pure White
                  });

                  return (
                    <Animated.Text
                      key={index}
                      className="font-bold text-2xl mb-6 leading-9"
                      style={{
                        opacity,
                        transform: [{ scale }],
                        color: color
                      }}
                    >
                      {line}
                    </Animated.Text>
                  );
                })
              ) : (
                <View className="py-10 items-center">
                  <Text className="text-white/50 text-base">Lyrics not available</Text>
                </View>
              )}
              <View className="h-10" />
            </ScrollView>
          </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
