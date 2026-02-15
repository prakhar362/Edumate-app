import { View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function Quiz() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-violet-100">
      <Text className="text-2xl font-bold text-violet-900 mb-4">Quiz Time!</Text>
      <Text onPress={() => router.back()} className="text-blue-500">Go Back</Text>
    </View>
  );
}