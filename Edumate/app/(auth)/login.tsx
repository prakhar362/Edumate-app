import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthStore } from "@/store/auth.store";

// 🌐 WEB CLIENT ID (Matches your Backend)
const WEB_GOOGLE_CLIENT_ID = "546364980081-069dkejuin4qo8u9omp0bocsqebiop5e.apps.googleusercontent.com";

// Configure Google Sign-in outside your component
GoogleSignin.configure({
  webClientId: WEB_GOOGLE_CLIENT_ID,
  offlineAccess: true, // Required to get the id_token
});

export default function Login() {
  const router = useRouter();

  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const loading = useAuthStore((s) => s.loading);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI State
  const [showPassword, setShowPassword] = useState(false);

  // ✉️ Email/Password Login
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Missing Fields", "Please fill in all fields.");
    }

    try {
      console.log("Attempting login with:", email, password);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error?.response?.data?.detail || "Invalid credentials"
      );
    }
  };

  // 🔵 Native Google Login
  const handleGoogleLogin = async () => {
    try {
      // 1. Check if device has Google Play Services
      await GoogleSignin.hasPlayServices();

      // 2. Open the native Google Sign-In bottom sheet
      await GoogleSignin.signIn();

      // 3. Get the ID token safely
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        Alert.alert("Error", "No ID token received from Google.");
        return;
      }

      // 4. Send the token to your backend
      await googleLogin(idToken);
      router.replace("/(tabs)");

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available on this device");
      } else {
        Alert.alert("Google Login Failed", error.message);
        console.error(error);
      }
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={["#3b1f77", "#5e35b1", "#311b92"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <View className="absolute top-0 -left-40 w-[500px] h-2 bg-white/5 rotate-45" />
        <View className="absolute top-40 -left-40 w-[500px] h-2 bg-white/5 rotate-45" />
        <View className="absolute top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-2xl" />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <View className="px-6 pt-16 pb-8">
            <Text className="text-white text-4xl font-bold">
              Welcome Back !
            </Text>
            <Text className="text-gray-300 text-lg mt-2">
              Please sign in to your account
            </Text>
          </View>

          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[70%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Email */}
              <View className="mb-6">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                  Email
                </Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1">
                  <TextInput
                    placeholder="example@gmail.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="text-gray-800 text-base"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-2">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                  Password
                </Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center">
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot */}
              <View className="flex-row justify-end mb-8">
                <Link href="/(auth)/forgot-pass" asChild>
                  <TouchableOpacity>
                    <Text className="text-[#8B5CF6] font-bold text-sm">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Login */}
              <TouchableOpacity
                onPress={handleLogin}
                className="bg-[#8B5CF6] py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-lg">
                  {loading ? "Logging in..." : "LOG IN"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="mx-4 text-gray-400 font-medium">OR</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              {/* Google */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                className="flex-row bg-[#4285F4] py-4 rounded-2xl items-center justify-center mb-8"
              >
                <View className="bg-white p-1 rounded-full mr-3">
                  <Ionicons
                    name="logo-google"
                    size={18}
                    color="#4285F4"
                  />
                </View>
                <Text className="text-white font-bold text-base">
                  Sign in with Google
                </Text>
              </TouchableOpacity>

              {/* Signup */}
              <View className="flex-row justify-center mb-10">
                <Text className="text-gray-500">
                  Don't have an account?{" "}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text className="text-[#8B5CF6] font-bold">
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}