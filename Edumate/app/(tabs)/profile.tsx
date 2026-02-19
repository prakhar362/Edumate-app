import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { usePlayerStore } from "@/store/player.store";
import { useAuthStore } from "@/store/auth.store";
import { authAPI } from "@/api/auth.service";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const user = auth?.user;
  const logout = auth?.logout;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const unloadAudio = usePlayerStore((s) => s.unload);

  const [formData, setFormData] = useState({
    name: "Learner",
    email: "user@example.com",
    phone: "",
    password: "",
    picture: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, ...user }));
    }
  }, [user]);

  // ✅ PICK IMAGE FUNCTION (NO UI CHANGES)
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || "profile.jpg",
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  // ✅ REAL SAVE FUNCTION
  const handleSave = async () => {
    try {
      setLoading(true);

      const res = await authAPI.editProfile(
        formData.name,
        formData.email,
        formData.password,
        selectedImage
      );

      // Update Zustand store
      useAuthStore.setState({
        user: res.data,
      });

      setIsEditing(false);
      setSelectedImage(null);

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      console.log("Edit error:", err?.response?.data);
      Alert.alert(
        "Error",
        err?.response?.data?.detail || "Profile update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          if (logout) logout();
          unloadAudio();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // ---- Component: Modern Info Tile ----
  const InfoTile = ({
    icon,
    label,
    value,
    field,
    keyboardType = "default",
    isPassword = false,
  }: any) => (
    <View
      className="flex-row items-center bg-white p-4 rounded-2xl mb-4 border border-slate-100"
      style={{
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="w-12 h-12 rounded-full bg-violet-50 items-center justify-center mr-4 border border-violet-100">
        <Ionicons name={icon} size={22} color="#7c3aed" />
      </View>

      <View className="flex-1 justify-center">
        <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">
          {label}
        </Text>

        {isEditing ? (
          <TextInput
            className="text-base text-slate-900 font-semibold border-b border-violet-500 py-0 h-8"
            value={value}
            onChangeText={(text) =>
              setFormData({ ...formData, [field]: text })
            }
            keyboardType={keyboardType}
            secureTextEntry={isPassword}
            placeholder={isPassword ? "New Password" : `Enter ${label}`}
            placeholderTextColor="#cbd5e1"
          />
        ) : (
          <Text className="text-base text-slate-900 font-bold tracking-tight">
            {isPassword ? "••••••••" : value || "Not set"}
          </Text>
        )}
      </View>

      {isEditing && <Ionicons name="pencil" size={14} color="#ddd" />}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <LinearGradient
        colors={["#f5f3ff", "#ffffff"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 400,
        }}
      />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row justify-between items-center px-6 pt-2 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
          >
            <Ionicons name="arrow-back" size={20} color="#1e293b" />
          </TouchableOpacity>

          <Text className="text-slate-900 text-2xl font-bold tracking-tight">
            My Profile
          </Text>

          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={loading}
            className={`px-4 h-10 rounded-2xl items-center justify-center flex-row shadow-sm ${isEditing
              ? "bg-violet-600 rounded-md"
              : "bg-white border border-slate-100"
              }`}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={isEditing ? "white" : "#7c3aed"}
              />
            ) : (
              <>
                <Text
                  className={`font-bold text-xs ${isEditing ? "text-white" : "text-slate-700"
                    } mr-1`}
                >
                  {isEditing ? "Save" : "Edit"}
                </Text>
                {!isEditing && (
                  <Ionicons
                    name="settings-outline"
                    size={14}
                    color="#334155"
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-2">
          <View className="items-center mb-10">
            <View className="relative">
              <LinearGradient
                colors={["#c4b5fd", "#7c3aed"]}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <View className="bg-white p-1 rounded-full">

                  <Image
                    source={{
                      uri:
                        selectedImage?.uri ||
                        user?.picture ||
                        "https://static.vecteezy.com/system/resources/previews/026/630/551/non_2x/profile-icon-symbol-design-illustration-vector.jpg",
                    }}
                    className="w-24 h-24 rounded-full"
                  />
                </View>
              </LinearGradient>

              {isEditing && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute bottom-4 right-0 bg-slate-900 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-lg"
                >
                  <Ionicons name="camera" size={14} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formData.name}
            </Text>
            <Text className="text-slate-500 font-medium text-sm mt-1">
              {isEditing ? "Update your details below" : "Student • Learn Mode"}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-slate-900 font-bold text-lg mb-4 ml-1">
              Personal Info
            </Text>

            <InfoTile
              icon="person"
              label="Full Name"
              value={formData.name}
              field="name"
            />
            <InfoTile
              icon="mail"
              label="Email Address"
              value={formData.email}
              field="email"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-900 font-bold text-lg mb-4 ml-1">
              Security
            </Text>

            {isEditing ? (
              <InfoTile
                icon="lock-closed"
                label="Change Password"
                value={formData.password}
                field="password"
                isPassword
              />
            ) : (
              <TouchableOpacity
                className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 active:bg-slate-100"
                onPress={() =>
                  Alert.alert("Coming Soon", "Change Password flow")
                }
              >
                <View className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center mr-4">
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color="#475569"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold">
                    Change Password
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    Last updated 3 months ago
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-red-500 py-4 rounded-2xl border border-red-100 mb-8"
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-bold text-lg">Sign Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-slate-300 text-xs pb-10">
            App Version 1.0.2
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
