import { serverTimestamp } from "firebase/firestore";
import React from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Purchases from "react-native-revenuecat";

import { useUser, useSubscription } from "../state/userStore";
import { updateUserInFirestore } from "../services/userService";

const PaywallScreen = () => {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { user } = useUser();
  const { packages, isSubscribing, restorePurchases } = useSubscription();

  const handlePurchase = async (pkg) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to make a purchase.");
      return;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active.pro) {
        await updateUserInFirestore(user.uid, {
          membershipTier: "pro",
          subscriptionStatus: "active",
          subscriptionProvider: "revenuecat",
          subscriptionUpdatedAt: serverTimestamp(),
        });
        Alert.alert("Success", "You are now a Pro member!");
        router.back();
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Error", e.message);
      }
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo?.entitlements.active.pro) {
        if (user) {
          await updateUserInFirestore(user.uid, {
            membershipTier: "pro",
            subscriptionStatus: "active",
            subscriptionProvider: "revenuecat",
            subscriptionUpdatedAt: serverTimestamp(),
          });
        }
        Alert.alert("Success", "Your purchases have been restored.");
        router.back();
      } else {
        Alert.alert("Info", "No active subscriptions found to restore.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const features = [
    "All learning paths",
    "Unlimited trips",
    "Full community posting",
    "Add your campground crew",
    "Build your gear closet",
    "Earn badges",
    "Get trip reminders and updates",
  ];

  const annualPackage = packages.find((p) => p.identifier === "annual");
  const monthlyPackage = packages.find((p) => p.identifier === "monthly");

  return (
    <View className="flex-1 justify-end bg-black/50">
      <View
        className="bg-white rounded-t-3xl p-6"
        style={{ paddingBottom: bottom + 16 }}
      >
        <Text className="text-3xl font-bold text-center mb-2">Upgrade to Pro</Text>
        <Text className="text-lg text-center text-gray-600 mb-8">
          Make camping easier, warmer, and way more organized.
        </Text>

        <View className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center">
              <Feather name="check-circle" size={20} color="#4ade80" />
              <Text className="ml-3 text-base">{feature}</Text>
            </View>
          ))}
        </View>

        {isSubscribing ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            {annualPackage && (
              <Pressable
                onPress={() => handlePurchase(annualPackage)}
                className="bg-green-500 rounded-xl p-4 mb-4 relative"
              >
                <View className="absolute top-[-10px] right-4 bg-yellow-400 px-2 py-1 rounded-full">
                  <Text className="text-xs font-bold">Best value</Text>
                </View>
                <Text className="text-white text-lg font-bold text-center">
                  Unlock Pro
                </Text>
              </Pressable>
            )}

            {monthlyPackage && (
              <Pressable onPress={() => handlePurchase(monthlyPackage)}>
                <Text className="text-center text-gray-600">
                  Or subscribe monthly for {monthlyPackage.product.priceString}
                </Text>
              </Pressable>
            )}
          </>
        )}

        <Pressable onPress={handleRestorePurchases} className="mt-6">
          <Text className="text-center text-gray-500">Restore purchases</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PaywallScreen;
