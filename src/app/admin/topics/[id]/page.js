'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// لاحظ: لم نعد بحاجة لاستيراد Image من next/image هنا لأننا سنستخدم img عادي للروابط الخارجية العشوائية

// --- 1. BlockPreview Component (محدث) ---
const BlockPreview = ({ block }) => { 
    switch (block.type) {
        case 'subheading': return <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-border-color pb-2">{block.data || "..."}</h2>;
        case 'paragraph': return <p className="text-base text-text-secondary my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.en || "..." }} />;
        case 'ciscoTerminal': return <pre className="my-4 text-sm bg-black/80 rounded-lg border border-border-color p-4 overflow-x-auto"><code className="text-green-400">{block.data || ''}</code></pre>;
        case 'note': return <div className="my-4 p-4 border-r-4 border-red-500 bg-red-500/10 text-red-300 rounded-r-lg text-sm" dangerouslySetInnerHTML={{ __html: block.data.en || "..." }} />;
        case 'orderedList': return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-base pl-4">{block.data.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item || `عنصر ${i+1}`}} />)}</ol>;
        case 'videoEmbed': if (!block.data.url) return <div className="my-6 text-center text-text-secondary border border-dashed border-border-color p-4 rounded-lg">[فيديو يوتيوب]</div>; return (<div className="my-6"><div className="aspect-w-16 aspect-h-9"><iframe src={block.data.url} title={block.data.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe></div>{block.data.caption && <p className="text-center text-xs text-text-secondary mt-2">{block.data.caption}</p>}</div>);
        
        // ✅ جديد: عرض الصورة من الرابط
        case 'image':
            if (!block.data.url) return <div className="my-6 text-center text-text-secondary border border-dashed border-border-color p-4 rounded-lg flex flex-col items-center gap-2"><span>🖼️</span><span>[مكان الصورة]</span></div>;
            return (
                <figure className="my-6">
                    {/* استخدمنا img عادي لتجنب مشاكل Next.js Domains مع الروابط الخارجية */}
                    <img 
                        src={block.data.url} 
                        alt={block.data.caption || 'صورة توضيحية'} 
                        className="w-full rounded-lg object-contain max-h-[500px] bg-black/20 border border-border-color" 
                        onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Broken+Image"; }} // صورة بديلة في حال الخطأ
                    />
                    {block.data.caption && (
                        <figcaption className="text-center text-xs text-text-secondary mt-2">
                            {block.data.caption}
                        </figcaption>
                    )}
                </figure>
            );

        default: return null;
    }
};

// --- YouTube Helper ---
function getYoutubeEmbedUrl(url) { if (!url) return ''; if (url.includes('youtube.com/embed/')) return url; const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; const match = url.match(regExp); if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`; else return url; }

// --- 2. Block Editor Component (محدث) ---
const BlockEditor = ({ block, onContentChange, onRemove, addListItem, removeListItem, onListChange }) => {
    const handleDataChange = (field, value) => {
        onContentChange({ ...block.data, [field]: value });
    };
    const handleVideoUrlBlur = (e) => {
        const cleanUrl = getYoutubeEmbedUrl(e.target.value);
        handleDataChange('url', cleanUrl);
    };

    return (
        <div className="p-4 border border-border-color rounded-md bg-background-dark relative pt-10 group hover:border-primary-blue/50 transition-colors">
            <div className="absolute top-3 left-3 flex gap-2">
                <span className="text-xs text-text-secondary uppercase font-mono bg-surface-dark px-2 py-1 rounded border border-border-color">{block.type}</span>
                <button type="button" onClick={onRemove} className="text-red-500 text-xl hover:scale-125 transition-transform" title="حذف البلوك">&times;</button>
            </div>
            
            {block.type === 'subheading' && <input type="text" value={block.data} onChange={(e) => onContentChange(e.target.value)} placeholder="عنوان فرعي..." className="w-full p-2 font-bold text-lg bg-transparent border-b-2 border-border-color focus:border-primary-blue focus:outline-none" />}
            {block.type === 'paragraph' && <div className="space-y-2"><textarea value={block.data.en} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="النص بالإنجليزية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /><textarea value={block.data.ar} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="النص بالعربية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /></div>}
            {block.type === 'ciscoTerminal' && <textarea value={block.data} onChange={(e) => onContentChange(e.target.value)} placeholder="Switch> enable..." rows="5" className="w-full rounded border border-border-color bg-black text-green-400 p-2 font-mono focus:border-green-500 outline-none" />}
            {block.type === 'note' && <div className="space-y-2"><textarea value={block.data.en} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="ملاحظة إنجليزية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300 focus:border-red-500 outline-none" /><textarea value={block.data.ar} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="ملاحظة عربية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300 focus:border-red-500 outline-none" /></div>}
            {block.type === 'orderedList' && <div className="space-y-2">{block.data.map((item, subIndex) => (<div key={subIndex} className="flex gap-2 items-center"><span className="text-text-secondary">{subIndex + 1}.</span><input type="text" value={item} onChange={(e) => onListChange(subIndex, e.target.value)} className="flex-1 rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /><button type="button" onClick={() => removeListItem(subIndex)} className="text-red-500 hover:scale-125 transition-transform">&times;</button></div>))}<button type="button" onClick={addListItem} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full mt-2 hover:bg-primary-blue hover:text-white transition-colors">+ إضافة عنصر</button></div>}
            {block.type === 'videoEmbed' && <div className="space-y-2"><input type="url" defaultValue={block.data.url} onBlur={handleVideoUrlBlur} placeholder="https://www.youtube.com/watch?v=... (سيتم تحويله تلقائيًا)" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none text-left dir-ltr" /><input type="text" value={block.data.caption} onChange={(e) => handleDataChange('caption', e.target.value)} placeholder="عنوان الفيديو (اختياري)" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /></div>}
            
            {/* ✅ جديد: واجهة تحرير الصورة */}
            {block.type === 'image' && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">رابط الصورة المباشر (URL)</label>
                        <input 
                            type="url" 
                            value={block.data.url} 
                            onChange={(e) => handleDataChange('url', e.target.value)} 
                            placeholder="https://example.com/image.png" 
                            className="w-full rounded border border-border-color bg-surface-dark p-2 text-sm text-left dir-ltr focus:border-primary-blue outline-none" 
                        />
                        <p className="text-[10px] text-text-secondary mt-1">نصيحة: استخدم روابط مباشرة تنتهي بـ .png أو .jpg</p>
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">تعليق (Caption)</label>
                        <input 
                            type="text" 
                            value={block.data.caption} 
                            onChange={(e) => handleDataChange('caption', e.target.value)} 
                            placeholder="شرح للصورة (اختياري)" 
                            className="w-full rounded border border-border-color bg-surface-dark p-2 text-sm focus:border-primary-blue outline-none" 
                        />
                    </div>
                    {/* معاينة مصغرة */}
                    {block.data.url && (
                        <div className="mt-2 relative h-24 w-full rounded overflow-hidden border border-border-color bg-black/50 flex items-center justify-center">
                             <img src={block.data.url} alt="Preview" className="h-full object-contain" onError={(e) => e.target.style.display='none'} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- SortableBlock (Standard) ---
const SortableBlock = (props) => { const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.block.id }); const style = { transform: CSS.Transform.toString(transform), transition }; return ( <div ref={setNodeRef} style={style} className="relative group"> <button type="button" {...attributes} {...listeners} className="absolute top-3 right-3 cursor-grab p-2 opacity-20 group-hover:opacity-100 transition-opacity z-10 bg-surface-dark rounded hover:bg-border-color" title="اسحب للترتيب"> <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM13 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg> </button> <BlockEditor {...props} /> </div> ); };

// --- useAutosave (Standard) ---
function useAutosave(data, onSave, delay = 3000) { const [status, setStatus] = useState('saved'); const isInitialMount = useRef(true); useEffect(() => { if (isInitialMount.current) { isInitialMount.current = false; return; } if (!data || !data.title) return; setStatus('unsaved'); const handler = setTimeout(() => { setStatus('saving'); onSave(data).then(() => { setStatus('saved'); toast.success('تم الحفظ تلقائياً!'); }); }, delay); return () => clearTimeout(handler); }, [JSON.stringify(data), onSave]); return status; }

export default function EditTopicPage({ params }) {
    const router = useRouter();
    const topicId = params.id; 
    const [isLoading, setIsLoading] = useState(true);
    const [topicData, setTopicData] = useState({ title: '', materialSlug: '', order: 0, content: [] });
    const [allMaterials, setAllMaterials] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleAutoSave = useCallback(async (dataToSave) => { if (!topicId) return; try { const tagSlugs = []; const newTagsToCreate = []; for (const tag of selectedTags) { if (tag.__isNew__) { const newSlug = tag.value.toLowerCase().replace(/\s+/g, '-'); newTagsToCreate.push({ name: tag.value, slug: newSlug }); tagSlugs.push(newSlug); } else { tagSlugs.push(tag.value); } } if (newTagsToCreate.length > 0) { const batch = writeBatch(db); newTagsToCreate.forEach(tag => { const tagRef = doc(collection(db, 'tags')); batch.set(tagRef, tag); }); await batch.commit(); } const docRef = doc(db, 'topics', topicId); const contentToSave = dataToSave.content.map(({ id, ...rest }) => rest); await updateDoc(docRef, { ...dataToSave, content: contentToSave, tags: tagSlugs, updatedAt: serverTimestamp() }); } catch (error) { console.error("Autosave error: ", error); toast.error("فشل الحفظ التلقائي."); } }, [topicId, selectedTags]);
    const saveStatus = useAutosave(topicData, handleAutoSave);

    useEffect(() => { if (!topicId) return; const fetchData = async () => { try { const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc')); const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc')); const [materialsSnapshot, tagsSnapshot] = await Promise.all([ getDocs(materialsQuery), getDocs(tagsQuery) ]); const materialsList = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); const tagsList = tagsSnapshot.docs.map(doc => ({ value: doc.data().slug, label: doc.data().name })); setAllMaterials(materialsList); setAllTags(tagsList); const docRef = doc(db, 'topics', topicId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const data = docSnap.data(); const validContent = Array.isArray(data.content) ? data.content : []; const contentWithIds = validContent.map(block => ({ ...block, id: uuidv4() })); setTopicData({ ...data, content: contentWithIds }); if (data.tags) { const currentTags = data.tags.map(slug => tagsList.find(t => t.value === slug)).filter(Boolean); setSelectedTags(currentTags); } } else { toast.error("الشرح غير موجود!"); router.push('/admin/topics'); } } catch (error) { toast.error("فشل في جلب البيانات."); } finally { setIsLoading(false); } }; fetchData(); }, [topicId, router]);
    
    const handleFieldChange = (field, value) => { setTopicData(prev => ({ ...prev, [field]: value })); };
    const setContent = (newContent) => { setTopicData(prev => ({ ...prev, content: newContent })); };
    
    // --- 3. تحديث دالة إضافة البلوك ---
    const addContentBlock = (type) => { 
        let newBlockData; 
        switch (type) { 
            case 'subheading': newBlockData = ''; break; 
            case 'paragraph': newBlockData = { en: '', ar: '' }; break; 
            case 'ciscoTerminal': newBlockData = ''; break; 
            case 'note': newBlockData = { en: '', ar: '' }; break; 
            case 'orderedList': newBlockData = ['']; break; 
            case 'videoEmbed': newBlockData = { url: '', caption: '' }; break; 
            case 'image': newBlockData = { url: '', caption: '' }; break; // ✅ تهيئة بيانات الصورة
            default: return; 
        } 
        setContent([...(topicData.content || []), { id: uuidv4(), type, data: newBlockData }]); 
    };
    
    const handleContentChange = (blockId, data) => { setTopicData(prev => ({ ...prev, content: prev.content.map(block => block.id === blockId ? { ...block, data } : block) })); };
    const handleListChange = (blockId, itemIndex, value) => { setTopicData(prev => ({ ...prev, content: prev.content.map(block => { if (block.id === blockId && block.type === 'orderedList') { const newListData = [...block.data]; newListData[itemIndex] = value; return { ...block, data: newListData }; } return block; }) })); };
    const addListItem = (blockId) => { setTopicData(prev => ({ ...prev, content: prev.content.map(block => { if (block.id === blockId && block.type === 'orderedList') { return { ...block, data: [...block.data, ''] }; } return block; }) })); };
    const removeListItem = (blockId, itemIndex) => { setTopicData(prev => ({ ...prev, content: prev.content.map(block => { if (block.id === blockId && block.type === 'orderedList' && block.data.length > 1) { const newListData = block.data.filter((_, i) => i !== itemIndex); return { ...block, data: newListData }; } return block; }) })); };
    const removeContentBlock = (blockId) => { setTopicData(prev => ({ ...prev, content: prev.content.filter(block => block.id !== blockId) })); };
    const onDragEnd = (event) => { const { active, over } = event; if (active.id !== over.id) { setTopicData(prev => { const oldIndex = prev.content.findIndex(item => item.id === active.id); const newIndex = prev.content.findIndex(item => item.id === over.id); return { ...prev, content: arrayMove(prev.content, oldIndex, newIndex) }; }); } };
    
    const selectStyles = { control: (s) => ({ ...s, backgroundColor: '#0a0a0f', borderColor: '#30363d', color: 'white' }), menu: (s) => ({ ...s, backgroundColor: '#0a0a0f' }), option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#1f6feb' : '#0a0a0f', color: '#e0e0e0' }), multiValue: (s) => ({ ...s, backgroundColor: '#1f6feb' }), multiValueLabel: (s) => ({ ...s, color: 'white' }), input: (s) => ({ ...s, color: 'white' })};

    if (isLoading) return <p className="p-6 text-center">جاري تحميل بيانات الشرح...</p>;

    const safeContent = Array.isArray(topicData.content) ? topicData.content : [];

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6" dir="rtl">
                <Toaster position="bottom-center" />
                <div className="lg:pr-4">
                    <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">تعديل الشرح</h1><div className="text-sm text-text-secondary transition-opacity">{saveStatus === 'unsaved' && 'تغييرات غير محفوظة'}{saveStatus === 'saving' && 'جاري الحفظ...'}{saveStatus === 'saved' && '✓ تم الحفظ'}</div></div>
                    <div className="space-y-8">
                        <div className="p-6 bg-surface-dark border border-border-color rounded-lg space-y-4"> <h2 className="text-xl font-bold">المعلومات الأساسية</h2> <div> <label className="block text-sm font-medium text-text-secondary mb-2">عنوان الشرح</label> <input type="text" value={topicData.title} onChange={(e) => handleFieldChange('title', e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required /> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className="block text-sm font-medium text-text-secondary mb-2">المادة</label> <select value={topicData.materialSlug} onChange={(e) => handleFieldChange('materialSlug', e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required> <option value="">اختر مادة...</option> {allMaterials.map(mat => <option key={mat.id} value={mat.slug}>{mat.title}</option>)} </select> </div> <div> <label className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label> <input type="number" value={topicData.order} onChange={(e) => handleFieldChange('order', Number(e.target.value))} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required min="0" /> </div> </div> <div> <label className="block text-sm font-medium text-text-secondary mb-2">الوسوم (Tags)</label> <Select isMulti isCreatable options={allTags} value={selectedTags} onChange={setSelectedTags} placeholder="اختر أو أنشئ وسوم..." styles={selectStyles} noOptionsMessage={() => 'لا توجد وسوم متاحة'} /> </div> </div>
                        
                        <div className="p-6 bg-surface-dark border border-border-color rounded-lg"> 
                            <h2 className="text-xl font-bold mb-4">محتوى الشرح (البلوكات)</h2>
                            <SortableContext items={safeContent.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-6 mb-6">
                                    {safeContent.map((block) => (
                                        <SortableBlock 
                                            key={block.id} 
                                            block={block} 
                                            onContentChange={(newData) => handleContentChange(block.id, newData)}
                                            onRemove={() => removeContentBlock(block.id)}
                                            addListItem={() => addListItem(block.id)}
                                            removeListItem={(itemIdx) => removeListItem(block.id, itemIdx)}
                                            onListChange={(itemIdx, value) => handleListChange(block.id, itemIdx, value)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                             <div className="flex flex-wrap gap-2"> 
                                <button type="button" onClick={() => addContentBlock('subheading')} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-500/30">عنوان</button> 
                                <button type="button" onClick={() => addContentBlock('paragraph')} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full border border-primary-blue/30 hover:bg-primary-blue/30">فقرة</button> 
                                <button type="button" onClick={() => addContentBlock('ciscoTerminal')} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 hover:bg-green-500/30">Cisco</button> 
                                <button type="button" onClick={() => addContentBlock('note')} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 hover:bg-red-500/30">ملاحظة</button> 
                                <button type="button" onClick={() => addContentBlock('orderedList')} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30 hover:bg-yellow-500/30">قائمة</button> 
                                <button type="button" onClick={() => addContentBlock('videoEmbed')} className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30 hover:bg-pink-500/30">فيديو</button>
                                {/* ✅ زر الصورة الجديد */}
                                <button type="button" onClick={() => addContentBlock('image')} className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1"><span>🖼️</span> صورة</button>
                             </div> 
                        </div>
                         <div className="flex gap-4 mt-8">
                            <Link href="/admin/topics" className="text-text-secondary hover:underline flex items-center">العودة للقائمة</Link>
                        </div>
                    </div>
                </div>
                
                {/* --- Live Preview Column --- */}
                <div className="hidden lg:block sticky top-8 h-[calc(100vh-4rem)]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>👁️</span> معاينة حية
                    </h3>
                    <div className="p-6 border border-border-color rounded-lg h-full overflow-y-auto bg-surface-dark/50 prose prose-invert max-w-none custom-scrollbar">
                        <h1 className="text-3xl font-bold mb-4">{topicData.title || "عنوان الشرح..."}</h1>
                        {/* عرض البلوكات في المعاينة */}
                        {(safeContent || []).map((block, index) => <BlockPreview key={index} block={block} />)}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}