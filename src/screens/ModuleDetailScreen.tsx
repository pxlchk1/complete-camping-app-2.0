import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { isPro } from "../utils/auth";
import { usePaywallStore } from "../state/paywallStore";
import { useLearningStore, LearningStep } from "../state/learningStore";
import { RootStackParamList } from "../navigation/types";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  PARCHMENT_BACKGROUND,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
} from "../constants/colors";

type ModuleDetailRouteProp = RouteProp<RootStackParamList, "ModuleDetail">;
type ModuleDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "ModuleDetail">;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function ModuleDetailScreen() {
  const navigation = useNavigation<ModuleDetailNavigationProp>();
  const route = useRoute<ModuleDetailRouteProp>();
  const { moduleId } = route.params;
  const proStatus = isPro();
  const { open: openPaywall } = usePaywallStore();

  const { getModuleById, getModuleProgress, completeStep } = useLearningStore();
  const module = getModuleById(moduleId);
  const progress = getModuleProgress(moduleId);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (module && progress) {
      const firstIncompleteIndex = module.steps.findIndex(
        (step) => progress.steps[step.id]?.status !== "completed"
      );
      if (firstIncompleteIndex !== -1) {
        setCurrentStepIndex(firstIncompleteIndex);
      }
    }
  }, [moduleId, progress, module]);

  if (!module) {
    return (
      <View className="flex-1 justify-center items-center bg-parchment">
        <Text>Module not found</Text>
      </View>
    );
  }

  const currentStep = module.steps[currentStepIndex];
  const isLastStep = currentStepIndex === module.steps.length - 1;
  const isStepCompleted = progress?.steps[currentStep.id]?.status === "completed";
  const isQuizLocked = currentStep.type === "quiz" && !proStatus;

  const showLockedQuizPaywall = () => {
    openPaywall("learn_quiz", {
      title: "Quizzes are a Pro feature",
      subtitle: "Upgrade to test your knowledge and earn badges.",
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isQuizLocked) {
      showLockedQuizPaywall();
      return;
    }

    if (!isStepCompleted) {
      completeStep(moduleId, currentStep.id);
    }

    if (isLastStep) {
      Alert.alert("Module Complete! 🎉", `You earned ${module.xpReward} XP.`, [
        { text: "Continue", onPress: () => navigation.goBack() },
      ]);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowQuizResults(false);
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setShowQuizResults(false);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (isQuizLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuizAnswers({ ...quizAnswers, [questionIndex]: answerIndex });
  };

  const checkQuizAnswers = () => {
    if (isQuizLocked) return;
    setShowQuizResults(true);
  };

  const renderQuizContent = () => {
    if (currentStep.type !== "quiz") return null;

    if (isQuizLocked) {
      return (
        <View className="items-center justify-center p-8 rounded-lg bg-yellow-100/70 border border-yellow-300/70">
          <Ionicons name="lock-closed" size={32} color="#a16207" />
          <Text className="text-lg font-bold text-center text-yellow-900/80 mt-4">Quizzes are a Pro feature</Text>
          <Text className="text-center text-yellow-800/80 mt-2 mb-6">
            Upgrade to test your knowledge and earn badges.
          </Text>
          <Pressable
            onPress={showLockedQuizPaywall}
            className="bg-yellow-500 rounded-lg px-8 py-3"
          >
            <Text className="font-bold text-white">Unlock with Pro</Text>
          </Pressable>
        </View>
      );
    }

    const quizData: { questions: QuizQuestion[] } = JSON.parse(currentStep.content);
    const quizScore = quizData.questions.reduce((acc, question, index) => {
      return acc + (quizAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    return (
      <View>
        <Text style={{ fontFamily: "JosefinSlab_700Bold", fontSize: 22, color: TEXT_PRIMARY_STRONG, marginBottom: 20 }}>
          {currentStep.title}
        </Text>
        {quizData.questions.map((q, qIndex) => (
          <View key={qIndex} style={{ marginBottom: 25 }}>
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 16, color: TEXT_PRIMARY_STRONG, marginBottom: 12 }}>
              {q.question}
            </Text>
            {q.options.map((option, oIndex) => {
              const isSelected = quizAnswers[qIndex] === oIndex;
              const isCorrect = showQuizResults && q.correctAnswer === oIndex;
              const isIncorrect = showQuizResults && isSelected && q.correctAnswer !== oIndex;

              let borderColor = BORDER_SOFT;
              if (isSelected) borderColor = DEEP_FOREST;
              if (isCorrect) borderColor = "green";
              if (isIncorrect) borderColor = "red";

              return (
                <Pressable
                  key={oIndex}
                  onPress={() => handleQuizAnswer(qIndex, oIndex)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderWidth: 2,
                    borderColor,
                    borderRadius: 10,
                    marginBottom: 8,
                    backgroundColor: isSelected ? CARD_BACKGROUND_LIGHT : "transparent",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: DEEP_FOREST,
                      marginRight: 12,
                      backgroundColor: isSelected ? DEEP_FOREST : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PARCHMENT }} />}
                  </View>
                  <Text style={{ flex: 1, fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
        {!showQuizResults && (
          <Pressable
            onPress={checkQuizAnswers}
            disabled={Object.keys(quizAnswers).length !== quizData.questions.length}
            style={{
              backgroundColor: Object.keys(quizAnswers).length !== quizData.questions.length ? BORDER_SOFT : DEEP_FOREST,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: Object.keys(quizAnswers).length !== quizData.questions.length ? TEXT_SECONDARY : PARCHMENT }}>Check Answers</Text>
          </Pressable>
        )}
        {showQuizResults && (
          <View style={{ marginTop: 20, padding: 15, borderRadius: 10, backgroundColor: CARD_BACKGROUND_LIGHT }}>
            <Text style={{ fontFamily: "JosefinSlab_700Bold", fontSize: 20, color: DEEP_FOREST, textAlign: "center", marginBottom: 10 }}>
              Results: {quizScore} / {quizData.questions.length} Correct
            </Text>
            <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, textAlign: "center" }}>
              {quizScore === quizData.questions.length ? "Great job!" : "Keep learning and try again!"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: PARCHMENT_BACKGROUND }}>
      <View
        style={{
          backgroundColor: DEEP_FOREST,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={PARCHMENT} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "JosefinSlab_700Bold", fontSize: 18, color: PARCHMENT }} numberOfLines={1}>
            {module.title}
          </Text>
          <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 13, color: PARCHMENT, opacity: 0.8, marginTop: 2 }}>
            Step {currentStepIndex + 1} of {module.steps.length}
          </Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {currentStep.type === "article" && (
          <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG, lineHeight: 26 }}>
            {currentStep.content}
          </Text>
        )}

        {currentStep.type === "quiz" && renderQuizContent()}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: PARCHMENT,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: BORDER_SOFT,
          flexDirection: "row",
          gap: 12,
        }}
      >
        {currentStepIndex > 0 && (
          <Pressable
            onPress={handlePrevious}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: DEEP_FOREST,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 15, color: DEEP_FOREST }}>
              Previous
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleNext}
          disabled={currentStep.type === "quiz" && !showQuizResults && !isQuizLocked}
          style={{
            flex: currentStepIndex === 0 ? 1 : 1,
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: (currentStep.type === "quiz" && !showQuizResults && !isQuizLocked) ? BORDER_SOFT : DEEP_FOREST,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              fontSize: 15,
              color: (currentStep.type === "quiz" && !showQuizResults && !isQuizLocked) ? TEXT_SECONDARY : PARCHMENT,
            }}
          >
            {isLastStep ? "Complete Module" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
