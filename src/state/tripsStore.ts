import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Trip, TripStatus } from "../types/camping";
import { useProStatus } from "../utils/auth";
import { usePaywallStore } from "./paywallStore";

// Re-export Trip type
export type { Trip };

interface TripsState {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, "id" | "createdAt" | "updatedAt" | "userId">) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
  getTripMeals: (id: string) => Trip["meals"] | undefined;
  getTripsByStatus: (status: TripStatus) => Trip[];
  updateTripPacking: (id: string, packing: Trip["packing"]) => void;
  updateTripMeals: (id: string, meals: Trip["meals"]) => void;
  updateTripNotes: (id: string, notes: string) => void;
  updateTripWeather: (id: string, weather: Trip["weather"]) => void;
}

const getTripStatus = (startDate: string, endDate: string): TripStatus => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now > end) return "completed";
  if (now < start) return "upcoming";
  return "active";
};

const proStorage: StateStorage = {
  getItem: (name) => {
    const isPro = useProStatus.getState().isPro;
    if (isPro) {
      return AsyncStorage.getItem(name);
    }
    return null;
  },
  setItem: (name, value) => {
    const isPro = useProStatus.getState().isPro;
    if (isPro) {
      return AsyncStorage.setItem(name, value);
    }
    usePaywallStore.getState().open('offline_mode', { title: 'Offline Mode is a Pro feature. Upgrade to save your data for offline use.' });
  },
  removeItem: (name) => {
    const isPro = useProStatus.getState().isPro;
    if (isPro) {
      return AsyncStorage.removeItem(name);
    }
  },
};

export const useTripsStore = create<TripsState>()(
  persist(
    (set, get) => ({
      trips: [],

      addTrip: (tripData) => {
        const { auth } = require("../config/firebase");
        const userId = auth.currentUser?.uid || "";

        const newTrip: Trip = {
          ...tripData,
          userId,
          id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: tripData.status || "planning",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          trips: [newTrip, ...state.trips],
        }));
        return newTrip.id;
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      deleteTrip: (id) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
        }));
      },

      getTripById: (id) => {
        return get().trips.find((trip) => trip.id === id);
      },
      
      getTripMeals: (id) => {
        const trip = get().trips.find((trip) => trip.id === id);
        return trip ? trip.meals : undefined;
      },

      getTripsByStatus: (status) => {
        return get().trips.filter((trip) => {
          const tripStatus = getTripStatus(trip.startDate, trip.endDate);
          return tripStatus === status;
        });
      },

      updateTripPacking: (id, packing) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, packing, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      updateTripMeals: (id, meals) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, meals, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      updateTripNotes: (id, notes) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, notes, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },

      updateTripWeather: (id, weather) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, weather, updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
      },
    }),
    {
      name: "trips-storage",
      storage: createJSONStorage(() => proStorage),
    }
  )
);

// Selector hooks
export const useTrips = () => useTripsStore((s) => s.trips);
export const useCreateTrip = () => useTripsStore((s) => s.addTrip);
export const useUpdateTrip = () => useTripsStore((s) => s.updateTrip);
export const useDeleteTrip = () => useTripsStore((s) => s.deleteTrip);
