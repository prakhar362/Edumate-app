import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function Verification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email || "your email"; // Get email passed from previous screen

  // State for 4 digits
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  // Refs to manage focus
  const inputs = useRef<Array<TextInput | null>>([]);

  // Countdown timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInput = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input if text is entered
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-focus previous input if text is deleted (backspace)
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) return Alert.alert('Error', 'Please enter the full 4-digit code');

    setLoading(true);
    // Simulate API verification
    setTimeout(() => {
        setLoading(false);
        // If success:
        router.push('/(auth)/new-password');
    }, 1000);
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
                    colors={['#3b1f77', '#5e35b1', '#311b92']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                  >
                    {/* Decorative Background Lines */}
                    <View className="absolute top-0 -left-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
                    <View className="absolute top-40 -left-40 w-[500px] h-2 bg-white/5 rotate-45 transform" />
                    
                    {/* Decorative Background Shapes */}
                    <View className="absolute top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-2xl" />
        </LinearGradient>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          
          <View className="px-6 pt-16 pb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-4xl font-bold">Verification</Text>
            <Text className="text-gray-300 text-base mt-2 mb-2">We have sent a code to your email</Text>
            <Text className="text-white font-bold mt-1">{email}</Text>
          </View>

          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[60%]">
            
            {/* Code Inputs */}
            <View className="flex-row justify-between mb-8 px-4">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleInput(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className={`w-16 h-16 bg-gray-100 rounded-2xl text-center text-2xl font-bold border ${digit ? 'border-[#FF6B00] bg-orange-50' : 'border-gray-100'}`}
                />
              ))}
            </View>

            {/* Timer & Resend */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-gray-500">Code expires in: <Text className="font-bold text-red-500">00:{timer < 10 ? `0${timer}` : timer}</Text></Text>
              <TouchableOpacity disabled={timer > 0}>
                <Text className={`font-bold ${timer > 0 ? 'text-gray-400' : 'text-[#3b1f77]'}`}>Resend Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleVerify}
              className="bg-[#8B5CF6] py-4 rounded-2xl items-center shadow-lg shadow-purple-200"
            >
              <Text className="text-white font-bold text-lg">{loading ? 'Verifying...' : 'VERIFY'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}