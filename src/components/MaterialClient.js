'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import DOMPurify from 'isomorphic-dompurify';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Copy, ArrowLeft, Bookmark, Share2, Clock, 
    LogIn, LogOut, User, ChevronDown, HelpCircle, LayoutDashboard, ArrowRight 
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// --- (BlockRenderer - No Change) ---
const BlockRenderer = ({ block }) => {
    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('تم نسخ الأمر بنجاح!');
    };
    const sanitize = (html) => DOMPurify.sanitize(html);
    switch (block.type) {
        case 'subheading':
            const id = block.data.replace(/\s+/g, '-').toLowerCase();
            return <h2 id={id} className="text-2xl font-bold mt-10 mb-4 border-b border-border-color pb-2 text-primary-blue">{block.data}</h2>;
        case 'paragraph':
            return <p className="text-lg text-text-secondary my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} />;
        case 'ciscoTerminal':
            return (
                <div className="not-prose my-6 relative group">
                    <pre className="bg-black/80 rounded-lg border border-border-color font-mono text-base p-4 pt-8 overflow-x-auto"><code className="text-green-400">{block.data}</code></pre>
                    <button onClick={() => handleCopy(block.data)} className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Copy size={12} /> نسخ
                    </button>
                </div>
            );
        case 'note':
            return <div className="my-4 p-4 border-r-4 border-yellow-500 bg-yellow-500/10 text-yellow-200/90 rounded-r-lg" dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} />;
        case 'orderedList':
            return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-lg pl-4 marker:text-primary-blue">{block.data.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: sanitize(item) }} />)}</ol>;
        case 'videoEmbed':
            if (!block.data.url) return null;
            return (
                <div className="not-prose my-8 relative w-full pt-[56.25%] rounded-xl overflow-hidden border border-border-color bg-black">
                    <iframe src={block.data.url} title={block.data.caption} className="absolute top-0 left-0 w-full h-full" allowFullScreen></iframe>
                </div>
            );
        case 'image':
            if (!block.data.url) return null;
            return (
                <figure className="not-prose my-8">
                    <img src={block.data.url} alt={block.data.caption || 'KawnHub Image'} className="w-full rounded-xl border border-border-color bg-black/20" />
                    <figcaption className="text-center text-sm text-text-secondary mt-2">{block.data.caption}</figcaption>
                </figure>
            );
        default: return null;
    }
};

const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = LucideIcons[name];
    if (!IconComponent) return <LucideIcons.BookOpen {...props} />;
    return <IconComponent {...props} />;
};


