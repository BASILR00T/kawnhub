'use client';

import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import MajorSelector from '@/components/MajorSelector';
import { Search, ArrowRight, Computer, HelpCircle, LogIn, LogOut, User, ChevronDown, LayoutDashboard, Clock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// استيراد أدوات Firestore لجلب تفاصيل الشروحات
import { db } from '@/lib/firebase';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';

// --- المكون الديناميكي للأيقونات ---
const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = LucideIcons[name];
    if (!IconComponent) return <LucideIcons.BookOpen {...props} />; // أيقونة افتراضية
    return <IconComponent {...props} />;
};

// --- مكون البطاقة ---
const BentoCard = ({ children, className, href }) => { 
    return ( 
        <Link href={href || '#'} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6 transition-transform duration-300 ease-in-out hover:-translate-y-1 ${className}`}> 
            <div className="absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(45deg, var(--primary-blue), var(--primary-purple))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div> 
            <div className="relative z-10 h-full flex flex-col"> {children} </div> 
        </Link> 
    ); 
};

export default function HubInterface({ initialMaterials = [], initialTopics = [], initialTags = [], isPreview = false }) {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // حالة جديدة لتخزين الشروحات الأخيرة
    const [recentTopics, setRecentTopics] = useState([]);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // جلب تفاصيل الشروحات الأخيرة
    useEffect(() => {
        const fetchRecents = async () => {
            // نتأكد أن المستخدم موجود، وأنه طالب، ولديه قائمة مشاهدة
            if (user && !user.isAdmin && user.recentlyViewed?.length > 0) {
                try {
                    const q = query(collection(db, 'topics'), where(documentId(), 'in', user.recentlyViewed.slice(0, 5)));
                    const snap = await getDocs(q);
                    const topicsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    // ترتيبها حسب ما هو مسجل عند المستخدم
                    const sortedTopics = user.recentlyViewed
                        .map(id => topicsData.find(t => t.id === id))
                        .filter(Boolean); // فلترة أي شروحات قد تكون حذفت
                    setRecentTopics(sortedTopics);
                } catch (e) { 
                    console.error("Failed to fetch recent topics:", e);
                    setRecentTopics([]);
                }
            } else {
                setRecentTopics([]); // تصفير القائمة إذا كان زائراً أو أدمن
            }
        };
        fetchRecents();
    }, [user]); // إعادة الجلب عند تغيير المستخدم

    const latestTopic = initialTopics.length > 0 ? initialTopics[0] : null;

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedTag(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredMaterials = useMemo(() => {
        let items = [...initialMaterials];
        const lowerCaseQuery = searchQuery.toLowerCase();

        // --- ✅ 1. فلترة التخصص (الميزة الجديدة) ---
        // إذا كان المستخدم طالباً واختار تخصصه، قم بالفلترة
        if (user && !user.isAdmin && user.major) {
            items = items.filter(material => 
                // تأكد أن المادة لديها مصفوفة التخصصات وأنها تشمل تخصص الطالب
                Array.isArray(material.targetMajors) && 
                material.targetMajors.includes(user.major)
            );
        }

        // --- 2. فلترة الوسوم (كما كانت) ---
        if (selectedTag) {
            const matchingTopicSlugs = new Set(
                initialTopics
                    .filter(topic => Array.isArray(topic.tags) && topic.tags.includes(selectedTag))
                    .map(topic => topic.materialSlug)
            );
            items = items.filter(material => matchingTopicSlugs.has(material.slug));
        }

        // --- 3. فلترة البحث (كما كانت) ---
        if (searchQuery) {
            items = items.filter(material => 
                material.title.toLowerCase().includes(lowerCaseQuery) || 
                material.courseCode.toLowerCase().includes(lowerCaseQuery) || 
                (initialTopics.some(topic => 
                    topic.materialSlug === material.slug && 
                    (topic.title.toLowerCase().includes(lowerCaseQuery) || (Array.isArray(topic.tags) && topic.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))))
                ))
            );
        }
        return items;
    }, [searchQuery, selectedTag, initialMaterials, initialTopics, user]); // ✅ تأكد من إضافة user هنا
    
    const handleTagClick = (slug) => {
        setSelectedTag(prev => prev === slug ? null : slug);
    };

    return (
        <div className="mx-auto max-w-6xl p-6">
             <MajorSelector />
             <Toaster position="bottom-center" />
             
             <header className="mb-12 flex items-center justify-between relative z-20"> 
                <Link href="/" className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </Link> 
                
                <nav className="flex items-center gap-6"> 
                    <div className="hidden md:flex items-center gap-6">
                        <button 
                            onClick={resetFilters}
                            disabled={isPreview}
                            className={`text-sm font-medium transition-colors ${(!searchQuery && !selectedTag) ? 'text-primary-blue cursor-default' : 'text-text-secondary hover:text-text-primary cursor-pointer'}`}
                        >
                            جميع المواد
                        </button>

                        <Link href="/lab" className="text-text-secondary hover:text-text-primary font-medium text-sm">
                            المختبر 🧪
                        </Link> 
                        
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                            <Link href="/admin" className="text-primary-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-primary-purple/10 px-3 py-1.5 rounded-lg border border-primary-purple/20">
                                <LayoutDashboard size={16} />
                                <span>الإدارة</span>
                            </Link>
                        )}

                        <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة والدعم">
                            <HelpCircle size={20} />
                        </Link>
                    </div>

                    <div className="h-6 w-px bg-border-color hidden md:block"></div>

                    {/* Dropdown */}
                    {user ? (
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
                                        <p className="text-sm font-bold text-text-primary truncate">{user.name || 'مستخدم'}</p>
                                        <p className="text-xs text-text-secondary truncate font-mono mt-0.5">{user.email}</p>
                                    </div>
                                    
                                    {(user?.role === 'admin' || user?.role === 'editor') && (
                                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-purple hover:bg-primary-purple/10 transition-colors mx-2 rounded-lg">
                                            <LayoutDashboard size={16} />
                                            <span>لوحة التحكم</span>
                                        </Link>
                                    )}

                                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-primary-blue/10 hover:text-primary-blue transition-colors mx-2 rounded-lg">
                                        <User size={16} />
                                        <span>الملف الشخصي</span>
                                    </Link>

                                    <div className="my-2 border-t border-border-color/50 mx-4"></div>

                                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors mx-2 rounded-lg text-right">
                                        <LogOut size={16} />
                                        <span>تسجيل خروج</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-sm font-bold text-white hover:bg-primary-blue/90 transition-colors">
                            <span>دخول</span>
                            <LogIn size={16} />
                        </Link>
                    )}
                </nav> 
             </header>

            {/* --- قسم "أكمل المذاكرة" --- */}
            {user && !user.isAdmin && recentTopics.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Clock className="text-primary-blue" />
                        أكمل من حيث توقفت
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentTopics.map(topic => (
                            <Link 
                                href={`/materials/${topic.materialSlug}?topic=${topic.id}`} 
                                key={topic.id}
                                className="group p-4 rounded-xl border border-border-color bg-surface-dark hover:border-primary-blue transition-all flex items-center gap-4"
                            >
                                <div className="p-3 rounded-lg bg-primary-blue/10 text-primary-blue shrink-0">
                                    <DynamicIcon name={initialMaterials.find(m => m.slug === topic.materialSlug)?.icon || 'BookOpen'} size={20} />
                                G</div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary group-hover:text-primary-blue transition-colors truncate">{topic.title}</p>
                                    <p className="text-xs text-text-secondary">{initialMaterials.find(m => m.slug === topic.materialSlug)?.title}</p>
                                </div>
                                <ArrowRight size={16} className="text-text-secondary mr-auto opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* --- الشبكة الرئيسية (Main Grid) --- */}
            <main className="grid grid-cols-6 auto-rows-[220px] gap-4">
                {/* بطاقة البحث */}
                <div className="col-span-6 md:col-span-4 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6">
                    <div className='flex-grow'> 
                        <h3 className="text-2xl font-bold mb-2">مركزك للمعرفة التقنية</h3> 
                        <p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p> 
                    </div>
                    <div className="relative mt-4">
                        <input 
                            type="search" 
                            placeholder="ابحث في المواد، الشروحات، أو الوسوم..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border-color bg-background-dark p-4 pr-12 text-lg focus:border-primary-blue outline-none transition-colors" 
                            disabled={isPreview}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"><Search size={20} /></span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-text-secondary mr-2 py-1">الأكثر شيوعًا:</span>
                        {initialTags.slice(0, 5).map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => handleTagClick(tag.slug)}
                                disabled={isPreview}
                                className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTag === tag.slug ? 'bg-primary-blue text-white border-primary-blue' : 'bg-surface-dark border-border-color text-text-secondary hover:border-primary-blue hover:text-white'}`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* بطاقة آخر تحديث */}
                <BentoCard className="col-span-6 md:col-span-2" href={latestTopic ? `/materials/${latestTopic.materialSlug}?topic=${latestTopic.id}` : '#'}>
                    {latestTopic ? (
                        <>
                            <div className='flex-grow'>
                                <h3 className="text-xl font-bold text-primary-purple">آخر تحديث ⚡</h3>
                                <p className="mt-2 font-semibold text-lg">{latestTopic.title}</p>
                                <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                                    {latestTopic.content?.find(b => b.type === 'paragraph')?.data.en || 'شرح جديد تمت إضافته...'}
                                </p>
                            </div>
                            <span className="self-start mt-4 font-bold text-primary-blue flex items-center gap-2 group-hover:translate-x-[-5px] transition-transform">
                                اقرأ الشرح <ArrowRight size={20} />
                            </span>
                        </>
                    ) : (
                        <div className="text-text-secondary flex items-center justify-center h-full">لا توجد تحديثات</div>
                    )}
                </BentoCard>
                
                {/* عرض المواد */}
                {filteredMaterials.map((material) => (
                    <BentoCard key={material.id} className="col-span-6 sm:col-span-3 md:col-span-2" href={`/materials/${material.slug}`}>
                        <div className="text-text-secondary group-hover:text-primary-blue mb-4 transition-colors">
                            <Suspense fallback={<Computer size={32} />}>
                                <DynamicIcon name={material.icon} size={32} />
                            </Suspense>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold">{material.title}</h3>
                            <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                                {material.description.ar || material.description.en}
                            </p>
                        </div>
                        <div className="self-end text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={20} />
                        </div>
                    </BentoCard>
                ))}
                
                {filteredMaterials.length === 0 && (
                    <div className="col-span-6 text-center text-text-secondary py-10 border border-dashed border-border-color rounded-2xl">
                        <p className="text-lg font-bold">لا توجد نتائج</p>
                        <p>تأكد من صحة الكلمات المفتاحية أو جرب وسمًا آخر.</p>
                        <button onClick={resetFilters} className="mt-4 text-primary-blue hover:underline">
                            عرض جميع المواد
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}