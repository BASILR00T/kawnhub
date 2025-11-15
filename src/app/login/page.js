'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  // إذا كان مسجلاً بالفعل، وجهه لمكانه الصحيح
  useEffect(() => {
    if (user && !loading) {
      if (user.isAdmin) router.push('/admin');
      else router.push('/hub');
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* خلفية جمالية */}
      <div className="absolute top-0 left-0 w-full h-full bg-background-dark z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        
        {/* الشعار */}
        <Link href="/" className="inline-block mb-8 text-4xl font-bold text-text-primary no-underline hover:scale-105 transition-transform">
          Kawn<span className="text-primary-blue">Hub</span>
        </Link>

        <div className="bg-surface-dark border border-border-color p-8 rounded-3xl shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-primary-blue to-primary-purple p-4 rounded-2xl text-white shadow-lg">
              <Sparkles size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-text-primary">حياك الله! 👋</h1>
          <p className="text-text-secondary mb-8">
            سجل دخولك عشان تحفظ موادك، وتخصص تجربتك، وتوصل للمختبر.
          </p>

          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>استمرار باستخدام Google</span>
          </button>

          <div className="mt-8 pt-6 border-t border-border-color/50">
            <Link href="/hub" className="text-sm text-text-secondary hover:text-primary-blue flex items-center justify-center gap-1 group">
              أبي أتصفح كزائر فقط <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}