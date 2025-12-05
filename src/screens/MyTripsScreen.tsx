import React, { useMemo } from "react";
import { View, Text, Pressable, FlatList, ImageBackground, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTripsStore, Trip } from "../state/tripsStore";
import { useTripsListStore } from "../state/tripsListStore";
import TripCard from "../components/TripCard";
import AccountButtonHeader from "../components/AccountButtonHeader";
import EmptyState from "../components/EmptyState";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isPro } from "../utils/auth";
import { usePaywallStore } from "../state/paywallStore";
import { RootStackParamList } from "../navigation/types";
import {
  DEEP_FOREST,
  PARCHMENT,
} from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

type MyTripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyTripsScreen() {
  const nav = useNavigation<MyTripsScreenNavigationProp>();
  const { trips, deleteTrip } = useTripsStore();
  const proStatus = isPro();
  const { open: openPaywall } = usePaywallStore();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();

  const { segment } = useTripsListStore();

  const handleCreateTripPress = () => {
    if (!proStatus && trips.length >= 1) {
      openPaywall("trip_limit", { title: "You can create one trial trip on the free plan. Pro gives you unlimited trips." });
    } else {
      nav.navigate("CreateTrip");
    }
  };

  const handleMenuPress = (trip: Trip) => {
    const options = ["Edit Trip", "Delete Trip", "Cancel"];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case 0: // Edit
            nav.navigate("EditTrip", { tripId: trip.id });
            break;
          case 1: // Delete
            Alert.alert("Delete Trip", `Are you sure you want to delete "${trip.name}"?`, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteTrip(trip.id),
              },
            ]);
            break;
        }
      }
    );
  };

  const filteredTrips = useMemo(() => {
    const now = new Date();
    if (segment === "upcoming") {
      return trips.filter(t => new Date(t.startDate) >= now);
    } else if (segment === "past") {
      return trips.filter(t => new Date(t.startDate) < now);
    }
    return trips; // "all"
  }, [trips, segment]);

  return (
    <View className="flex-1 bg-parchment">
      <ImageBackground
        source={HERO_IMAGES.PLAN_TRIP}
        style={{ height: 200 + insets.top, justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0 }}>
          <AccountButtonHeader color={PARCHMENT} />
        </View>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 }}
        />
        <View className="px-6 pb-4">
          <Text className="text-parchment text-3xl" style={{ fontFamily: "JosefinSlab_700Bold" }}>
            My Trips
          </Text>
          <Text className="text-parchment mt-1" style={{ fontFamily: "SourceSans3_400Regular" }}>
            Organize and manage your camping adventures
          </Text>
        </View>
      </ImageBackground>

      <View className="flex-row items-center justify-between p-4 bg-forest">
        <Text className="text-xl text-parchment" style={{ fontFamily: "JosefinSlab_700Bold" }}>
            {segment.charAt(0).toUpperCase() + segment.slice(1)} Trips
        </Text>
        <Pressable
          onPress={handleCreateTripPress}
          className="flex-row items-center bg-earth-green rounded-full px-4 py-2 active:opacity-80"
          accessibilityLabel="Create new trip"
        >
          <Ionicons name="add" size={20} color={PARCHMENT} />
          <Text className="text-parchment font-bold ml-1">New Trip</Text>
        </Pressable>
      </View>

      {!proStatus && trips.length >= 1 && (
        <View className="p-3 bg-yellow-100/70 border-b border-yellow-300/70">
          <Text className="text-center text-yellow-900/80 text-sm">
            You can create one trial trip on the free plan. Pro gives you unlimited trips.
          </Text>
        </View>
      )}

      <FlatList
        data={filteredTrips}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onResume={() => nav.navigate("TripDetail", { tripId: item.id })}
            onMenu={handleMenuPress}
          />
        )}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="mt-16">
            <EmptyState
              iconName="compass-outline"
              title="No Trips Yet"
              message="Start planning your next adventure and your trips will show up here."
              ctaLabel="Create First Trip"
              onPress={handleCreateTripPress}
            />
          </View>
        }
      />
    </View>
  );
}
