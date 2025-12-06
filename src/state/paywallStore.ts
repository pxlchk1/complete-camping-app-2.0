import { create } from "zustand";

type PaywallType = "community_full" | "premium_feature" | "trial_expired" | "ai_assistant" | "offline_mode" | "community_posting" | "community_interaction";

interface PaywallContext {
  name: string;
  [key: string]: any;
}

interface PaywallState {
  isVisible: boolean;
  paywallType: PaywallType | null;
  context: PaywallContext | null;

  // Actions
  open: (type: PaywallType, context?: PaywallContext) => void;
  close: () => void;
}

export const usePaywallStore = create<PaywallState>()((set) => ({
  isVisible: false,
  paywallType: null,
  context: null,

  open: (type, context) =>
    set({
      isVisible: true,
      paywallType: type,
      context: context || null,
    }),

  close: () =>
    set({
      isVisible: false,
      paywallType: null,
      context: null,
    }),
}));
