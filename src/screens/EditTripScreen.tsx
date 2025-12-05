import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useTripsStore, Trip } from "../state/tripsStore";
import { Heading2 } from "../components/Typography";
import Button from "../components/Button";
import AccountButton from "../components/AccountButton";
import CalendarModal from "../components/CalendarModal";
import { RootStackParamList } from "../navigation/types";
import { CampingStyle } from "../types/camping";

type EditTripScreenRouteProp = RouteProp<RootStackParamList, "EditTrip">;
type EditTripScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditTrip"
>;

const CAMPING_STYLES: { value: CampingStyle; label: string }[] = [
  { value: "CAR_CAMPING", label: "Car camping" },
  { value: "BACKPACKING", label: "Backpacking" },
  { value: "RV", label: "RV camping" },
  { value: "HAMMOCK", label: "Hammock camping" },
  { value: "ROOFTOP_TENT", label: "Roof-top tent camping" },
  { value: "OVERLANDING", label: "Overlanding" },
  { value: "BOAT_CANOE", label: "Boat or canoe camping" },
  { value: "BIKEPACKING", label: "Bikepacking" },
  { value: "WINTER", label: "Winter camping" },
  { value: "DISPERSED", label: "Dispersed camping" },
];

export default function EditTripScreen() {
  const navigation = useNavigation<EditTripScreenNavigationProp>();
  const route = useRoute<EditTripScreenRouteProp>();
  const { tripId } = route.params;
  const { getTripById, updateTrip } = useTripsStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [campingStyle, setCampingStyle] = useState<CampingStyle | undefined>();
  const [partySize, setPartySize] = useState("");

  useEffect(() => {
    const existingTrip = getTripById(tripId);
    if (existingTrip) {
      setTrip(existingTrip);
      setTripName(existingTrip.name);
      setStartDate(new Date(existingTrip.startDate));
      setEndDate(new Date(existingTrip.endDate));
      setCampingStyle(existingTrip.campingStyle);
      setPartySize(existingTrip.partySize ? String(existingTrip.partySize) : "");
    }
  }, [tripId, getTripById]);

  const handleUpdate = () => {
    if (!tripName.trim()) {
      alert("Please enter a trip name");
      return;
    }

    updateTrip(tripId, {
      name: tripName.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      campingStyle,
      partySize: partySize ? parseInt(partySize) : undefined,
    });

    navigation.goBack();
  };

  if (!trip) {
    return (
      <SafeAreaView className="flex-1 bg-parchment items-center justify-center">
        <Text>Trip not found!</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-parchmentDark">
          <View className="flex-row items-center justify-between">
            <Heading2>Edit Trip</Heading2>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-[#f0f9f4] items-center justify-center active:bg-[#dcf3e5]"
              >
                <Text className="text-forest text-lg" style={{ fontFamily: "SourceSans3_400Regular" }}>✕</Text>
              </Pressable>
              <AccountButton />
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          {/* Trip Name */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Trip Name</Text>
            <TextInput
              value={tripName}
              onChangeText={setTripName}
              placeholder="e.g., Yosemite Weekend"
              placeholderTextColor="#999"
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3 text-base text-[#16492f]"
            />
          </View>

          {/* Dates */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Start Date</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowStartDateModal(true);
              }}
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3"
            >
              <Text className="text-base text-[#16492f]" style={{ fontFamily: "SourceSans3_400Regular" }}>
                {startDate.toLocaleDateString()}
              </Text>
            </Pressable>
          </View>

          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>End Date</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEndDateModal(true);
              }}
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3"
            >
              <Text className="text-base text-[#16492f]" style={{ fontFamily: "SourceSans3_400Regular" }}>
                {endDate.toLocaleDateString()}
              </Text>
            </Pressable>
          </View>

          {/* Camping Style */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Camping Style</Text>
            <View className="flex-row flex-wrap gap-2">
              {CAMPING_STYLES.map((style) => (
                <Pressable
                  key={style.value}
                  onPress={() => setCampingStyle(style.value)}
                  className={`px-4 py-2 rounded-full ${
                    campingStyle === style.value
                      ? "bg-forest"
                      : "bg-[#f0f9f4] active:bg-[#dcf3e5]"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      campingStyle === style.value ? "text-parchment" : "text-forest"
                    }`}
                  >
                    {style.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Party Size */}
          <View className="mb-6">
            <Text className="text-[#16492f] text-base font-semibold mb-2" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Party Size</Text>
            <TextInput
              value={partySize}
              onChangeText={setPartySize}
              placeholder="Number of people"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              className="bg-parchment border border-parchmentDark rounded-xl px-4 py-3 text-base text-[#16492f]"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-5 pb-5 pt-3 border-t border-parchmentDark">
          <Button onPress={handleUpdate} fullWidth icon="checkmark-circle">
            Save Changes
          </Button>
        </View>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        date={startDate}
        onDateChange={(event, date) => {
          if (date) {
            setStartDate(date);
            if (date > endDate) {
              setEndDate(new Date(date.getTime() + 86400000));
            }
          }
          setShowStartDateModal(false);
        }}
        title="Select Start Date"
      />

      <CalendarModal
        visible={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        date={endDate}
        onDateChange={(event, date) => {
          if (date) {
            setEndDate(date);
          }
          setShowEndDateModal(false);
        }}
        title="Select End Date"
        minimumDate={startDate}
      />
    </SafeAreaView>
  );
}
