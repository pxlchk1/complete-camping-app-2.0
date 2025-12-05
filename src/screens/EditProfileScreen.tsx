
import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../config/firebase";
import { useCurrentUser, useUserStore } from "../state/userStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
} from "../constants/colors";
import { User } from "../types/user";
import Avatar from "../components/Avatar";

const campingStyles = [
  { value: "tent", label: "Tent Camping" },
  { value: "rv", label: "RV Camping" },
  { value: "hammock", label: "Hammock Camping" },
  { value: "car", label: "Car Camping" },
  { value: "backpacking", label: "Backpacking" },
  { value: "glamping", label: "Glamping" },
];

const gearCategories = [
  { value: "shelter", label: "Shelter" },
  { value: "sleeping", label: "Sleeping Bags & Pads" },
  { value: "cooking", label: "Cooking Gear" },
  { value: "packs", label: "Backpacks" },
  { value: "clothing", label: "Clothing" },
  { value: "footwear", label: "Footwear" },
  { value: "electronics", label: "Electronics" },
  { value: "tools", label: "Tools & Knives" },
  { value: "safety", label: "Safety & First Aid" },
];

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const currentUser = useCurrentUser();
  const { updateCurrentUser } = useUserStore();
  const insets = useSafeAreaInsets();

  const [about, setAbout] = useState(currentUser?.about || "");
  const [campingStyle, setCampingStyle] = useState(
    currentUser?.favoriteCampingStyle || ""
  );
  const [favoriteGear, setFavoriteGear] = useState(
    currentUser?.favoriteGear?.[0] || ""
  );
  const [image, setImage] = useState<string | null>(
    currentUser?.photoURL || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    let photoURL = currentUser.photoURL;

    if (image && image !== currentUser.photoURL) {
      const newUrl = await uploadImage(image);
      if (newUrl) {
        photoURL = newUrl;
      }
    }

    const updates: Partial<User> = {
      about,
      favoriteCampingStyle: campingStyle,
      favoriteGear: favoriteGear ? [favoriteGear] : [],
      photoURL: photoURL,
      updatedAt: new Date().toISOString(),
    };

    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, updates);
      updateCurrentUser(updates);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Edit Profile",
      headerTitleStyle: { color: TEXT_PRIMARY_STRONG },
      headerStyle: { backgroundColor: PARCHMENT },
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Text style={{ color: EARTH_GREEN, fontSize: 16 }}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={EARTH_GREEN} />
          ) : (
            <Text
              style={{ color: EARTH_GREEN, fontSize: 16, fontWeight: "bold" }}
            >
              Save
            </Text>
          )}
        </Pressable>
      ),
    });
  }, [navigation, isSaving, about, campingStyle, favoriteGear, image]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!currentUser) return null;
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `avatars/${currentUser.id}/${Date.now()}`
      );
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: PARCHMENT }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center p-6">
          <Pressable onPress={handlePickImage} disabled={isUploading}>
            <Avatar user={{ ...currentUser, photoURL: image }} size={120} />
            <View className="absolute -bottom-1 -right-1 bg-earthGreen p-2 rounded-full border-4 border-parchment">
              {isUploading ? (
                <ActivityIndicator size="small" color={PARCHMENT} />
              ) : (
                <Ionicons name="camera" size={20} color={PARCHMENT} />
              )}
            </View>
          </Pressable>
        </View>

        <View className="px-6 space-y-4">
          <View>
            <Text className="text-base font-semibold text-gray-600 mb-1">
              About
            </Text>
            <TextInput
              value={about}
              onChangeText={setAbout}
              placeholder="Tell us a little about your camping adventures."
              multiline
              className="h-24 rounded-xl border border-parchmentDark bg-parchment p-3 text-base leading-snug"
              style={{ textAlignVertical: "top" }}
              placeholderTextColor={TEXT_SECONDARY}
            />
          </View>

          <View>
            <Text className="text-base font-semibold text-gray-600 mb-1">
              Favorite Camping Style
            </Text>
            <Select value={campingStyle} onValueChange={setCampingStyle}>
              <SelectTrigger aria-label="Select camping style">
                <SelectValue placeholder="Select a style..." />
              </SelectTrigger>
              <SelectContent>
                {campingStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View>
            <Text className="text-base font-semibold text-gray-600 mb-1">
              Favorite Gear Category
            </Text>
            <Select value={favoriteGear} onValueChange={setFavoriteGear}>
              <SelectTrigger aria-label="Select gear category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {gearCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;
