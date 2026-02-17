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

  // Initialize animated values once
  useEffect(() => {
    if (lines.length > 0) {
      animatedValues.length = 0;
      lines.forEach(() => {
        animatedValues.push(new Animated.Value(0.3));
      });
    }
  }, [lines.length]);

  // Animate highlight + auto scroll
  useEffect(() => {
    animatedValues.forEach((anim, index) => {
      let toValue = 0.3;

      if (index === currentLineIndex) toValue = 1;
      else if (index < currentLineIndex) toValue = 0.5;

      Animated.timing(anim, {
        toValue,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });

    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: currentLineIndex * 36,
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
              <Ionicons name="school" size={14} color="white" style={{marginRight: 4}} />
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
                style={{marginLeft: isPlaying ? 0 : 4}}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => skipTime(10)}>
              <Ionicons name="play-forward" size={28} color="white" />
              <Text className="text-[10px] text-gray-400 text-center -mt-1">+10s</Text>
            </TouchableOpacity>
          </View>

          {/* SUMMARY SECTION */}
          <View className="flex-1 bg-[#2D2245] rounded-t-3xl mx-4 p-6">
            <Text className="text-white font-bold uppercase tracking-widest text-xs mb-4">
              Summary Text
            </Text>

            {lines.length > 0 ? (
              lines.map((line: string, index: number) => {
                const scale = animatedValues[index]
                  ? animatedValues[index].interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [1, 1.05],
                    })
                  : 1;

                return (
                  <Animated.Text
                    key={index}
                    className="text-white text-lg font-medium leading-8"
                    style={{
                      opacity: animatedValues[index] || 0.3,
                      transform: [{ scale }],
                      marginBottom: 6,
                    }}
                  >
                    {line}
                  </Animated.Text>
                );
              })
            ) : (
              <Text className="text-gray-400 text-center mt-4">
                No text content available.
              </Text>
            )}

            <View className="h-20" />
          </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