export default function MaterialClient({ material, topics, initialTopic }) {
    const { user, logout, logRecentTopic } = useAuth();
    const { bookmarkedIds, toggleBookmark } = useBookmarks();
    
    const [selectedTopic, setSelectedTopic] = useState(initialTopic);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    
    const dropdownRef = useRef(null);

    // ✅ دالة جديدة لاختيار الشرح مع التمرير للأعلى
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        // التمرير التلقائي لأعلى الصفحة
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        // لا نحتاج handleTopicSelect هنا، فقط عند الضغط
        setSelectedTopic(initialTopic);
        if (initialTopic?.id) {
            logRecentTopic(initialTopic.id);
        }
    }, [initialTopic, logRecentTopic]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const subheadings = selectedTopic?.content?.filter(block => block.type === 'subheading') || [];
    const isBookmarked = selectedTopic ? bookmarkedIds.includes(selectedTopic.id) : false;

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?topic=${selectedTopic.id}`;
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ رابط هذا الشرح!');
    };

    return (
        // ✅ 1. أعدنا الحاوية الأصلية التي تسمح بالسكرول الطبيعي
        <div className="mx-auto max-w-7xl p-6 font-sans">
            <Toaster position="bottom-center" />
            
            <header className="mb-8 flex items-center justify-between border-b border-border-color py-4">
                <Link href="/" className="text-3xl font-bold text-text-primary no-underline">Kawn<span className="text-primary-blue">Hub</span></Link>
                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المنصة</Link>
                        <Link href="/lab" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المختبر 🧪</Link>
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                            <Link href="/admin" className="text-primary-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-primary-purple/10 px-3 py-1.5 rounded-lg border border-primary-purple/20">
                                <LayoutDashboard size={16} /> <span>الإدارة</span>
                            </Link>
                        )}
                        <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة"><HelpCircle size={20}/></Link>
                    </div>

                    <div className="h-6 w-px bg-border-color hidden md:block"></div>

                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 focus:outline-none group">
                                {user.photoURL ? (
                                    <Image src={user.photoURL} alt={user.name || "الصورة الشخصية"} width={36} height={36} className="rounded-full border border-primary-blue/50 group-hover:border-primary-blue" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold border border-primary-blue/50">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                )}
                                <ChevronDown size={16} className={`text-text-secondary transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border-color bg-surface-dark shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-left">
                                    <div className="px-4 py-3 border-b border-border-color/50 mb-2">
                                        <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
                                        <p className="text-xs text-text-secondary truncate font-mono mt-0.5">{user.email}</p>
                                    </div>
                                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-primary-blue/10 hover:text-primary-blue mx-2 rounded-lg">
                                        <User size={16} /> <span>الملف الشخصي</span>
                                    </Link>
                                    <div className="my-2 border-t border-border-color/50 mx-4"></div>
                                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 mx-2 rounded-lg text-right">
                                        <LogOut size={16} /> <span>تسجيل خروج</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-sm font-bold text-white hover:bg-primary-blue/90 transition-colors">
                            <span>دخول</span> <LogIn size={16} />
                        </Link>
                    )}
                </nav>
            </header>

            {/* ✅ 2. Grid عادي (بدون تحكم بارتفاع الشاشة) */}
            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                
                {/* ✅ 3. القائمة الجانبية أصبحت "لاصقة" */}
                <aside className="md:col-span-1">
                    <div className="md:sticky md:top-8">
                        <div className="mb-4">
                            <DynamicIcon name={material.icon || 'BookOpen'} size={32} className="text-primary-blue" />
                        </div>
                        <h2 className="mb-1 text-2xl font-bold text-text-primary">{material.title}</h2>
                        <p className="mb-4 text-sm text-text-secondary">{material.courseCode}</p>
                        <hr className="border-border-color mb-4" />
                        
                        <h3 className="font-bold mb-2">محتويات الشرح</h3>
                        <ul className="space-y-2">
                           {subheadings.length > 0 ? subheadings.map((sub, i) => (
                                <li key={i}>
                                    <a href={`#${sub.data.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm block text-text-secondary hover:text-primary-blue transition-colors">
                                        {sub.data}
                                    </a>
                                </li>
                            )) : <li className="text-xs text-text-secondary italic">لا يوجد فهرس لهذا الشرح</li>}
                        </ul>

                        <hr className="border-border-color my-6" />

                        <h3 className="font-bold mb-2">شروحات المادة</h3>
                        <ul className="space-y-3">
                            {topics.map((topic) => (
                                <li key={topic.id} className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleTopicSelect(topic)} // ✅ 4. استخدام الدالة الجديدة
                                        className={`w-full text-right rounded-md p-2 transition-colors text-sm ${selectedTopic?.id === topic.id ? 'bg-primary-blue/10 text-primary-blue font-bold' : 'text-text-secondary hover:bg-surface-dark hover:text-text-primary'}`}
                                    >
                                        {topic.title}
                                    </button>
                                    <button 
                                        onClick={() => toggleBookmark(topic.id)} 
                                        title="حفظ"
                                        className={`p-2 rounded-md ${bookmarkedIds.includes(topic.id) ? 'text-yellow-400' : 'text-text-secondary/50 hover:text-yellow-400'}`}
                                    >
                                        <Bookmark size={14} fill={bookmarkedIds.includes(topic.id) ? 'currentColor' : 'none'} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* ✅ 5. المحتوى الرئيسي (بدون تحكم بالسكرول، يتبع الصفحة) */}
                <main className="md:col-span-3">
                    {selectedTopic ? (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-4xl font-bold text-text-primary">
                                    {selectedTopic.title}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleShare} className="p-2 rounded-lg bg-surface-dark border border-border-color text-text-secondary hover:text-text-primary"><Share2 size={16} /></button>
                                    <button 
                                        onClick={() => toggleBookmark(selectedTopic.id)} 
                                        className={`p-2 rounded-lg border ${isBookmarked ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-surface-dark border-border-color text-text-secondary hover:text-yellow-400'}`}
                                    >
                                        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-6 pb-6 border-b border-border-color/50 text-xs text-text-secondary flex items-center gap-1">
                                <Clock size={12} />
                                <span>آخر تحديث: {selectedTopic.updatedAt ? new Date(selectedTopic.updatedAt).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                            </div>
                            
                            {subheadings.length > 0 && (
                                <div className="not-prose bg-surface-dark border border-border-color rounded-lg p-4 mb-8">
                                    <h3 className="font-bold mb-2 text-text-primary">في هذا الشرح:</h3>
                                    <ul className="list-decimal list-inside space-y-1">
                                        {subheadings.map((sub, i) => (
                                            <li key={i}>
                                                <a href={`#${sub.data.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm text-text-secondary hover:text-primary-blue transition-colors underline decoration-border-color hover:decoration-primary-blue">
                                                    {sub.data}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="prose prose-invert max-w-none">
                                {selectedTopic.content.map((block, index) => (
                                    <BlockRenderer key={index} block={block} />
                                ))}
                            </div>
                        </div>
                    ) : ( 
                        <div className="text-center py-20">
                            <h2 className="text-2xl font-bold mb-4">لا توجد شروحات متاحة</h2>
                            <p className="text-lg text-text-secondary">لم يتم إضافة شروحات لهذه المادة بعد. نعمل على إضافتها قريباً!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}