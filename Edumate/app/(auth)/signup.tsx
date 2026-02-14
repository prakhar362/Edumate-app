import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
//import { authAPI } from '../../services/auth'; // Ensure this path matches your file structure

export default function Signup() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    // Basic Validation
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Missing Fields', 'Please fill in all fields.');
    }

    // Password Match Check
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      // Call your API
      //const result = await authAPI.signup(name, email, password);
      console.log('Signup success:', name, email, password);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(auth)/login'); 
    } catch (error) {
      console.error(error);
      Alert.alert('Signup Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    console.log('Initiating Google Signup...');
    // Add your Google Auth logic here
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      
      {/* 1. Background (Same as Splash Page) */}
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

      {/* 2. Main Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          
          {/* Header Section (Title & Back Button) */}
          <View className="px-6 pt-16 pb-8">
           
            <Text className="text-white text-4xl font-bold">Sign Up</Text>
            <Text className="text-gray-300 text-lg mt-2">Create your account to get started</Text>
          </View>

          {/* White Bottom Sheet Form */}
          <View className="bg-white rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl h-3/4">
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Name Input */}
              <View className="mb-5">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Name</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 border border-gray-100 focus:border-purple-500">
                  <TextInput 
                    placeholder="John Doe" 
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    className="text-gray-800 text-base"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View className="mb-5">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Email</Text>
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

              {/* Password Input */}
              <View className="mb-5">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Password</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-100 focus:border-purple-500">
                  <TextInput 
                    placeholder="••••••••" 
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View className="mb-8">
                <Text className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Re-type Password</Text>
                <View className="bg-gray-100 rounded-2xl px-4 py-1 flex-row items-center border border-gray-100 focus:border-purple-500">
                  <TextInput 
                    placeholder="••••••••" 
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 text-gray-800 text-base"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity 
                onPress={handleSignup}
                className="bg-[#8B5CF6] py-4 rounded-2xl items-center shadow-lg shadow-purple-300"
              >
                <Text className="text-white font-bold text-lg">{loading ? 'Creating Account...' : 'SIGN UP'}</Text>
              </TouchableOpacity>

              {/* OR Divider */}
              <View className="flex-row items-center my-3">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="mx-4 text-gray-400 font-medium">OR</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              {/* Google Button */}
              <TouchableOpacity 
                onPress={handleGoogleSignup}
                className="flex-row bg-[#4285F4] py-4 rounded-2xl items-center justify-center shadow-md mb-8"
              >
                <View className="bg-white p-1 rounded-full mr-3">
                   <Ionicons name="logo-google" size={18} color="#4285F4" />
                </View>
                <Text className="text-white font-bold text-base">Sign in with Google</Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center mb-10">
                <Text className="text-gray-500">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-[#8B5CF6] font-bold">Log In</Text>
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