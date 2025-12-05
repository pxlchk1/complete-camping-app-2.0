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
  increment,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Question, Answer, QuestionStatus } from "../../types/community";

export const questionsService = {
  // Create a new question
  async createQuestion(data: {
    title: string;
    body: string;
    tags: string[];
    authorId: string;
    authorHandle: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to create a question');

    const questionData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "open" as QuestionStatus,
        answerCount: 0,
        viewCount: 0,
        upvotes: 1,
        userVotes: { [user.uid]: 'up' },
        lastActivityAt: serverTimestamp(),
        hasAcceptedAnswer: false,
    };

    const docRef = await addDoc(collection(db, 'questions'), questionData);
    return docRef.id;
  },

  // Get questions with pagination and filtering
  async getQuestions(
    filterBy?: "all" | "unanswered" | "answered" | "popular",
    userId?: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ questions: Question[]; lastDoc: DocumentSnapshot | null }> {
    const questionsRef = collection(db, "questions");

    let q = query(questionsRef);

    // Apply filters
    if (filterBy === "unanswered") {
        q = query(q, where("answerCount", "==", 0), orderBy("createdAt", "desc"));
    } else if (filterBy === "answered") {
        q = query(q, where("status", "==", "answered"), orderBy("lastActivityAt", "desc"));
    } else if (filterBy === "popular") {
        q = query(q, orderBy("upvotes", "desc"), orderBy("createdAt", "desc"));
    } else if (userId) {
        q = query(q, where("authorId", "==", userId), orderBy("createdAt", "desc"));
    } else {
        q = query(q, orderBy("lastActivityAt", "desc"));
    }

    q = query(q, limit(limitCount));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        content: doc.data().body, // Legacy alias
    })) as Question[];

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { questions, lastDoc: lastVisible };
  },

  // Get a single question by ID
  async getQuestionById(questionId: string): Promise<Question | null> {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        content: data.body, // Legacy alias
    } as Question;
  },

  // Vote on a question
  async voteQuestion(questionId: string, vote: 'up' | 'down'): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to vote');

    const docRef = doc(db, 'questions', questionId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Question not found');
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

  async incrementQuestionViews(questionId: string): Promise<void> {
    const questionRef = doc(db, "questions", questionId);
    await updateDoc(questionRef, {
      viewCount: increment(1),
    });
  },

  // ==================== Answers ====================

  async getAnswers(
    questionId: string,
    limitCount: number = 50
  ): Promise<Answer[]> {
    const answersRef = collection(db, "answers");
    const q = query(
      answersRef,
      where("questionId", "==", questionId),
      orderBy("upvoteCount", "desc"),
      orderBy("createdAt", "asc"),
      limit(limitCount)
    );
  
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        content: data.body, // Legacy alias
        upvotes: data.upvoteCount, // Legacy alias
      } as Answer;
    });
  },
  
  async createAnswer(data: {
    questionId: string;
    body: string;
    authorId: string;
    authorHandle: string;
  }): Promise<string> {
    const answersRef = collection(db, "answers");
  
    const docRef = await addDoc(answersRef, {
      questionId: data.questionId,
      body: data.body,
      authorId: data.authorId,
      authorHandle: data.authorHandle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvoteCount: 0,
      isAccepted: false,
    });
  
    // Increment answer count and update activity
    const questionRef = doc(db, "questions", data.questionId);
    await updateDoc(questionRef, {
      answerCount: increment(1),
      lastActivityAt: serverTimestamp(),
    });
  
    return docRef.id;
  },
  
  async upvoteAnswer(answerId: string): Promise<void> {
    const answerRef = doc(db, "answers", answerId);
    await updateDoc(answerRef, {
      upvoteCount: increment(1),
    });
  },
  
  async acceptAnswer(
    questionId: string,
    answerId: string
  ): Promise<void> {
    // Mark answer as accepted
    const answerRef = doc(db, "answers", answerId);
    await updateDoc(answerRef, {
      isAccepted: true,
    });
  
    // Update question
    const questionRef = doc(db, "questions", questionId);
    await updateDoc(questionRef, {
      status: "answered" as QuestionStatus,
      hasAcceptedAnswer: true,
      acceptedAnswerId: answerId,
    });
  },
};
