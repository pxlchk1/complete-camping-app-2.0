import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DEEP_FOREST, PARCHMENT, TEXT_MUTED, TEXT_PRIMARY_STRONG } from '../constants/colors';
import { useProStatus } from '../utils/auth';
import { usePaywallStore } from "../state/paywallStore";

export default function MyActivityScreen() {
    const navigation = useNavigation();
    const isPro = useProStatus();
    const { open: openPaywall } = usePaywallStore();


    if (!isPro) {
        return (
            <View className="flex-1 items-center justify-center p-8 bg-parchment">
                <Ionicons name="lock-closed" size={48} color={TEXT_MUTED} />
                <Text className="text-xl font-bold text-center text-primaryStrong mt-4">Your activity shows everything you have shared. Pro unlocks posting.</Text>
                <Pressable
                    onPress={() => openPaywall("my_activity", { title: "Your activity shows everything you have shared. Pro unlocks posting." })}
                    className="mt-6 bg-forest rounded-lg px-8 py-3"
                >
                    <Text className="font-bold text-white">Unlock with Pro</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 items-center justify-center bg-parchment">
            <Text className="text-lg text-primaryStrong">My Activity</Text>
        </View>
    );
}
