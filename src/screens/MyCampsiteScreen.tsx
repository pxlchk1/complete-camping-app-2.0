import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { HERO_IMAGES } from "../constants/images";
import { useUserStore } from "../state/userStore";
import { useProStatus } from "../utils/auth";
import { usePaywallStore } from "../state/paywallStore";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  BORDER_SOFT,
} from "../constants/colors";

type UserProfile = {
    displayName: string;
    handle: string;
    email: string;
    avatarUrl: string | null;
    backgroundUrl: string | null;
    membershipTier: "free" | "pro";
    bio: string | null;
    location: string | null;
    campingStyle: string | null;
    joinedAt: any;
  };

const COVER_HEIGHT = 200;
const PROFILE_SIZE = 120;
const PROFILE_OVERLAP = 60;

export default function MyCampsiteScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUserStore();
  const isPro = useProStatus();
  const { open: openPaywall } = usePaywallStore();

  useEffect(() => {
    if (!user) {
      navigation.replace("Auth");
      return;
    }
    loadProfile(user.uid);
  }, [user, navigation]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
      } else {
        // This case should be handled by AuthLanding creating the user doc
      }
    } catch (error) {
      console.error("[MyCampsite] Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    navigation.replace("Auth");
  };

  const handleEditProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("EditProfile");
  };

  const handleMyCampgroundPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPro) {
      navigation.navigate("MyCampground");
    } else {
      openPaywall("my_campground", { title: "This is where you will keep your camping crew. Pro unlocks your campground." });
    }
  };

  const handleMyGearClosetPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPro) {
      navigation.navigate("MyGearCloset");
    } else {
      openPaywall("my_gear_closet", { title: "Store all your gear in one place with Pro. It makes packing so much easier." });
    }
  }

  const handleMyActivityPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MyActivity");
  }

  if (loading || !profile) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: PARCHMENT }}>
        <ActivityIndicator size="large" color={DEEP_FOREST} />
      </View>
    );
  }

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ImageBackground source={HERO_IMAGES.default} style={{ height: COVER_HEIGHT }} resizeMode="cover" />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ height: COVER_HEIGHT - PROFILE_OVERLAP }} />
        <View className="px-5 pb-10" style={{ marginTop: -PROFILE_OVERLAP, zIndex: 10 }}>
           {/* Avatar */}
           <View
            style={{
              width: PROFILE_SIZE,
              height: PROFILE_SIZE,
              borderRadius: PROFILE_SIZE / 2,
              borderWidth: 4,
              borderColor: PARCHMENT,
              backgroundColor: PARCHMENT,
              marginBottom: 12,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{
                  flex: 1,
                  borderRadius: (PROFILE_SIZE - 8) / 2,
                }}
              />
            ) : (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: DEEP_FOREST, borderRadius: (PROFILE_SIZE - 8) / 2 }}>
                <Text
                  style={{
                    fontFamily: "SourceSans3_700Bold",
                    fontSize: 40,
                    color: PARCHMENT,
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl font-bold" style={{color: TEXT_PRIMARY_STRONG}}>{profile.displayName}</Text>
            <View
              className="rounded-full px-3 py-1 self-start ml-2"
              style={{ backgroundColor: isPro ? GRANITE_GOLD : EARTH_GREEN }}
            >
              <Text className="text-xs font-semibold" style={{ color: PARCHMENT }}>
                {isPro ? "Pro" : "Free user"}
              </Text>
            </View>
          </View>
          <Text className="text-base mb-4" style={{color: TEXT_SECONDARY}}>@{profile.handle}</Text>

          <Pressable
            onPress={handleEditProfilePress}
            className="mb-3 p-4 rounded-xl border active:opacity-70 flex-row items-center justify-between"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center">
              <Ionicons name={"create-outline"} size={22} color={EARTH_GREEN} />
              <Text className="ml-3" style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
                Edit Profile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
          </Pressable>

          <Pressable
            onPress={handleMyCampgroundPress}
            className="mb-3 p-4 rounded-xl border active:opacity-70 flex-row items-center justify-between"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center">
              <Ionicons name={isPro ? "people-outline" : "lock-closed-outline"} size={22} color={EARTH_GREEN} />
              <Text className="ml-3" style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
                My Campground
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
          </Pressable>

          <Pressable
            onPress={handleMyGearClosetPress}
            className="mb-3 p-4 rounded-xl border active:opacity-70 flex-row items-center justify-between"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center">
              <Ionicons name={isPro ? "shirt-outline" : "lock-closed-outline"} size={22} color={EARTH_GREEN} />
              <Text className="ml-3" style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
                My Gear Closet
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
          </Pressable>

          <Pressable
            onPress={handleMyActivityPress}
            className="mb-6 p-4 rounded-xl border active:opacity-70 flex-row items-center justify-between"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center">
              <Ionicons name={isPro ? "analytics-outline" : "lock-closed-outline"} size={22} color={EARTH_GREEN} />
              <Text className="ml-3" style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
                My Activity
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
          </Pressable>
          
          <Pressable
            onPress={handleSignOut}
            className="mt-4 mb-4 p-4 rounded-xl active:opacity-70 flex-row items-center justify-center bg-red-100"
          >
              <Ionicons name={"log-out-outline"} size={22} color={"#dc2626"} />
              <Text className="ml-3 font-bold" style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 16, color: "#dc2626" }}>
                Sign Out
              </Text>
          </Pressable>

          </View>
      </ScrollView>
    </View>
  );
}