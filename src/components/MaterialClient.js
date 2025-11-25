'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useProgress } from '@/hooks/useProgress';
import DOMPurify from 'isomorphic-dompurify';
import toast, { Toaster } from 'react-hot-toast';
import {
    Copy, Bookmark, Share2, Clock, Pin,
    LayoutDashboard, HelpCircle, LogIn, LogOut, User, ChevronDown, ArrowRight,
    CheckCircle, Circle, Maximize2, Minimize2, Search
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import SearchDialog from './SearchDialog';
import confetti from 'canvas-confetti';

// --- BlockRenderer Component ---
const BlockRenderer = ({ block, index, showTranslation, highlightedBlockIndex }) => {
    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('تم نسخ الأمر بنجاح!');
    };
    const sanitize = (html) => DOMPurify.sanitize(html);

    // Helper for bilingual text
    const renderText = (data) => {
        if (typeof data === 'string') return data; // Fallback for old data
        return (
            <div className="flex flex-col gap-2">
                {/* English (Primary) */}
                <div dir="ltr" className="text-left" dangerouslySetInnerHTML={{ __html: sanitize(data.en) }} />

                {/* Arabic (Translation) */}
                {showTranslation && data.ar && (
                    <div dir="rtl" className="text-right text-sm text-primary-blue/80 border-t border-primary-blue/10 pt-2 mt-1 font-medium" dangerouslySetInnerHTML={{ __html: sanitize(data.ar) }} />
                )}
            </div>
        );
    };

    const isHighlighted = index === highlightedBlockIndex;
    const highlightClass = isHighlighted ? 'bg-yellow-500/10 -mx-4 px-4 rounded-lg border-l-4 border-yellow-500 transition-all duration-500' : '';

    const commonProps = {
        id: `block-${index}`,
        className: highlightClass
    };

    switch (block.type) {
        case 'subheading':
            const id = typeof block.data === 'string' ? block.data.replace(/\s+/g, '-').toLowerCase() : block.data.en.replace(/\s+/g, '-').toLowerCase();
            return (
                <div {...commonProps}>
                    <h2 id={id} className="text-2xl font-bold mt-10 mb-4 border-b border-border-color pb-2 text-primary-blue" dir="ltr">
                        {typeof block.data === 'string' ? block.data : (
                            <div className="flex flex-col">
                                <span>{block.data.en}</span>
                                {showTranslation && block.data.ar && <span className="text-lg text-text-secondary mt-1" dir="rtl">{block.data.ar}</span>}
                            </div>
                        )}
                    </h2>
                </div>
            );
        case 'paragraph':
            return <div {...commonProps} className={`text-lg text-text-secondary my-4 leading-relaxed ${highlightClass}`}>{renderText(block.data)}</div>;
        case 'ciscoTerminal':
            return (
                <div {...commonProps} className={`not-prose my-6 relative group ${highlightClass}`} dir="ltr">
                    <pre className="bg-black/80 rounded-lg border border-border-color font-mono text-base p-4 pt-8 overflow-x-auto text-left"><code className="text-green-400">{block.data}</code></pre>
                    <button onClick={() => handleCopy(block.data)} className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Copy size={12} /> Copy
                    </button>
                </div>
            );
        case 'note':
            return <div {...commonProps} className={`my-4 p-4 border-l-4 border-yellow-500 bg-yellow-500/10 text-yellow-200/90 rounded-r-lg ${highlightClass}`} dir="ltr">{renderText(block.data)}</div>;
        case 'orderedList':
            return (
                <div {...commonProps}>
                    <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-lg pl-4 marker:text-primary-blue" dir="ltr">
                        {block.data.map((item, i) => (
                            <li key={i} className="text-left">
                                {typeof item === 'string' ? <span dangerouslySetInnerHTML={{ __html: sanitize(item) }} /> : renderText(item)}
                            </li>
                        ))}
                    </ol>
                </div>
            );
        case 'videoEmbed':
            if (!block.data.url) return null;
            return (
                <div {...commonProps} className={`not-prose my-8 relative w-full pt-[56.25%] rounded-xl overflow-hidden border border-border-color bg-black ${highlightClass}`}>
                    <iframe src={block.data.url} title={block.data.caption} className="absolute top-0 left-0 w-full h-full" allowFullScreen></iframe>
                </div>
            );
        case 'image':
            if (!block.data.url) return null;
            return (
                <figure {...commonProps} className={`not-prose my-8 ${highlightClass}`}>
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

export default function MaterialClient({ material, topics, initialTopic, allMaterials }) {
    const { user, logout, logRecentTopic, togglePin } = useAuth();
    const { bookmarkedIds, toggleBookmark } = useBookmarks();
    const { completedIds, toggleComplete } = useProgress();

    const [selectedTopic, setSelectedTopic] = useState(initialTopic);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMaterialsMenuOpen, setIsMaterialsMenuOpen] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [highlightedBlockIndex, setHighlightedBlockIndex] = useState(-1);

    const dropdownRef = useRef(null);
    const materialsDropdownRef = useRef(null);
    const mainContentRef = useRef(null);
    const loggedTopicRef = useRef(null);

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        mainContentRef.current?.scrollTo(0, 0);
    };

    // Keyboard shortcut for search (Ctrl+K or Cmd+K) & Hash Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Handle Hash Navigation
        const hash = window.location.hash;
        if (hash && hash.startsWith('#block-')) {
            const index = parseInt(hash.replace('#block-', ''), 10);
            if (!isNaN(index)) {
                setHighlightedBlockIndex(index);
                // Wait for render
                setTimeout(() => {
                    const element = document.getElementById(`block-${index}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 500);
            }
        } else {
            setHighlightedBlockIndex(-1);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTopic]); // Re-run when topic changes

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (materialsDropdownRef.current && !materialsDropdownRef.current.contains(event.target)) {
                setIsMaterialsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const subheadings = selectedTopic?.content?.filter(block => block.type === 'subheading') || [];
    const isBookmarked = selectedTopic ? bookmarkedIds.includes(selectedTopic.id) : false;
    const isPinned = user?.recentlyViewed?.includes(selectedTopic.id);

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?topic=${selectedTopic.id}`;
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ رابط هذا الشرح!');
    };

    const handlePin = () => {
        if (!user) {
            toast.error('يجب تسجيل الدخول لتثبيت الدرس');
            return;
        }
        togglePin(selectedTopic.id);
    };

    const handleComplete = () => {
        if (!user) {
            toast.error('يجب تسجيل الدخول لتحديد الدرس كمكتمل');
            return;
        }
        const isNowCompleted = !completedIds.includes(selectedTopic.id);
        toggleComplete(selectedTopic.id);

        if (isNowCompleted) {
            toast.success('أحسنت! تم إكمال الدرس 🎉');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#388bfd', '#8A2BE2', '#ffffff']
            });
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen">
            <Toaster position="bottom-center" />

            {/* Header */}
            <header className={`flex-shrink-0 flex items-center justify-between border-b border-border-color py-4 px-6 bg-surface-dark z-20 transition-all duration-300 ${isFocusMode ? '-mt-20 opacity-0 pointer-events-none absolute w-full' : ''}`}>
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-3xl font-bold text-text-primary no-underline">Kawn<span className="text-primary-blue">Hub</span></Link>

                    {/* Materials Dropdown */}
                    {allMaterials && (
                        <div className="relative hidden md:block" ref={materialsDropdownRef}>
                            <button
                                onClick={() => setIsMaterialsMenuOpen(!isMaterialsMenuOpen)}
                                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
                            >
                                <span>{material.title}</span>
                                <ChevronDown size={14} className={`transition-transform ${isMaterialsMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMaterialsMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-border-color bg-surface-dark shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">مواد أخرى</div>
                                    {allMaterials.filter(m => m.slug !== material.slug).map(m => (
                                        <Link
                                            key={m.slug}
                                            href={`/materials/${m.slug}`}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-primary-blue/10 hover:text-primary-blue transition-colors"
                                        >
                                            <DynamicIcon name={m.icon} size={18} />
                                            <span className="text-sm font-medium">{m.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex items-center gap-4">
                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المواد الدراسية</Link>
                        <Link href="/lab" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المختبر 🧪</Link>
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                            <Link href="/admin" className="text-primary-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-primary-purple/10 px-3 py-1.5 rounded-lg border border-primary-purple/20">
                                <LayoutDashboard size={16} /> <span>الإدارة</span>
                            </Link>
                        )}
                        <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة"><HelpCircle size={20} /></Link>
                    </div>

                    <div className="h-6 w-px bg-border-color hidden md:block"></div>

                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors border border-transparent hover:border-border-color"
                        title="بحث (Ctrl+K)"
                    >
                        <Search size={18} />
                        <span className="hidden lg:inline text-xs opacity-70 border border-white/20 rounded px-1.5 py-0.5">Ctrl+K</span>
                    </button>

                    {/* Translation Toggle */}
                    <button
                        onClick={() => setShowTranslation(!showTranslation)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${showTranslation
                            ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20'
                            : 'bg-surface-light text-text-secondary hover:text-text-primary border border-border-color'
                            }`}
                        title="تفعيل الترجمة العربية للشرح"
                    >
                        <span className="font-mono">EN/AR</span>
                    </button>

                    {/* Focus Mode Button */}
                    <button
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="p-2 rounded-lg text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 transition-colors"
                        title="وضع التركيز"
                    >
                        <Maximize2 size={20} />
                    </button>

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

            {/* Exit Focus Mode Button */}
            {isFocusMode && (
                <button
                    onClick={() => setIsFocusMode(false)}
                    className="fixed top-4 left-4 z-50 p-2 rounded-full bg-surface-dark border border-border-color text-text-secondary hover:text-primary-blue shadow-lg animate-in fade-in zoom-in"
                    title="إنهاء وضع التركيز"
                >
                    <Minimize2 size={20} />
                </button>
            )}

            {/* Split View Container */}
            <div className={`flex-1 grid grid-cols-1 ${isFocusMode ? 'md:grid-cols-1' : 'md:grid-cols-4'} min-h-0 transition-all duration-300`}>

                {/* Sidebar (Right - RTL) */}
                <aside className={`border-l border-border-color bg-surface-dark h-full overflow-y-auto custom-scrollbar p-6 ${isFocusMode ? 'hidden' : 'md:col-span-1'}`}>
                    <div className="mb-4">
                        <DynamicIcon name={material.icon || 'BookOpen'} size={32} className="text-primary-blue" />
                    </div>
                    <h2 className="mb-1 text-2xl font-bold text-text-primary">{material.title}</h2>
                    <p className="mb-4 text-sm text-text-secondary">{material.courseCode}</p>
                    <hr className="border-border-color mb-4" />

                    <h3 className="font-bold mb-2 text-text-secondary uppercase text-xs tracking-wider">شروحات المادة</h3>
                    <ul className="space-y-2">
                        {topics.map((topic) => (
                            <li key={topic.id} className="flex items-center gap-1 p-1 hover:bg-white/5 rounded-lg transition-colors group">
                                <button
                                    onClick={() => toggleComplete(topic.id)}
                                    className={`shrink-0 p-1 rounded-full transition-colors ${completedIds.includes(topic.id) ? 'text-green-500' : 'text-text-secondary/30 hover:text-green-500/50'}`}
                                    title={completedIds.includes(topic.id) ? "مكتمل" : "تحديد كمكتمل"}
                                >
                                    {completedIds.includes(topic.id) ? <CheckCircle size={16} /> : <Circle size={16} />}
                                </button>

                                <Link
                                    href={`/materials/${material.slug}?topic=${topic.id}`}
                                    onClick={() => handleTopicSelect(topic)}
                                    className={`flex-1 text-right text-sm truncate py-1 ${selectedTopic?.id === topic.id ? 'text-primary-blue font-bold' : 'text-text-secondary group-hover:text-text-primary'}`}
                                >
                                    {topic.title}
                                </Link>

                                <button
                                    onClick={() => toggleBookmark(topic.id)}
                                    title="حفظ"
                                    className={`p-1 rounded-md ${bookmarkedIds.includes(topic.id) ? 'text-yellow-400' : 'text-text-secondary/30 hover:text-yellow-400'}`}
                                >
                                    <Bookmark size={14} fill={bookmarkedIds.includes(topic.id) ? 'currentColor' : 'none'} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main Content (Left - LTR for English Content) */}
                <main className={`bg-background-dark h-full overflow-y-auto custom-scrollbar relative ${isFocusMode ? 'col-span-1' : 'md:col-span-3'}`} ref={mainContentRef}>
                    <div className="max-w-4xl mx-auto p-8 pb-32">
                        {/* Topic Header */}
                        <div className="mb-8 pb-8 border-b border-border-color">
                            <div className="flex items-center gap-3 text-sm text-text-secondary mb-4">
                                <span className="bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full font-bold">{material.title}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(selectedTopic.updatedAt).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <h1 className="text-4xl font-extrabold text-text-primary leading-tight" dir="ltr">{selectedTopic.title}</h1>
                                <div className="flex gap-2">
                                    <button onClick={handlePin} className={`p-2 rounded-lg border transition-colors ${isPinned ? 'bg-primary-blue text-white border-primary-blue' : 'bg-surface-dark border-border-color text-text-secondary hover:text-primary-blue'}`} title={isPinned ? "إلغاء التثبيت" : "تثبيت الدرس"}>
                                        <Pin size={20} fill={isPinned ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={handleShare} className="p-2 rounded-lg bg-surface-dark border border-border-color text-text-secondary hover:text-primary-blue transition-colors" title="مشاركة">
                                        <Share2 size={20} />
                                    </button>
                                    <button onClick={() => toggleBookmark(selectedTopic.id)} className={`p-2 rounded-lg border transition-colors ${isBookmarked ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-surface-dark border-border-color text-text-secondary hover:text-yellow-400'}`} title="حفظ">
                                        <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table of Contents (Subheadings) */}
                        {subheadings.length > 0 && (
                            <div className="mb-10 p-6 bg-surface-dark rounded-xl border border-border-color">
                                <h3 className="text-lg font-bold mb-4 text-text-primary flex items-center gap-2">
                                    <LayoutDashboard size={20} className="text-primary-blue" />
                                    محتويات الشرح
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    {subheadings.map((block, i) => {
                                        const id = typeof block.data === 'string' ? block.data.replace(/\s+/g, '-').toLowerCase() : block.data.en.replace(/\s+/g, '-').toLowerCase();
                                        const text = typeof block.data === 'string' ? block.data : block.data.en;
                                        return (
                                            <a key={i} href={`#${id}`} className="text-text-secondary hover:text-primary-blue transition-colors text-sm flex items-center gap-2 group" dir="ltr">
                                                <span className="w-1.5 h-1.5 rounded-full bg-border-color group-hover:bg-primary-blue transition-colors"></span>
                                                {text}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Content Blocks */}
                        <div className="prose prose-invert max-w-none">
                            {selectedTopic.content?.map((block, index) => (
                                <BlockRenderer
                                    key={index}
                                    index={index}
                                    block={block}
                                    showTranslation={showTranslation}
                                    highlightedBlockIndex={highlightedBlockIndex}
                                />
                            ))}
                        </div>

                        {/* Completion Button */}
                        <div className="mt-16 mb-8 flex justify-center">
                            <button
                                onClick={handleComplete}
                                className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 overflow-hidden ${completedIds.includes(selectedTopic.id)
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'
                                    : 'bg-primary-blue text-white shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 hover:scale-105'
                                    }`}
                            >
                                {completedIds.includes(selectedTopic.id) ? (
                                    <>
                                        <CheckCircle size={24} className="animate-in zoom-in spin-in-90 duration-300" />
                                        <span>تم إكمال الدرس</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <CheckCircle size={24} />
                                        <span>تحديد كمكتمل</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Navigation Footer */}
                        <div className="mt-16 pt-8 border-t border-border-color flex justify-between items-center">
                            {(() => {
                                const currentIndex = topics.findIndex(t => t.id === selectedTopic.id);
                                const prevTopic = topics[currentIndex - 1];
                                const nextTopic = topics[currentIndex + 1];

                                return (
                                    <>
                                        {prevTopic ? (
                                            <Link
                                                href={`/materials/${material.slug}?topic=${prevTopic.id}`}
                                                onClick={() => handleTopicSelect(prevTopic)}
                                                className="flex items-center gap-3 text-text-secondary hover:text-primary-blue transition-colors group"
                                            >
                                                <div className="p-2 rounded-full bg-surface-dark border border-border-color group-hover:border-primary-blue transition-colors">
                                                    <ArrowRight size={20} className="rotate-180" />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-text-secondary/50">السابق</div>
                                                    <div className="font-bold">{prevTopic.title}</div>
                                                </div>
                                            </Link>
                                        ) : <div></div>}

                                        {nextTopic ? (
                                            <Link
                                                href={`/materials/${material.slug}?topic=${nextTopic.id}`}
                                                onClick={() => handleTopicSelect(nextTopic)}
                                                className="flex items-center gap-3 text-text-secondary hover:text-primary-blue transition-colors group"
                                            >
                                                <div className="text-left">
                                                    <div className="text-xs text-text-secondary/50">التالي</div>
                                                    <div className="font-bold">{nextTopic.title}</div>
                                                </div>
                                                <div className="p-2 rounded-full bg-surface-dark border border-border-color group-hover:border-primary-blue transition-colors">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </Link>
                                        ) : <div></div>}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </main>
            </div>

            {/* Search Dialog */}
            <SearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                topics={topics}
                onSelectTopic={(topic) => {
                    handleTopicSelect(topic);
                    setIsSearchOpen(false);
                }}
            />
        </div>
    );
}