import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SummaryAPI } from '@/api/summarize.service';

const { width } = Dimensions.get('window');

// --- Non-SVG Score Visualizer ---
const ScoreDashboard = ({ correct, total }: { correct: number; total: number }) => {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrong = total - correct;

  return (
    <View className="items-center w-full my-6">

      {/* 1. Circular Score Badge */}
      <View className="w-40 h-40 rounded-full border-[8px] border-white/10 items-center justify-center mb-6 bg-[#1e1e36] shadow-xl">
        <View className="items-center">
          <Text className="text-white text-5xl font-black tracking-tighter">{percentage}%</Text>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Accuracy</Text>
        </View>
      </View>

      {/* 2. Linear Split Chart (Green vs Red) */}
      <View className="w-full px-4 mb-2">
        <View className="flex-row h-6 w-full rounded-full overflow-hidden bg-gray-700">
          {/* Green Segment */}
          {correct > 0 && (
            <View
              style={{ flex: correct }}
              className="bg-emerald-500 h-full items-center justify-center"
            >
              {correct > 0 && <Text className="text-[10px] font-bold text-white">{correct}</Text>}
            </View>
          )}

          {/* Red Segment */}
          {wrong > 0 && (
            <View
              style={{ flex: wrong }}
              className="bg-rose-500 h-full items-center justify-center"
            >
              {wrong > 0 && <Text className="text-[10px] font-bold text-white">{wrong}</Text>}
            </View>
          )}
        </View>
      </View>

      {/* 3. Legend */}
      <View className="flex-row justify-between w-full px-8 mt-2">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
          <Text className="text-gray-300 font-bold">{correct} Correct</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
          <Text className="text-gray-300 font-bold">{wrong} Incorrect</Text>
        </View>
      </View>

    </View>
  );
};

