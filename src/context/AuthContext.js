'use client';

// 1. استيراد useCallback
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

    // ... (useEffect الخاص بـ onAuthStateChanged يبقى كما هو) ...
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

    // ✅ 2. تغليف كل الدوال بـ useCallback
    const handleLoginResult = useCallback(async (result) => {
        const user = result.user;
        const adminRef = doc(db, 'admins', user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
            toast.success('أهلاً بك أيها المشرف 🫡');
            router.push('/admin');
        } else {
            toast.success('تم تسجيل الدخول بنجاح 🚀');
            router.push('/hub');
        }
    }, [router]);

    const loginWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await handleLoginResult(result);
        } catch (error) {
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
            console.error("Error updating major:", error);
            toast.error("حدث خطأ أثناء حفظ التخصص");
        }
    }, [user]);

    const logRecentTopic = useCallback(async (topicId) => {
        if (!user || user.isAdmin || !topicId) return;

        const userRef = doc(db, 'users', user.email);
        const currentRecents = user.recentlyViewed || [];
        const filteredRecents = currentRecents.filter(id => id !== topicId);
        const newRecents = [topicId, ...filteredRecents].slice(0, 5); 

        try {
            // التحقق من وجود الملف (احتياطي لحسابات الأدمن)
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
                await setDoc(userRef, { email: user.email, name: user.displayName, role: user.role, recentlyViewed: newRecents }, { merge: true });
            } else {
                await updateDoc(userRef, { recentlyViewed: newRecents });
            }
            setUser(prev => ({ ...prev, recentlyViewed: newRecents }));
        } catch (error) {
            console.error("Error logging recent topic:", error);
        }
    }, [user]); // يعتمد على "user"

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateMajor, logRecentTopic }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) return { user: null, loading: true, loginWithGoogle: () => {}, logout: () => {}, updateMajor: () => {}, logRecentTopic: () => {} };
    return context;
};