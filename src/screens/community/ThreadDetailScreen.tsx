import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import ModalHeader from "../../components/ModalHeader";
import type { RootStackParamList, RootStackNavigationProp } from "../../navigation/types";
import { getQuestionById, getAnswers, addAnswer, type Question, type Answer } from "../../api/qa-service";
import { useAuthStore } from "../../state/authStore";
import { useToast } from "../../components/ToastManager";
import { Timestamp } from "firebase/firestore";
import { useProStatus } from "../../utils/auth";
import { usePaywallStore } from "../../state/paywallStore";
import { DEEP_FOREST, PARCHMENT, CARD_BACKGROUND_LIGHT, BORDER_SOFT, TEXT_PRIMARY_STRONG, TEXT_SECONDARY, TEXT_MUTED } from "../../constants/colors";

// Helper to convert Timestamp to string
const toDateString = (date: Timestamp | string): string => {
  if (typeof date === "string") return date;
  return date.toDate().toISOString();
};

export default function ThreadDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ThreadDetail">>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { questionId } = route.params;

  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const isPro = useProStatus();
  const { open: openPaywall } = usePaywallStore();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [fetchedQuestion, fetchedAnswers] = await Promise.all([
        getQuestionById(questionId),
        getAnswers(questionId),
      ]);
      setQuestion(fetchedQuestion);
      setAnswers(fetchedAnswers);
    } catch (error) {
      showError("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [questionId]);

  const post = async () => {
    if (!isPro) {
        openPaywall("community_posting", { title: "Posting is a Pro feature. Upgrade to join the conversation." });
        return;
    }

    if (!text.trim()) return;

    if (!user) {
      return;
    }

    try {
      setPosting(true);
      await addAnswer(text.trim(), user.id, questionId);
      setText("");
      await load();
      showSuccess("Answer posted!");
    } catch (error) {
      showError("Failed to post answer");
    } finally {
      setPosting(false);
    }
  };

    const handleTextInputFocus = () => {
        if (!isPro) {
            openPaywall("community_posting", { title: "Posting is a Pro feature. Upgrade to join the conversation." });
        }
    };

  if (loading) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Thread" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      </View>
    );
  }

  if (!question) {
    return (
      <View className="flex-1 bg-parchment">
        <ModalHeader title="Thread" showTitle />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}>Question not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader title="Thread" showTitle />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Question Card */}
          <View style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }} className="rounded-xl p-4 mb-6 border">
            <Text style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }} className="text-lg mb-3">
              {question.question}
            </Text>

            {question.details && (
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, lineHeight: 24 }} className="text-base mb-3">
                {question.details}
              </Text>
            )}

            {/* Footer */}
            <View style={{ borderColor: BORDER_SOFT }} className="flex-row items-center justify-between pt-3 border-t">
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }} className="text-sm">
                by {question.userId}
              </Text>
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }} className="text-sm">
                {question.createdAt?.toDate ? question.createdAt.toDate().toLocaleDateString() : ""}
              </Text>
            </View>
          </View>

          {/* Answers Section */}
          <View className="mb-6">
            <Text style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }} className="text-lg mb-4">
              {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
            </Text>

            {answers.length === 0 ? (
              <View style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }} className="rounded-xl p-6 items-center border">
                <Ionicons name="chatbubble-outline" size={48} color="#9ca3af" />
                <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }} className="mt-3">No answers yet</Text>
                <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }} className="text-sm mt-1">Be the first to help!</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {answers.map((answer) => (
                  <View
                    key={answer.id}
                    style={{ backgroundColor: PARCHMENT, borderColor: BORDER_SOFT }} className="rounded-xl p-4 border"
                  >
                    <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG, lineHeight: 24 }} className="text-base mb-3">
                      {answer.text}
                    </Text>

                    <View style={{ borderColor: BORDER_SOFT }} className="flex-row items-center justify-between pt-3 border-t">
                      <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }} className="text-sm">
                        by {answer.userId}
                      </Text>
                      <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }} className="text-sm">
                        {answer.createdAt?.toDate ? answer.createdAt.toDate().toLocaleDateString() : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Answer Input */}
        <View style={{ borderTopColor: BORDER_SOFT }} className="px-6 py-4 border-t bg-parchment">
          <View className="flex-row items-end">
            <View className="flex-1 mr-3">
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={handleTextInputFocus}
                placeholder={isPro ? "Write your answer..." : "Upgrade to Pro to answer"}
                placeholderTextColor="#9ca3af"
                multiline
                editable={isPro}
                className="rounded-xl px-4 py-3 text-base border"
                style={{
                    backgroundColor: isPro ? CARD_BACKGROUND_LIGHT : BORDER_SOFT,
                    borderColor: BORDER_SOFT,
                    color: TEXT_PRIMARY_STRONG,
                    maxHeight: 100, 
                    fontFamily: "SourceSans3_400Regular"
                }}
              />
            </View>
            <Pressable
              onPress={post}
              disabled={!text.trim() || posting || !isPro}
              className={`rounded-full p-3 ${!text.trim() || posting || !isPro ? "bg-stone-300" : "bg-forest-800 active:bg-forest-900"}`}
            >
              <Ionicons name="send" size={20} color={PARCHMENT} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
