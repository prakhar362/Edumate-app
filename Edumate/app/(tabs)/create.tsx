import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";

// Services
import { PlaylistAPI } from "@/api/playlist.service";
import { SummaryAPI } from "@/api/summarize.service";
import { useAuthStore } from "@/store/auth.store";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // --- Global State ---
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]); // Kept for consistency with your useEffect
  const [userDetails, setUserDetails] = useState<any>(null);

  // --- Modal Visibility State ---
  const [modalType, setModalType] = useState<"playlist" | "upload" | "summarize" | null>(null);

  // --- Form States ---
  // 1. Create Playlist
  const [plTitle, setPlTitle] = useState("");
  const [plDesc, setPlDesc] = useState("");

  // 2. Upload Item
  const [selectedPlId, setSelectedPlId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [uploadName, setUploadName] = useState("");

  // 3. Summarize PDF
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [pdfName, setPdfName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1. Logic to set the default first item
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlId) {
      const firstPlaylist = playlists[0];
      setSelectedPlId(firstPlaylist._id || firstPlaylist.id);
    }
  }, [playlists]);

  // 2. Helper to get the name of the currently selected item for the Header
  const getSelectedName = () => {
    const selected = playlists.find(p => (p._id || p.id) === selectedPlId);
    // If found, return title; if not (or list empty), return placeholder
    return selected ? (selected.title || selected.name) : "Select a playlist";
  };

  // --- 1. Data Loader (Exactly as requested) ---
  const loadData = async () => {
    try {
      // Don't set full page loading if just refreshing background data, 
      // but for first load we might want it. 
      // setMainLoading(true); 
      
      // Fetch Playlists
      let playlistData = [];
      try {
        const pRes = await PlaylistAPI.getPlayLists();
        playlistData = pRes?.data || [];
      } catch (err) {
        console.log("Playlist API Error:", err);
      }

      // Fetch Summaries
      let summaryData = [];
      try {
        if (SummaryAPI && typeof SummaryAPI.getSummaries === "function") {
          const sRes = await SummaryAPI.getSummaries();
          summaryData = sRes?.data || [];
        }
      } catch (err) {
        console.log("Summary API Error:", err);
      }

      // Getting user details
      if (user) {
         // console.log("User details:", user);
      }

      setUserDetails(user);
      // console.log("User details from variable:", user);
      
      setPlaylists(playlistData);
      setSummaries(summaryData);
      
      // Auto-select first playlist for upload dropdown if available
      if (playlistData.length > 0 && !selectedPlId) {
        setSelectedPlId(playlistData[0]._id || playlistData[0].id);
      }

    } catch (e) {
      Alert.alert("Error", "Could not load data.");
    } finally {
      // setLoading(false); // Managed locally by actions usually
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Helpers ---
  const pickDocument = async (setFileSetter: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "audio/*", "video/*"], // Adjust types as needed
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileSetter(file);
      }
    } catch (err) {
      console.log("Picker Error", err);
    }
  };

  const resetForms = () => {
    setPlTitle("");
    setPlDesc("");
    setSelectedPlId(playlists.length > 0 ? (playlists[0]._id || playlists[0].id) : null);
    setUploadFile(null);
    setUploadName("");
    setPdfFile(null);
    setPdfName("");
    setModalType(null);
    setLoading(false);
  };

  // --- API Actions ---

  // 1. Create Playlist Action
  const handleCreatePlaylist = async () => {
    if (!plTitle) return Alert.alert("Error", "Title is required");
    
    try {
      setLoading(true);
      
      // Call API (Assuming createPlaylist exists based on pattern)
      await PlaylistAPI.createPlaylist(plTitle, plDesc);
      
      Alert.alert("Success", "Playlist Created!");
      resetForms();
      loadData(); // Refresh list
    } catch (e) {
      Alert.alert("Error", "Failed to create playlist");
      console.log(e);
      setLoading(false);
    }
  };

  // 2. Upload Item Action
  const handleUploadItem = async () => {
    if (!selectedPlId) return Alert.alert("Error", "Please select a playlist");
    if (!uploadFile) return Alert.alert("Error", "Please select a file");

    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append File
      formData.append("file", {
        uri: uploadFile.uri,
        name: uploadFile.name,
        type: uploadFile.mimeType || "application/octet-stream",
      } as any);

      // Append Name (Optional but good practice)
      if (uploadName) formData.append("name", uploadName);

      // Call API: POST /api/playlists/{id}/upload-item
      // Assuming PlaylistAPI has a helper, otherwise raw fetch:
      if (PlaylistAPI.uploadItem) {
          await PlaylistAPI.uploadItem(selectedPlId, formData);
      } else {
         // Fallback manual fetch if service method missing
         // const token = ... get token 
         // await fetch(`${BASE_URL}/api/playlists/${selectedPlId}/upload-item`, { method: 'POST', body: formData, ...headers })
         throw new Error("Upload method not found in service");
      }

      Alert.alert("Success", "Item added to playlist!");
      resetForms();
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to upload item");
      console.log(e);
      setLoading(false);
    }
  };

