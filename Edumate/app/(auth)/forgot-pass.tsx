import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '@/api/auth.service';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address');

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      console.log('Code sent to:', email);

      // Pass email to verification screen so we know who to verify
      router.push({ pathname: '/(auth)/verification', params: { email } });
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
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
          {/* Header */}
          <View className="px-6 pt-10 pb-8">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mb-6 ">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-4xl font-bold">Forgot Password</Text>
            <Text className="text-gray-300 text-base mt-2">Enter your email to receive a reset code.</Text>
          </View>

          {/* Bottom Sheet */}
          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[60%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-8">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Email Address</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 border border-gray-100 focus:border-purple-500">
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

              <TouchableOpacity
                onPress={handleSendCode}
                className="bg-[#8B5CF6] py-4 rounded-2xl items-center shadow-lg shadow-purple-200"
              >
                <Text className="text-white font-bold text-lg">{loading ? 'Sending...' : 'SEND CODE'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}