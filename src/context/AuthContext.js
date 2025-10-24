'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// 1. إنشاء السياق (Context)
const AuthContext = createContext();

// 2. إنشاء "المزود" (Provider)
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // المستخدم سجل دخوله... لنتأكد من أنه "أدمن"
                const adminDocRef = doc(db, 'admins', user.email);
                const adminDoc = await getDoc(adminDocRef);
                
                if (adminDoc.exists()) {
                    // نعم، هو أدمن
                    setUser(user);
                    setIsAdmin(true);
                } else {
                    // لا، هو ليس أدمن. قم بطرده.
                    setUser(null);
                    setIsAdmin(false);
                    await auth.signOut();
                    router.push('/login');
                }
            } else {
                // لا يوجد مستخدم مسجل
                setUser(null);
                setIsAdmin(false);
                router.push('/login'); //  طرده إلى صفحة تسجيل الدخول
            }
            setLoading(false);
        });

        return () => unsubscribe(); // تنظيف المراقبة عند إغلاق الصفحة
    }, [router]);

    // عرض شاشة تحميل أنيقة أثناء التحقق
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-dark text-text-primary">
                جاري التحقق من الصلاحيات...
            </div>
        );
    }

    // إذا كان المستخدم مسجلاً وهو أدمن، اعرض له الصفحة المطلوبة
    return (
        <AuthContext.Provider value={{ user, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. إنشاء "هوك" (Hook) لسهولة الاستخدام
export const useAuth = () => {
    return useContext(AuthContext);
};
