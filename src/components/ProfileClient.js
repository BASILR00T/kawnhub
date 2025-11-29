'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/hooks/useProgress';
import { db } from '@/lib/firebase';
import { documentId, where, query, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import {
    User, Mail, GraduationCap, Calendar, Save, Edit2,
    BookOpen, Star, Clock, Settings, CheckCircle, Bookmark,
    LogOut, ChevronDown, HelpCircle, ArrowRight, Search, Filter, Grid, List, Pin, LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileClient() {
    const { user, updateMajor, logout } = useAuth();
    const { completedIds } = useProgress();

    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMajor, setSelectedMajor] = useState(user?.major || '');
    const [loading, setLoading] = useState(false);

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Bookmarks State
    const [bookmarksData, setBookmarksData] = useState([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [bookmarkSearch, setBookmarkSearch] = useState('');
    const [bookmarkFilter, setBookmarkFilter] = useState('all');

    // Pinned Topics State
    const [pinnedTopics, setPinnedTopics] = useState([]);

    // Majors State
    const [majorsList, setMajorsList] = useState([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Majors
    useEffect(() => {
        const fetchMajors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'majors'));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMajorsList(data);
            } catch (error) {
                console.error("Error fetching majors:", error);
            }
        };
        fetchMajors();
    }, []);

    // Fetch Pinned Topics
    useEffect(() => {
        const fetchPinnedTopics = async () => {
            if (!user?.recentlyViewed || user.recentlyViewed.length === 0) {
                setPinnedTopics([]);
                return;
            }

            try {
                const q = query(collection(db, 'topics'), where(documentId(), 'in', user.recentlyViewed));
                const querySnapshot = await getDocs(q);
                const topics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Sort them by the order in recentlyViewed (most recent first)
                const sortedTopics = user.recentlyViewed
                    .map(id => topics.find(t => t.id === id))
                    .filter(Boolean);

                setPinnedTopics(sortedTopics);
            } catch (error) {
                console.error("Error fetching pinned topics:", error);
            }
        };

        if (activeTab === 'overview') {
            fetchPinnedTopics();
        }
    }, [user, activeTab]);

    // Fetch Bookmarks with Chunking
    useEffect(() => {
        const fetchBookmarks = async () => {
            const validFavorites = user?.favorites?.filter(Boolean) || [];
            if (validFavorites.length === 0) {
                setBookmarksData([]);
                return;
            }

            setBookmarksLoading(true);
            try {
                // Firestore 'in' query limit is 10. We must chunk the requests.
                const chunks = [];
                for (let i = 0; i < validFavorites.length; i += 10) {
                    chunks.push(validFavorites.slice(i, i + 10));
                }

                const promises = chunks.map(chunk => {
                    const q = query(collection(db, 'topics'), where(documentId(), 'in', chunk));
                    return getDocs(q);
                });

                const snapshots = await Promise.all(promises);
                const allDocs = snapshots.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));

                setBookmarksData(allDocs);
            } catch (e) {
                console.error("Error fetching bookmarks:", e);
                toast.error('فشل في جلب المفضلة');
            } finally {
                setBookmarksLoading(false);
            }
        };

        if (activeTab === 'bookmarks') {
            fetchBookmarks();
        }
    }, [user, activeTab]);

    // Filter and Search Logic
    const filteredBookmarks = useMemo(() => {
        return bookmarksData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(bookmarkSearch.toLowerCase());
            const matchesFilter = bookmarkFilter === 'all' || item.materialSlug === bookmarkFilter;
            return matchesSearch && matchesFilter;
        });
    }, [bookmarksData, bookmarkSearch, bookmarkFilter]);

    // Get unique materials for filter dropdown
    const uniqueMaterials = useMemo(() => {
        const materials = bookmarksData.map(b => b.materialSlug).filter(Boolean);
        return [...new Set(materials)];
    }, [bookmarksData]);

    if (!user) return <div className="p-20 text-center text-text-secondary animate-pulse">جاري تحميل بيانات الطالب...</div>;

    const handleSaveMajor = async () => {
        setLoading(true);
        await updateMajor(selectedMajor);
        setLoading(false);
        setIsEditing(false);
    };

    const stats = [
        {
            label: 'شروحات قرأتها',
            value: completedIds.length,
            icon: BookOpen,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'في المفضلة',
            value: user?.favorites?.filter(Boolean).length || 0,
            icon: Bookmark,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10'
        },
        {
            label: 'أيام الدراسة',
            value: '1',
            icon: Clock,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        },
    ];

    return (
        <div className="mx-auto max-w-6xl p-6">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between py-4 border-b border-border-color/50">
                <Link href="/" className="text-3xl font-bold text-text-primary no-underline hover:opacity-80 transition-opacity">
                    Kawn<span className="text-primary-blue">Hub</span>
                </Link>

                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium">المنصة</Link>
                        <Link href="/lab" className="hidden sm:block text-text-secondary transition-colors hover:text-text-primary font-medium">المختبر 🧪</Link>
                        {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner') && (
                            <Link href="/admin" className="text-primary-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-primary-purple/10 px-3 py-1.5 rounded-lg border border-primary-purple/20">
                                <LayoutDashboard size={16} /> <span>الإدارة</span>
                            </Link>
                        )}
                        <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة"><HelpCircle size={20} /></Link>
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
                                {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner') && (
                                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-purple hover:bg-primary-purple/10 transition-colors mx-2 rounded-lg">
                                        <LayoutDashboard size={16} /> <span>لوحة التحكم</span>
                                    </Link>
                                )}
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
                                {user.role === 'owner' ? 'المالك' : user.role === 'admin' ? 'مشرف النظام' : user.role === 'editor' ? 'محرر' : 'طالب نشيط'}
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
                    {/* التخصص */}
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
                                    {majorsList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
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
                                    {user.major || 'غير محدد'}
                                </p>
                                <p className="text-xs text-text-secondary uppercase tracking-widest">
                                    {majorsList.find(m => m.name === user.major)?.code || 'N/A'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* الإحصائيات */}
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
                                {pinnedTopics.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Pin className="text-primary-blue" size={20} />
                                            الدروس المثبتة (أكمل من حيث توقفت)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pinnedTopics.map(topic => (
                                                <Link
                                                    key={topic.id}
                                                    href={`/materials/${topic.materialSlug}?topic=${topic.id}`}
                                                    className="group relative flex flex-col justify-between p-6 rounded-2xl border border-primary-blue/30 bg-gradient-to-br from-primary-blue/5 to-transparent hover:border-primary-blue hover:shadow-lg hover:shadow-primary-blue/10 transition-all duration-300"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between mb-4">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full border border-primary-blue/20">
                                                                {topic.materialSlug}
                                                            </span>
                                                            <div className="p-2 rounded-full bg-primary-blue/10 text-primary-blue">
                                                                <ArrowRight size={20} className="rtl:rotate-180 group-hover:translate-x-[-5px] transition-transform" />
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-2xl text-text-primary group-hover:text-primary-blue transition-colors mb-3 line-clamp-2">
                                                            {topic.title}
                                                        </h4>
                                                    </div>

                                                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {topic.updatedAt?.toDate ? topic.updatedAt.toDate().toLocaleDateString('ar-EG') : '...'}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-2xl border border-dashed border-border-color bg-surface-dark/50 text-center">
                                        <div className="mx-auto w-16 h-16 bg-background-dark rounded-full flex items-center justify-center mb-4">
                                            <Pin size={32} className="text-text-secondary/50" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">لم تقم بتثبيت أي درس</h3>
                                        <p className="text-text-secondary text-sm mb-6">
                                            اضغط على أيقونة الدبوس 📌 في أي درس ليظهر هنا وتصل إليه بسرعة.
                                        </p>
                                        <Link href="/hub" className="inline-block px-6 py-2 bg-primary-blue text-white rounded-lg text-sm font-bold hover:bg-primary-blue/90 transition-colors">
                                            تصفح المواد الآن
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bookmarks' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                {/* Search & Filter Controls */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input
                                            type="text"
                                            placeholder="ابحث في مفضلتك..."
                                            value={bookmarkSearch}
                                            onChange={(e) => setBookmarkSearch(e.target.value)}
                                            className="w-full rounded-xl border border-border-color bg-surface-dark py-2.5 pr-10 pl-4 text-sm focus:border-primary-blue outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="relative min-w-[150px]">
                                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                                        <select
                                            value={bookmarkFilter}
                                            onChange={(e) => setBookmarkFilter(e.target.value)}
                                            className="w-full appearance-none rounded-xl border border-border-color bg-surface-dark py-2.5 pr-10 pl-8 text-sm focus:border-primary-blue outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="all">كل المواد</option>
                                            {uniqueMaterials.map(mat => (
                                                <option key={mat} value={mat}>{mat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={14} />
                                    </div>
                                </div>

                                {/* Bookmarks Grid */}
                                {bookmarksLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-32 rounded-xl bg-surface-dark animate-pulse border border-border-color"></div>
                                        ))}
                                    </div>
                                ) : filteredBookmarks.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {filteredBookmarks.map(topic => (
                                            <Link
                                                key={topic.id}
                                                href={`/materials/${topic.materialSlug}?topic=${topic.id}`}
                                                className="group relative flex flex-col justify-between p-5 rounded-xl border border-border-color bg-surface-dark hover:border-primary-blue hover:shadow-lg hover:shadow-primary-blue/5 transition-all duration-300"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-background-dark px-2 py-1 rounded border border-border-color">
                                                            {topic.materialSlug}
                                                        </span>
                                                        <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100">
                                                            <Bookmark size={16} fill="currentColor" />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-text-primary group-hover:text-primary-blue transition-colors line-clamp-2 mb-2">
                                                        {topic.title}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-color/50">
                                                    <span className="text-xs text-text-secondary flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {topic.updatedAt?.toDate ? topic.updatedAt.toDate().toLocaleDateString('ar-EG') : '...'}
                                                    </span>
                                                    <span className="text-xs font-bold text-primary-blue flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                                                        مذاكرة
                                                        <ArrowRight size={12} className="rtl:rotate-180" />
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-border-color rounded-2xl bg-surface-dark/30">
                                        <div className="w-16 h-16 mx-auto bg-surface-dark rounded-full flex items-center justify-center mb-4 border border-border-color">
                                            <Search size={24} className="text-text-secondary" />
                                        </div>
                                        <p className="text-text-secondary font-medium">لا توجد نتائج</p>
                                        <p className="text-xs text-text-secondary mt-1">جرب تغيير كلمات البحث أو الفلتر</p>
                                        {bookmarksData.length === 0 && (
                                            <Link href="/hub" className="mt-4 inline-block text-primary-blue text-sm hover:underline">
                                                تصفح المواد لإضافة شروحات
                                            </Link>
                                        )}
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