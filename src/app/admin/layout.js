'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { LayoutDashboard, Folder, Hash, FileText, Users, LogOut, Loader2, Globe, Inbox } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // --- 🔥 الجدار الناري المطور 🔥 ---
  useEffect(() => {
    // 1. ننتظر حتى ينتهي التحميل
    if (loading) return;

    // 2. إذا لم يكن مسجلاً أصلاً -> لصفحة الدخول
    if (!user) {
      router.push('/login');
      return;
    }

    // 3. (الشرط الجديد) إذا كان مسجلاً لكنه ليس أدمن أو مشرف -> طرد للمنصة
    if (user.role !== 'admin' && user.role !== 'editor') {
      toast.error('عذراً، هذه المنطقة للمشرفين فقط!');
      router.push('/hub');
    }
  }, [user, loading, router]);

  // --- شاشة التحميل والحماية ---
  // نعرض شاشة التحميل إذا:
  // 1. جاري التحقق (loading)
  // 2. المستخدم غير موجود
  // 3. المستخدم موجود لكنه ليس أدمن (كي لا يرى المحتوى ولو لثانية قبل الطرد)
  if (loading || !user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-dark text-primary-blue">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // --- القائمة والمحتوى (يظهر فقط للأدمن/المشرف) ---
  const navItems = [
    { name: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { name: 'المواد', href: '/admin/materials', icon: Folder },
    { name: 'الشروحات', href: '/admin/topics', icon: FileText },
    { name: 'الوسوم', href: '/admin/tags', icon: Hash },
    { name: 'الرسائل', href: '/admin/messages', icon: Inbox }, 
  ];

  return (
    <div className="flex min-h-screen bg-background-dark text-text-primary">
      <Toaster position="bottom-left" />

      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-64 border-l border-border-color bg-surface-dark p-4 hidden md:flex flex-col">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="text-2xl font-bold">Kawn<span className="text-primary-blue">Admin</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary transition-all hover:bg-primary-blue hover:text-white mb-2">
            <Globe size={20} />
            <span className="font-medium">عرض الموقع</span>
          </Link>

          <div className="my-2 h-px bg-border-color mx-2 opacity-50"></div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? 'bg-primary-blue text-white' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {user.role === 'admin' && (
            <>
              <div className="my-2 h-px bg-border-color mx-2 opacity-50"></div>
              <Link href="/admin/users" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === '/admin/users' ? 'bg-primary-purple/20 text-primary-purple' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                <Users size={20} />
                <span className="font-medium">المستخدمين</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-border-color pt-4">
          <div className="mb-4 px-2 text-xs text-text-secondary">
             مسجل كـ: <span className="font-bold text-primary-blue uppercase">{user.role}</span>
             <br/>
             <span className="truncate block" title={user.email}>{user.email}</span>
          </div>
          <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 transition-all hover:bg-red-500/10">
            <LogOut size={20} />
            <span className="font-medium">تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 md:mr-64">
        {children}
      </main>
    </div>
  );
}