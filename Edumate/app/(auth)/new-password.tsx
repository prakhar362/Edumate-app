import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "@/api/auth.service";

export default function NewPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string; // 👈 Get email from previous screen

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      return Alert.alert("Error", "Please fill all fields");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      setLoading(true);

      await authAPI.resetPassword(email, password);

      setLoading(false);

      Alert.alert("Success", "Password updated successfully!");

      // Replace stack so user can't go back
      router.replace("/(auth)/login");
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to reset password"
      );
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
        colors={["#3b1f77", "#5e35b1", "#311b92"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <View className="px-6 pt-16 pb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mb-6"
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold">
              Create New Password
            </Text>
            <Text className="text-gray-300 text-base mt-2">
              Your new password must be different from previously used ones.
            </Text>
          </View>

          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[65%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Password */}
              <View className="mb-6">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                  Password
                </Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-200">
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                  >
                    <Ionicons
                      name={showPass ? "eye-off" : "eye"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-8">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                  Confirm Password
                </Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-200">
                  <TextInput
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off" : "eye"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleReset}
                className="bg-purple-600 py-4 rounded-2xl items-center"
                disabled={loading}
              >
                <Text className="text-white font-bold text-lg">
                  {loading ? "Updating..." : "CREATE PASSWORD"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
