'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'; //  الخطوة 1: نستورد "limit"
import toast from 'react-hot-toast';

// --- (Icon and Card components remain the same) ---
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const ComputerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> );
const LinuxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 13.66a4.33 4.33 0 0 0-1.06-1.06 2.5 2.5 0 0 0-3.88 0A4.33 4.33 0 0 0 8 13.66 M2 16.22a9.42 9.42 0 0 0 1.94 3.63c3.48 3.49 9.1 3.49 12.58 0A9.42 9.42 0 0 0 18.46 18M6.2 13.31a12.5 12.5 0 0 0-3.66 3.66c-1.35 2.12.06 5 2.18 6.35 2.12 1.35 5 .06 6.35-2.18a12.5 12.5 0 0 0 3.66-3.66 M12 2a6 6 0 0 0-6 6c0 4.5 6 11.5 6 11.5s6-7 6-11.5a6 6 0 0 0-6-6Z"></path></svg> );
const NetworkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> );
const ArrowIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> );

const icons = { ComputerIcon: <ComputerIcon />, LinuxIcon: <LinuxIcon />, NetworkIcon: <NetworkIcon /> };
const BentoCard = ({ children, className, isPreview, href }) => { const Tag = isPreview ? 'div' : Link; return ( <Tag href={isPreview ? null : href} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6 transition-transform duration-300 ease-in-out hover:-translate-y-1 ${className}`}> <div className="absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(45deg, var(--primary-blue), var(--primary-purple))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div> <div className="relative z-10 h-full flex flex-col"> {children} </div> </Tag> ); };

export default function HubInterface({ isPreview = false }) {
    const [allMaterials, setAllMaterials] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [latestTopic, setLatestTopic] = useState(null); //  الخطوة 2: حالة جديدة لآخر شرح

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch materials
                const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
                const materialsSnapshot = await getDocs(materialsQuery);
                const materialsList = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllMaterials(materialsList);

                // Fetch topics (for search)
                const topicsQuery = query(collection(db, 'topics'));
                const topicsSnapshot = await getDocs(topicsQuery);
                const topicsList = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllTopics(topicsList);
                
                // Fetch tags
                const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc'));
                const tagsSnapshot_tags = await getDocs(tagsQuery);
                const tagsList = tagsSnapshot_tags.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllTags(tagsList);

                //  الخطوة 3: جلب آخر شرح تم إضافته
                const latestTopicQuery = query(collection(db, 'topics'), orderBy('createdAt', 'desc'), limit(1));
                const latestTopicSnapshot = await getDocs(latestTopicQuery);
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
             <header className="mb-12 flex items-center justify-between"> <LogoTag href={isPreview ? null : "/"} className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </LogoTag> <nav className="hidden items-center gap-6 md:flex"> <NavTag href={isPreview ? null : "#"} className="text-text-secondary">جميع المواد</NavTag> <NavTag href={isPreview ? null : "/lab"} className="text-text-secondary">المختبر 🧪</NavTag> </nav> </header>

            <main className="grid grid-cols-6 auto-rows-[220px] gap-4">
                <BentoCard className="col-span-6 md:col-span-4" isPreview={isPreview} href="#">
                    {/* ... (Search and Tags section remains the same) ... */}
                    <div className='flex-grow'> <h3 className="text-2xl font-bold mb-2">مركزك للمعرفة التقنية</h3> <p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p> </div> <div className="relative mt-4"> <input type="search" placeholder="ابحث في المواد، الشروحات، أو الوسوم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-4 pr-12 text-lg" disabled={isPreview} /> <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"><SearchIcon /></span> </div> <div className="mt-4 flex flex-wrap gap-2"> <span className="text-sm text-text-secondary mr-2 py-1">الأكثر شيوعًا:</span> {isLoading ? ( <div className="text-sm text-text-secondary py-1">...</div> ) : ( allTags.slice(0, 5).map(tag => ( <button key={tag.id} onClick={() => handleTagClick(tag.slug)} disabled={isPreview} className={`text-xs bg-surface-dark border border-border-color px-3 py-1 rounded-full text-text-secondary transition-colors ${isPreview ? 'cursor-default' : 'hover:bg-primary-blue hover:text-white hover:border-primary-blue'} ${selectedTag === tag.slug ? 'bg-primary-blue text-white border-primary-blue' : ''}`}> {tag.name} </button> )) )} </div>
                </BentoCard>
                
                {/* الخطوة 4: تحديث بطاقة "أحدث إضافة" */}
                <BentoCard 
                    className="col-span-6 md:col-span-2" 
                    isPreview={isPreview} 
                    href={latestTopic ? `/materials/${latestTopic.materialSlug}` : '#'}
                >
                    {isLoading ? (
                        <div className="text-text-secondary">جاري تحميل...</div>
                    ) : latestTopic ? (
                        <>
                            <div className='flex-grow'>
                                <h3 className="text-xl font-bold">أحدث إضافة</h3>
                                <p className="mt-2 font-semibold">{latestTopic.title}</p>
                                <p className="mt-1 text-sm text-text-secondary">
                                    {/* نعرض أول فقرة كنص وصفي */}
                                    {latestTopic.content?.find(b => b.type === 'paragraph')?.data.en.substring(0, 70) + '...' || '...'}
                                </p>
                            </div>
                            <span className="self-start mt-4 font-bold text-primary-blue no-underline flex items-center gap-2">
                                اقرأ الشرح <ArrowIcon />
                            </span>
                        </>
                    ) : (
                        <div className="text-text-secondary">لم تتم إضافة أي شروحات بعد.</div>
                    )}
                </BentoCard>
                
                {/* ... (The rest of the component remains the same) ... */}
                {(isLoading && !isPreview) ? ( <div className="col-span-6 text-center text-text-secondary">جاري تحميل المواد...</div> ) : ( (isPreview ? allMaterials : filteredMaterials).map((material) => ( <BentoCard key={material.id} className="col-span-3 md:col-span-2" isPreview={isPreview} href={`/materials/${material.slug}`}> <div className="text-text-secondary group-hover:text-primary-blue mb-4"> {icons[material.icon] || <ComputerIcon />} </div> <div className="flex-grow"> <h3 className="text-lg font-bold">{material.title}</h3> <p className="text-sm text-text-secondary mt-2">{material.description.en}</p> </div> <div className="self-end text-text-secondary opacity-0 group-hover:opacity-100"> <ArrowIcon /> </div> </BentoCard> )) )}
                {!isLoading && filteredMaterials.length === 0 && !isPreview && ( <div className="col-span-6 text-center text-text-secondary py-10"> <p className="text-lg font-bold">لا توجد نتائج مطابقة لبحثك</p> <p>جرب كلمة مفتاحية أخرى.</p> </div> )}
            </main>
        </div>
    );
}

