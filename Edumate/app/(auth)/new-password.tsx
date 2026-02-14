import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function NewPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) return Alert.alert('Error', 'Please fill all fields');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    // Simulate API Call
    setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Password updated successfully!');
        // Navigate back to Login and clear history so user can't go back to reset flow
        router.replace('/(auth)/login');
    }, 1500);
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
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold">Create New Password</Text>
            <Text className="text-gray-300 text-base mt-2">Your new password must be different from previous used passwords.</Text>
          </View>

          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-[65%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Password */}
              <View className="mb-6">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Password</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-100 focus:border-purple-500">
                  <TextInput 
                    placeholder="Enter your password" 
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-8">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Confirm Password</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-100 focus:border-purple-500">
                  <TextInput 
                    placeholder="Confirm your password" 
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleReset}
                className="bg-[#8B5CF6] py-4 rounded-2xl items-center shadow-lg shadow-purple-200"
              >
                <Text className="text-white font-bold text-lg">{loading ? 'Updating...' : 'CREATE PASSWORD'}</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}