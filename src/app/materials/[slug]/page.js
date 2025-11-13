'use client'; 
import DOMPurify from 'isomorphic-dompurify';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';


// --- Reusable Icon Components ---
const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const ArrowLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>);


// --- Block Renderer Component (Final Version) ---
const BlockRenderer = ({ block }) => {
    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('تم نسخ الأمر بنجاح!');
    };
    const sanitize = (html) => DOMPurify.sanitize(html);
    switch (block.type) {
        case 'paragraph':
            return (
               <p 
                 className="..." 
                 // ✅ الآن النص آمن حتى لو احتوى على <script>
                 dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} 
               />
            );
        case 'note':
             return (
                <div 
                  className="..." 
                  dangerouslySetInnerHTML={{ __html: sanitize(block.data.en) }} 
                />
             );
        case 'subheading':
            const id = block.data.replace(/\s+/g, '-').toLowerCase();
            return <h2 id={id} className="text-2xl font-bold mt-10 mb-4 border-b border-border-color pb-2">{block.data}</h2>;
        
        case 'paragraph':
            return <p className="text-lg text-text-secondary my-4 leading-relaxed">{block.data.en}</p>;
            
        case 'ciscoTerminal':
            return (
                <div className="my-6 relative group">
                    <pre className="bg-black/80 rounded-lg border border-border-color font-mono text-base p-4 pt-8 overflow-x-auto"><code className="text-green-400">{block.data}</code></pre>
                    <button onClick={() => handleCopy(block.data)} className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <CopyIcon /> نسخ
                    </button>
                </div>
            );
            
        case 'note':
            return <div className="my-4 p-4 border-r-4 border-red-500 bg-red-500/10 text-red-300 rounded-r-lg">{block.data.en}</div>;
            
        case 'orderedList':
            return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-lg pl-4">{block.data.map((item, i) => <li key={i}>{item}</li>)}</ol>;
            
       case 'videoEmbed':
        return (
            <div className="my-8 max-w-4xl mx-auto">
                <div className="aspect-w-16 aspect-h-9">
                    <iframe 
                        src={block.data.url} 
                        title={block.data.caption} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                        className="w-full h-full rounded-lg shadow-lg"
                    ></iframe>
                </div>
                {block.data.caption && <p className="text-center text-sm text-text-secondary mt-2">{block.data.caption}</p>}
            </div>
    );
            
        default: return null;
    }
};

// --- Loading Skeleton Component ---
const SkeletonLoader = () => (
    <div className="animate-pulse">
        <div className="h-10 bg-surface-dark rounded w-3/4 mb-8"></div>
        <div className="space-y-4">
            <div className="h-6 bg-surface-dark rounded w-full"></div>
            <div className="h-6 bg-surface-dark rounded w-5/6"></div>
            <div className="h-24 bg-surface-dark rounded mt-6"></div>
            <div className="h-6 bg-surface-dark rounded w-full mt-6"></div>
        </div>
    </div>
);


export default function MaterialPage() {
    const params = useParams();
    const { slug } = params;
    
    const [material, setMaterial] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Extract subheadings for the smart Table of Contents
    const subheadings = selectedTopic?.content?.filter(block => block.type === 'subheading') || [];

    useEffect(() => {
        if (!slug) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const matQuery = query(collection(db, 'materials'), where('slug', '==', slug));
                const matSnapshot = await getDocs(matQuery);
                if (!matSnapshot.empty) setMaterial(matSnapshot.docs[0].data());

                const topicsQuery = query(collection(db, 'topics'), where('materialSlug', '==', slug), orderBy('order', 'asc'));
                const topicsSnapshot = await getDocs(topicsQuery);
                const topicsList = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTopics(topicsList);

                if (topicsList.length > 0) setSelectedTopic(topicsList[0]);
            } catch (error) {
                console.error("Error fetching data: ", error)
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    if (isLoading) {
        // ... (Return loading skeletons for a better UX)
        return <div className="mx-auto max-w-7xl p-6"><SkeletonLoader /></div>;
    }

    if (!material) return <p className="text-center p-10">المادة غير موجودة.</p>;

    return (
        <div className="mx-auto max-w-7xl p-6 font-sans">
            
            <header className="mb-8 flex items-center justify-between border-b border-border-color py-4">
                <Link href="/hub" className="text-3xl font-bold text-text-primary no-underline">Kawn<span className="text-primary-blue">Hub</span></Link>
                <nav><Link href="/hub" className="flex items-center gap-2 font-medium text-text-secondary transition-colors hover:text-text-primary"><ArrowLeftIcon /><span>العودة للمنصة</span></Link></nav>
            </header>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                <aside className="md:col-span-1">
                    <div className="sticky top-8">
                        <h2 className="mb-1 text-2xl font-bold text-text-primary">{material.title}</h2>
                        <p className="mb-4 text-sm text-text-secondary">{material.courseCode}</p>
                        <hr className="border-border-color mb-4" />
                        
                        {/* Smart Table of Contents */}
                        <h3 className="font-bold mb-2">محتويات الشرح</h3>
                        <ul className="space-y-2">
                           {subheadings.map((sub, i) => (
                               <li key={i}>
                                   <a href={`#${sub.data.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm block text-text-secondary hover:text-primary-blue transition-colors">
                                       {sub.data}
                                   </a>
                               </li>
                           ))}
                        </ul>

                        <hr className="border-border-color my-6" />

                        <h3 className="font-bold mb-2">شروحات أخرى</h3>
                        <ul className="space-y-3">
                            {topics.map((topic) => (
                                <li key={topic.id}>
                                    <button onClick={() => setSelectedTopic(topic)} className={`w-full text-right rounded-md p-2 transition-colors text-sm ${selectedTopic?.id === topic.id ? 'bg-primary-blue/10 text-primary-blue font-bold' : 'text-text-secondary hover:bg-surface-dark hover:text-text-primary'}`}>
                                        {topic.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                <main className="md:col-span-3">
                    {selectedTopic ? (
                        <div>
                             <h1 className="mb-6 text-4xl font-bold text-text-primary border-b border-border-color pb-4">
                                {selectedTopic.title}
                             </h1>
                             {selectedTopic.content.map((block, index) => (
                                <BlockRenderer key={index} block={block} />
                             ))}
                        </div>
                    ) : ( <p className="text-lg text-text-secondary">لا توجد شروحات لهذه المادة حاليًا.</p> )}
                </main>
            </div>
        </div>
    );
}