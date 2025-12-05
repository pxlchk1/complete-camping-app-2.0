import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  runTransaction,
  DocumentSnapshot,
  limit,
  startAfter,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { GearReview, GearCategory } from "../../types/community";

export const gearReviewsService = {
  // Create a new gear review
  async createGearReview(data: {
    gearName: string;
    brand?: string;
    category: GearCategory;
    rating: number;
    summary: string;
    body: string;
    pros?: string;
    cons?: string;
    tags: string[];
    authorId: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create a gear review');

    const reviewData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvoteCount: 1, // Start with 1 upvote from the creator
        userVotes: { [user.uid]: 'up' },
        commentCount: 0,
    };

    const docRef = await addDoc(collection(db, 'gearReviews'), reviewData);
    return docRef.id;
  },

  // Get gear reviews with pagination
  async getGearReviews(
    category?: GearCategory | "all",
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ reviews: GearReview[]; lastDoc: DocumentSnapshot | null }> {
    const reviewsRef = collection(db, "gearReviews");

    let q = query(reviewsRef, orderBy("createdAt", "desc"));

    if (category && category !== "all") {
        q = query(reviewsRef, where("category", "==", category), orderBy("createdAt", "desc"));
    }

    q = query(q, limit(limitCount));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as GearReview[];

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { reviews, lastDoc: lastVisible };
  },

  // Get a single gear review by ID
  async getGearReviewById(reviewId: string): Promise<GearReview | null> {
    const docRef = doc(db, 'gearReviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as GearReview;
  },

  // Vote on a gear review
  async voteGearReview(reviewId: string, vote: 'up' | 'down'): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'gearReviews', reviewId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Review not found');
      }

      const data = docSnap.data();
      const userVotes = data.userVotes || {};
      const currentVote = userVotes[user.uid];
      let newUpvotes = data.upvoteCount || 0;

      if (currentVote === vote) {
        // User is undoing their vote
        delete userVotes[user.uid];
        newUpvotes += vote === 'up' ? -1 : 1;
      } else if (currentVote) {
        // User is changing their vote
        userVotes[user.uid] = vote;
        newUpvotes += vote === 'up' ? 2 : -2;
      } else {
        // User is casting a new vote
        userVotes[user.uid] = vote;
        newUpvotes += vote === 'up' ? 1 : -1;
      }

      transaction.update(docRef, { upvoteCount: newUpvotes, userVotes });
    });
  },
};
