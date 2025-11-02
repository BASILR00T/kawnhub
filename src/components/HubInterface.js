'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ArrowRight, Computer } from 'lucide-react'; // نستورد أيقونات أساسية فقط
import * as LucideIcons from 'lucide-react'; // نستورد كل الأيقونات

// --- المكون الديناميكي الجديد ---
const DynamicIcon = ({ name, ...props }) => {
    //  نبحث عن الأيقونة بالاسم في المكتبة
    const IconComponent = LucideIcons[name];

    if (!IconComponent) {
        //  إذا لم نجدها (أو كان الاسم خطأ)، نعرض أيقونة افتراضية
        return <Computer {...props} />;
    }

    return <IconComponent {...props} />;
};
// --- نهاية المكون الجديد ---


const BentoCard = ({ children, className, isPreview, href }) => { const Tag = isPreview ? 'div' : Link; return ( <Tag href={isPreview ? null : href} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6 transition-transform duration-300 ease-in-out hover:-translate-y-1 ${className}`}> <div className="absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(45deg, var(--primary-blue), var(--primary-purple))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div> <div className="relative z-10 h-full flex flex-col"> {children} </div> </Tag> ); };

export default function HubInterface({ isPreview = false }) {
    // ... (The rest of the file remains exactly the same as your version)
    const [allMaterials, setAllMaterials] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [latestTopic, setLatestTopic] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
                const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc'));
                
                //  نستخدم 'updatedAt' لجلب آخر الشروحات
                const topicsQuery = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'));
                const latestTopicQuery = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'), limit(1));

                const [materialsSnapshot, topicsSnapshot, tagsSnapshot, latestTopicSnapshot] = await Promise.all([
                    getDocs(materialsQuery),
                    getDocs(topicsQuery),
                    getDocs(tagsQuery),
                    getDocs(latestTopicQuery)
                ]);

                const materialsList = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const topicsList = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const tagsList = tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setAllMaterials(materialsList);
                setAllTopics(topicsList);
                setAllTags(tagsList);

                if (!latestTopicSnapshot.empty) {
                    setLatestTopic(latestTopicSnapshot.docs[0].data());
                }

            } catch (error) {
                console.error("Error fetching data: ", error);
                if (!isPreview) toast.error("فشل في جلب بيانات المنصة.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isPreview]);

    // ... (filteredMaterials useMemo hook remains the same)
    const filteredMaterials = useMemo(() => { let items = [...allMaterials]; const lowerCaseQuery = searchQuery.toLowerCase(); if (selectedTag) { const matchingTopicSlugs = new Set( allTopics .filter(topic => Array.isArray(topic.tags) && topic.tags.includes(selectedTag)) .map(topic => topic.materialSlug) ); items = items.filter(material => matchingTopicSlugs.has(material.slug)); } if (searchQuery) { items = items.filter(material => material.title.toLowerCase().includes(lowerCaseQuery) || material.courseCode.toLowerCase().includes(lowerCaseQuery) || (allTopics.some(topic => topic.materialSlug === material.slug && (topic.title.toLowerCase().includes(lowerCaseQuery) || (Array.isArray(topic.tags) && topic.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))) )) ); } return items; }, [searchQuery, selectedTag, allMaterials, allTopics]);
    
    const handleTagClick = (slug) => {
        if (selectedTag === slug) { setSelectedTag(null); } else { setSelectedTag(slug); }
    };

    const LogoTag = isPreview ? 'div' : Link;
    const NavTag = isPreview ? 'span' : Link;

    return (
        <div className="mx-auto max-w-6xl p-6">
             <Toaster position="bottom-center" />
             <header className="mb-12 flex items-center justify-between"> <LogoTag href={isPreview ? null : "/"} className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </LogoTag> <nav className="hidden items-center gap-6 md:flex"> <NavTag href={isPreview ? null : "#"} className="text-text-secondary">جميع المواد</NavTag> <NavTag href={isPreview ? null : "/lab"} className="text-text-secondary">المختبر 🧪</NavTag> </nav> </header>

            <main className="grid grid-cols-6 auto-rows-[220px] gap-4">
                <BentoCard className="col-span-6 md:col-span-4" isPreview={isPreview} href="#">
                    <div className='flex-grow'> <h3 className="text-2xl font-bold mb-2">مركزك للمعرفة التقنية</h3> <p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p> </div>
                    <div className="relative mt-4">
                        <input 
                            type="search" 
                            placeholder="ابحث في المواد، الشروحات، أو الوسوم..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border-color bg-background-dark p-4 pr-12 text-lg" 
                            disabled={isPreview}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"><Search size={20} /></span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-text-secondary mr-2 py-1">الأكثر شيوعًا:</span>
                        {isLoading ? ( <div className="text-sm text-text-secondary py-1">...</div> ) : (
                            allTags.slice(0, 5).map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.slug)}
                                    disabled={isPreview}
                                    className={`text-xs bg-surface-dark border border-border-color px-3 py-1 rounded-full text-text-secondary transition-colors ${isPreview ? 'cursor-default' : 'hover:bg-primary-blue hover:text-white hover:border-primary-blue'} ${selectedTag === tag.slug ? 'bg-primary-blue text-white border-primary-blue' : ''}`}
                                >
                                    {tag.name}
                                </button>
                            ))
                        )}
                    </div>
                </BentoCard>
                
                <BentoCard 
                    className="col-span-6 md:col-span-2" 
                    isPreview={isPreview} 
                    href={latestTopic ? `/materials/${latestTopic.materialSlug}` : '#'}
                >
                    {isLoading ? ( <div className="text-text-secondary animate-pulse">جاري تحميل...</div> ) : latestTopic ? (
                        <>
                            <div className='flex-grow'><h3 className="text-xl font-bold">آخر تحديث</h3><p className="mt-2 font-semibold">{latestTopic.title}</p><p className="mt-1 text-sm text-text-secondary">{latestTopic.content?.find(b => b.type === 'paragraph')?.data.en.substring(0, 70) + '...' || '...'}</p></div>
                            <span className="self-start mt-4 font-bold text-primary-blue no-underline flex items-center gap-2">
                                اقرأ الشرح <ArrowRight size={20} />
                            </span>
                        </>
                    ) : ( <div className="text-text-secondary">لم تتم إضافة أي شروحات بعد.</div> )}
                </BentoCard>
                
                {(isLoading && !isPreview) ? ( <div className="col-span-6 text-center text-text-secondary">جاري تحميل المواد...</div> ) : (
                    (isPreview ? allMaterials : filteredMaterials).map((material) => (
                        <BentoCard 
                            key={material.id} 
                            className="col-span-3 md:col-span-2" 
                            isPreview={isPreview} 
                            href={`/materials/${material.slug}`}
                        >
                            {/* الخطوة 3: نستخدم المكون الديناميكي الجديد */}
                            <div className="text-text-secondary group-hover:text-primary-blue mb-4">
                                <Suspense fallback={<Computer size={32} />}>
                                    <DynamicIcon name={material.icon} size={32} />
                                </Suspense>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold">{material.title}</h3>
                                <p className="text-sm text-text-secondary mt-2">{material.description.en}</p>
                            </div>
                            <div className="self-end text-text-secondary opacity-0 group-hover:opacity-100">
                                <ArrowRight size={20} />
                            </div>
                        </BentoCard>
                    ))
                )}
                
                {!isLoading && filteredMaterials.length === 0 && !isPreview && (
                    <div className="col-span-6 text-center text-text-secondary py-10">
                        <p className="text-lg font-bold">لا توجد نتائج مطابقة لبحثك</p>
                        <p>جرب كلمة مفتاحية أخرى.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

