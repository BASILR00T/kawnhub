'use client';
// Force recompile

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
    CheckCircle, Circle, Maximize2, Minimize2, Search, Terminal
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import SearchDialog from './SearchDialog';
import confetti from 'canvas-confetti';

// Helper to group terminal blocks
const processContentBlocks = (blocks) => {
    if (!blocks) return [];
    const processed = [];
    let currentGroup = null;

    for (const block of blocks) {
        if (block.type === 'terminal_command' || block.type === 'terminal_output') {
            if (!currentGroup) {
                // Determine style from the first command block (if available)
                let groupStyle = 'linux'; // Default
                if (block.type === 'terminal_command') {
                    if (typeof block.data === 'object' && block.data.style) {
                        groupStyle = block.data.style;
                    }
                }

                currentGroup = {
                    type: 'terminal_group',
                    style: groupStyle,
                    data: []
                };
                processed.push(currentGroup);
            }
            // Update style if a subsequent command has a specific style (optional, usually consistent)
            if (block.type === 'terminal_command' && typeof block.data === 'object' && block.data.style) {
                currentGroup.style = block.data.style;
            }

            currentGroup.data.push(block);
        } else {
            currentGroup = null;
            processed.push(block);
        }
    }
    return processed;
};

// --- BlockRenderer Component ---
const BlockRenderer = ({ block, index, showTranslation, highlightedBlockIndex }) => {
    // Helper to clean command output (remove prompts and comments)
    const cleanCommandOutput = (text) => {
        if (!text) return '';
        const lines = text.split('\n');
        const commands = [];

        // Regex for prompts:
        // [root@...] or [user@...] followed by # or $
        // Switch> or Router#
        // C:\...>
        const promptRegex = /^(\[.*?\][#$]|[\w-]+[>#]|[A-Z]:\\.*>)\s*(.*)/;

        let hasPrompt = false;

        for (const line of lines) {
            const match = line.match(promptRegex);
            if (match) {
                hasPrompt = true;
                let cmd = match[2];

                // Remove comments (starting with " #")
                const commentIndex = cmd.indexOf(' #');
                if (commentIndex !== -1) {
                    cmd = cmd.substring(0, commentIndex);
                }

                cmd = cmd.trim();
                if (cmd) commands.push(cmd);
            }
        }

        // If no prompts were found, return original text (it might be just a list of commands)
        if (!hasPrompt) return text;

        return commands.join('\n');
    };

    const handleCopy = (code) => {
        const cleanCode = cleanCommandOutput(code);
        navigator.clipboard.writeText(cleanCode);
        toast.success('تم نسخ الأمر بنجاح!');
    };

    const handleRawCopy = (text) => {
        navigator.clipboard.writeText(text);
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

        case 'terminal_group':
            // Extract only commands for Copy/Run
            const rawCommands = block.data
                .filter(b => b.type === 'terminal_command')
                .map(b => typeof b.data === 'object' ? b.data.cmd : b.data)
                .join('\n');

            // Determine styles based on group style
            const style = block.style || 'linux';
            let containerClass = "bg-black border-gray-700"; // Linux default (matched to Admin)
            let prompt = "$";
            let promptClass = "text-green-400";
            let cmdClass = "text-gray-100";
            let outputClass = "text-gray-400";
            let headerTitle = "Terminal";
            let isWindows = false;

            if (style === 'cmd') {
                containerClass = "bg-black border-gray-600";
                prompt = ">";
                promptClass = "text-gray-100";
                cmdClass = "text-gray-100";
                outputClass = "text-gray-300";
                headerTitle = "Command Prompt";
                isWindows = true;
            } else if (style === 'powershell') {
                containerClass = "bg-[#012456] border-blue-800";
                prompt = "PS>";
                promptClass = "text-white";
                cmdClass = "text-yellow-200";
                outputClass = "text-gray-200";
                headerTitle = "Administrator: Windows PowerShell";
                isWindows = true;
            } else if (style === 'cisco') {
                containerClass = "bg-black border-gray-700";
                prompt = "#";
                promptClass = "text-gray-300";
                cmdClass = "text-white font-bold";
                outputClass = "text-gray-300";
                headerTitle = "Cisco IOS";
                isWindows = false;
            }

            return (
                <div {...commonProps} className={`not-prose my-8 relative group rounded-lg overflow-hidden border shadow-2xl w-full text-left direction-ltr ${containerClass}`} dir="ltr">
                    {/* Terminal Header */}
                    <div className={`flex items-center justify-between px-4 py-2 ${isWindows ? 'bg-white text-black h-8' : 'bg-[#333] text-gray-300 h-8 border-b border-gray-600'}`}>
                        <div className="flex items-center gap-2">
                            {isWindows ? (
                                <div className="text-xs font-sans select-none font-bold">{headerTitle}</div>
                            ) : (
                                <>
                                    <Terminal size={12} className="text-gray-400" />
                                    <div className="text-xs font-mono select-none">{headerTitle}</div>
                                </>
                            )}
                        </div>

                        {/* Window Controls */}
                        <div className="flex items-center gap-3 opacity-70">
                            {isWindows ? (
                                <>
                                    <div className="w-3 h-0.5 bg-black/50"></div> {/* Minimize */}
                                    <div className="w-3 h-3 border border-black/50"></div> {/* Maximize */}
                                    <div className="text-sm leading-none font-bold text-black/50">✕</div> {/* Close */}
                                </>
                            ) : (
                                <>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500/50"></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-4 font-mono text-sm overflow-x-auto custom-scrollbar" style={{ direction: 'ltr', textAlign: 'left' }}>
                        {block.data.map((subBlock, i) => {
                            const content = typeof subBlock.data === 'object' ? subBlock.data.cmd : subBlock.data;
                            if (subBlock.type === 'terminal_command') {
                                return (
                                    <div key={i} className="flex gap-2 mb-1">
                                        <span className={`select-none shrink-0 ${promptClass}`}>{prompt}</span>
                                        <span className={cmdClass}>{content}</span>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={i} className={`mb-2 whitespace-pre-wrap ${outputClass}`}>
                                        {content}
                                    </div>
                                );
                            }
                        })}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-10 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Link
                            href={`/lab?command=${encodeURIComponent(rawCommands)}`}
                            target="_blank"
                            className="bg-primary-blue text-white px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-primary-blue/90 transition-colors shadow-lg"
                            title="Run in Lab"
                        >
                            <Terminal size={12} /> Run
                        </Link>
                        <button onClick={() => handleRawCopy(rawCommands)} className="bg-white/10 backdrop-blur text-white px-2 py-1 text-xs rounded hover:bg-white/20 transition-colors flex items-center gap-1 shadow-lg border border-white/5">
                            <Copy size={12} /> Copy
                        </button>
                    </div>
                </div>
            );

        case 'ciscoTerminal':
            const cleanCode = cleanCommandOutput(block.data);
            return (
                <div {...commonProps} className={`not-prose my-6 relative group ${highlightClass}`} dir="ltr">
                    <pre className="bg-black/80 rounded-lg border border-border-color font-mono text-base p-4 pt-8 overflow-x-auto text-left"><code className="text-green-400">{block.data}</code></pre>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                            href={`/lab?command=${encodeURIComponent(cleanCode)}`}
                            target="_blank"
                            className="bg-primary-blue text-white px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-primary-blue/90 transition-colors"
                            title="Run in Lab"
                        >
                            <Terminal size={12} /> Run
                        </Link>
                        <button onClick={() => handleCopy(block.data)} className="bg-gray-700 text-white px-2 py-1 text-xs rounded hover:bg-gray-600 transition-colors flex items-center gap-1">
                            <Copy size={12} /> Copy
                        </button>
                    </div>
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
                <div {...commonProps} className={`not-prose my-8 ${highlightClass}`}>
                    <img src={block.data.url} alt={block.data.caption || 'KawnHub Image'} className="w-full rounded-xl border border-border-color bg-black/20" />
                    <div className="text-center text-sm text-text-secondary mt-2">{block.data.caption}</div>
                </div>
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

    // Process content blocks to group terminals
    const processedContent = React.useMemo(() => {
        return processContentBlocks(selectedTopic?.content);
    }, [selectedTopic]);

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

                <div className="flex items-center gap-4">
                    {/* Search Trigger */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors bg-surface-dark border border-border-color px-3 py-1.5 rounded-lg text-sm"
                    >
                        <Search size={16} />
                        <span className="hidden md:inline">بحث...</span>
                        <kbd className="hidden md:inline-block text-[10px] font-mono bg-background-dark border border-border-color px-1.5 py-0.5 rounded text-text-secondary">⌘K</kbd>
                    </button>

                    <div className="h-6 w-px bg-border-color hidden md:block"></div>

                    <nav className="flex items-center gap-4">
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المواد الدراسية</Link>
                            <Link href="/lab" className="text-text-secondary transition-colors hover:text-text-primary font-medium text-sm">المختبر 🧪</Link>
                            {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner') && (
                                <Link href="/admin" className="text-primary-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-primary-purple/10 px-3 py-1.5 rounded-lg border border-primary-purple/20">
                                    <LayoutDashboard size={16} /> <span>الإدارة</span>
                                </Link>
                            )}
                            <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة"><HelpCircle size={20} /></Link>
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-blue/20">
                                    {user && user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-border-color bg-surface-dark shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-3 border-b border-border-color mb-2">
                                                <div className="font-bold text-text-primary truncate">{user.name}</div>
                                                <div className="text-xs text-text-secondary truncate">{user.email}</div>
                                            </div>
                                            <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                                                <User size={16} /> الملف الشخصي
                                            </Link>
                                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-right">
                                                <LogOut size={16} /> تسجيل الخروج
                                            </button>
                                        </>
                                    ) : (
                                        <Link href="/login" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                                            <LogIn size={16} /> تسجيل الدخول
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            {/* Search Dialog */}
            <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar (Right - RTL) */}
                <aside className={`w-80 bg-surface-dark border-l border-border-color flex-shrink-0 flex flex-col transition-all duration-300 ${isFocusMode ? '-mr-80 opacity-0' : ''}`}>
                    <div className="p-4 border-b border-border-color flex justify-between items-center">
                        <h2 className="font-bold text-text-primary">محتويات المادة</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTranslation(!showTranslation)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${showTranslation ? 'bg-primary-blue/20 text-primary-blue border-primary-blue/30' : 'bg-transparent text-text-secondary border-border-color'}`}
                                title="تبديل الترجمة"
                            >
                                {showTranslation ? 'EN/AR' : 'EN'}
                            </button>
                            <button onClick={() => setIsFocusMode(true)} className="text-text-secondary hover:text-primary-blue transition-colors" title="وضع التركيز">
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>
                    <ul className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar" dir="rtl">
                        {topics.map((topic) => (
                            <li key={topic.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${selectedTopic?.id === topic.id ? 'bg-primary-blue/10 border border-primary-blue/20' : 'hover:bg-white/5 border border-transparent'}`}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleComplete(topic.id); }}
                                    className={`flex-shrink-0 transition-colors ${completedIds.includes(topic.id) ? 'text-green-500' : 'text-text-secondary group-hover:text-text-primary'}`}
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
                <main className={`bg-background-dark h-full overflow-y-auto custom-scrollbar relative w-full ${isFocusMode ? 'col-span-1' : 'md:col-span-3'}`} ref={mainContentRef}>
                    <div className="max-w-4xl mx-auto p-8 pb-32 w-full text-left" dir="ltr">
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
                            {processedContent?.map((block, index) => (
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
                                        <Circle size={24} />
                                        <span>تحديد كمكتمل</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center pt-8 border-t border-border-color">
                            {/* Previous Topic */}
                            {topics.findIndex(t => t.id === selectedTopic.id) > 0 ? (
                                <Link
                                    href={`/materials/${material.slug}?topic=${topics[topics.findIndex(t => t.id === selectedTopic.id) - 1].id}`}
                                    onClick={() => handleTopicSelect(topics[topics.findIndex(t => t.id === selectedTopic.id) - 1])}
                                    className="flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors group"
                                >
                                    <div className="p-2 rounded-full bg-surface-dark border border-border-color group-hover:border-primary-blue/50 transition-colors">
                                        <ArrowRight size={16} className="rotate-180" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-text-secondary/50">الدرس السابق</div>
                                        <div className="font-bold text-sm">{topics[topics.findIndex(t => t.id === selectedTopic.id) - 1].title}</div>
                                    </div>
                                </Link>
                            ) : <div></div>}

                            {/* Next Topic */}
                            {topics.findIndex(t => t.id === selectedTopic.id) < topics.length - 1 ? (
                                <Link
                                    href={`/materials/${material.slug}?topic=${topics[topics.findIndex(t => t.id === selectedTopic.id) + 1].id}`}
                                    onClick={() => handleTopicSelect(topics[topics.findIndex(t => t.id === selectedTopic.id) + 1])}
                                    className="flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors group text-left"
                                >
                                    <div className="text-left">
                                        <div className="text-xs text-text-secondary/50">الدرس التالي</div>
                                        <div className="font-bold text-sm">{topics[topics.findIndex(t => t.id === selectedTopic.id) + 1].title}</div>
                                    </div>
                                    <div className="p-2 rounded-full bg-surface-dark border border-border-color group-hover:border-primary-blue/50 transition-colors">
                                        <ArrowRight size={16} />
                                    </div>
                                </Link>
                            ) : <div></div>}
                        </div>
                    </div>

                    {/* Focus Mode Exit Button */}
                    {isFocusMode && (
                        <button
                            onClick={() => setIsFocusMode(false)}
                            className="fixed bottom-8 right-8 bg-primary-blue text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                            title="خروج من وضع التركيز"
                        >
                            <Minimize2 size={24} />
                        </button>
                    )}
                </main>
            </div>
        </div>
    );
}