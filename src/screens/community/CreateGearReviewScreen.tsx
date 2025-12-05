import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "../../components/ModalHeader";
import * as Haptics from "expo-haptics";
import { createGearReview } from "../../services/gearReviewsService";
import { useCurrentUser } from "../../state/userStore";
import { RootStackNavigationProp } from "../../navigation/types";
import { GearCategory } from "../../types/community";
import { useProStatus } from "../../utils/auth";
import { usePaywallStore } from "../../state/paywallStore";
import {
  DEEP_FOREST,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

const CATEGORIES: { value: GearCategory; label: string }[] = [
  { value: "shelter", label: "Shelter" },
  { value: "sleep", label: "Sleep System" },
  { value: "kitchen", label: "Kitchen" },
  { value: "clothing", label: "Clothing" },
  { value: "lighting", label: "Lighting" },
  { value: "pack", label: "Backpacks" },
  { value: "water", label: "Water" },
  { value: "safety", label: "Safety" },
  { value: "misc", label: "Other" },
];

export default function CreateGearReviewScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();
  const isPro = useProStatus();
  const { open: openPaywall } = usePaywallStore();

  const [gearName, setGearName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<GearCategory>("misc");
  const [rating, setRating] = useState(0);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (!isPro) {
      openPaywall("community_posting", { title: "Posting is a Pro feature. Upgrade to join the conversation." });
      navigation.goBack();
    }
  }, [isPro, navigation, openPaywall]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    if (!gearName.trim() || rating === 0 || !summary.trim() || !body.trim()) {
        // This should be handled by disabling the button, but as a safeguard:
        alert("Please fill out all required fields.");
        return;
    }

    try {
      setSubmitting(true);
      const reviewId = await createGearReview({
        gearName: gearName.trim(),
        brand: brand.trim() || undefined,
        category,
        rating,
        summary: summary.trim(),
        body: body.trim(),
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        tags,
        authorId: currentUser.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("GearReviewDetail", { reviewId });
    } catch (error: any) {
      alert("Failed to create review");
      setSubmitting(false);
    }
  };

  const renderStarSelector = () => {
    return (
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              setRating(star);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="mr-2 active:opacity-70"
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={36}
              color="#F59E0B"
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const isFormValid = gearName.trim() && rating > 0 && summary.trim() && body.trim();

  if (!isPro) {
    return (
        <View className="flex-1 justify-center items-center bg-parchment">
            <ActivityIndicator color={DEEP_FOREST} />
        </View>
    )
  }

  return (
    <View className="flex-1 bg-parchment">
      <ModalHeader
        title="Review Gear"
        showTitle
        rightAction={{
          icon: "checkmark",
          onPress: handleSubmit,
          disabled: submitting || !isFormValid
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-5">
          {/* ... form fields ... */}
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
