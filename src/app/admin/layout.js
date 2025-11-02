'use client'; //  الخطوة 1: نحول الملف إلى "مكون عميل"

import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; //  الخطوة 2: نستورد 'useRouter' للتوجيه
import { auth } from '@/lib/firebase'; // نستورد 'auth'
import { signOut } from 'firebase/auth'; // نستورد دالة تسجيل الخروج
import { LogOut } from 'lucide-react'; // نستورد أيقونة احترافية

export default function AdminLayout({ children }) {
  const router = useRouter();

  //  الخطوة 3: ننشئ دالة تسجيل الخروج
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login'); //  توجيه المستخدم إلى صفحة الدخول
    } catch (error) {
      console.error("Error signing out: ", error);
      alert('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background-dark text-text-primary font-sans">
        
        <aside className="w-64 flex-shrink-0 bg-surface-dark p-6 border-l border-border-color flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-blue mb-8">لوحة التحكم</h1>
            <nav className="flex flex-col space-y-4">
              <Link href="/admin" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
                الرئيسية (Dashboard)
              </Link>
              <Link href="/admin/materials" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
                إدارة المواد
              </Link>
              <Link href="/admin/topics" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
                إدارة الشروحات
              </Link>
              <Link href="/admin/tags" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
                إدارة الوسوم
              </Link>
              <hr className="border-border-color my-4" />
              <Link href="/" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
                العودة للموقع الرئيسي
              </Link>
            </nav>
          </div>
          
          {/* الخطوة 4: نضيف زر تسجيل الخروج في الأسفل */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
        
      </div>
    </AuthProvider>
  );
}

