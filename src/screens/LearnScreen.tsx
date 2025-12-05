import React from "react";
import { View, Text, ScrollView, Pressable, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Heading3 } from "../components/Typography";
import AccountButtonHeader from "../components/AccountButtonHeader";
import { XPBar } from "../components/XPBar";
import { isPro } from "../utils/auth";
import { usePaywallStore } from "../state/paywallStore";
import { useLearningStore, MODULES } from "../state/learningStore";
import { RootStackParamList } from "../navigation/types";

import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT_BACKGROUND,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_ON_DARK,
} from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

type LearnScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Learn">;

export default function LearnScreen() {
  const navigation = useNavigation<LearnScreenNavigationProp>();
  const proStatus = isPro();
  const { open: openPaywall } = usePaywallStore();
  const insets = useSafeAreaInsets();

  const { getCompletedModules, getTotalXP, getCurrentLevel } = useLearningStore();

  const handleModulePress = (moduleId: string) => {
    const module = MODULES.find((m) => m.id === moduleId);
    if (module && module.id !== 'leave-no-trace' && !proStatus) {
      openPaywall("learn_module", { title: "You have reached the rest of the learning path. Pro unlocks every module and quiz." });
    } else {
      navigation.navigate("ModuleDetail", { moduleId });
    }
  };

  const totalXP = getTotalXP();
  const currentLevel = getCurrentLevel();
  const completedModules = getCompletedModules();

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT_BACKGROUND }}>
      {/* Header */}
      <ImageBackground
        source={HERO_IMAGES.LEARNING}
        style={{ height: 200 + insets.top, justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0 }}>
            <AccountButtonHeader color={TEXT_ON_DARK} />
        </View>
        <View className="px-6 pb-4">
            <Text className="text-3xl" style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_ON_DARK }}>
            Learn
            </Text>
            <Text className="mt-2" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_ON_DARK }}>
            Master camping skills from novice to expert
            </Text>
        </View>
      </ImageBackground>

      <ScrollView className="flex-1 px-4 pt-4">
        <XPBar currentXP={totalXP} level={currentLevel} />

        {/* Modules */}
        <View className="space-y-4">
          {MODULES.map((module) => {
            const isLocked = module.id !== 'leave-no-trace' && !proStatus;
            const isCompleted = completedModules.includes(module.id);

            return (
              <Pressable
                key={module.id}
                onPress={() => handleModulePress(module.id)}
                className={`rounded-xl p-4 border active:opacity-80 ${isLocked ? "opacity-60" : ""}`}
                style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
              >
                <View className="flex-row items-start">
                  <View
                    className={`rounded-full p-3 mr-4 ${
                      isCompleted && !isLocked ? "bg-forest" : "bg-sierraSky/20"
                    }`}
                  >
                    <Ionicons
                      name={isLocked ? "lock-closed" : (module.icon as any)}
                      size={24}
                      color={isCompleted && !isLocked ? "white" : DEEP_FOREST}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Heading3 color={TEXT_PRIMARY_STRONG} className="flex-1">
                        {module.title}
                      </Heading3>
                      {isCompleted && !isLocked && (
                        <Ionicons name="checkmark-circle" size={20} color={DEEP_FOREST} />
                      )}
                    </View>

                    <Text className="mb-3" style={{ color: TEXT_SECONDARY }}>
                      {module.description}
                    </Text>

                    {module.badge && (
                      <View className={`mt-3 pt-3 border-t flex-row items-center ${isLocked ? "opacity-50" : ""}`} style={{ borderColor: BORDER_SOFT }}>
                        <Ionicons name={module.badge.icon as any} size={20} color={GRANITE_GOLD} />
                        <Text className="text-sm font-medium ml-2" style={{ color: GRANITE_GOLD }}>
                          Earn Badge: {module.badge.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        {!proStatus && (
            <View className="mt-4 p-4 rounded-lg bg-yellow-100/70 border border-yellow-300/70">
                <Text className="text-center text-yellow-900/80">
                You have reached the rest of the learning path. Pro unlocks every module and quiz.
                </Text>
            </View>
        )}
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}
