/**
 * Feedback List Screen
 * Shows app feedback posts from the community
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { feedbackService, FeedbackPost } from "../../services/firestore/feedbackService";
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

type CategoryFilter = 'feature' | 'bug' | 'improvement' | 'question' | 'other' | 'all';

export default function FeedbackListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = auth.currentUser;

  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [authorDetails, setAuthorDetails] = useState<Record<string, User>>({});

  const toggleVisibility = (postId: string) => {
    setHiddenPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const allPosts = await feedbackService.getFeedback();

      const filtered = selectedCategory === "all"
        ? allPosts
        : allPosts.filter(post => post.category === selectedCategory);

      setPosts(filtered);

      // Fetch author details
      const authorIds = [...new Set(filtered.map(p => p.authorId))];
      const profiles = await profileService.getMultipleUserProfiles(authorIds);
      setAuthorDetails(profiles);

    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [selectedCategory])
  );

  const handlePostPress = (postId: string) => {
    navigation.navigate("FeedbackDetail", { postId });
  };

  const handleCreatePost = () => {
    if (!currentUser) {
      // TODO: Show auth dialog
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateFeedback");
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await feedbackService.voteFeedback(postId, type);
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const currentVote = p.userVotes && p.userVotes[currentUser.uid];
            let newVoteCount = p.voteCount;

            if (currentVote === type) { 
              newVoteCount = type === 'up' ? p.voteCount - 1 : p.voteCount + 1;
            } else if (currentVote) { 
              newVoteCount = type === 'up' ? p.voteCount + 2 : p.voteCount - 2;
            } else { 
              newVoteCount = type === 'up' ? p.voteCount + 1 : p.voteCount - 1;
            }
            
            return { ...p, voteCount: newVoteCount };
          }
          return p;
        })
      );
    } catch (err) {
      loadPosts(); 
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "#6b7280";
      case "planned": return "#3b82f6";
      case "in-progress": return "#f59e0b";
      case "completed": return "#10b981";
      case "declined": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "planned": return "Planned";
      case "in-progress": return "In Progress";
      case "completed": return "Completed";
      case "declined": return "Declined";
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "feature": return "Feature";
      case "bug": return "Bug";
      case "improvement": return "Improvement";
      case "question": return "Question";
      case "other": return "Other";
      default: return category;
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

  const renderPost = ({ item }: { item: FeedbackPost }) => {
    const statusColor = getStatusColor(item.status);
    const statusLabel = getStatusLabel(item.status);
    const userVote = currentUser && item.userVotes ? item.userVotes[currentUser.uid] : null;
    const isHidden = item.voteCount <= -5 && !hiddenPosts.includes(item.id);
    const author = authorDetails[item.authorId];

    return (
      <Pressable
        onPress={() => handlePostPress(item.id)}
        className="rounded-xl p-4 mb-3 border active:opacity-90"
        style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row flex-wrap gap-2 flex-1">
            <View className="px-3 py-1 rounded-full bg-amber-100">
              <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: "#92400e" }}>
                {getCategoryLabel(item.category)}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-md" style={{ backgroundColor: statusColor + "20" }}>
              <Text className="text-xs" style={{ fontFamily: "SourceSans3_600SemiBold", color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

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

        <View className="flex-row items-center justify-between pt-3 border-t" style={{ borderColor: BORDER_SOFT }}>
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
              {item.voteCount}
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
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text
          className="mt-4"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Loading feedback...
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
          Failed to load feedback
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {error}
        </Text>
        <Pressable
          onPress={() => loadPosts()}
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
        title="Feedback"
        onAddPress={handleCreatePost}
      />

      {/* Category Filter */}
      <View className="px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        <View className="flex-row flex-wrap gap-2">
          {[
            { id: "all" as CategoryFilter, label: "All" },
            { id: "feature" as CategoryFilter, label: "Features" },
            { id: "bug" as CategoryFilter, label: "Bugs" },
            { id: "improvement" as CategoryFilter, label: "Improvements" },
            { id: "question" as CategoryFilter, label: "Questions" },
            { id: "other" as CategoryFilter, label: "Other" },
          ].map(option => (
            <Pressable
              key={option.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(option.id);
              }}
              className={`px-3 py-1 rounded-full border ${
                selectedCategory === option.id ? "bg-amber-100 border-amber-600" : "bg-white"
              }`}
              style={selectedCategory !== option.id ? { borderColor: BORDER_SOFT } : undefined}
            >
              <Text
                className="text-xs"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: selectedCategory === option.id ? "#92400e" : TEXT_SECONDARY
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="chatbubbles-outline" size={64} color={GRANITE_GOLD} />
          <Text
            className="mt-4 text-xl text-center"
            style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
          >
            No feedback yet
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            Be the first to share feedback and help shape the app!
          </Text>
          <Pressable
            onPress={handleCreatePost}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Share Feedback
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
