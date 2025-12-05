/**
 * Gear Reviews List Screen
 * Shows list of gear reviews with category filtering
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { DocumentSnapshot } from "firebase/firestore";
import * as Haptics from "expo-haptics";
import { gearReviewsService, GearReview } from "../../services/firestore/gearReviewsService";
import { GearCategory } from "../../types/community";
import { RootStackNavigationProp } from "../../navigation/types";
import { useCurrentUser } from "../../state/userStore";
import CommunitySectionHeader from "../../components/CommunitySectionHeader";
import { profileService } from "../../services/firestore/profileService";
import { User } from "../../types/user";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";

type CategoryFilter = "all" | GearCategory;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shelter", label: "Shelter" },
  { value: "sleep", label: "Sleep" },
  { value: "kitchen", label: "Kitchen" },
  { value: "clothing", label: "Clothing" },
  { value: "lighting", label: "Lighting" },
  { value: "pack", label: "Packs" },
  { value: "water", label: "Water" },
  { value: "safety", label: "Safety" },
  { value: "misc", label: "Other" },
];

export default function GearReviewsListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();

  const [reviews, setReviews] = useState<GearReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<GearReview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [authorDetails, setAuthorDetails] = useState<Record<string, User>>({});

  const toggleVisibility = (postId: string) => {
    setHiddenPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const toDateString = (date: any): string => {
    if (typeof date === "string") return date;
    if (date?.toDate) return date.toDate().toISOString();
    return new Date().toISOString();
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

  const loadReviews = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setReviews([]);
        setLastDoc(null);
        setHasMore(true);
        setError(null);
      }

      const result = await gearReviewsService.getGearReviews(
        category === "all" ? "all" : category,
        20,
        refresh ? undefined : lastDoc || undefined
      );

      let allReviews: GearReview[];
      if (refresh) {
        allReviews = result.reviews;
      } else {
        allReviews = [...reviews, ...result.reviews];
      }
      setReviews(allReviews);

      setLastDoc(result.lastDoc);
      setHasMore(result.reviews.length === 20);

      const authorIds = [...new Set(allReviews.map(p => p.authorId))];
      const profiles = await profileService.getMultipleUserProfiles(authorIds);
      setAuthorDetails(profiles);

    } catch (err: any) {
      setError(err.message || "Failed to load gear reviews");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await gearReviewsService.voteGearReview(postId, type);
      setReviews(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const currentVote = p.userVotes && p.userVotes[currentUser.id];
            let newUpvotes = p.upvoteCount;

            if (currentVote === type) { 
              newUpvotes = type === 'up' ? p.upvoteCount - 1 : p.upvoteCount + 1;
            } else if (currentVote) { 
              newUpvotes = type === 'up' ? p.upvoteCount + 2 : p.upvoteCount - 2;
            } else { 
              newUpvotes = type === 'up' ? p.upvoteCount + 1 : p.upvoteCount - 1;
            }
            
            return { ...p, upvoteCount: newUpvotes };
          }
          return p;
        })
      );
    } catch (err) {
      loadReviews(); 
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      setLoadingMore(true);
      loadReviews(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews(true);
  };

  const handleCategoryChange = (newCategory: CategoryFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(newCategory);
    setReviews([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
  };

  useEffect(() => {
    loadReviews(true);
  }, [category]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredReviews(
        reviews.filter(
          (r) =>
            r.gearName.toLowerCase().includes(query) ||
            r.brand?.toLowerCase().includes(query) ||
            r.summary.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredReviews(reviews);
    }
  }, [searchQuery, reviews]);

  const renderReviewItem = ({ item }: { item: GearReview }) => {
    const userVote = currentUser && item.userVotes ? item.userVotes[currentUser.id] : null;
    const isHidden = item.upvoteCount <= -5 && !hiddenPosts.includes(item.id);
    const author = authorDetails[item.authorId];

    return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("GearReviewDetail", { reviewId: item.id });
      }}
      className="mb-3 p-4 rounded-xl border active:opacity-90"
      style={{
        backgroundColor: CARD_BACKGROUND_LIGHT,
        borderColor: BORDER_SOFT,
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text
            className="text-lg mb-1"
            style={{
              fontFamily: "JosefinSlab_700Bold",
              color: TEXT_PRIMARY_STRONG,
            }}
            numberOfLines={1}
          >
            {item.gearName}
          </Text>
          {item.brand && (
            <Text
              className="text-sm mb-1"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}
            >
              {item.brand}
            </Text>
          )}
        </View>
        <View className="flex-row items-center">
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text
            className="ml-1"
            style={{
              fontFamily: "SourceSans3_600SemiBold",
              color: TEXT_PRIMARY_STRONG,
            }}
          >
            {item.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      {isHidden ? (
          <Pressable onPress={() => toggleVisibility(item.id)} className="py-4 items-center bg-gray-100 rounded-md">
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}>Content hidden due to downvotes</Text>
            <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED, marginTop: 4 }}>Tap to show</Text>
          </Pressable>
        ) : (
        <Text
          className="mb-2"
          style={{
            fontFamily: "SourceSans3_400Regular",
            color: TEXT_SECONDARY,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {item.summary}
        </Text>
      )}

      {item.tags && item.tags.length > 0 && !isHidden && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {item.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <Text
                className="text-xs"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: "#6B7280" }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image source={{ uri: author?.photoURL }} className="w-6 h-6 rounded-full mr-2" />
          <Text
            className="text-xs"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}
          >
            @{author?.handle} • {formatTimeAgo(toDateString(item.createdAt))}
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
              {item.upvoteCount}
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

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center px-6 py-12">
        <Ionicons name="bag-outline" size={64} color={TEXT_MUTED} />
        <Text
          className="text-lg mt-4 mb-2 text-center"
          style={{
            fontFamily: "JosefinSlab_700Bold",
            color: TEXT_PRIMARY_STRONG,
          }}
        >
          No Reviews Yet
        </Text>
        <Text
          className="text-center mb-6"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          {searchQuery
            ? "No reviews match your search"
            : "Be the first to review camping gear"}
        </Text>
        {currentUser && !searchQuery && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("CreateGearReview");
            }}
            className="px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text
              style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
            >
              Write First Review
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text
        className="text-lg mt-4 mb-2 text-center"
        style={{
          fontFamily: "JosefinSlab_700Bold",
          color: TEXT_PRIMARY_STRONG,
        }}
      >
        Something Went Wrong
      </Text>
      <Text
        className="text-center mb-6"
        style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
      >
        {error}
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setError(null);
          setLoading(true);
          loadReviews(true);
        }}
        className="px-6 py-3 rounded-xl active:opacity-90"
        style={{ backgroundColor: DEEP_FOREST }}
      >
        <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
          Retry
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <CommunitySectionHeader
        title="Gear Reviews"
        onAddPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (currentUser) {
            navigation.navigate("CreateGearReview");
          }
        }}
      />

      {/* Search Bar */}
      <View className="px-5 py-3">
        <View className="flex-row items-center px-4 py-3 rounded-xl border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
          <Ionicons name="search" size={20} color={TEXT_MUTED} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search gear..."
            placeholderTextColor={TEXT_MUTED}
            className="flex-1 ml-2"
            style={{
              fontFamily: "SourceSans3_400Regular",
              color: TEXT_PRIMARY_STRONG,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      {/* Category Filters */}
      <View className="px-5 pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleCategoryChange(item.value)}
              className="mr-2 px-4 py-2 rounded-full active:opacity-70"
              style={{
                backgroundColor:
                  category === item.value ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                borderWidth: 1,
                borderColor: category === item.value ? DEEP_FOREST : BORDER_SOFT,
              }}
            >
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: category === item.value ? PARCHMENT : TEXT_PRIMARY_STRONG,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Content */}
      {error ? (
        renderErrorState()
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={DEEP_FOREST}
            />
          }
          ListFooterComponent={
            hasMore && !searchQuery && filteredReviews.length > 0 ? (
              <Pressable
                onPress={handleLoadMore}
                disabled={loadingMore}
                className="py-3 px-6 rounded-xl items-center mt-2 active:opacity-90"
                style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderWidth: 1, borderColor: BORDER_SOFT }}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={DEEP_FOREST} />
                ) : (
                  <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}>
                    Load More
                  </Text>
                )}
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
}
