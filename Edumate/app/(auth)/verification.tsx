import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "@/api/auth.service";

export default function Verification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputs = useRef<Array<TextInput | null>>([]);

  // Countdown timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 5000000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleInput = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move forward
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Move backward
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      return Alert.alert("Error", "Please enter the full 6-digit code");
    }

    try {
      setLoading(true);

      await authAPI.verifyOTP(email, fullCode);

      setLoading(false);

      // Navigate to new password screen
      router.push({
        pathname: "/(auth)/new-password",
        params: { email },
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Verification Failed",
        error?.response?.data?.detail || "Invalid or expired OTP"
      );
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await authAPI.forgotPassword(email); // call forgot API again
      setTimer(30);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      Alert.alert("Success", "OTP resent to your email");
    } catch (err) {
      Alert.alert("Error", "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
        colors={["#3b1f77", "#5e35b1", "#311b92"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
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
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-4xl font-bold">
              Verification
            </Text>
            <Text className="text-gray-300 text-base mt-2">
              We have sent a 6-digit code to
            </Text>
            <Text className="text-white font-bold mt-1">
              {email}
            </Text>
          </View>

          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[60%]">
            {/* OTP Inputs */}
            <View className="flex-row justify-between mb-8 px-4">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleInput(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className={`w-12 h-14 bg-gray-100 rounded-xl text-center text-xl font-bold border ${digit
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200"
                    }`}
                />
              ))}
            </View>

            {/* Timer + Resend */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-gray-500">
                Code expires in:{" "}
                <Text className="font-bold text-red-500">
                  00:{timer < 10 ? `0${timer}` : timer}
                </Text>
              </Text>

              <TouchableOpacity
                disabled={timer > 0}
                onPress={handleResend}
              >
                <Text
                  className={`font-bold ${timer > 0
                    ? "text-gray-400"
                    : "text-purple-700"
                    }`}
                >
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              className="bg-purple-600 py-4 rounded-2xl items-center"
              disabled={loading}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Verifying..." : "VERIFY"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
