import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { SummaryAPI } from '@/api/summarize.service';

const { width } = Dimensions.get('window');

// =============================
// 🎯 PIE CHART COMPONENT
// =============================
const ResultPieChart = ({
  correct,
  total,
}: {
  correct: number;
  total: number;
}) => {
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const wrong = total - correct;
  const percentage = total > 0 ? correct / total : 0;
  const strokeDashoffset = circumference - circumference * percentage;

  return (
    <View className="items-center justify-center my-6">
      <Svg height="160" width="160" viewBox="0 0 160 160">
        <G rotation="-90" origin="80, 80">
          {/* Red background = Wrong */}
          <Circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Green foreground = Correct */}
          <Circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Center Percentage */}
      <View className="absolute items-center justify-center">
        <Text className="text-white text-3xl font-bold">
          {Math.round(percentage * 100)}%
        </Text>
      </View>
    </View>
  );
};

// =============================
// 🎯 MAIN QUIZ COMPONENT
// =============================
export default function Quiz() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // =============================
  // 📥 FETCH QUIZ
  // =============================
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const summaryId = Array.isArray(id) ? id[0] : id;
        if (!summaryId) return;

        const res = await SummaryAPI.getQuiz(summaryId);

        if (res?.data?.questions?.length) {
          setQuestions(res.data.questions);
        } else {
          Alert.alert('No Questions Found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load quiz.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  // =============================
  // ✅ HANDLE ANSWER
  // =============================
  const handleOptionPress = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === questions[currentIndex]?.answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  // =============================
  // ➡ NEXT
  // =============================
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  };

  // =============================
  // 🔁 RETRY (FULL REFRESH)
  // =============================
  const handleRetry = () => {
    router.replace(`/quiz/${id}`);
  };

  // =============================
  // 🏠 SUBMIT + GO HOME
  // =============================
  const submitScore = async () => {
    setSubmitting(true);

    try {
      const summaryId = Array.isArray(id) ? id[0] : id;

      console.log("========== SUBMIT SCORE DEBUG ==========");
      console.log("Summary ID:", summaryId);
      console.log("Score:", typeof (score));

      if (!summaryId) {
        throw new Error("Summary ID is missing");
      }

      const response = await SummaryAPI.submitQuiz(summaryId, score);

      console.log("API SUCCESS RESPONSE:", response?.data);

      router.replace('/(tabs)');
    } catch (error: any) {
      console.log("========== SUBMIT SCORE ERROR ==========");

      if (error?.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        console.log("Headers:", error.response.headers);
      } else if (error?.request) {
        console.log("No response received:", error.request);
      } else {
        console.log("Error message:", error.message);
      }

      console.log("Full error object:", error);

      Alert.alert(
        "Submit Failed",
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit score."
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ⏳ LOADING
  if (loading) {
    return (
      <View className="flex-1 bg-[#1a1a2e] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!questions.length) return null;


  // 🏆 RESULT SCREEN
  if (quizCompleted) {
    return (
      <View className="flex-1 bg-[#1a1a2e]">
        <LinearGradient
          colors={['#4c1d95', '#1a1a2e']}
          className="absolute w-full h-full"
        />
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <View className="bg-[#070717] p-8 rounded-3xl w-full items-center border border-white/10">

            <Text className="text-white text-2xl font-bold mb-2">
              Quiz Results
            </Text>

            <ResultPieChart
              correct={score}
              total={questions.length}
            />

            <View className="flex-row justify-between w-full px-10 mb-8">
              <View className="items-center">
                <Text className="text-emerald-400 font-bold text-xl">
                  {score}
                </Text>
                <Text className="text-gray-400 text-xs">Correct</Text>
              </View>
              <View className="items-center">
                <Text className="text-rose-400 font-bold text-xl">
                  {questions.length - score}
                </Text>
                <Text className="text-gray-400 text-xs">Wrong</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={submitScore}
              disabled={submitting}
              className="bg-emerald-500 w-full py-4 rounded-xl items-center mb-4"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Save & Go Home
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRetry}
              className="w-full py-4 rounded-xl items-center border border-white/10 bg-white/5"
            >
              <Text className="text-white font-bold text-lg">
                Retry Quiz
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =============================
  // ❓ QUESTION SCREEN
  // =============================
  const currentQuestion = questions[currentIndex];
  const progress =
    ((currentIndex + 1) / questions.length) * 100;

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient
        colors={['#4c1d95', '#1a1a2e']}
        className="absolute w-full h-full"
      />
      <SafeAreaView className="flex-1">

        {/* Header */}
        <View className="px-6 pt-2 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-bold text-lg">
              Flash Quiz
            </Text>

            <View className="flex-row items-center bg-black/20 px-3 py-1 rounded-full">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-white font-bold ml-1">
                {score}
              </Text>
            </View>
          </View>

          <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <View
              className="h-full bg-violet-500"
              style={{ width: `${progress}%` }}
            />
          </View>

          <Text className="text-gray-400 text-xs mt-2">
            Question {currentIndex + 1} of {questions.length}
          </Text>
        </View>

        {/* Increased paddingBottom to ensure button clears the global bottom player */}
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
          <View className="mx-6 min-h-[200px] bg-[#141429] rounded-3xl p-6 items-center justify-center mb-8">
            <Text className="text-white text-xl font-bold text-center">
              {currentQuestion.question}
            </Text>
          </View>

          {/* Options */}
          <View className="px-6 gap-2 mb-8">
            {currentQuestion.options.map(
              (option: string, index: number) => {
                const isSelected =
                  selectedOption === option;
                const isCorrect =
                  option === currentQuestion.answer;

                let bg = 'bg-[#1d1d27] border-white/10';
                let text = 'text-white';

                if (isAnswered) {
                  if (isCorrect) {
                    bg =
                      'bg-emerald-500/20 border-emerald-500';
                    text = 'text-emerald-400';
                  } else if (isSelected) {
                    bg =
                      'bg-rose-500/20 border-rose-500';
                    text = 'text-rose-400';
                  } else {
                    bg += ' opacity-50';
                  }
                } else if (isSelected) {
                  bg =
                    'bg-violet-600 border-violet-400';
                }

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() =>
                      handleOptionPress(option)
                    }
                    disabled={isAnswered}
                    className={`p-4 rounded-2xl border ${bg}`}
                  >
                    <Text
                      className={`font-semibold ${text}`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* Moved NEXT BUTTON here inside the ScrollView */}
          <View className="px-6">
            <TouchableOpacity
              onPress={handleNext}
              disabled={!isAnswered}
              className={`w-full py-3 rounded-2xl flex-row items-center justify-center shadow-lg ${isAnswered ? 'bg-white' : 'bg-gray-600 opacity-50'
                }`}
            >
              <Text
                className={`font-bold text-lg mr-2 ${isAnswered ? 'text-violet-900' : 'text-gray-300'
                  }`}
              >
                {currentIndex === questions.length - 1
                  ? 'Finish Quiz'
                  : 'Next Question'}
              </Text>
              {isAnswered && <Ionicons name="arrow-forward" size={20} color="#4c1d95" />}
            </TouchableOpacity>
          </View>

        </ScrollView>

      </SafeAreaView>
    </View>
  );
}