// 3. Summarize PDF Action
  const handleSummarizePdf = async () => {
    if (!pdfFile) return Alert.alert("Error", "Please select a PDF file");
    if (!pdfName) return Alert.alert("Error", "Please provide a name");

    try {
      setLoading(true);
      const formData = new FormData();

      // Append File
      formData.append("file", {
        uri: pdfFile.uri,
        name: pdfFile.name || "document.pdf",
        type: pdfFile.mimeType || "application/pdf", // Use actual mimeType if available
      } as any);
      
      // Append Name
      formData.append("name", pdfName);

      // Call API: POST /api/summarize/pdf
      if (SummaryAPI.uploadPdf) {
          // FIX: Call 'uploadPdf' to match your service definition
          await SummaryAPI.uploadPdf(formData); 
      } else {
          throw new Error("Summarize method (uploadPdf) not found in service");
      }

      Alert.alert("Success", "Summary generation started!");
      resetForms();
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to summarize PDF");
      console.log(e);
      setLoading(false);
    }
  };
  
  // --- Render Components ---

  // Reusable Action Card
  const ActionCard = ({ title, desc, icon, color, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-white rounded-3xl p-5 mb-5 border border-slate-100 flex-row items-center"
      style={{
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View style={{ backgroundColor: color }} className="w-14 h-14 rounded-2xl items-center justify-center mr-4">
        <Ionicons name={icon} size={28} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900">{title}</Text>
        <Text className="text-slate-400 text-xs mt-1">{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-extrabold text-slate-900">Create Something New</Text>
          <Text className="text-slate-500 font-medium">Manage your content library</Text>
        </View>

        <ScrollView className="px-6 pt-2" showsVerticalScrollIndicator={false}>
          
          <ActionCard 
            title="New Playlist" 
            desc="Create a collection for your notes" 
            icon="albums-outline" 
            color="#8b5cf6" 
            onPress={() => setModalType("playlist")}
          />

          <ActionCard 
            title="Upload to Playlist" 
            desc="Add files to existing collections" 
            icon="cloud-upload-outline" 
            color="#06b6d4" 
            onPress={() => setModalType("upload")}
          />

          <ActionCard 
            title="Summarize PDF" 
            desc="Generate AI summary from document" 
            icon="document-text-outline" 
            color="#10b981" 
            onPress={() => setModalType("summarize")}
          />

        </ScrollView>
      </SafeAreaView>

      {/* ================= MODALS ================= */}

      {/* 1. Create Playlist Modal */}
      <Modal visible={modalType === "playlist"} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[60%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Create Playlist:</Text>
              <TouchableOpacity onPress={resetForms} className="bg-slate-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="label font-semibold">Title</Text>
            <TextInput 
              className="input-field border border-slate-200 rounded-xl" 
              placeholder="e.g. Finance Notes" 
              value={plTitle} 
              onChangeText={setPlTitle} 
            />

            <Text className="label mt-4 font-semibold">Description</Text>
            <TextInput 
              className="input-field h-24 text-top pt-3 border border-slate-200 rounded-xl" 
              placeholder="What is this collection about?" 
              multiline 
              numberOfLines={3}
              textAlignVertical="top"
              value={plDesc} 
              onChangeText={setPlDesc} 
            />

            <TouchableOpacity 
              onPress={handleCreatePlaylist} 
              disabled={loading}
              className="mt-8 bg-violet-600 py-4 rounded-xl items-center shadow-lg shadow-violet-200"
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Create Playlist</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. Upload Item Modal */}
      <Modal visible={modalType === "upload"} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[75%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-900">Upload Item:</Text>
              <TouchableOpacity onPress={resetForms} className="bg-slate-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="label font-semibold">Select Playlist</Text>
           <View className="mb-4 z-50">
      
      {/* --- HEADER (Always Visible) --- */}
      <TouchableOpacity 
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex-row items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50"
      >
        <Text className="font-medium text-slate-700">
          {getSelectedName()}
        </Text>
        {/* Simple chevron indicator */}
        <Text className="text-slate-500 text-xs">
          {isDropdownOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>


      {/* --- DROPDOWN BODY (Visible only when open) --- */}
      {isDropdownOpen && (
        <View className="mt-1 h-32 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
          <ScrollView nestedScrollEnabled>
            {playlists.map((p) => (
              <TouchableOpacity
                key={p._id || p.id}
                onPress={() => {
                  setSelectedPlId(p._id || p.id);
                  setIsDropdownOpen(false); // Close dropdown after selection
                }}
                className={`p-3 border-b border-slate-100 ${
                  selectedPlId === (p._id || p.id) ? "bg-violet-100" : ""
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedPlId === (p._id || p.id)
                      ? "text-violet-700"
                      : "text-slate-600"
                  }`}
                >
                  {p.title || p.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {playlists.length === 0 && (
              <Text className="p-4 text-slate-400 text-center">
                No playlists found.
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>

            <Text className="label font-semibold">Display Name</Text>
            <TextInput 
              className="input-field mb-4 border border-slate-200 rounded-xl" 
              placeholder="Name for this file (Optional)" 
              value={uploadName}
              onChangeText={setUploadName} 
            />

            <TouchableOpacity 
              onPress={() => pickDocument(setUploadFile)} 
              className={`border-2 border-dashed rounded-xl p-4 items-center mb-6 ${uploadFile ? "border-violet-500 bg-violet-50" : "border-slate-500 bg-slate-50"}`}
            >
               <Ionicons name={uploadFile ? "document-text" : "cloud-upload"} size={32} color={uploadFile ? "#7c3aed" : "#94a3b8"} />
               <Text className="text-slate-700 mt-2 font-medium">
                 {uploadFile ? uploadFile.name : "Tap to select file"}
               </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleUploadItem} 
              disabled={loading}
              className="bg-violet-600 py-4 rounded-xl items-center shadow-lg shadow-violet-200"
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Upload File</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Summarize PDF Modal */}
      <Modal visible={modalType === "summarize"} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[60%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Summarize PDF:</Text>
              <TouchableOpacity onPress={resetForms} className="bg-slate-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="label font-semibold">Summary Name</Text>
            <TextInput 
              className="input-field mb-4 border border-slate-200 rounded-xl" 
              placeholder="e.g. Chapter 1 Summary" 
              value={pdfName} 
              onChangeText={setPdfName} 
            />

            <TouchableOpacity 
              onPress={() => pickDocument(setPdfFile)} 
              className={`border-2 border-dashed rounded-xl p-6 items-center mb-8 ${pdfFile ? "border-emerald-500 bg-emerald-50" : "border-slate-500 bg-slate-50"}`}
            >
               <Ionicons name={pdfFile ? "document-text" : "document-attach"} size={40} color={pdfFile ? "#10b981" : "#94a3b8"} />
               <Text className="text-slate-700 mt-2 font-medium">
                 {pdfFile ? pdfFile.name : "Select PDF File"}
               </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSummarizePdf} 
              disabled={loading}
              className="bg-violet-600 py-4 rounded-xl items-center shadow-lg shadow-violet-200"
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Generate Summary</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}