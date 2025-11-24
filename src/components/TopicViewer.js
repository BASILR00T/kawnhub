'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import DOMPurify from 'isomorphic-dompurify';
import { Bookmark, Share2, Clock, Pin } from 'lucide-react';
import toast from 'react-hot-toast';

// --- مكون عرض البلوكات (مبسط للعرض فقط) ---
const BlockRenderer = ({ block }) => {
    const sanitize = (html) => DOMPurify.sanitize(html);

    switch (block.type) {
        case 'subheading': return <h2 className="text-2xl font-bold mt-8 mb-4 text-primary-blue border-b border-border-color pb-2">{block.data}</h2>;
        case 'paragraph': return <p className="text-lg text-text-secondary my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} />;
        case 'ciscoTerminal': return <div className="my-6 rounded-lg overflow-hidden border border-border-color bg-[#0d1117] shadow-2xl"><div className="flex gap-2 px-4 py-2 bg-white/5 border-b border-white/5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div><pre className="p-4 overflow-x-auto text-sm font-mono text-green-400 selection:bg-green-900 selection:text-white"><code>{block.data}</code></pre></div>;
        case 'note': return <div className="my-6 p-4 border-r-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg text-yellow-200/90" dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} />;
        case 'orderedList': return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary pl-4 marker:text-primary-blue font-medium">{block.data.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: sanitize(item) }} />)}</ol>;
        case 'videoEmbed': if (!block.data.url) return null; return <div className="my-8 rounded-xl overflow-hidden border border-border-color bg-black aspect-video"><iframe src={block.data.url} title={block.data.caption} className="w-full h-full" allowFullScreen></iframe></div>;
        case 'image': if (!block.data.url) return null; return <figure className="my-8"><img src={block.data.url} alt={block.data.caption} className="w-full rounded-xl border border-border-color bg-black/20" /><figcaption className="text-center text-sm text-text-secondary mt-2">{block.data.caption}</figcaption></figure>;
        default: return null;
    }
};

export default function TopicViewer({ topic }) {
    const { user, logRecentTopic } = useAuth();
    const { bookmarkedIds, toggleBookmark } = useBookmarks();
    const isBookmarked = bookmarkedIds.includes(topic.id);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط!');
    };

    const handlePin = () => {
        if (!user) {
            toast.error('يجب تسجيل الدخول لتثبيت الدرس');
            return;
        }
        logRecentTopic(topic.id);
        toast.success('تم تثبيت الدرس في "أكمل من حيث توقفت"');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8 pb-8 border-b border-border-color">
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-4">
                    <span className="bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full font-bold">
                        {topic.materialSlug}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={14} /> {new Date(topic.updatedAt).toLocaleDateString('ar-EG')}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h1 className="text-4xl font-extrabold text-text-primary leading-tight">
                        {topic.title}
                    </h1>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePin}
                            className="p-3 rounded-xl bg-surface-dark border border-border-color text-text-secondary hover:text-primary-blue hover:border-primary-blue transition-all"
                            title="تثبيت الدرس (أكمل من حيث توقفت)"
                        >
                            <Pin size={20} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-3 rounded-xl bg-surface-dark border border-border-color text-text-secondary hover:text-text-primary hover:border-primary-blue transition-all"
                            title="مشاركة"
                        >
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={() => toggleBookmark(topic.id)}
                            className={`p-3 rounded-xl border transition-all ${isBookmarked
                                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20'
                                    : 'bg-surface-dark border-border-color text-text-secondary hover:text-yellow-400 hover:border-yellow-400'
                                }`}
                            title={isBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        >
                            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none pb-20">
                {topic.content?.map((block) => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        </div>
    );
}