'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select/creatable';

// --- (BlockPreview component remains the same) ---
const BlockPreview = ({ block }) => { switch (block.type) { case 'subheading': return <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-border-color pb-2">{block.data || "..."}</h2>; case 'paragraph': return <p className="text-base text-text-secondary my-4 leading-relaxed">{block.data.en || "..."}</p>; case 'ciscoTerminal': return <pre className="my-4 text-sm bg-black/80 rounded-lg border border-border-color p-4 overflow-x-auto"><code className="text-green-400">{block.data || ''}</code></pre>; case 'note': return <div className="my-4 p-4 border-r-4 border-red-500 bg-red-500/10 text-red-300 rounded-r-lg text-sm">{block.data.en || "..."}</div>; case 'orderedList': return <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-base pl-4">{block.data.map((item, i) => <li key={i}>{item || `عنصر ${i+1}`}</li>)}</ol>; case 'videoEmbed': if (!block.data.url) return null; return (<div className="my-6"><div className="aspect-w-16 aspect-h-9"><iframe src={block.data.url} title={block.data.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe></div>{block.data.caption && <p className="text-center text-xs text-text-secondary mt-2">{block.data.caption}</p>}</div>); default: return null; }};

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
                const materialsSnapshot = await getDocs(materialsQuery);
                setAllMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc'));
                const tagsSnapshot = await getDocs(tagsQuery);
                setAllTags(tagsSnapshot.docs.map(doc => ({ value: doc.data().slug, label: doc.data().name })));
            } catch (error) {
                toast.error("فشل في جلب البيانات.");
            }
        };
        fetchData();
    }, []);

    const addContentBlock = (type) => { let newBlock; switch (type) { case 'subheading': newBlock = { type: 'subheading', data: '' }; break; case 'paragraph': newBlock = { type: 'paragraph', data: { en: '', ar: '' } }; break; case 'ciscoTerminal': newBlock = { type: 'ciscoTerminal', data: '' }; break; case 'note': newBlock = { type: 'note', data: { en: '', ar: '' } }; break; case 'orderedList': newBlock = { type: 'orderedList', data: [''] }; break; case 'videoEmbed': newBlock = { type: 'videoEmbed', data: { url: '', caption: '' } }; break; default: return; } setContent([...content, newBlock]); };
    const handleContentChange = (index, field, value, subIndex = null) => { const uC = [...content]; const b = uC[index]; if (b.type === 'orderedList') { b.data[subIndex] = value; } else if (typeof b.data === 'object' && b.data !== null) { b.data[field] = value; } else { b.data = value; } setContent(uC); };
    const addListItem = (index) => { const uC = [...content]; uC[index].data.push(''); setContent(uC); };
    const removeListItem = (index, subIndex) => { const uC = [...content]; if(uC[index].data.length > 1) { uC[index].data.splice(subIndex, 1); setContent(uC); } };
    const removeContentBlock = (index) => { setContent(content.filter((_, i) => i !== index)); };
    const moveBlock = (index, direction) => { const uC = [...content]; if (direction === 'up' && index > 0) { [uC[index - 1], uC[index]] = [uC[index], uC[index - 1]]; } else if (direction === 'down' && index < uC.length - 1) { [uC[index], uC[index + 1]] = [uC[index + 1], uC[index]]; } setContent(uC); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!title || !materialSlug) {
            toast.error("الرجاء ملء عنوان الشرح واختيار المادة.");
            return;
        }
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
            const newTopic = { title, materialSlug, order: Number(order), content, tags: tagSlugs };
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
                        <div className="space-y-6 mb-6">{content.map((block, index) => ( <div key={index} className="p-4 border border-border-color rounded-md bg-background-dark relative"> <div className="absolute top-2 left-2 flex gap-2"><button type="button" onClick={() => removeContentBlock(index)} className="text-red-500 text-xl hover:scale-125 transition-transform">&times;</button></div><div className="absolute top-2 right-2 flex gap-2"><button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="text-xs bg-surface-dark px-2 py-1 rounded disabled:opacity-30 hover:bg-primary-blue">↑</button><button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === content.length - 1} className="text-xs bg-surface-dark px-2 py-1 rounded disabled:opacity-30 hover:bg-primary-blue">↓</button></div> {block.type === 'subheading' && <input type="text" value={block.data} onChange={(e) => handleContentChange(index, null, e.target.value)} placeholder="عنوان فرعي..." className="w-full p-2 font-bold text-lg bg-transparent border-b-2 border-border-color focus:border-primary-blue focus:outline-none" />} {block.type === 'paragraph' && <div className="space-y-2 pt-8"><textarea value={block.data.en} onChange={(e) => handleContentChange(index, 'en', e.target.value)} placeholder="النص بالإنجليزية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2" /><textarea value={block.data.ar} onChange={(e) => handleContentChange(index, 'ar', e.target.value)} placeholder="النص بالعربية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2" /></div>} {block.type === 'ciscoTerminal' && <textarea value={block.data} onChange={(e) => handleContentChange(index, null, e.target.value)} placeholder="Switch> enable..." rows="5" className="w-full rounded border border-border-color bg-black text-green-400 p-2 font-mono" />} {block.type === 'note' && <div className="space-y-2 pt-8"><textarea value={block.data.en} onChange={(e) => handleContentChange(index, 'en', e.target.value)} placeholder="ملاحظة إنجليزية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300" /><textarea value={block.data.ar} onChange={(e) => handleContentChange(index, 'ar', e.target.value)} placeholder="ملاحظة عربية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300" /></div>} {block.type === 'orderedList' && <div className="space-y-2 pt-8">{block.data.map((item, subIndex) => (<div key={subIndex} className="flex gap-2 items-center"><span className="text-text-secondary">{subIndex + 1}.</span><input type="text" value={item} onChange={(e) => handleContentChange(index, null, e.target.value, subIndex)} className="flex-1 rounded border border-border-color bg-surface-dark p-2" /><button type="button" onClick={() => removeListItem(index, subIndex)} className="text-red-500 hover:scale-125 transition-transform">&times;</button></div>))}<button type="button" onClick={() => addListItem(index)} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full mt-2">+ إضافة عنصر</button></div>} {block.type === 'videoEmbed' && <div className="space-y-2 pt-8"><input type="url" value={block.data.url} onChange={(e) => handleContentChange(index, 'url', e.target.value)} placeholder="رابط YouTube embed" className="w-full rounded border border-border-color bg-surface-dark p-2" /><input type="text" value={block.data.caption} onChange={(e) => handleContentChange(index, 'caption', e.target.value)} placeholder="عنوان الفيديو (اختياري)" className="w-full rounded border border-border-color bg-surface-dark p-2" /></div>} </div> ))} </div> <div className="flex flex-wrap gap-2"> <button type="button" onClick={() => addContentBlock('subheading')} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">عنوان</button> <button type="button" onClick={() => addContentBlock('paragraph')} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full">فقرة</button> <button type="button" onClick={() => addContentBlock('ciscoTerminal')} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Cisco</button> <button type="button" onClick={() => addContentBlock('note')} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full">ملاحظة</button> <button type="button" onClick={() => addContentBlock('orderedList')} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">قائمة</button> <button type="button" onClick={() => addContentBlock('videoEmbed')} className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full">فيديو</button> </div> </div>
                    <div className="flex gap-4"> <button type="submit" disabled={isSubmitting} className="bg-primary-blue text-white px-6 py-2 rounded-lg disabled:opacity-50 font-bold"> {isSubmitting ? 'جاري الحفظ...' : 'حفظ الشرح'} </button> <Link href="/admin/topics" className="text-text-secondary hover:underline flex items-center">إلغاء</Link> </div>
                </form>
            </div>
            <div className="hidden lg:block sticky top-8">
                <h3 className="text-xl font-bold mb-4">معاينة حية</h3>
                <div className="p-6 border border-border-color rounded-lg h-[80vh] overflow-y-auto bg-surface-dark/50 prose prose-invert max-w-none">
                    <h1 className="text-3xl font-bold mb-4">{title || "عنوان الشرح..."}</h1>
                    {content.map((block, index) => <BlockPreview key={index} block={block} />)}
                </div>
            </div>
        </div>
    );
}

