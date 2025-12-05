import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "./types";
import CustomBottomTabBar from "../components/CustomBottomTabBar";
import CommunityTopTabsNavigator from "./CommunityTopTabsNavigator";
import * as Screens from "../screens";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const PlanStack = createNativeStackNavigator();

function PlanStackNavigator() {
  return (
    <PlanStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <PlanStack.Screen name="MyTrips" component={Screens.MyTripsScreen} />
      <PlanStack.Screen name="ParksBrowse" component={Screens.ParksBrowseScreen} />
    </PlanStack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Screens.HomeScreen} />
      <Tab.Screen name="Learn" component={Screens.LearnScreen} />
      <Tab.Screen name="Plan" component={PlanStackNavigator} />
      <Tab.Screen name="Connect" component={CommunityTopTabsNavigator} />
      <Tab.Screen name="FirstAid" component={Screens.FirstAidScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ animation: "none" }} />
      <Stack.Screen name="CreateTrip" component={Screens.CreateTripScreen} />
      <Stack.Screen name="EditTrip" component={Screens.EditTripScreen} />
      <Stack.Screen name="TripDetail" component={Screens.TripDetailScreen} />
      <Stack.Screen name="GearLists" component={Screens.GearListsScreen} />
      <Stack.Screen name="CreateGearList" component={Screens.CreateGearListScreen} />
      <Stack.Screen name="GearListDetail" component={Screens.GearListDetailScreen} />
      <Stack.Screen name="Account" component={Screens.MyCampsiteScreen} />
      <Stack.Screen name="MyCampground" component={Screens.MyCampgroundScreen} />
      <Stack.Screen name="AddCamper" component={Screens.AddCamperScreen} />
      <Stack.Screen name="EditCamper" component={Screens.EditCamperScreen} />
      <Stack.Screen name="AddPeopleToTrip" component={Screens.AddPeopleToTripScreen} />
      <Stack.Screen name="Notifications" component={Screens.NotificationsScreen} />
      <Stack.Screen name="Settings" component={Screens.SettingsScreen} />
      <Stack.Screen name="MyActivity" component={Screens.MyActivityScreen} />
      <Stack.Screen
        name="EditProfile"
        component={Screens.EditProfileScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={Screens.AuthLanding}
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen name="SeedData" component={Screens.SeedDataScreen} />

      {/* Learning */}
      <Stack.Screen name="ModuleDetail" component={Screens.ModuleDetailScreen} />

      {/* Subscription */}
      <Stack.Screen
        name="Paywall"
        component={Screens.PaywallScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Trip Planning screens */}
      <Stack.Screen name="PackingList" component={Screens.PackingListScreen} />
      <Stack.Screen name="MealPlanning" component={Screens.MealPlanningScreen} />
      <Stack.Screen name="ShoppingList" component={Screens.ShoppingListScreen} />
      <Stack.Screen name="MealPlan" component={Screens.MyCampsiteScreen} />

      {/* Community screens */}
      <Stack.Screen
        name="AskQuestionModal"
        component={Screens.AskQuestionModal}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="ThreadDetail" component={Screens.ThreadDetailScreen} />

      {/* Tips */}
      <Stack.Screen name="TipsListScreen" component={Screens.TipsListScreen} />
      <Stack.Screen name="TipDetail" component={Screens.TipDetailScreen} />
      <Stack.Screen name="CreateTip" component={Screens.CreateTipScreen} />

      {/* Gear Reviews */}
      <Stack.Screen name="GearReviewsListScreen" component={Screens.GearReviewsListScreen} />
      <Stack.Screen name="GearReviewDetail" component={Screens.GearReviewDetailScreen} />
      <Stack.Screen name="CreateGearReview" component={Screens.CreateGearReviewScreen} />
      <Stack.Screen name="SubmitGearReview" component={Screens.CreateGearReviewScreen} />

      {/* Questions/Ask */}
      <Stack.Screen name="QuestionsListScreen" component={Screens.QuestionsListScreen} />
      <Stack.Screen name="QuestionDetail" component={Screens.QuestionDetailScreen} />
      <Stack.Screen name="CreateQuestion" component={Screens.CreateQuestionScreen} />
      <Stack.Screen name="AskQuestion" component={Screens.CreateQuestionScreen} />

      {/* Photos */}
      <Stack.Screen name="PhotosListScreen" component={Screens.PhotosListScreen} />
      <Stack.Screen name="PhotoDetail" component={Screens.PhotoDetailScreen} />
      <Stack.Screen name="UploadPhoto" component={Screens.UploadPhotoScreen} />

      {/* Feedback */}
      <Stack.Screen name="FeedbackListScreen" component={Screens.FeedbackListScreen} />
      <Stack.Screen name="FeedbackDetail" component={Screens.FeedbackDetailScreen} />
      <Stack.Screen name="CreateFeedback" component={Screens.CreateFeedbackScreen} />
      <Stack.Screen name="SubmitFeedback" component={Screens.SubmitFeedbackScreen} />

      {/* Gear Closet */}
      <Stack.Screen name="MyGearCloset" component={Screens.MyGearClosetScreen} />
      <Stack.Screen name="AddGear" component={Screens.AddGearScreen} />
      <Stack.Screen name="GearDetail" component={Screens.GearDetailScreen} />

      {/* Admin screens */}
      <Stack.Screen name="AdminDashboard" component={Screens.AdminDashboardScreen} />
      <Stack.Screen name="AdminReports" component={Screens.AdminReportsScreen} />
      <Stack.Screen name="AdminUsers" component={Screens.AdminUsersScreen} />
      <Stack.Screen name="AdminSubscriptions" component={Screens.AdminSubscriptionsScreen} />
      <Stack.Screen name="AdminPhotos" component={Screens.AdminPhotosScreen} />
    </Stack.Navigator>
  );
}
