/**
 * Tips List Screen
 * Uses tipsService for Firestore queries
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, Image } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { tipsService, Tip } from "../../services/firestore/tipsService";
import { auth } from "../../config/firebase";
import { RootStackNavigationProp } from "../../navigation/types";
import CommunitySectionHeader from "../../components/CommunitySectionHeader";
import { profileService } from "../../services/firestore/profileService";
import { User } from "../../types/user";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

type SortOption = "newest" | "my";

export default function TipsListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = auth.currentUser;

  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [authorDetails, setAuthorDetails] = useState<Record<string, User>>({});

  const toggleVisibility = (postId: string) => {
    setHiddenPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const loadTips = async () => {
    try {
      setLoading(true);
      setError(null);

      let allTips: Tip[];

      if (sortBy === "my" && currentUser) {
        const allTipsData = await tipsService.getTips();
        allTips = allTipsData.filter(tip => tip.authorId === currentUser.uid);
      } else {
        allTips = await tipsService.getTips();
      }

      setTips(allTips);

      const authorIds = [...new Set(allTips.map(p => p.authorId))];
      const profiles = await profileService.getMultipleUserProfiles(authorIds);
      setAuthorDetails(profiles);

    } catch (err: any) {
      setError(err.message || "Failed to load tips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, [sortBy]);

  useFocusEffect(
    React.useCallback(() => {
      loadTips();
    }, [sortBy])
  );

  const handleTipPress = (tipId: string) => {
    navigation.navigate("TipDetail", { tipId });
  };

  const handleCreateTip = () => {
    if (!currentUser) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateTip");
  };
  
  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await tipsService.voteTip(postId, type);
      setTips(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const currentVote = p.userVotes && p.userVotes[currentUser.uid];
            let newUpvotes = p.upvotes;

            if (currentVote === type) { 
              newUpvotes = type === 'up' ? p.upvotes - 1 : p.upvotes + 1;
            } else if (currentVote) { 
              newUpvotes = type === 'up' ? p.upvotes + 2 : p.upvotes - 2;
            } else { 
              newUpvotes = type === 'up' ? p.upvotes + 1 : p.upvotes - 1;
            }
            
            return { ...p, upvotes: newUpvotes };
          }
          return p;
        })
      );
    } catch (err) {
      loadTips(); 
    }
  };

  const formatTimeAgo = (dateString: string | any) => {
    const now = new Date();
    const date = typeof dateString === "string" ? new Date(dateString) : dateString.toDate?.() || new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  };

  const filteredTips = searchQuery
    ? tips.filter(tip =>
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tips;

  const renderTip = ({ item }: { item: Tip }) => {
    const userVote = currentUser && item.userVotes ? item.userVotes[currentUser.uid] : null;
    const isHidden = item.upvotes <= -5 && !hiddenPosts.includes(item.id);
    const author = authorDetails[item.authorId];
    
    return (
    <Pressable
      onPress={() => handleTipPress(item.id)}
      className="rounded-xl p-4 mb-3 border active:opacity-90"
      style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
    >
      <Text
        className="text-lg mb-2"
        style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
      >
        {item.title}
      </Text>
      {isHidden ? (
        <Pressable onPress={() => toggleVisibility(item.id)} className="py-4 items-center bg-gray-100 rounded-md">
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>Content hidden due to downvotes</Text>
          <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED, marginTop: 4 }}>Tap to show</Text>
        </Pressable>
      ) : (
        <Text
          className="mb-3"
          numberOfLines={2}
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {item.body}
        </Text>
      )}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image source={{ uri: author?.photoURL }} className="w-6 h-6 rounded-full mr-2" />
          <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
            @{author?.handle} • {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleVote(item.id, 'up');
              }}
              className="px-2 py-1"
            >
              <Ionicons 
                name={userVote === 'up' ? "arrow-up-circle" : "arrow-up-circle-outline"} 
                size={20} 
                color={userVote === 'up' ? EARTH_GREEN : TEXT_MUTED} 
              />
            </Pressable>
            
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG, minWidth: 20, textAlign: 'center' }}>
              {item.upvotes}
            </Text>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleVote(item.id, 'down');
              }}
              className="px-2 py-1"
            >
              <Ionicons 
                name={userVote === 'down' ? "arrow-down-circle" : "arrow-down-circle-outline"} 
                size={20} 
                color={userVote === 'down' ? '#ef4444' : TEXT_MUTED} 
              />
            </Pressable>
          </View>
      </View>
    </Pressable>
  )};

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text
          className="mt-4"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Loading tips...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment px-5">
        <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
        <Text
          className="mt-4 text-center text-lg"
          style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
        >
          Failed to load tips
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {error}
        </Text>
        <Pressable
          onPress={() => loadTips()}
          className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
          style={{ backgroundColor: DEEP_FOREST }}
        >
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <CommunitySectionHeader
        title="Camping Tips"
        onAddPress={handleCreateTip}
      />

      {/* Search and Filters */}
      <View className="px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border mb-3" style={{ borderColor: BORDER_SOFT }}>
          <Ionicons name="search" size={18} color={TEXT_MUTED} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tips"
            placeholderTextColor={TEXT_MUTED}
            className="flex-1 ml-2"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <View className="flex-row gap-2">
          {[
            { id: "newest" as SortOption, label: "Newest" },
            { id: "my" as SortOption, label: "My Tips" },
          ].map(option => (
            <Pressable
              key={option.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy(option.id);
              }}
              className={`px-4 py-2 rounded-full ${
                sortBy === option.id ? "bg-forest" : "bg-white border"
              }`}
              style={sortBy !== option.id ? { borderColor: BORDER_SOFT } : undefined}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: sortBy === option.id ? PARCHMENT : TEXT_PRIMARY_STRONG
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {filteredTips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="bulb-outline" size={64} color={GRANITE_GOLD} />
          <Text
            className="mt-4 text-xl text-center"
            style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
          >
            No tips yet
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            Be the first to share a helpful camping tip!
          </Text>
          <Pressable
            onPress={handleCreateTip}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Share Your First Tip
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredTips}
          renderItem={renderTip}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