export default function Quiz() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Data State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz Logic State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const summaryId = Array.isArray(id) ? id[0] : id;
        const res = await SummaryAPI.getQuiz(summaryId);
        if (res.data && res.data.questions) {
          setQuestions(res.data.questions);
        }
      } catch (error) {
        console.log("Quiz load error:", error);
        Alert.alert("Error", "Could not load quiz questions.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuiz();
  }, [id]);

  // Handle Option Selection
  const handleOptionPress = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.answer;

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  // Handle Next Question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  // Finish Logic
  const finishQuiz = () => {
    setQuizCompleted(true);
  };

  // Submit to Backend
  const submitScore = async () => {
    setSubmitting(true);
    try {
      const summaryId = Array.isArray(id) ? id[0] : id;
      await SummaryAPI.submitQuiz(summaryId, score);
      Alert.alert("Success", "Score saved to your profile!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to submit score.");
    } finally {
      setSubmitting(false);
    }
  };

  // Retry Logic
  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <View className="flex-1 bg-[#1a1a2e] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-white mt-4 font-medium">Loading Quiz...</Text>
      </View>
    );
  }

  // 2. ERROR / EMPTY STATE (FIX FOR CRASH)
  // If questions are missing or empty, show this instead of trying to render questions[0]
  if (!questions || questions.length === 0) {
    return (
      <View className="flex-1 bg-[#1a1a2e] items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={60} color="#6b7280" />
        <Text className="text-white text-lg font-bold mt-4 text-center">
          No questions available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-violet-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RESULT VIEW ---
  if (quizCompleted) {
    return (
      <View className="flex-1 bg-[#1a1a2e]">
        <LinearGradient colors={['#4c1d95', '#1a1a2e']} className="absolute top-0 w-full h-full opacity-80" />
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <View className="bg-[#2d2d44] p-6 rounded-3xl w-full items-center shadow-2xl border border-white/10">

            <View className="flex-row items-center mb-2">
              <Ionicons name="ribbon" size={28} color="#fbbf24" className="mr-2" />
              <Text className="text-white text-2xl font-bold">Quiz Results</Text>
            </View>

            <ScoreDashboard correct={score} total={questions.length} />

            <View className="h-4" />

            <TouchableOpacity
              onPress={submitScore}
              disabled={submitting}
              className="bg-emerald-500 w-full py-4 rounded-xl items-center mb-4 shadow-lg shadow-emerald-500/20 flex-row justify-center"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-lg">Save & Finish</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRetry}
              className="w-full py-4 rounded-xl items-center border border-white/10 bg-white/5 flex-row justify-center"
            >
              <MaterialIcons name="refresh" size={22} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-lg">Try Again</Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- QUESTION CARD VIEW ---
  // Safe to access now because we handled the empty state above
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient colors={['#4c1d95', '#1a1a2e']} className="absolute top-0 w-full h-full opacity-80" />
      <SafeAreaView className="flex-1">

        {/* Header */}
        <View className="px-6 pt-2 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-bold text-lg">Flash Quiz</Text>

            <View className="flex-row items-center bg-black/20 px-3 py-1 rounded-full border border-white/5">
              <Ionicons name="checkmark-circle" size={16} color="#34d399" style={{ marginRight: 4 }} />
              <Text className="text-white font-bold">{score}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-violet-500 rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-gray-400 text-xs mt-2 font-medium">Question {currentIndex + 1} of {questions.length}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Question */}
          <View className="mx-6 min-h-[200px] bg-[#2d2d44] rounded-3xl p-6 items-center justify-center mb-8 border border-white/5 shadow-xl">
            <Text className="text-white text-xl font-bold text-center leading-8">{currentQuestion?.question || "Question Error"}</Text>
          </View>

          {/* Options */}
          <View className="px-6 gap-4">
            {currentQuestion?.options?.map((option: string, index: number) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer = option === currentQuestion.answer;

              let bgStyle = "bg-[#1e1e36] border-white/5";
              let textStyle = "text-white";
              let iconName = "radio-button-off";
              let iconColor = "#9ca3af";

              if (isAnswered) {
                if (isCorrectAnswer) {
                  bgStyle = "bg-emerald-500/20 border-emerald-500";
                  textStyle = "text-emerald-400";
                  iconName = "checkmark-circle";
                  iconColor = "#34d399";
                } else if (isSelected && !isCorrectAnswer) {
                  bgStyle = "bg-rose-500/20 border-rose-500";
                  textStyle = "text-rose-400";
                  iconName = "close-circle";
                  iconColor = "#fb7185";
                } else {
                  bgStyle = "bg-[#1e1e36] border-white/5 opacity-50";
                }
              } else if (isSelected) {
                bgStyle = "bg-violet-600 border-violet-400";
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleOptionPress(option)}
                  disabled={isAnswered}
                  className={`flex-row items-center p-4 rounded-2xl border ${bgStyle}`}
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center border mr-4 ${isAnswered && isCorrectAnswer ? "bg-emerald-500 border-emerald-500" :
                      isAnswered && isSelected ? "bg-rose-500 border-rose-500" :
                        "bg-white/10 border-white/20"
                    }`}>
                    <Text className="text-white font-bold text-sm">{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text className={`flex-1 font-semibold text-base ${textStyle}`}>{option}</Text>
                  {isAnswered && (isSelected || isCorrectAnswer) && (
                    <Ionicons name={iconName as any} size={24} color={iconColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Next Button */}
        <View className="p-6">
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isAnswered}
            className={`w-full py-4 rounded-2xl items-center shadow-lg flex-row justify-center ${isAnswered ? "bg-white" : "bg-gray-600 opacity-50"}`}
          >
            <Text className={`font-bold text-lg mr-2 ${isAnswered ? "text-violet-900" : "text-gray-300"}`}>
              {currentIndex === questions.length - 1 ? "Show Results" : "Next Question"}
            </Text>
            {isAnswered && <Ionicons name="arrow-forward" size={20} color="#4c1d95" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}