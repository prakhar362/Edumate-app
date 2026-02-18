import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { SummaryAPI } from '@/api/summarize.service';
import { PlaylistAPI } from '@/api/playlist.service';

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

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Playlist Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Dropdown & Form State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Layout & Animation Refs
  const lineLayouts = useRef<{ y: number, height: number }[]>([]);
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
        // Set default name for the input field
        setCustomName(summaryData?.name || "");

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

  // ---------------- PLAYLIST LOGIC ----------------

  const openPlaylistModal = async () => {
    setModalVisible(true);
    setLoadingPlaylists(true);
    // Reset form
    setSelectedPlaylistId(null);
    setIsDropdownOpen(false);
    setCustomName(data?.name || "");

    try {
      const res = await PlaylistAPI.getPlayLists();
      setPlaylists(res.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const getSelectedName = () => {
    if (!selectedPlaylistId) return "Select a playlist...";
    const pl = playlists.find(p => (p._id || p.id) === selectedPlaylistId);
    return pl ? (pl.title || pl.name) : "Select a playlist...";
  };

  const handleAddItem = async () => {
    if (!selectedPlaylistId) {
      Alert.alert("Required", "Please select a playlist first.");
      return;
    }

    setIsAdding(true);
    try {
      const summaryId = Array.isArray(id) ? id[0] : id;

      const payload = {
        name: customName || data?.name || "Untitled Summary",
        summary_id: summaryId,
        quiz_id: data?.quiz_id || "",
        pdf_url: data?.pdf_url || "",
        audio_path: data?.audio_path || ""
      };

      await PlaylistAPI.addItem(selectedPlaylistId, payload);

      setModalVisible(false);
      Alert.alert("Success", "Added to playlist successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not add item to playlist.");
    } finally {
      setIsAdding(false);
    }
  };

  // ---------------- CONSTANTS & SCROLL ----------------
  const CONTAINER_HEIGHT = 320;

  const lines =
    data?.summary
      ?.replace(/\*/g, '')
      ?.split('\n')
      ?.filter((line: string) => line.trim() !== '') || [];

  const lineDuration =
    duration && lines.length ? duration / lines.length : 0;

  const currentLineIndex =
    lineDuration ? Math.floor(position / lineDuration) : 0;

  useEffect(() => {
    if (lines.length > 0) {
      if (animatedValues.length !== lines.length) {
        animatedValues.length = 0;
        lines.forEach(() => {
          animatedValues.push(new Animated.Value(0.1));
        });
      }
    }
  }, [lines.length]);

  useEffect(() => {
    if (animatedValues.length === 0) return;

    animatedValues.forEach((anim, index) => {
      const distance = Math.abs(index - currentLineIndex);
      let targetValue = 0.1;
      if (distance === 0) targetValue = 1;
      else if (distance === 1) targetValue = 0.4;

      Animated.spring(anim, {
        toValue: targetValue,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    });

    if (lyricsScrollRef.current && currentLineIndex >= 0) {
      const currentLayout = lineLayouts.current[currentLineIndex];
      if (currentLayout) {
        const scrollPos = currentLayout.y - (CONTAINER_HEIGHT / 2) + (currentLayout.height / 2);
        lyricsScrollRef.current.scrollTo({
          y: Math.max(0, scrollPos),
          animated: true,
        });
      }
    }
  }, [currentLineIndex, lines.length]);

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

          {/* ALBUM ART */}
          <View className="items-center justify-center mb-6 px-8">
            <View className="w-full aspect-square bg-gray-800 rounded-2xl overflow-hidden border border-white/10">
              <View className="w-full h-full bg-violet-800 items-center justify-center">
                <Ionicons name="book" size={80} color="white" />
              </View>
            </View>
          </View>

          {/* TITLE & ADD BUTTON */}
          <View className="px-8 mb-6 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>
                {data?.name || "Untitled"}
              </Text>
              <Text className="text-gray-400 text-sm font-medium">
                AI Generated • {data?.pdf_url ? "PDF Source" : "Text Source"}
              </Text>
            </View>

            {/* ADD TO PLAYLIST BUTTON */}
            <TouchableOpacity onPress={openPlaylistModal}>
              <View className="w-10 h-10 rounded-full border border-gray-400 items-center justify-center">
                <Ionicons name="add" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* PROGRESS SLIDER */}
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
              <Text className="text-xs text-gray-400 font-medium">{formatTime(position)}</Text>
              <Text className="text-xs text-gray-400 font-medium">-{formatTime(duration - position)}</Text>
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

          {/* LYRICS CARD */}
          <View
            className="mx-4 rounded-[32px] overflow-hidden mb-10"
            style={{
              backgroundColor: '#4c1d95',
              height: CONTAINER_HEIGHT
            }}
          >
            <View className="flex-row justify-between items-center px-6 pt-5 pb-2 z-10 bg-[#4c1d95]">
              <Text className="text-white/80 font-black uppercase tracking-widest text-[10px]">
                Teleprompter Sync
              </Text>
              <View className="bg-black/20 flex-row items-center px-3 py-1.5 rounded-full">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                <Text className="text-white text-[10px] font-bold tracking-wider">LIVE</Text>
              </View>
            </View>

            <ScrollView
              ref={lyricsScrollRef}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 40,
                paddingBottom: CONTAINER_HEIGHT / 5,
                paddingHorizontal: 24
              }}
            >
              {lines.length > 0 ? (
                lines.map((line: string, index: number) => (
                  <Animated.Text
                    key={index}
                    onLayout={(event) => {
                      const { y, height } = event.nativeEvent.layout;
                      lineLayouts.current[index] = { y, height };
                    }}
                    style={{
                      opacity: animatedValues[index],
                      transform: [{
                        scale: animatedValues[index].interpolate({
                          inputRange: [0.1, 1],
                          outputRange: [0.98, 1.05]
                        })
                      }],
                      color: animatedValues[index].interpolate({
                        inputRange: [0.1, 1],
                        outputRange: ['rgba(255, 255, 255, 0.4)', '#FFFFFF']
                      }),
                      marginBottom: 20,
                      textAlignVertical: 'center',
                      fontSize: 22,
                      fontWeight: '700',
                      lineHeight: 32
                    }}
                  >
                    {line}
                  </Animated.Text>
                ))
              ) : (
                <View className="py-10 items-center">
                  <Text className="text-white/50 text-base">Summary not available</Text>
                </View>
              )}
            </ScrollView>
          </View>

        </SafeAreaView>
      </ScrollView>

      {/* --- ADD TO PLAYLIST MODAL WITH DROPDOWN --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
            <View className="bg-white rounded-t-3xl p-6 h-[60%]">

              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-slate-900">Add to Playlist</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Dropdown Label */}
              <Text className="label font-semibold mb-2 text-slate-700">Select Playlist</Text>

              {/* --- DROPDOWN CONTAINER --- */}
              <View className="mb-4 z-50">
                {/* Dropdown Header */}
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex-row items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <Text className="font-medium text-slate-700">
                    {getSelectedName()}
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    {isDropdownOpen ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {/* Dropdown List (Visible only when open) */}
                {isDropdownOpen && (
                  <View className="absolute top-12 left-0 right-0 max-h-40 border border-slate-200 rounded-xl bg-white shadow-lg z-50 overflow-hidden">
                    <ScrollView nestedScrollEnabled className="max-h-40">
                      {playlists.map((p) => (
                        <TouchableOpacity
                          key={p._id || p.id}
                          onPress={() => {
                            setSelectedPlaylistId(p._id || p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-3 border-b border-slate-100 ${selectedPlaylistId === (p._id || p.id) ? "bg-violet-100" : ""
                            }`}
                        >
                          <Text className={`font-medium ${selectedPlaylistId === (p._id || p.id) ? "text-violet-700" : "text-slate-600"
                            }`}>
                            {p.title || p.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {playlists.length === 0 && (
                        <Text className="p-4 text-slate-400 text-center">No playlists found.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Display Name Input */}
              <Text className="label font-semibold mb-2 text-slate-700">Display Name</Text>
              <TextInput
                className="input-field mb-6 border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-800"
                placeholder="Name for this item"
                value={customName}
                onChangeText={setCustomName}
              />

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAddItem}
                disabled={isAdding}
                className="bg-violet-600 py-4 rounded-xl items-center shadow-lg shadow-violet-200 mt-auto mb-4"
              >
                {isAdding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Add Item</Text>
                )}
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}