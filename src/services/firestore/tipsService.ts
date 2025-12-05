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

export interface TipPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  userVotes: { [key: string]: 'up' | 'down' };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const tipsService = {
  // Create a new tip
  async createTip(data: {
    title: string;
    content: string;
    category: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create a tip');

    const tipData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || null,
      title: data.title,
      content: data.content,
      category: data.category,
      upvotes: 1,
      userVotes: { [user.uid]: 'up' },
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'tips'), tipData);
    return docRef.id;
  },

  // Get all tips ordered by createdAt desc
  async getTips(): Promise<TipPost[]> {
    const q = query(collection(db, 'tips'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TipPost[];
  },

  // Get a single tip by ID
  async getTipById(tipId: string): Promise<TipPost | null> {
    const docRef = doc(db, 'tips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TipPost;
  },

  // Update a tip (only by owner)
  async updateTip(
    tipId: string,
    data: { title?: string; content?: string; category?: string }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to update a tip');

    const docRef = doc(db, 'tips', tipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Tip not found');
    if (docSnap.data().userId !== user.uid) {
      throw new Error('You can only edit your own tips');
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete a tip (admin only)
  async deleteTip(tipId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to delete a tip');

    // In a real app, you would check for admin roles here.

    await deleteDoc(doc(db, 'tips', tipId));
  },

  // Vote on a tip
  async voteTip(tipId: string, vote: 'up' | 'down'): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'tips', tipId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Tip not found');
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
};
