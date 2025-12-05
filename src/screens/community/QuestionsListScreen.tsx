/**
 * Questions List Screen (Ask a Camper)
 * Uses questionsService for Firestore queries
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, Image } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { questionsService, Question } from "../../services/firestore/questionsService";
import { useCurrentUser } from "../../state/userStore";
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
import { DocumentSnapshot } from "firebase/firestore";

type FilterOption = "all" | "unanswered" | "answered" | "popular";

export default function QuestionsListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [authorDetails, setAuthorDetails] = useState<Record<string, User>>({});

  const toggleVisibility = (postId: string) => {
    setHiddenPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const loadQuestions = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setQuestions([]);
        setLastDoc(null);
        setHasMore(true);
      }

      setError(null);

      const result = await questionsService.getQuestions(
        filterBy,
        undefined,
        20,
        refresh ? undefined : lastDoc || undefined
      );

      let allQuestions: Question[];
      if (refresh) {
        allQuestions = result.questions;
      } else {
        allQuestions = [...questions, ...result.questions];
      }
      setQuestions(allQuestions);

      setLastDoc(result.lastDoc);
      setHasMore(result.questions.length === 20);

      const authorIds = [...new Set(allQuestions.map(p => p.authorId))];
      const profiles = await profileService.getMultipleUserProfiles(authorIds);
      setAuthorDetails(profiles);

    } catch (err: any) {
      setError(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await questionsService.voteQuestion(postId, type);
      setQuestions(prev =>
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
      loadQuestions(); 
    }
  };

  useEffect(() => {
    loadQuestions(true);
  }, [filterBy]);

  useFocusEffect(
    React.useCallback(() => {
      loadQuestions(true);
    }, [filterBy])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && lastDoc) {
      setLoadingMore(true);
      loadQuestions(false);
    }
  };

  const handleQuestionPress = (questionId: string) => {
    navigation.navigate("QuestionDetail", { questionId });
  };

  const handleAskQuestion = () => {
    if (!currentUser) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateQuestion");
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

  const filteredQuestions = searchQuery
    ? questions.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : questions;

  const renderQuestion = ({ item }: { item: Question }) => {
    const userVote = currentUser && item.userVotes ? item.userVotes[currentUser.uid] : null;
    const isHidden = item.upvotes <= -5 && !hiddenPosts.includes(item.id);
    const author = authorDetails[item.authorId];

    return (
    <Pressable
      onPress={() => handleQuestionPress(item.id)}
      className="rounded-xl p-4 mb-3 border active:opacity-90"
      style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-lg flex-1 mr-2"
          style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          {item.title}
        </Text>
        {item.hasAcceptedAnswer && (
          <View className="bg-green-100 rounded-full px-2 py-1">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          </View>
        )}
      </View>

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

      {item.tags && item.tags.length > 0 && !isHidden && (
        <View className="flex-row flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} className="px-2 py-1 rounded-full bg-blue-100">
              <Text
                className="text-xs"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: "#1e40af" }}
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
          <Text className="text-xs" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
            @{author?.handle} • {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
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
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={16} color={TEXT_MUTED} />
            <Text className="text-xs ml-1" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}>
              {item.answerCount}
            </Text>
          </View>
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
          Loading questions...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-parchment">
        <CommunitySectionHeader
          title="Ask a Camper"
          onAddPress={handleAskQuestion}
        />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text
            className="mt-4 text-center text-lg"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
          >
            Failed to load questions
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => loadQuestions(true)}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
        >
          <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
            Retry
          </Text>
        </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <CommunitySectionHeader
        title="Ask a Camper"
        onAddPress={handleAskQuestion}
      />

      {/* Search and Filters */}
      <View className="px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border mb-3" style={{ borderColor: BORDER_SOFT }}>
          <Ionicons name="search" size={18} color={TEXT_MUTED} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search questions"
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
            { id: "all" as FilterOption, label: "All" },
            { id: "unanswered" as FilterOption, label: "Unanswered" },
            { id: "answered" as FilterOption, label: "Answered" },
            { id: "popular" as FilterOption, label: "Popular" },
          ].map(option => (
            <Pressable
              key={option.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterBy(option.id);
              }}
              className={`px-4 py-2 rounded-full ${
                filterBy === option.id ? "bg-forest" : "bg-white border"
              }`}
              style={filterBy !== option.id ? { borderColor: BORDER_SOFT } : undefined}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: filterBy === option.id ? PARCHMENT : TEXT_PRIMARY_STRONG
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {filteredQuestions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="help-circle-outline" size={64} color={GRANITE_GOLD} />
          <Text
            className="mt-4 text-xl text-center"
            style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
          >
            No questions yet
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            Be the first to ask the community!
          </Text>
          <Pressable
            onPress={handleAskQuestion}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Ask Your First Question
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          renderItem={renderQuestion}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListFooterComponent={
            hasMore ? (
              <Pressable
                onPress={handleLoadMore}
                disabled={loadingMore}
                className="py-4 items-center"
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
