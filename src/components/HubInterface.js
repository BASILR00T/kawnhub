'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
// ✅ التعديل هنا: تمت إضافة HelpCircle
import { Search, ArrowRight, Computer, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// --- المكون الديناميكي للأيقونات ---
const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = LucideIcons[name];
    if (!IconComponent) return <Computer {...props} />;
    return <IconComponent {...props} />;
};

const BentoCard = ({ children, className, href }) => { 
    return ( 
        <Link href={href || '#'} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6 transition-transform duration-300 ease-in-out hover:-translate-y-1 ${className}`}> 
            <div className="absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(45deg, var(--primary-blue), var(--primary-purple))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div> 
            <div className="relative z-10 h-full flex flex-col"> {children} </div> 
        </Link> 
    ); 
};

// نستقبل البيانات كـ props
export default function HubInterface({ initialMaterials = [], initialTopics = [], initialTags = [], isPreview = false }) {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    // تحديد آخر شرح تم إضافته
    const latestTopic = initialTopics.length > 0 ? initialTopics[0] : null;

    // --- دالة إعادة تعيين الفلاتر ---
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedTag(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // منطق الفلترة
    const filteredMaterials = useMemo(() => {
        let items = [...initialMaterials];
        const lowerCaseQuery = searchQuery.toLowerCase();

        if (selectedTag) {
            const matchingTopicSlugs = new Set(
                initialTopics
                    .filter(topic => Array.isArray(topic.tags) && topic.tags.includes(selectedTag))
                    .map(topic => topic.materialSlug)
            );
            items = items.filter(material => matchingTopicSlugs.has(material.slug));
        }

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
    }, [searchQuery, selectedTag, initialMaterials, initialTopics]);
    
    const handleTagClick = (slug) => {
        setSelectedTag(prev => prev === slug ? null : slug);
    };

    return (
        <div className="mx-auto max-w-6xl p-6">
             <Toaster position="bottom-center" />
             
             <header className="mb-12 flex items-center justify-between"> 
                <Link href="/" className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </Link> 
                
                <nav className="hidden items-center gap-6 md:flex"> 
                    <button 
                        onClick={resetFilters}
                        disabled={isPreview}
                        className={`text-sm font-medium transition-colors ${
                            (!searchQuery && !selectedTag) 
                            ? 'text-primary-blue cursor-default' 
                            : 'text-text-secondary hover:text-text-primary cursor-pointer'
                        }`}
                    >
                        جميع المواد
                    </button>

                    <Link href="/lab" className="text-text-secondary hover:text-text-primary font-medium text-sm">
                        المختبر 🧪
                    </Link> 

                    {/* رابط المساعدة والدعم */}
                    <Link href="/support" className="text-text-secondary hover:text-primary-blue transition-colors" title="المساعدة والدعم">
                        <HelpCircle size={20} />
                    </Link>
                </nav> 
             </header>

            <main className="grid grid-cols-6 auto-rows-[220px] gap-4">
                {/* بطاقة البحث */}
                <div className="col-span-6 md:col-span-4 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6">
                    <div className='flex-grow'> 
                        <h3 className="text-2xl font-bold mb-2">مركزك للمعرفة التقنية</h3> 
                        <p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p> 
                    </div>
                    <div className="relative mt-4">
                        <input 
                            type="search" 
                            placeholder="ابحث في المواد، الشروحات، أو الوسوم..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border-color bg-background-dark p-4 pr-12 text-lg focus:border-primary-blue outline-none transition-colors" 
                            disabled={isPreview}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"><Search size={20} /></span>
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
                <BentoCard className="col-span-6 md:col-span-2" href={latestTopic ? `/materials/${latestTopic.materialSlug}` : '#'}>
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
        </div>
    );
}