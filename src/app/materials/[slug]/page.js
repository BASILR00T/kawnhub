'use client'; // الخطوة 1: نحول الصفحة إلى Client Component

import React, { useState, useEffect } from 'react'; // نستورد أدوات التفاعل
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// --- Reusable Component to Render Content Blocks (No changes) ---
const ContentBlock = ({ block }) => {
    switch (block.type) {
        case 'subheading': //  كيفية عرض العنوان الفرعي
            return <h3 className="text-2xl font-bold mt-8 mb-4 border-b border-border-color pb-2">{block.data}</h3>;
        case 'paragraph':
            return <p className="text-lg text-text-secondary">{block.data.en}</p>;
        case 'ciscoTerminal':
            return (
                <div className="my-6 overflow-hidden rounded-lg border border-border-color bg-black/80 font-mono text-base">
                    <div className="border-b border-border-color bg-surface-dark p-2 text-xs text-text-secondary">
                        Terminal
                    </div>
                    <pre className="overflow-x-auto p-4">
                        <code className="text-green-400">{block.data}</code>
                    </pre>
                </div>
            );
        default:
            return null;
    }
};

export default function MaterialPage({ params }) {
    const { slug } = params;
    
    // --- State Management ---
    const [material, setMaterial] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null); // الخطوة 2: حالة لتخزين الشرح المحدد
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all data on component load
    useEffect(() => {
        const fetchData = async () => {
            // Fetch material details
            const matQuery = query(collection(db, 'materials'), where('slug', '==', slug));
            const matSnapshot = await getDocs(matQuery);
            if (!matSnapshot.empty) {
                setMaterial(matSnapshot.docs[0].data());
            }

            // Fetch topics for the material
            const topicsQuery = query(collection(db, 'topics'), where('materialSlug', '==', slug), orderBy('order', 'asc'));
            const topicsSnapshot = await getDocs(topicsQuery);
            const topicsList = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTopics(topicsList);

            // Set the first topic as the selected one initially
            if (topicsList.length > 0) {
                setSelectedTopic(topicsList[0]);
            }
            
            setIsLoading(false);
        };

        fetchData();
    }, [slug]);

    if (isLoading) {
        return <p className="text-center p-10">جاري تحميل محتوى المادة...</p>;
    }

    if (!material) {
        return <p className="text-center p-10">المادة غير موجودة.</p>;
    }

    return (
        <div className="mx-auto max-w-7xl p-6 font-sans">
            {/* ... Header (No Changes) ... */}
            <header className="mb-8 flex items-center justify-between border-b border-border-color py-4"> <Link href="/hub" className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </Link> <nav> <Link href="/hub" className="flex items-center gap-2 font-medium text-text-secondary transition-colors hover:text-text-primary"> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> <span>العودة للمنصة</span> </Link> </nav> </header>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                {/* --- Interactive Sidebar --- */}
                <aside className="md:col-span-1">
                    <div className="sticky top-8">
                        <h2 className="mb-1 text-2xl font-bold text-text-primary">{material.title}</h2>
                        <p className="mb-4 text-sm text-text-secondary">{material.courseCode}</p>
                        <hr className="border-border-color mb-4" />
                        <ul className="space-y-3">
                            {topics.map((topic) => (
                                <li key={topic.id}>
                                    {/* الخطوة 3: الزر يغير الشرح المحدد */}
                                    <button 
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`block w-full text-right rounded-md p-2 transition-colors ${selectedTopic?.id === topic.id ? 'bg-primary-blue/10 text-primary-blue font-bold' : 'text-text-secondary hover:bg-surface-dark hover:text-text-primary'}`}
                                    >
                                        {topic.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* --- Dynamic Main Content --- */}
                <main className="md:col-span-3">
                    <div className="prose prose-invert max-w-none">
                        {/* الخطوة 4: نعرض محتوى الشرح المحدد */}
                        {selectedTopic ? (
                            <>
                                <h1 className="mb-4 text-4xl font-bold text-text-primary">
                                   {selectedTopic.title}
                                </h1>
                                {selectedTopic.content.map((block, index) => (
                                    <ContentBlock key={index} block={block} />
                                ))}
                            </>
                        ) : (
                            <p className="text-lg text-text-secondary">
                                لا توجد شروحات لهذه المادة حاليًا.
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}