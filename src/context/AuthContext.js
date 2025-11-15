'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
// أضفنا setDoc لإنشاء ملف الطالب
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
                    // 1. هل هو أدمن؟
                    const adminRef = doc(db, 'admins', currentUser.email);
                    const adminSnap = await getDoc(adminRef);
                    
                    if (adminSnap.exists()) {
                        setUser({
                            ...currentUser,
                            role: adminSnap.data().role,
                            major: null, // الأدمن لا يحتاج تخصص
                            isAdmin: true
                        });
                    } else {
                        // 2. هل هو طالب مسجل؟
                        const userRef = doc(db, 'users', currentUser.email);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            // طالب موجود مسبقاً
                            setUser({
                                ...currentUser,
                                role: 'student',
                                major: userSnap.data().major || null, // جلب التخصص
                                isAdmin: false
                            });
                        } else {
                            // 3. طالب جديد (أول مرة يدخل) -> ننشئ له ملف
                            const newUserData = {
                                email: currentUser.email,
                                name: currentUser.displayName,
                                photoURL: currentUser.photoURL,
                                major: null, // لم يختر التخصص بعد
                                role: 'student',
                                createdAt: serverTimestamp(),
                                favorites: [] // للمفضلة مستقبلاً
                            };
                            
                            await setDoc(userRef, newUserData);
                            
                            setUser({
                                ...currentUser,
                                ...newUserData,
                                isAdmin: false
                            });
                            
                            // توجيه لاختيار التخصص (سنبني هذه الصفحة لاحقاً)
                            toast.success('أهلاً بك في KawnHub! 🚀');
                        }
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

    // --- دوال تسجيل الدخول والخروج ---

   const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // نتحقق فوراً من الدور لتوجيه المستخدم
            // 1. فحص الأدمن
            const adminRef = doc(db, 'admins', user.email);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                toast.success('أهلاً بك أيها المشرف 🫡');
                router.push('/admin');
            } else {
                // 2. فحص الطالب (أو إنشاؤه)
                // ملاحظة: التوثيق والإنشاء يتم تلقائياً في useEffect المراقب، 
                // هنا فقط نوجه الصفحة
                toast.success('تم تسجيل الدخول بنجاح 🚀');
                router.push('/hub');
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل تسجيل الدخول');
        }
    };
    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            router.push('/');
            toast.success('تم تسجيل الخروج');
        } catch (error) {
            console.error(error);
        }
    };

    // --- دالة جديدة: تحديث التخصص ---
    const updateMajor = async (newMajor) => {
        if (!user || user.isAdmin) return; // حماية

        try {
            const userRef = doc(db, 'users', user.email);
            await updateDoc(userRef, { major: newMajor });
            
            // تحديث الحالة محلياً ليرى الطالب التغيير فوراً
            setUser(prev => ({ ...prev, major: newMajor }));
            
            toast.success(`تم تحديث التخصص إلى ${newMajor}`);
        } catch (error) {
            console.error("Error updating major:", error);
            toast.error("حدث خطأ أثناء حفظ التخصص");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateMajor }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        return { user: null, loading: true, loginWithGoogle: () => {}, logout: () => {}, updateMajor: () => {} };
    }
    return context;
};