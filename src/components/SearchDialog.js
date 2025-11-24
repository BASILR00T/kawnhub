'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, FileText, ChevronRight, Hash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchTopics } from '@/app/actions/search';

export default function SearchDialog({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleSearch = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const data = await searchTopics(query);
                setResults(data);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(handleSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    navigateToTopic(results[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const navigateToTopic = (topic) => {
        onClose();
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Dialog */}
            <div className="relative w-full max-w-2xl bg-surface-dark border border-border-color rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Search Input */}
                <div className="flex items-center border-b border-border-color px-4 py-4">
                    <Search className="text-text-secondary w-5 h-5 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="ابحث عن درس أو موضوع... (systeminfo, routing, etc.)"
                        className="flex-1 bg-transparent border-none outline-none text-lg text-text-primary placeholder:text-text-secondary/50"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        dir="auto"
                    />
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-primary-blue animate-spin ml-2" />
                    ) : query && (
                        <button onClick={() => setQuery('')} className="text-text-secondary hover:text-text-primary">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => navigateToTopic(result)}
                                    className={`w-full flex flex-col items-end px-4 py-3 rounded-lg text-right transition-colors ${index === selectedIndex
                                        ? 'bg-primary-blue/10'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        {index === selectedIndex && <ChevronRight size={16} className="text-primary-blue" />}
                                        <div className="flex items-center gap-3 ml-auto">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-medium ${index === selectedIndex ? 'text-primary-blue' : 'text-text-primary'}`}>
                                                    <HighlightedText text={result.title} highlight={query} />
                                                </span>
                                                {result.snippet && (
                                                    <span className="text-xs text-text-secondary mt-1 line-clamp-1" dir="ltr">
                                                        <HighlightedText text={result.snippet} highlight={query} />
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-primary-blue/20 text-primary-blue' : 'bg-surface-light text-text-secondary'}`}>
                                                {result.blockIndex !== -1 ? <Hash size={18} /> : <FileText size={18} />}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.trim().length >= 2 && !isLoading ? (
                        <div className="text-center py-10 text-text-secondary">
                            <p>لا توجد نتائج لـ "{query}"</p>
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-text-secondary/50 text-sm">
                            <p>اكتب للبحث في جميع المواد</p>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <kbd className="px-2 py-1 bg-white/5 rounded text-xs font-mono border border-white/10">↑</kbd>
                                <kbd className="px-2 py-1 bg-white/5 rounded text-xs font-mono border border-white/10">↓</kbd>
                                <span>للتنقل</span>
                                <kbd className="px-2 py-1 bg-white/5 rounded text-xs font-mono border border-white/10 ml-2">Enter</kbd>
                                <span>للاختيار</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-surface-light border-t border-border-color px-4 py-2 text-xs text-text-secondary flex justify-between items-center">
                    <span>KawnHub Search</span>
                    <span className="font-mono text-[10px] opacity-50">ESC to close</span>
                </div>
            </div>
        </div>
    );
}
