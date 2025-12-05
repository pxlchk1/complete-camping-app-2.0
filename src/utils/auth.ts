import { useCurrentUser } from "../state/userStore";

export function isPro(): boolean {
  const currentUser = useCurrentUser();
  return currentUser?.membershipTier === "pro";
}
