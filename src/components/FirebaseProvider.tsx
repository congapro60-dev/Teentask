import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, CV } from '../types';

export { auth, db };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (role?: 'student' | 'parent' | 'business' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  sendFriendRequest: (toId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  addRelationship: (relatedUserId: string, relatedUserName: string, relatedUserPhoto: string | undefined, type: 'Family' | 'Professional', title: string) => Promise<void>;
  acceptRelationship: (relId: string) => Promise<void>;
  rejectRelationship: (relId: string) => Promise<void>;
  submitRating: (toId: string, score: number, comment?: string, jobId?: string) => Promise<void>;
  createChat: (otherUserId: string, otherUserDetails: any, relatedTo?: { type: string, id: string, title: string }) => Promise<string>;
  sendNotification: (userId: string, title: string, message: string, type: string, link?: string) => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  toggleSaveShadowing: (shadowingId: string) => Promise<void>;
  submitNameChangeRequest: (newName: string, reason: string, proofUrl: string) => Promise<void>;
  toggleFollowUser: (targetUserId: string) => Promise<void>;
  unfriendUser: (targetUserId: string) => Promise<void>;
  saveCV: (cvData: Partial<CV>) => Promise<string>;
  getCV: (cvId: string) => Promise<CV | null>;
  bookShadowing: (event: any) => Promise<void>;
  getBookings: () => Promise<any[]>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

function cleanData(data: any) {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        const path = `users/${currentUser.uid}`;
        const profileRef = doc(db, 'users', currentUser.uid);
        unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async (selectedRole?: 'student' | 'parent' | 'business' | 'admin') => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const BOSS_EMAIL = "congapro60@gmail.com";
      const ADMIN_EMAIL = "cuong.vuviet@thedeweyschools.edu.vn";
      const ADMIN_EMAIL_2 = "vuvietcuonglmnx@gmail.com";
      
      const path = `users/${user.uid}`;
      const profileRef = doc(db, 'users', user.uid);
      
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return;
      }
      
      const userEmailLower = user.email?.toLowerCase();
      const isBoss = userEmailLower === BOSS_EMAIL.toLowerCase();
      const isPredefinedAdmin = userEmailLower === ADMIN_EMAIL.toLowerCase() || userEmailLower === ADMIN_EMAIL_2.toLowerCase();
      const isAuthorizedAdmin = isBoss || isPredefinedAdmin || (profileSnap.exists() && profileSnap.data()?.role === 'admin');

      if (selectedRole === 'admin' && !isAuthorizedAdmin) {
        await signOut(auth);
        throw new Error("không thể cấp quyền đăng nhập ở vai trò này");
      }

      if (!profileSnap.exists()) {
        const newProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'TeenTasker',
          photoURL: user.photoURL || '',
          trustScore: 0,
          skills: [],
          role: selectedRole || 'student',
          createdAt: Date.now(),
          balance: 0,
          isVip: isAuthorizedAdmin,
        };
        try {
          await setDoc(profileRef, newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      } else if (selectedRole) {
        try {
          await setDoc(profileRef, { 
            role: selectedRole,
            isVip: !!(isAuthorizedAdmin || profileSnap.data()?.isVip)
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    } catch (error: any) {
      if (error.message !== "không thể cấp quyền đăng nhập ở vai trò này") {
        console.error('Login error:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const profileRef = doc(db, 'users', user.uid);
    try {
      await setDoc(profileRef, cleanData(data), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const sendFriendRequest = async (toId: string) => {
    if (!user || !profile) return;
    const path = 'friend_requests';
    try {
      const requestId = `${user.uid}_${toId}`;
      await setDoc(doc(db, 'friend_requests', requestId), cleanData({
        id: requestId,
        fromId: user.uid,
        fromName: profile.displayName,
        fromPhoto: profile.photoURL,
        fromRole: profile.role,
        toId,
        status: 'pending',
        createdAt: Date.now()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user || !profile) return;
    const path = `friend_requests/${requestId}`;
    try {
      const requestRef = doc(db, 'friend_requests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) return;
      const requestData = requestSnap.data();
      
      await setDoc(requestRef, { status: 'accepted' }, { merge: true });
      
      const myProfileRef = doc(db, 'users', user.uid);
      const theirProfileRef = doc(db, 'users', requestData.fromId);
      
      const myFriends = profile.friends || [];
      const theirSnap = await getDoc(theirProfileRef);
      const theirFriends = theirSnap.data()?.friends || [];
      
      await setDoc(myProfileRef, { friends: [...new Set([...myFriends, requestData.fromId])] }, { merge: true });
      await setDoc(theirProfileRef, { friends: [...new Set([...theirFriends, user.uid])] }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const path = `friend_requests/${requestId}`;
    try {
      await setDoc(doc(db, 'friend_requests', requestId), { status: 'rejected' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addRelationship = async (relatedUserId: string, relatedUserName: string, relatedUserPhoto: string | undefined, type: 'Family' | 'Professional', title: string) => {
    if (!user || !profile) return;
    const path = 'relationships';
    try {
      const relId = `${user.uid}_${relatedUserId}`;
      await setDoc(doc(db, 'relationships', relId), cleanData({
        id: relId,
        userId: user.uid,
        userName: profile.displayName,
        userPhoto: profile.photoURL,
        relatedUserId,
        relatedUserName,
        relatedUserPhoto,
        type,
        title,
        status: 'pending',
        createdAt: Date.now()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const acceptRelationship = async (relId: string) => {
    const path = `relationships/${relId}`;
    try {
      await setDoc(doc(db, 'relationships', relId), { status: 'accepted' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const rejectRelationship = async (relId: string) => {
    const path = `relationships/${relId}`;
    try {
      await setDoc(doc(db, 'relationships', relId), { status: 'rejected' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const submitRating = async (toId: string, score: number, comment?: string, jobId?: string) => {
    if (!user || !profile) return;
    const path = 'ratings';
    try {
      const ratingId = `${user.uid}_${toId}_${jobId || 'general'}`;
      await setDoc(doc(db, 'ratings', ratingId), cleanData({
        id: ratingId,
        fromId: user.uid,
        fromName: profile.displayName,
        toId,
        jobId,
        score,
        comment,
        createdAt: Date.now()
      }));

      if (profile.role === 'admin') {
        const targetProfileRef = doc(db, 'users', toId);
        const targetSnap = await getDoc(targetProfileRef);
        if (targetSnap.exists()) {
          await setDoc(targetProfileRef, { trustScore: score }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const createChat = async (otherUserId: string, otherUserDetails: any, relatedTo?: { type: string, id: string, title: string }) => {
    if (!user || !profile) throw new Error("User not authenticated");
    const chatId = [user.uid, otherUserId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        participants: [user.uid, otherUserId],
        participantDetails: {
          [user.uid]: {
            displayName: profile.displayName,
            photoURL: profile.photoURL,
            role: profile.role
          },
          [otherUserId]: {
            displayName: otherUserDetails.displayName,
            photoURL: otherUserDetails.photoURL,
            role: otherUserDetails.role
          }
        },
        lastMessage: '',
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
        relatedTo: relatedTo || null
      });
    }
    return chatId;
  };

  const sendNotification = async (userId: string, title: string, message: string, type: string, link?: string) => {
    const notifRef = collection(db, 'notifications');
    await addDoc(notifRef, {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: Date.now(),
      link: link || null
    });
  };

  const toggleSaveJob = async (jobId: string) => {
    if (!user || !profile) return;
    const savedJobs = profile.savedJobs || [];
    const isSaved = savedJobs.includes(jobId);
    const newSavedJobs = isSaved 
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    await updateDoc(doc(db, 'users', user.uid), {
      savedJobs: newSavedJobs
    });
  };

  const toggleSaveShadowing = async (shadowingId: string) => {
    if (!user || !profile) return;
    const savedShadowing = profile.savedShadowing || [];
    const isSaved = savedShadowing.includes(shadowingId);
    const newSavedShadowing = isSaved 
      ? savedShadowing.filter(id => id !== shadowingId)
      : [...savedShadowing, shadowingId];
    
    await updateDoc(doc(db, 'users', user.uid), {
      savedShadowing: newSavedShadowing
    });
  };

  const submitNameChangeRequest = async (newName: string, reason: string, proofUrl: string) => {
    if (!user || !profile) return;
    const path = 'name_change_requests';
    try {
      await addDoc(collection(db, 'name_change_requests'), {
        userId: user.uid,
        currentName: profile.displayName,
        newName,
        reason,
        proofUrl,
        status: 'pending',
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const toggleFollowUser = async (targetUserId: string) => {
    if (!user || !profile) return;
    const following = profile.following || [];
    const isFollowing = following.includes(targetUserId);
    
    const myProfileRef = doc(db, 'users', user.uid);
    const theirProfileRef = doc(db, 'users', targetUserId);
    
    try {
      if (isFollowing) {
        // Unfollow
        await updateDoc(myProfileRef, { following: following.filter(id => id !== targetUserId) });
        const theirSnap = await getDoc(theirProfileRef);
        if (theirSnap.exists()) {
          const theirFollowers = theirSnap.data()?.followers || [];
          await updateDoc(theirProfileRef, { followers: theirFollowers.filter((id: string) => id !== user.uid) });
        }
      } else {
        // Follow
        await updateDoc(myProfileRef, { following: [...following, targetUserId] });
        const theirSnap = await getDoc(theirProfileRef);
        if (theirSnap.exists()) {
          const theirFollowers = theirSnap.data()?.followers || [];
          await updateDoc(theirProfileRef, { followers: [...theirFollowers, user.uid] });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${targetUserId}`);
    }
  };

  const unfriendUser = async (targetUserId: string) => {
    if (!user || !profile) return;
    const myFriends = profile.friends || [];
    
    const myProfileRef = doc(db, 'users', user.uid);
    const theirProfileRef = doc(db, 'users', targetUserId);
    
    try {
      await updateDoc(myProfileRef, { friends: myFriends.filter(id => id !== targetUserId) });
      const theirSnap = await getDoc(theirProfileRef);
      if (theirSnap.exists()) {
        const theirFriends = theirSnap.data()?.friends || [];
        await updateDoc(theirProfileRef, { friends: theirFriends.filter((id: string) => id !== user.uid) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${targetUserId}`);
    }
  };

  const saveCV = async (cvData: Partial<CV>) => {
    if (!user) throw new Error("User not authenticated");
    const cvId = profile?.cvId || user.uid; // Use UID as CV ID for simplicity or a separate ID
    const cvRef = doc(db, 'cvs', cvId);
    
    const fullCVData = {
      ...cvData,
      id: cvId,
      userId: user.uid,
      lastUpdated: Date.now()
    };

    try {
      await setDoc(cvRef, cleanData(fullCVData), { merge: true });
      if (!profile?.cvId) {
        await updateProfile({ cvId });
      }
      return cvId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cvs/${cvId}`);
      throw error;
    }
  };

  const getCV = async (cvId: string) => {
    const cvRef = doc(db, 'cvs', cvId);
    try {
      const snap = await getDoc(cvRef);
      return snap.exists() ? (snap.data() as CV) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `cvs/${cvId}`);
      return null;
    }
  };

  const bookShadowing = async (event: any) => {
    if (!user || !profile) return;
    const path = 'shadowing_bookings';
    try {
      const bookingId = `${user.uid}_${event.id}`;
      await setDoc(doc(db, 'shadowing_bookings', bookingId), cleanData({
        id: bookingId,
        userId: user.uid,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        company: event.company,
        status: 'pending',
        createdAt: Date.now()
      }));
      
      // Send notification to user
      await sendNotification(
        user.uid,
        'Đăng ký kiến tập thành công',
        `Bạn đã đăng ký kiến tập tại ${event.company}. Vui lòng chờ xác nhận từ mentor.`,
        'shadowing'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const getBookings = async () => {
    if (!user) return [];
    const path = 'shadowing_bookings';
    try {
      // For simplicity, we'll use a basic fetch. In a real app, we'd use a query.
      // But since we don't have indexes set up yet, we'll just fetch all or use onSnapshot.
      // Let's use getDocs for now.
      const { getDocs, query, where, collection } = await import('firebase/firestore');
      const q = query(collection(db, 'shadowing_bookings'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, profile, loading, login, logout, updateProfile, 
      sendFriendRequest, acceptFriendRequest, rejectFriendRequest, 
      addRelationship, acceptRelationship, rejectRelationship,
      submitRating, createChat, sendNotification,
      toggleSaveJob, toggleSaveShadowing, submitNameChangeRequest,
      toggleFollowUser, unfriendUser, saveCV, getCV,
      bookShadowing, getBookings
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
