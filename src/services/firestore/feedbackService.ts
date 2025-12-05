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
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

export interface FeedbackPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  category: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
  status: 'open' | 'planned' | 'in-progress' | 'completed' | 'declined';
  upvotes: number;
  userVotes: { [key: string]: 'up' | 'down' };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const feedbackService = {
  // Create new feedback
  async createFeedback(data: {
    title: string;
    description: string;
    category: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create feedback');

    const feedbackData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || null,
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'open' as const,
      upvotes: 1, // Start with 1 upvote from the creator
      userVotes: { [user.uid]: 'up' },
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'feedbackPosts'), feedbackData);
    return docRef.id;
  },

  // Get all feedback ordered by createdAt desc
  async getFeedback(): Promise<FeedbackPost[]> {
    const q = query(
      collection(db, 'feedbackPosts'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackPost[];
  },

  // Get feedback by ID
  async getFeedbackById(feedbackId: string): Promise<FeedbackPost | null> {
    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as FeedbackPost;
  },

  // Update feedback (only by owner)
  async updateFeedback(
    feedbackId: string,
    data: {
      title?: string;
      description?: string;
      category?: 'feature' | 'bug' | 'improvement' | 'question' | 'other';
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update feedback');

    const docRef = doc(db, 'feedbackPosts', feedbackId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Feedback not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own feedback');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete feedback (admin only)
  async deleteFeedback(feedbackId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete feedback');

    // For simplicity, this example doesn't implement admin roles.
    // In a real app, you would check if the user has an 'admin' role.
    // const userDoc = await getDoc(doc(db, 'users', user.uid));
    // const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
    // if (!isAdmin) throw new Error('Only admins can delete feedback');

    await deleteDoc(doc(db, 'feedbackPosts', feedbackId));
  },

  // Vote on feedback (upvote/downvote)
  async voteFeedback(feedbackId: string, vote: 'up' | 'down'): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'feedbackPosts', feedbackId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Feedback not found');
      }

      const data = docSnap.data();
      const userVotes = data.userVotes || {};
      const currentVote = userVotes[user.uid];
      let newUpvotes = data.upvotes || 0;

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

      transaction.update(docRef, { upvotes: newUpvotes, userVotes });
    });
  },

  // Update status (admin only)
  async updateStatus(
    feedbackId: string,
    status: 'open' | 'planned' | 'in-progress' | 'completed' | 'declined'
  ): Promise<void> {
    // Admin check would be needed in a real app
    await updateDoc(doc(db, 'feedbackPosts', feedbackId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
