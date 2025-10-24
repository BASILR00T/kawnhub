'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
//  الخطوة 1: نستورد 'serverTimestamp'
import { collection, getDocs, addDoc, query, orderBy, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- (BlockPreview component remains the same) ---
const BlockPreview = ({ block }) => { switch (block.type) { case 'subheading': return <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-border-color pb-2">{block.data || "..."}</h2>; case 'paragraph': return <p className="text-base text-text-secondary my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.en || "..." }} />; case 'ciscoTerminal': return ( <div className="my-4 text-sm text-left" dir="ltr"> <SyntaxHighlighter language="cisco" style={vscDarkPlus} customStyle={{ background: '#0D1117', border: '1px solid var(--border-color)', borderRadius: '0.5rem', margin: 0, padding: '1rem' }} codeTagProps={{ style: { fontFamily: '"Fira Code", monospace' } }} wrapLines={true} wrapLongLines={true}> {block.data || ''} </SyntaxHighlighter> </div> ); case 'note': return <div className="my-4 p-4 border-r-4 border-red-500 bg-red-500/10 text-red-300 rounded-r-lg text-sm" dangerouslySetInnerHTML={{ __html: block.data.en || "..." }} />; case 'orderedList': return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-base pl-4">{block.data.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item || `عنصر ${i+1}`}} />)}</ol>; case 'videoEmbed': if (!block.data.url) return <div className="my-6 text-center text-text-secondary">[Video Preview]</div>; return (<div className="my-6"><div className="aspect-w-16 aspect-h-9"><iframe src={block.data.url} title={block.data.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe></div>{block.data.caption && <p className="text-center text-xs text-text-secondary mt-2">{block.data.caption}</p>}</div>); default: return null; }};

// --- (getYoutubeEmbedUrl function remains the same) ---
function getYoutubeEmbedUrl(url) { if (!url) return ''; if (url.includes('youtube.com/embed/')) return url; const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; const match = url.match(regExp); if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`; else return url; }

// --- (BlockEditor component remains the same) ---
const BlockEditor = ({ block, onContentChange, onRemove, addListItem, removeListItem, onListChange }) => { const handleDataChange = (field, value) => { onContentChange({ ...block.data, [field]: value }); }; const handleVideoUrlBlur = (e) => { const cleanUrl = getYoutubeEmbedUrl(e.target.value); handleDataChange('url', cleanUrl); }; return ( <div className="p-4 border border-border-color rounded-md bg-background-dark relative pt-10"> <div className="absolute top-3 left-3 flex gap-2"> <button type="button" onClick={onRemove} className="text-red-500 text-xl hover:scale-125 transition-transform" title="حذف البلوك">&times;</button> </div> {block.type === 'subheading' && <input type="text" value={block.data} onChange={(e) => onContentChange(e.target.value)} placeholder="عنوان فرعي..." className="w-full p-2 font-bold text-lg bg-transparent border-b-2 border-border-color focus:border-primary-blue focus:outline-none" />} {block.type === 'paragraph' && <div className="space-y-2"><textarea value={block.data.en} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="النص بالإنجليزية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2" /><textarea value={block.data.ar} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="النص بالعربية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2" /></div>} {block.type === 'ciscoTerminal' && <textarea value={block.data} onChange={(e) => onContentChange(e.target.value)} placeholder="Switch> enable..." rows="5" className="w-full rounded border border-border-color bg-black text-green-400 p-2 font-mono" />} {block.type === 'note' && <div className="space-y-2"><textarea value={block.data.en} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="ملاحظة إنجليزية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300" /><textarea value={block.data.ar} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="ملاحظة عربية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300" /></div>} {block.type === 'orderedList' && <div className="space-y-2">{block.data.map((item, subIndex) => (<div key={subIndex} className="flex gap-2 items-center"><span className="text-text-secondary">{subIndex + 1}.</span><input type="text" value={item} onChange={(e) => onListChange(subIndex, e.target.value)} className="flex-1 rounded border border-border-color bg-surface-dark p-2" /><button type="button" onClick={() => removeListItem(subIndex)} className="text-red-500 hover:scale-125 transition-transform">&times;</button></div>))}<button type="button" onClick={addListItem} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full mt-2">+ إضافة عنصر</button></div>} {block.type === 'videoEmbed' && <div className="space-y-2"><input type="url" defaultValue={block.data.url} onBlur={handleVideoUrlBlur} placeholder="https://www.youtube.com/watch?v=... (سيتم تحويله تلقائيًا)" className="w-full rounded border border-border-color bg-surface-dark p-2" /><input type="text" value={block.data.caption} onChange={(e) => handleDataChange('caption', e.target.value)} placeholder="عنوان الفيديو (اختياري)" className="w-full rounded border border-border-color bg-surface-dark p-2" /></div>} </div> ); };

// --- (SortableBlock component remains the same) ---
const SortableBlock = (props) => { const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.block.id }); const style = { transform: CSS.Transform.toString(transform), transition }; return ( <div ref={setNodeRef} style={style} className="relative group"> <button type="button" {...attributes} {...listeners} className="absolute top-3 right-3 cursor-grab p-2 opacity-20 group-hover:opacity-100 transition-opacity z-10" title="اسحب للترتيب"> <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM13 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg> </button> <BlockEditor {...props} /> </div> ); };

export default function NewTopicPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [materialSlug, setMaterialSlug] = useState('');
    const [order, setOrder] = useState(0);
    const [content, setContent] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // ... (useEffect for data fetching remains the same)
    useEffect(() => { const fetchData = async () => { try { const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc')); const materialsSnapshot = await getDocs(materialsQuery); setAllMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc')); const tagsSnapshot = await getDocs(tagsQuery); setAllTags(tagsSnapshot.docs.map(doc => ({ value: doc.data().slug, label: doc.data().name }))); } catch (error) { toast.error("فشل في جلب البيانات."); } }; fetchData(); }, []);

    // ... (Block management functions remain the same)
    const addContentBlock = (type) => { let newBlockData; switch (type) { case 'subheading': newBlockData = ''; break; case 'paragraph': newBlockData = { en: '', ar: '' }; break; case 'ciscoTerminal': newBlockData = ''; break; case 'note': newBlockData = { en: '', ar: '' }; break; case 'orderedList': newBlockData = ['']; break; case 'videoEmbed': newBlockData = { url: '', caption: '' }; break; default: return; } setContent([...content, { id: uuidv4(), type, data: newBlockData }]); };
    const handleContentChange = (blockId, data) => { setContent(prevContent => prevContent.map(block => block.id === blockId ? { ...block, data } : block)); };
    const handleListChange = (blockId, itemIndex, value) => { setContent(prevContent => prevContent.map(block => { if (block.id === blockId && block.type === 'orderedList') { const newListData = [...block.data]; newListData[itemIndex] = value; return { ...block, data: newListData }; } return block; })); };
    const addListItem = (blockId) => { setContent(prevContent => prevContent.map(block => { if (block.id === blockId && block.type === 'orderedList') { return { ...block, data: [...block.data, ''] }; } return block; })); };
    const removeListItem = (blockId, itemIndex) => { setContent(prevContent => prevContent.map(block => { if (block.id === blockId && block.type === 'orderedList' && block.data.length > 1) { const newListData = block.data.filter((_, i) => i !== itemIndex); return { ...block, data: newListData }; } return block; })); };
    const removeContentBlock = (blockId) => { setContent(prevContent => prevContent.filter(block => block.id !== blockId)); };
    const onDragEnd = (event) => { const { active, over } = event; if (active.id !== over.id) { setContent((items) => { const oldIndex = items.findIndex(item => item.id === active.id); const newIndex = items.findIndex(item => item.id === over.id); return arrayMove(items, oldIndex, newIndex); }); } };

    //  الخطوة 2: تحديث دالة الحفظ
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!title || !materialSlug) { toast.error("الرجاء ملء عنوان الشرح واختيار المادة."); return; }
        const toastId = toast.loading('جاري حفظ الشرح...');
        setIsSubmitting(true);
        const tagSlugs = [];
        const newTagsToCreate = [];
        for (const tag of selectedTags) {
            if (tag.__isNew__) {
                const newSlug = tag.value.toLowerCase().replace(/\s+/g, '-');
                newTagsToCreate.push({ name: tag.value, slug: newSlug });
                tagSlugs.push(newSlug);
            } else {
                tagSlugs.push(tag.value);
            }
        }
        try {
            if (newTagsToCreate.length > 0) {
                const batch = writeBatch(db);
                newTagsToCreate.forEach(tag => {
                    const tagRef = doc(collection(db, 'tags'));
                    batch.set(tagRef, tag);
                });
                await batch.commit();
            }
            const contentToSave = content.map(({ id, ...rest }) => rest);
            //  التحديث هنا: نضيف 'createdAt'
            const newTopic = { 
                title, 
                materialSlug, 
                order: Number(order), 
                content: contentToSave, 
                tags: tagSlugs,
                createdAt: serverTimestamp() //  <--  الإضافة الجديدة
            };
            await addDoc(collection(db, 'topics'), newTopic);
            toast.success('تم حفظ الشرح بنجاح!', { id: toastId });
            router.push('/admin/topics');
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ.', { id: toastId });
            setIsSubmitting(false);
        }
    };
    
    const selectStyles = { control: (s) => ({ ...s, backgroundColor: '#0a0a0f', borderColor: '#30363d', color: 'white' }), menu: (s) => ({ ...s, backgroundColor: '#0a0a0f' }), option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#1f6feb' : '#0a0a0f', color: '#e0e0e0' }), multiValue: (s) => ({ ...s, backgroundColor: '#1f6feb' }), multiValueLabel: (s) => ({ ...s, color: 'white' }), input: (s) => ({ ...s, color: 'white' })};

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6" dir="rtl">
                <Toaster position="bottom-center" />
                <div className="lg:pr-4">
                    <h1 className="text-3xl font-bold mb-8">إضافة شرح جديد</h1>
                    <form onSubmit={handleSubmit} className="space-y-8">
                         <div className="p-6 bg-surface-dark border border-border-color rounded-lg space-y-4"> 
                            <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
                            <div> <label className="block text-sm font-medium text-text-secondary mb-2">عنوان الشرح</label> <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required /> </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                                <div> <label className="block text-sm font-medium text-text-secondary mb-2">المادة</label> <select value={materialSlug} onChange={(e) => setMaterialSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required> <option value="">اختر مادة...</option> {allMaterials.map(mat => <option key={mat.id} value={mat.slug}>{mat.title}</option>)} </select> </div> 
                                <div> <label className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label> <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required min="0" /> </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">الوسوم (Tags)</label>
                                <Select isMulti isCreatable options={allTags} onChange={setSelectedTags} placeholder="اختر أو أنشئ وسوم..." styles={selectStyles} noOptionsMessage={() => 'لا توجد وسوم متاحة'} />
                            </div>
                         </div>
                        
                        <div className="p-6 bg-surface-dark border border-border-color rounded-lg">
                            <h2 className="text-xl font-bold mb-4">محتوى الشرح (البلوكات)</h2>
                            <SortableContext items={content.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-6 mb-6">
                                    {content.map((block) => (
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
                                <button type="button" onClick={() => addContentBlock('subheading')} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">عنوان</button>
                                <button type="button" onClick={() => addContentBlock('paragraph')} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full">فقرة</button>
                                <button type="button" onClick={() => addContentBlock('ciscoTerminal')} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Cisco</button>
                                <button type="button" onClick={() => addContentBlock('note')} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full">ملاحظة</button>
                                <button type="button" onClick={() => addContentBlock('orderedList')} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">قائمة</button>
                                <button type="button" onClick={() => addContentBlock('videoEmbed')} className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full">فيديو</button>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <button type="submit" disabled={isSubmitting} className="bg-primary-blue text-white px-6 py-2 rounded-lg disabled:opacity-50 font-bold transition-transform hover:scale-105">
                                {isSubmitting ? 'جاري الحفظ...' : 'حفظ الشرح'}
                            </button>
                            <Link href="/admin/topics" className="text-text-secondary hover:underline flex items-center">إلغاء</Link>
                        </div>
                    </form>
                </div>
                {/* Live Preview Column */}
                <div className="hidden lg:block sticky top-8">
                    <h3 className="text-xl font-bold mb-4">معاينة حية</h3>
                    <div className="p-6 border border-border-color rounded-lg h-[80vh] overflow-y-auto bg-surface-dark/50 prose prose-invert max-w-none">
                        <h1 className="text-3xl font-bold mb-4">{title || "عنوان الشرح..."}</h1>
                        {content.map((block) => <BlockPreview key={block.id} block={block} />)}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}

