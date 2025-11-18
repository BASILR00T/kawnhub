'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { documentId, where, query, collection, getDocs } from 'firebase/firestore';
import { 
  User, Mail, GraduationCap, Calendar, Save, Edit2, 
  BookOpen, Star, Clock, Settings, CheckCircle, Bookmark,
  LogOut, ChevronDown, HelpCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const majors = [
  { id: 'CS', name: 'علوم الحاسب', code: 'CS' },
  { id: 'IT', name: 'تقنية المعلومات', code: 'IT' },
  { id: 'ISE', name: 'هندسة النظم', code: 'ISE' },
  { id: 'Common', name: 'سنة مشتركة', code: 'PYP' },
];

export default function ProfileClient() {
  const { user, updateMajor, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState(user?.major || '');
  const [loading, setLoading] = useState(false);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [bookmarksData, setBookmarksData] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جلب بيانات المفضلة
  useEffect(() => {
    const fetchBookmarks = async () => {
        // نستخدم user.favorites (الذي يأتي من AuthContext)
        if (user?.favorites?.length > 0) {
            try {
                const q = query(collection(db, 'topics'), where(documentId(), 'in', user.favorites.slice(0, 10)));
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setBookmarksData(data);
            } catch (e) {
                console.error("Error fetching bookmarks:", e);
                toast.error('فشل في جلب المفضلة');
            }
        } else {
            setBookmarksData([]);
        }
    };
    
    if (activeTab === 'bookmarks') {
        fetchBookmarks();
    }
  }, [user, activeTab]); // نعتمد على user من الكونتكست

  if (!user) return <div className="p-20 text-center text-text-secondary animate-pulse">جاري تحميل بيانات الطالب...</div>;

  const handleSaveMajor = async () => {
    setLoading(true);
    await updateMajor(selectedMajor);
    setLoading(false);
    setIsEditing(false);
  };

  const stats = [
    { label: 'شروحات قرأتها', value: '0', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'في المفضلة', value: user?.favorites?.length || 0, icon: Bookmark, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'أيام الدراسة', value: '1', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      
      <header className="mb-8 flex items-center justify-between py-4 border-b border-border-color/50"> 
        <Link href="/" className="text-3xl font-bold text-text-primary no-underline hover:opacity-80 transition-opacity">
           Kawn<span className="text-primary-blue">Hub</span> 
        </Link>
        
        <nav className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-6">
                <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium">المنصة</Link>
                <Link href="/lab" className="hidden sm:block text-text-secondary transition-colors hover:text-text-primary font-medium">المختبر 🧪</Link>
                <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة"><HelpCircle size={20}/></Link>
             </div>

             <div className="h-6 w-px bg-border-color hidden md:block"></div>

             <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 focus:outline-none group">
                    {user.photoURL ? (
                        <Image src={user.photoURL} alt={user.name || "الصورة الشخصية"} width={36} height={36} className="rounded-full border border-primary-blue/50 group-hover:border-primary-blue transition-colors" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold border border-primary-blue/50 group-hover:border-primary-blue transition-colors">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-text-secondary transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border-color bg-surface-dark shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-left">
                        <div className="px-4 py-3 border-b border-border-color/50 mb-2">
                            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
                            <p className="text-xs text-text-secondary truncate font-mono mt-0.5">{user.email}</p>
                        </div>
                        <Link href="/hub" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-primary-blue/10 hover:text-primary-blue mx-2 rounded-lg">
                            <BookOpen size={16} />
                            <span>تصفح المواد</span>
                        </Link>
                        <div className="my-2 border-t border-border-color/50 mx-4"></div>
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors mx-2 rounded-lg text-right">
                            <LogOut size={16} />
                            <span>تسجيل خروج</span>
                        </button>
                    </div>
                )}
             </div>
        </nav>
      </header>

      {/* Student Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border-color bg-surface-dark p-8 mb-8">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary-blue via-purple-600 to-primary-blue opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end gap-6 mt-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-blue to-purple-600 rounded-full opacity-75 blur"></div>
            <div className="relative h-28 w-28 rounded-full border-4 border-background-dark overflow-hidden bg-background-dark flex items-center justify-center">
                {user.photoURL ? (
                    // ✅ إصلاح: إضافة قيمة احتياطية لـ alt
                    <Image src={user.photoURL} alt={user.name || 'الصورة الشخصية'} fill className="object-cover" />
                ) : (
                    <User size={48} className="text-text-secondary" />
                )}
            </div>
          </div>

          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-bold text-text-primary">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> انضممت في {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('ar-EG') : '...'}</span>
                <span className="px-2 py-0.5 rounded-md bg-primary-blue/10 text-primary-blue text-xs font-bold border border-primary-blue/20">
                    {user.role === 'admin' ? 'مشرف النظام' : 'طالب نشيط'}
                </span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-dark border border-border-color text-text-secondary hover:text-primary-blue hover:border-primary-blue transition-all mb-2"
          >
            <Settings size={18} />
            <span>الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-dark border border-border-color rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <GraduationCap className="text-primary-purple" size={20} />
                        التخصص الدراسي
                    </h3>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-xs text-primary-blue hover:underline">تغيير</button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-3 animate-in fade-in">
                        <select 
                            value={selectedMajor} 
                            onChange={(e) => setSelectedMajor(e.target.value)}
                            className="w-full rounded-lg bg-background-dark border border-border-color p-2.5 text-sm focus:border-primary-blue outline-none"
                        >
                            <option value="" disabled>اختر التخصص</option>
                            {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={handleSaveMajor} disabled={loading} className="flex-1 bg-primary-blue text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-blue/90">
                                {loading ? '...' : 'حفظ'}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="px-3 py-2 rounded-lg border border-border-color text-text-secondary text-xs hover:bg-white/5">
                                إلغاء
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary-purple/10 to-transparent border border-primary-purple/20 text-center">
                        <p className="text-2xl font-bold text-primary-purple mb-1">
                            {majors.find(m => m.id === user.major)?.name || 'غير محدد'}
                        </p>
                        <p className="text-xs text-text-secondary uppercase tracking-widest">
                            {majors.find(m => m.id === user.major)?.code || 'N/A'}
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                    <div key={i} className={`p-4 rounded-2xl border border-border-color bg-surface-dark ${i === 0 ? 'col-span-2' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.bg} ${stat.color}`}>
                            <stat.icon size={16} />
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                        <p className="text-xs text-text-secondary">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-8">
            <div className="flex items-center gap-4 border-b border-border-color mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`pb-3 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-primary-blue' : 'text-text-secondary hover:text-text-primary'}`}>
                    نظرة عامة
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-blue rounded-t-full"></div>}
                </button>
                <button onClick={() => setActiveTab('bookmarks')} className={`pb-3 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'bookmarks' ? 'text-primary-blue' : 'text-text-secondary hover:text-text-primary'}`}>
                    المفضلة ({bookmarksData.length})
                    {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-blue rounded-t-full"></div>}
                </button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 px-2 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-primary-blue' : 'text-text-secondary hover:text-text-primary'}`}>
                    إعدادات الحساب
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-blue rounded-t-full"></div>}
                </button>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-8 rounded-2xl border border-dashed border-border-color bg-surface-dark/50 text-center">
                            <div className="mx-auto w-16 h-16 bg-background-dark rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-green-500/50" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">أكمل من حيث توقفت</h3>
                            <p className="text-text-secondary text-sm mb-6">
                                سيظهر هنا آخر درس قمت بفتحه لتكمل المذاكرة فوراً.
                            </p>
                            <Link href="/hub" className="inline-block px-6 py-2 bg-primary-blue text-white rounded-lg text-sm font-bold hover:bg-primary-blue/90 transition-colors">
                                تصفح المواد الآن
                            </Link>
                        </div>
                    </div>
                )}

                {activeTab === 'bookmarks' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {bookmarksData.length > 0 ? (
                            bookmarksData.map(topic => (
                                <Link 
                                    key={topic.id} 
                                    // ✅ الإصلاح: إضافة topic.materialSlug
                                    href={`/materials/${topic.materialSlug}?topic=${topic.id}`}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border-color bg-surface-dark hover:border-primary-blue transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                                            <Bookmark size={20} fill="currentColor" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-primary group-hover:text-primary-blue transition-colors">{topic.title}</h4>
                                            <span className="text-xs text-text-secondary bg-background-dark px-2 py-1 rounded border border-border-color mt-1 inline-block">{topic.materialSlug}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-text-secondary group-hover:translate-x-[-5px] transition-transform rtl:rotate-180" />
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <Star size={48} className="mx-auto text-text-secondary/20 mb-4" />
                                <p className="text-text-secondary">لا توجد عناصر في المفضلة بعد.</p>
                                <p className="text-xs text-text-secondary mt-2">تصفح المواد واضغط على زر الحفظ لتعود إليها لاحقاً.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                            <h3 className="text-lg font-bold text-red-400 mb-2">منطقة الخطر</h3>
                            <p className="text-sm text-red-300/70 mb-6">
                                حذف الحساب سيؤدي لمسح جميع بياناتك، بما في ذلك المفضلة والتقدم الدراسي، ولا يمكن التراجع عنه.
                            </p>
                            <button className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors">
                                حذف حسابي نهائياً
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}