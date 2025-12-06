
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { User } from "../../types/user";



export const profileService = {
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
      } else {
        console.warn(`No user profile found for userId: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile.");
    }
  },

  async getMultipleUserProfiles(userIds: string[]): Promise<Record<string, User>> {
    const profiles: Record<string, User> = {};
    if (!userIds || userIds.length === 0) {
      return profiles;
    }

    try {
      // Firestore 'in' query is limited to 10 items
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 10) {
        chunks.push(userIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const q = query(collection(db, "users"), where("id", "in", chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          if (doc.exists()) {
            profiles[doc.id] = { id: doc.id, ...doc.data() } as User;
          }
        });
      }

      return profiles;
    } catch (error) {
      console.error("Error fetching multiple user profiles:", error);
      throw new Error("Failed to fetch user profiles.");
    }
  },
};
