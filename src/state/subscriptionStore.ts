import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SubscriptionState {
  subscriptionInfo: any | null;
  isLoading: boolean;
  error: string | null;
  setSubscriptionInfo: (info: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscriptionInfo: null,
      isLoading: false,
      error: null,
      setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearSubscription: () =>
        set({
          subscriptionInfo: null,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
