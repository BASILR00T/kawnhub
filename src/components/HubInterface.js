'use client';

import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import MajorSelector from '@/components/MajorSelector';
import { Search, ArrowRight, Computer, HelpCircle, LogIn, LogOut, User, ChevronDown, LayoutDashboard, Clock, FileText, Hash, Loader2, X, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import SearchDialog from './SearchDialog';

// استيراد أدوات Firestore لجلب تفاصيل الشروحات
import { db } from '@/lib/firebase';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
// import { searchTopics } from '@/app/actions/search'; // Removed server action import

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
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Deep Search State
    const [deepResults, setDeepResults] = useState([]);
    const [isDeepSearching, setIsDeepSearching] = useState(false);
    const [showDeepResults, setShowDeepResults] = useState(false);
    const searchContainerRef = useRef(null);

    // حالة جديدة لتخزين الشروحات الأخيرة
    const [recentTopics, setRecentTopics] = useState([]);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowDeepResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Client-side Deep Search Function
    const performClientSideDeepSearch = (query) => {
        if (!query || query.trim().length < 2) return [];

        const term = query.toLowerCase().trim();
        const results = [];

        initialTopics.forEach(topic => {
            const title = topic.title || '';
            let matchFound = false;
            let snippet = '';
            let blockIndex = -1;

            // 1. Check Title
            if (title.toLowerCase().includes(term)) {
                matchFound = true;
                snippet = 'Topic Title Match';
            }

            // 2. Check Content Blocks
            if (topic.content && Array.isArray(topic.content)) {
                for (let i = 0; i < topic.content.length; i++) {
                    const block = topic.content[i];
                    let textToCheck = '';

                    if (typeof block.data === 'string') {
                        textToCheck = block.data;
                    } else if (block.data && typeof block.data === 'object') {
                        textToCheck = (block.data.en || '') + ' ' + (block.data.ar || '');
                        if (Array.isArray(block.data)) {
                            textToCheck = block.data.map(item => typeof item === 'string' ? item : (item.en + ' ' + item.ar)).join(' ');
                        }
                    }

                    if (textToCheck.toLowerCase().includes(term)) {
                        if (!matchFound) {
                            matchFound = true;
                            blockIndex = i;
                            const index = textToCheck.toLowerCase().indexOf(term);
                            const start = Math.max(0, index - 30);
                            const end = Math.min(textToCheck.length, index + 70);
                            snippet = (start > 0 ? '...' : '') + textToCheck.substring(start, end) + (end < textToCheck.length ? '...' : '');
                        } else if (blockIndex === -1) {
                            blockIndex = i;
                        }
                        break;
                    }
                }
            }

            if (matchFound) {
                results.push({
                    id: topic.id,
                    title: topic.title,
                    materialSlug: topic.materialSlug,
                    type: 'topic',
                    snippet: snippet,
                    blockIndex: blockIndex
                });
            }
        });

        return results.slice(0, 10);
    };

    // Deep Search Effect (Client-side)
    useEffect(() => {
        const handleDeepSearch = () => {
            if (searchQuery.trim().length < 2) {
                setDeepResults([]);
                setShowDeepResults(false);
                return;
            }

            setIsDeepSearching(true);
            setShowDeepResults(true);

            // Perform search immediately since it's client-side
            const data = performClientSideDeepSearch(searchQuery);
            setDeepResults(data);
            setIsDeepSearching(false);
        };

        const timeoutId = setTimeout(handleDeepSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, initialTopics]);

    // جلب تفاصيل الشروحات الأخيرة
    useEffect(() => {
        const fetchRecents = async () => {
            // ✅ 1. نقوم بتنظيف القائمة أولاً
            const validRecents = user?.recentlyViewed?.filter(Boolean); // filter(Boolean) يحذف القيم الفارغة

            if (validRecents?.length > 0) {
                try {
                    // ✅ 2. نستخدم القائمة النظيفة
                    const q = query(collection(db, 'topics'), where(documentId(), 'in', validRecents.slice(0, 5)));
                    const snap = await getDocs(q);
                    const topicsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                    const sortedTopics = validRecents
                        .map(id => topicsData.find(t => t.id === id))
                        .filter(Boolean);
                    setRecentTopics(sortedTopics);
                } catch (e) {
                    console.error("Failed to fetch recent topics:", e);
                    setRecentTopics([]);
                }
            } else {
                setRecentTopics([]);
            }
        };
        fetchRecents();
    }, [user]); // إعادة الجلب عند تغيير المستخدم

    const latestTopic = initialTopics.length > 0 ? initialTopics[0] : null;

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedTag(null);
        setDeepResults([]);
        setShowDeepResults(false);
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

    const navigateToTopic = (topic) => {
        let url = `/materials/${topic.materialSlug}?topic=${topic.id}`;
        if (topic.blockIndex !== -1) {
            url += `#block-${topic.blockIndex}`;
        }
        router.push(url);
    };

    // Helper to highlight search term
    const HighlightedText = ({ text, highlight }) => {
        if (!highlight || !text) return <span>{text}</span>;

        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5 font-bold">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
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

                        {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner') && (
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

                    {/* Search Button (Header) */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors border border-transparent hover:border-border-color"
                        title="بحث (Ctrl+K)"
                    >
                        <Search size={18} />
                        <span className="hidden lg:inline text-xs opacity-70 border border-white/20 rounded px-1.5 py-0.5">Ctrl+K</span>
                    </button>

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

                                    {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner') && (
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
                <div className="col-span-6 md:col-span-4 relative flex flex-col justify-between overflow-visible rounded-2xl border border-border-color bg-surface-dark p-6 z-10 transition-all duration-300 hover:border-primary-blue/30">
                    <div className='flex-grow'>
                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            مركزك للمعرفة التقنية
                            <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                        </h3>
                        <p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p>
                    </div>
                    <div className="relative mt-4" ref={searchContainerRef}>
                        <div className={`relative rounded-xl transition-all duration-300 ${showDeepResults ? 'shadow-[0_0_30px_rgba(59,130,246,0.15)]' : ''}`}>
                            <input
                                type="search"
                                placeholder="ابحث في المواد، الشروحات، أو الوسوم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => { if (deepResults.length > 0) setShowDeepResults(true); }}
                                className={`w-full rounded-xl border bg-background-dark p-4 pr-12 text-lg outline-none transition-all duration-300 ${showDeepResults ? 'border-primary-blue rounded-b-none' : 'border-border-color focus:border-primary-blue'}`}
                                disabled={isPreview}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                                {isDeepSearching ? <Loader2 size={20} className="animate-spin text-primary-blue" /> : <Search size={20} />}
                            </span>
                        </div>

                        {/* Deep Search Results Dropdown */}
                        {showDeepResults && deepResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-surface-dark border border-t-0 border-primary-blue rounded-b-xl shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 space-y-1">
                                    <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider flex justify-between items-center bg-background-dark/50 rounded-lg mb-2">
                                        <span className="flex items-center gap-2"><Sparkles size={12} className="text-primary-blue" /> نتائج البحث العميق</span>
                                        <button onClick={() => setShowDeepResults(false)} className="hover:text-text-primary p-1 rounded-md hover:bg-white/10 transition-colors"><X size={14} /></button>
                                    </div>
                                    {deepResults.map((result, index) => (
                                        <button
                                            key={result.id}
                                            onClick={() => navigateToTopic(result)}
                                            className="w-full flex flex-col items-end px-4 py-3 rounded-lg text-right transition-all duration-200 hover:bg-primary-blue/5 border border-transparent hover:border-primary-blue/10 group"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3 ml-auto w-full">
                                                    <div className="flex flex-col items-end flex-1 min-w-0">
                                                        <span className="font-medium text-text-primary group-hover:text-primary-blue transition-colors truncate w-full text-right">
                                                            <HighlightedText text={result.title} highlight={searchQuery} />
                                                        </span>
                                                        {result.snippet && (
                                                            <span className="text-xs text-text-secondary mt-1 line-clamp-1 w-full text-right" dir="ltr">
                                                                <HighlightedText text={result.snippet} highlight={searchQuery} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-surface-light text-text-secondary group-hover:bg-primary-blue/20 group-hover:text-primary-blue transition-colors shrink-0">
                                                        {result.blockIndex !== -1 ? <Hash size={18} /> : <FileText size={18} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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

            <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}