'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                try {
                    const adminRef = doc(db, 'admins', currentUser.email);
                    const adminSnap = await getDoc(adminRef);

                    if (adminSnap.exists()) {
                        setUser({ ...currentUser, role: adminSnap.data().role, isAdmin: true, favorites: [], recentlyViewed: [] });
                    } else {
                        const userRef = doc(db, 'users', currentUser.email);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            setUser({
                                ...currentUser,
                                role: 'student',
                                major: userSnap.data().major || null,
                                isAdmin: false,
                                favorites: userSnap.data().favorites || [],
                                recentlyViewed: userSnap.data().recentlyViewed || []
                            });
                        } else {
                            const newUserData = {
                                email: currentUser.email,
                                name: currentUser.displayName || 'Student',
                                photoURL: currentUser.photoURL,
                                major: null,
                                role: 'student',
                                createdAt: serverTimestamp(),
                                favorites: [],
                                recentlyViewed: []
                            };
                            await setDoc(userRef, newUserData);
                            setUser({ ...currentUser, ...newUserData, isAdmin: false });
                            toast.success('أهلاً بك في KawnHub! 🚀');
                        }
                    }
                } catch (error) { setUser(null); }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLoginResult = useCallback(async (result) => {
        console.log('🚀 handleLoginResult started', result.user.email);
        const user = result.user;
        try {
            const adminRef = doc(db, 'admins', user.email);
            console.log('🔍 Checking admin status...');
            const adminSnap = await getDoc(adminRef);
            console.log('✅ Admin check complete. Exists:', adminSnap.exists());

            if (adminSnap.exists()) {
                toast.success('أهلاً بك أيها المشرف 🫡');
                router.push('/admin');
            } else {
                toast.success('تم تسجيل الدخول بنجاح 🚀');
                router.push('/hub');
            }
        } catch (error) {
            console.error('❌ Error in handleLoginResult:', error);
            toast.error('حدث خطأ أثناء توجيه المستخدم');
        }
    }, [router]);

    const loginWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await handleLoginResult(result);
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('User closed the login popup.');
                return;
            }
            console.error(error);
            toast.error('فشل تسجيل الدخول بقوقل');
        }
    }, [handleLoginResult]);

    const logout = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
            router.push('/');
            toast.success('تم تسجيل الخروج');
        } catch (error) {
            console.error(error);
        }
    }, [router]);

    const updateMajor = useCallback(async (newMajor) => {
        if (!user || user.isAdmin) return;
        try {
            const userRef = doc(db, 'users', user.email);
            await updateDoc(userRef, { major: newMajor });
            setUser(prev => ({ ...prev, major: newMajor }));
            toast.success(`تم تحديث التخصص إلى ${newMajor}`);
        } catch (error) {
            console.error('Error updating major:', error);
            toast.error('فشل تحديث التخصص');
        }
    }, [user]);

    const togglePin = useCallback(async (topicId) => {
        if (!user) {
            toast.error('يجب تسجيل الدخول لتثبيت الدرس');
            return;
        }
        const { recentlyViewed = [] } = user;
        let newRecentlyViewed;

        if (recentlyViewed.includes(topicId)) {
            // Remove topic if already pinned
            newRecentlyViewed = recentlyViewed.filter((id) => id !== topicId);
            toast.success('تم إلغاء تثبيت الدرس');
        } else {
            // Add topic if not pinned, limit to 5
            newRecentlyViewed = [
                topicId,
                ...recentlyViewed.filter((id) => id !== topicId).slice(0, 4),
            ];
            toast.success('تم تثبيت الدرس');
        }

        try {
            await updateDoc(doc(db, 'users', user.email), { recentlyViewed: newRecentlyViewed });
            setUser((prev) => ({ ...prev, recentlyViewed: newRecentlyViewed }));
        } catch (error) {
            console.error("Error updating pinned topics:", error);
            toast.error("فشل تحديث التثبيت");
        }
    }, [user]);

    const logRecentTopic = useCallback(async (topicId) => {
        if (!user || user.isAdmin) return;
        try {
            const userRef = doc(db, 'users', user.email);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                let recentlyViewed = userData.recentlyViewed || [];

                // Remove if already exists to move to front
                recentlyViewed = recentlyViewed.filter(id => id !== topicId);

                // Add to front, limit to 5
                recentlyViewed.unshift(topicId);
                recentlyViewed = recentlyViewed.slice(0, 5);

                await updateDoc(userRef, { recentlyViewed: recentlyViewed });
                setUser(prev => ({ ...prev, recentlyViewed: recentlyViewed }));
            }
        } catch (error) {
            console.error('Error logging recent topic:', error);
        }
    }, [user]);

    const value = {
        user,
        loading,
        loginWithGoogle,
        logout,
        updateMajor,
        logRecentTopic,
        togglePin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) return { user: null, loading: true, loginWithGoogle: () => { }, logout: () => { }, updateMajor: () => { }, logRecentTopic: () => { }, togglePin: () => { } };
    return context;
};