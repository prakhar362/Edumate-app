import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function FilterPill({ label, active, onPress }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`px-6 py-2 rounded-full mr-3 border ${
        active ? 'bg-violet-600 border-violet-600' : 'bg-transparent border-gray-300'
      }`}
    >
      <Text className={`font-bold ${active ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}