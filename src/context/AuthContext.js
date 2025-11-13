'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// 1. إنشاء السياق
const AuthContext = createContext(null);

// 2. إنشاء المزود
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);

            if (currentUser) {
                try {
                    // التحقق من القائمة البيضاء والصلاحيات في Firestore
                    const userDocRef = doc(db, 'admins', currentUser.email);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        // المستخدم موجود في النظام -> نعطيه دوره المحدد
                        const userData = userDoc.data();
                        setUser({
                            ...currentUser,
                            role: userData.role || 'student', // الدور الافتراضي
                        });
                    } else {
                        // المستخدم سجل بجوجل لكنه غير مضاف في قائمة admins
                        // نعامله كزائر (User is null)
                        console.warn("User not found in whitelist:", currentUser.email);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Auth Check Error:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- دوال المساعدة ---

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success('تم تسجيل الدخول بنجاح');
            router.push('/admin'); // توجيه للوحة التحكم بعد الدخول
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في تسجيل الدخول');
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            toast.success('تم تسجيل الخروج');
            router.push('/login');
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء تسجيل الخروج');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. الهوك لاستخدام السياق
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // إرجاع قيم افتراضية لتجنب الأخطاء في حال الاستدعاء خارج المزود
        return { user: null, loading: true, loginWithGoogle: () => {}, logout: () => {} };
    }
    return context;
};