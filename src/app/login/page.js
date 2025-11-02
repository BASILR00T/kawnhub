'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
//  الخطوة 1: نستورد الدالات الجديدة
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    //  الخطوة 2: نضيف حالات جديدة لحقول النموذج
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const router = useRouter();
    const auth = getAuth();
    const googleProvider = new GoogleAuthProvider();

    // --- دالة التحقق من القائمة البيضاء (Whitelist Check) ---
    const checkAdminAndRedirect = async (user) => {
        if (user) {
            const adminDocRef = doc(db, 'admins', user.email);
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists()) {
                // نجح! المستخدم هو أدمن
                router.push('/admin');
            } else {
                // فشل! المستخدم ليس أدمن
                await auth.signOut();
                alert('خطأ: هذا الحساب غير مصرح له بالدخول.');
                setIsLoading(false);
            }
        }
    };

    // ---  دالة تسجيل الدخول بالإيميل (الجديدة) ---
    const handleEmailSignIn = async (e) => {
        e.preventDefault(); // نمنع الفورم من إعادة تحميل الصفحة
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await checkAdminAndRedirect(userCredential.user);
        } catch (error) {
            console.error("Error during email sign-in: ", error);
            alert('خطأ: كلمة المرور أو البريد الإلكتروني غير صحيح.');
            setIsLoading(false);
        }
    };

    // --- دالة تسجيل الدخول بجوجل (الموجودة سابقًا) ---
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await checkAdminAndRedirect(result.user);
        } catch (error) {
            console.error("Error during Google sign-in: ", error);
            alert('حدث خطأ أثناء محاولة تسجيل الدخول.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background-dark">
            <div className="p-10 bg-surface-dark border border-border-color rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold mb-4 text-center">Kawn<span className="text-primary-blue">Hub</span></h1>
                <h2 className="text-xl text-text-secondary mb-8 text-center">تسجيل دخول لوحة التحكم</h2>
                
                {/* الخطوة 3: نضيف نموذج تسجيل الدخول بالإيميل */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2 text-right">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-border-color bg-background-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2 text-right">
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-border-color bg-background-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-primary-blue text-white font-bold rounded-lg transition-colors hover:bg-primary-blue/90 disabled:bg-gray-500"
                    >
                        {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                    </button>
                </form>

                {/* --- فاصل --- */}
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-border-color"></div>
                    <span className="mx-4 text-text-secondary text-sm">أو</span>
                    <div className="flex-grow border-t border-border-color"></div>
                </div>

                {/* --- زر تسجيل الدخول بجوجل --- */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-3 w-full px-6 py-3 bg-surface-dark border border-border-color text-text-primary font-bold rounded-lg transition-colors hover:bg-background-dark disabled:bg-gray-500"
                >
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.108-11.283-7.946l-6.522 5.025C9.505 41.219 16.227 44 24 44z" />
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.756 36.318 44 30.778 44 24c0-1.341-.138-2.65-.389-3.917z" />
                    </svg>
                    {isLoading ? 'جاري التحقق...' : 'المتابعة باستخدام Google'}
                </button>
            </div>
        </div>
    );
}

