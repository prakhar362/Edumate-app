// app/summary/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { SummaryAPI } from '@/api/summarize.service';
import { PlaylistAPI } from '@/api/playlist.service';

// IMPORT ZUSTAND STORE
import { usePlayerStore } from '@/store/player.store';

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

  // --- ZUSTAND STORE ---
  const {
    currentTrack,
    isPlaying,
    duration,
    position: globalPos,
    togglePlayPause,
    seekBy,
    seekTo,
    loadTrack
  } = usePlayerStore();

  // ---------------- STATE ----------------
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isSeeking) setPosition(globalPos);
  }, [globalPos, isSeeking]);

  const [modalVisible, setModalVisible] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const lineLayouts = useRef<{ y: number, height: number }[]>([]);
  const animatedValues = useRef<Animated.Value[]>([]).current;

  // --- BUG FIX: Lazy initialize animations safely ---
  const getAnimValue = (index: number) => {
    if (!animatedValues[index]) {
      animatedValues[index] = new Animated.Value(0.1);
    }
    return animatedValues[index];
  };

  // ---------------- FETCH + LOAD ----------------
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const summaryId = Array.isArray(id) ? id[0] : id;
        const res = await SummaryAPI.getSummary(summaryId);
        const summaryData = res.data;

        setQuizId(summaryData?.quiz_id);
        setData(summaryData);
        setCustomName(summaryData?.name || "");

        // Check if global store is already playing THIS track. 
        // If not, load it into the store!
        if (summaryData?.audio_path && currentTrack?.id !== summaryId) {
          await loadTrack({
            id: summaryId,
            title: summaryData.name || "Untitled Summary",
            subtitle: summaryData.pdf_url ? "PDF Source" : "Text Source",
            audioUrl: summaryData.audio_path
          });
        }
      } catch (error) {
        Alert.alert("Error", "Could not load summary.");
      } finally {
        setLoading(false);
      }
    };

    if (id) init();
  }, [id]);

  const handleSeekComplete = async (value: number) => {
    await seekTo(value);
    setIsSeeking(false);
  };

  // ---------------- PLAYLIST LOGIC ----------------
  const openPlaylistModal = async () => {
    setModalVisible(true);
    setLoadingPlaylists(true);
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
    if (!selectedPlaylistId) return Alert.alert("Required", "Please select a playlist first.");
    setIsAdding(true);
    try {
      const summaryId = Array.isArray(id) ? id[0] : id;
      const payload = {
        name: customName || data?.name || "Untitled Summary",
        summary_id: summaryId,
        quiz_id: quizId || "",
        pdf_url: data?.pdf_url || "",
        audio_path: data?.audio_path || ""
      };
      await PlaylistAPI.addItem(selectedPlaylistId, payload);
      setModalVisible(false);
      Alert.alert("Success", "Added to playlist successfully!");
    } catch (error) {
      Alert.alert("Error", "Could not add item to playlist.");
    } finally {
      setIsAdding(false);
    }
  };

  // ---------------- CONSTANTS & SCROLL ----------------
  const CONTAINER_HEIGHT = 320;
  const lines = data?.summary?.replace(/\*/g, '')?.split('\n')?.filter((line: string) => line.trim() !== '') || [];
  const lineDuration = duration && lines.length ? duration / lines.length : 0;
  const currentLineIndex = lineDuration ? Math.floor(position / lineDuration) : 0;

  useEffect(() => {
    if (lines.length === 0) return;

    // BUG FIX: Animate using the safely generated values
    lines.forEach((_, index) => {
      const anim = getAnimValue(index);
      const distance = Math.abs(index - currentLineIndex);
      let targetValue = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.1;
      Animated.spring(anim, { toValue: targetValue, useNativeDriver: true, friction: 8, tension: 40 }).start();
    });

    if (lyricsScrollRef.current && currentLineIndex >= 0) {
      const currentLayout = lineLayouts.current[currentLineIndex];
      if (currentLayout) {
        const scrollPos = currentLayout.y - (CONTAINER_HEIGHT / 2) + (currentLayout.height / 2);
        lyricsScrollRef.current.scrollTo({ y: Math.max(0, scrollPos), animated: true });
      }
    }
  }, [currentLineIndex, lines.length]);

  if (loading) {
    return <View className="flex-1 bg-[#1a1a2e] items-center justify-center"><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  }

  // ---------------- UI ----------------
  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient colors={['#4c1d95', '#1a1a2e']} className="absolute top-0 w-full h-full opacity-80" />

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

            <TouchableOpacity onPress={() => router.push(`/quiz/${id}`)} className="bg-violet-600 px-3 py-2 rounded-full flex-row items-center">
              <Ionicons name="school" size={16} color="white" style={{ marginRight: 4 }} />
              <Text className="text-white font-bold text-md">Quiz</Text>
            </TouchableOpacity>
          </View>

          {/* ALBUM ART */}
          <View className="items-center justify-center mb-6 px-8">
            <View className="w-full aspect-square bg-gray-800 rounded-2xl overflow-hidden border border-white/10">
              <View className="w-full h-full bg-violet-800 items-center justify-center">
                <Ionicons name="book" size={80} color="white" />
                <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>{data?.name || "Edumate Summary"}</Text>
              </View>
            </View>
          </View>

          {/* TITLE & ADD BUTTON */}
          <View className="px-8 mb-6 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>{data?.name || "Untitled"}</Text>
              <Text className="text-gray-400 text-sm font-medium">AI Generated • {data?.pdf_url ? "PDF Source" : "Text Source"}</Text>
            </View>
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
              onSlidingComplete={handleSeekComplete}
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
            <TouchableOpacity onPress={() => seekBy(-10)}>
              <Ionicons name="play-back" size={28} color="white" />
              <Text className="text-[10px] text-gray-400 text-center -mt-1">-10s</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} className="w-16 h-16 bg-white rounded-full items-center justify-center">
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="black" style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => seekBy(10)}>
              <Ionicons name="play-forward" size={28} color="white" />
              <Text className="text-[10px] text-gray-400 text-center -mt-1">+10s</Text>
            </TouchableOpacity>
          </View>

          {/* LYRICS CARD */}
          <View className="mx-4 rounded-[32px] overflow-hidden mb-10" style={{ backgroundColor: '#4c1d95', height: CONTAINER_HEIGHT }}>
            <View className="flex-row justify-between items-center px-6 pt-5 pb-2 z-10 bg-[#4c1d95]">
              <Text className="text-white/80 font-black uppercase tracking-widest text-[12px]">Text Summary</Text>
              <View className="bg-black/20 flex-row items-center px-3 py-1.5 rounded-full">
                <Text className="text-white text-[12px] font-bold tracking-wider">More</Text>
              </View>
            </View>

            <ScrollView
              ref={lyricsScrollRef}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 40, paddingBottom: CONTAINER_HEIGHT / 5, paddingHorizontal: 24 }}
            >
              {lines.length > 0 ? (
                lines.map((line: string, index: number) => {
                  // SAFELY GET ANIMATION VALUE DURING RENDER
                  const anim = getAnimValue(index);

                  return (
                    <Animated.Text
                      key={index}
                      onLayout={(event) => {
                        const { y, height } = event.nativeEvent.layout;
                        lineLayouts.current[index] = { y, height };
                      }}
                      style={{
                        opacity: anim,
                        transform: [{ scale: anim.interpolate({ inputRange: [0.1, 1], outputRange: [0.98, 1.05] }) }],
                        color: anim.interpolate({ inputRange: [0.1, 1], outputRange: ['rgba(255, 255, 255, 0.4)', '#FFFFFF'] }),
                        marginBottom: 20, textAlignVertical: 'center', fontSize: 22, fontWeight: '700', lineHeight: 32
                      }}
                    >
                      {line}
                    </Animated.Text>
                  );
                })
              ) : (
                <View className="py-10 items-center"><Text className="text-white/50 text-base">Summary not available</Text></View>
              )}
            </ScrollView>
          </View>

        </SafeAreaView>
      </ScrollView>

      {/* --- ADD TO PLAYLIST MODAL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
            <View className="bg-white rounded-t-3xl p-6 h-[60%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-slate-900">Add to Playlist</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text className="label font-semibold mb-2 text-slate-700">Select Playlist</Text>

              <View className="mb-4 z-50">
                <TouchableOpacity onPress={() => setIsDropdownOpen(!isDropdownOpen)} className="flex-row items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <Text className="font-medium text-slate-700">{getSelectedName()}</Text>
                  <Text className="text-slate-500 text-xs">{isDropdownOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View className="absolute top-12 left-0 right-0 max-h-40 border border-slate-200 rounded-xl bg-white shadow-lg z-50 overflow-hidden">
                    <ScrollView nestedScrollEnabled className="max-h-40">
                      {playlists.map((p) => (
                        <TouchableOpacity
                          key={p._id || p.id}
                          onPress={() => { setSelectedPlaylistId(p._id || p.id); setIsDropdownOpen(false); }}
                          className={`p-3 border-b border-slate-100 ${selectedPlaylistId === (p._id || p.id) ? "bg-violet-100" : ""}`}
                        >
                          <Text className={`font-medium ${selectedPlaylistId === (p._id || p.id) ? "text-violet-700" : "text-slate-600"}`}>
                            {p.title || p.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text className="label font-semibold mb-2 text-slate-700">Display Name</Text>
              <TextInput
                className="input-field mb-6 border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-800"
                placeholder="Name for this item"
                value={customName}
                onChangeText={setCustomName}
              />

              <TouchableOpacity onPress={handleAddItem} disabled={isAdding} className="bg-violet-600 py-4 rounded-xl items-center shadow-lg shadow-violet-200 mt-auto mb-4">
                {isAdding ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Add Item</Text>}
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}