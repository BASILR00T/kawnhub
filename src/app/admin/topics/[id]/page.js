'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 1. BlockPreview Component (محدث) ---
const BlockPreview = ({ block }) => {
    switch (block.type) {
        case 'subheading': return <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-border-color pb-2 text-primary-blue">{typeof block.data === 'object' ? (block.data.en || block.data.ar || "...") : (block.data || "...")}</h2>;
        case 'paragraph':
            return (
                <div className="my-4">
                    <p className="text-base text-text-secondary leading-relaxed" dir="ltr" dangerouslySetInnerHTML={{ __html: typeof block.data === 'object' ? (block.data.en || "") : block.data }} />
                    {typeof block.data === 'object' && block.data.ar && <p className="text-base text-text-secondary leading-relaxed mt-2 text-right" dir="rtl" dangerouslySetInnerHTML={{ __html: block.data.ar }} />}
                </div>
            );

        case 'terminal_command':
            const cmdData = typeof block.data === 'object' ? block.data : { cmd: block.data, style: 'linux' };
            const style = cmdData.style || 'linux';
            let prompt = "$";
            let promptClass = "text-green-400";
            let bgClass = "bg-black";

            if (style === 'cmd') {
                prompt = ">";
                promptClass = "text-gray-100";
            } else if (style === 'powershell') {
                prompt = "PS>";
                promptClass = "text-white";
                bgClass = "bg-[#012456]";
            } else if (style === 'cisco') {
                prompt = "#";
                promptClass = "text-gray-300";
            }

            return (
                <div className={`my-2 text-sm ${bgClass} rounded-t-lg border border-border-color p-3 font-mono`} dir="ltr">
                    <span className={`${promptClass} mr-2 select-none`}>{prompt}</span>
                    <span className="text-gray-100">{cmdData.cmd || ''}</span>
                </div>
            );
        case 'terminal_output': return <div className="my-2 text-sm bg-black rounded-b-lg border border-border-color p-3 font-mono text-gray-300" dir="ltr">{block.data || ''}</div>;
        case 'note':
            return (
                <div className="my-4 p-4 border-r-4 border-red-500 bg-red-500/10 text-red-300 rounded-r-lg text-sm">
                    <div dir="ltr" dangerouslySetInnerHTML={{ __html: typeof block.data === 'object' ? (block.data.en || "") : block.data }} />
                    {typeof block.data === 'object' && block.data.ar && <div className="mt-2 text-right" dir="rtl" dangerouslySetInnerHTML={{ __html: block.data.ar }} />}
                </div>
            );
        case 'orderedList':
            return (
                <ol className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-base pl-4" dir="ltr">
                    {block.data.map((item, i) => (
                        <li key={i}>
                            <span dangerouslySetInnerHTML={{ __html: typeof item === 'object' ? (item.en || "") : item }} />
                            {typeof item === 'object' && item.ar && <div className="text-right mr-4 text-sm opacity-80" dir="rtl" dangerouslySetInnerHTML={{ __html: item.ar }} />}
                        </li>
                    ))}
                </ol>
            );
        case 'videoEmbed': if (!block.data.url) return <div className="my-6 text-center text-text-secondary border border-dashed border-border-color p-4 rounded-lg">[فيديو يوتيوب]</div>; return (<div className="my-6"><div className="aspect-w-16 aspect-h-9"><iframe src={block.data.url} title={block.data.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe></div>{block.data.caption && <p className="text-center text-xs text-text-secondary mt-2">{block.data.caption}</p>}</div>);

        case 'image':
            if (!block.data.url) return <div className="my-6 text-center text-text-secondary border border-dashed border-border-color p-4 rounded-lg flex flex-col items-center gap-2"><span>🖼️</span><span>[مكان الصورة]</span></div>;
            return (
                <figure className="my-6">
                    <img
                        src={block.data.url}
                        alt={block.data.caption || 'صورة توضيحية'}
                        className="w-full rounded-lg object-contain max-h-[500px] bg-black/20 border border-border-color"
                        onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Broken+Image"; }}
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

            {block.type === 'subheading' && <input type="text" value={typeof block.data === 'object' ? block.data.en : block.data} onChange={(e) => typeof block.data === 'object' ? handleDataChange('en', e.target.value) : onContentChange(e.target.value)} placeholder="عنوان فرعي..." className="w-full p-2 font-bold text-lg bg-transparent border-b-2 border-border-color focus:border-primary-blue focus:outline-none" />}
            {block.type === 'paragraph' && <div className="space-y-2"><textarea value={block.data.en || ''} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="النص بالإنجليزية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" dir="ltr" /><textarea value={block.data.ar || ''} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="النص بالعربية..." rows="3" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" dir="rtl" /></div>}

            {block.type === 'terminal_command' && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-black p-2 rounded border border-border-color">
                        <span className="text-blue-400 font-mono select-none">$</span>
                        <input
                            type="text"
                            value={typeof block.data === 'object' ? block.data.cmd : block.data}
                            onChange={(e) => {
                                const newVal = e.target.value;
                                if (typeof block.data === 'object') {
                                    onContentChange({ ...block.data, cmd: newVal });
                                } else {
                                    onContentChange(newVal);
                                }
                            }}
                            placeholder="mkdir new_project"
                            className="flex-1 bg-transparent text-green-400 font-mono focus:outline-none"
                            dir="ltr"
                        />
                    </div>
                    {/* Style Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-secondary">Style:</label>
                        <select
                            value={typeof block.data === 'object' ? (block.data.style || 'linux') : 'linux'}
                            onChange={(e) => {
                                const newStyle = e.target.value;
                                const currentCmd = typeof block.data === 'object' ? block.data.cmd : block.data;
                                onContentChange({ cmd: currentCmd, style: newStyle });
                            }}
                            className="bg-surface-dark border border-border-color text-xs rounded px-2 py-1 text-text-secondary focus:border-primary-blue outline-none"
                        >
                            <option value="linux">Linux (Default)</option>
                            <option value="cmd">Windows CMD</option>
                            <option value="powershell">PowerShell</option>
                            <option value="cisco">Cisco IOS</option>
                        </select>
                    </div>
                </div>
            )}
            {block.type === 'terminal_output' && <textarea value={block.data} onChange={(e) => onContentChange(e.target.value)} placeholder="Command output..." rows="3" className="w-full rounded border border-border-color bg-black text-gray-300 p-2 font-mono focus:border-gray-500 outline-none" dir="ltr" />}
            {block.type === 'note' && <div className="space-y-2"><textarea value={block.data.en || ''} onChange={(e) => handleDataChange('en', e.target.value)} placeholder="ملاحظة إنجليزية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300 focus:border-red-500 outline-none" dir="ltr" /><textarea value={block.data.ar || ''} onChange={(e) => handleDataChange('ar', e.target.value)} placeholder="ملاحظة عربية..." rows="2" className="w-full rounded border border-red-500/50 bg-red-500/10 p-2 text-red-300 focus:border-red-500 outline-none" dir="rtl" /></div>}
            {block.type === 'orderedList' && <div className="space-y-2">{block.data.map((item, subIndex) => (<div key={subIndex} className="flex gap-2 items-center"><span className="text-text-secondary">{subIndex + 1}.</span><input type="text" value={typeof item === 'object' ? item.en : item} onChange={(e) => onListChange(subIndex, e.target.value)} className="flex-1 rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /><button type="button" onClick={() => removeListItem(subIndex)} className="text-red-500 hover:scale-125 transition-transform">&times;</button></div>))}<button type="button" onClick={addListItem} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full mt-2 hover:bg-primary-blue hover:text-white transition-colors">+ إضافة عنصر</button></div>}
            {block.type === 'videoEmbed' && <div className="space-y-2"><input type="url" defaultValue={block.data.url} onBlur={handleVideoUrlBlur} placeholder="https://www.youtube.com/watch?v=... (سيتم تحويله تلقائيًا)" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none text-left dir-ltr" /><input type="text" value={block.data.caption} onChange={(e) => handleDataChange('caption', e.target.value)} placeholder="عنوان الفيديو (اختياري)" className="w-full rounded border border-border-color bg-surface-dark p-2 focus:border-primary-blue outline-none" /></div>}

            {block.type === 'image' && (
                <div className="space-y-2">
                    <input
                        type="url"
                        value={block.data.url}
                        onChange={(e) => handleDataChange('url', e.target.value)}
                        placeholder="رابط الصورة (URL)..."
                        className="w-full rounded border border-border-color bg-surface-dark p-2 text-sm focus:border-primary-blue outline-none text-left dir-ltr"
                    />
                    <input
                        type="text"
                        value={block.data.caption}
                        onChange={(e) => handleDataChange('caption', e.target.value)}
                        placeholder="وصف الصورة (اختياري)..."
                        className="w-full rounded border border-border-color bg-surface-dark p-2 text-sm focus:border-primary-blue outline-none"
                    />
                    {block.data.url && (
                        <div className="mt-2 relative h-24 w-full rounded overflow-hidden border border-border-color bg-black/50 flex items-center justify-center">
                            <img src={block.data.url} alt="Preview" className="h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- SortableBlock (Standard) ---
const SortableBlock = (props) => { const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.block.id }); const style = { transform: CSS.Transform.toString(transform), transition }; return (<div ref={setNodeRef} style={style} className="relative group"> <button type="button" {...attributes} {...listeners} className="absolute top-3 right-3 cursor-grab p-2 opacity-20 group-hover:opacity-100 transition-opacity z-10 bg-surface-dark rounded hover:bg-border-color" title="اسحب للترتيب"> <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM13 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" /></svg> </button> <BlockEditor {...props} /> </div>); };

// --- useAutosave (Standard) ---
function useAutosave(data, onSave, delay = 3000) { const [status, setStatus] = useState('saved'); const isInitialMount = useRef(true); useEffect(() => { if (isInitialMount.current) { isInitialMount.current = false; return; } if (!data || !data.title) return; setStatus('unsaved'); const handler = setTimeout(() => { setStatus('saving'); onSave(data).then(() => { setStatus('saved'); toast.success('تم الحفظ تلقائياً!'); }); }, delay); return () => clearTimeout(handler); }, [JSON.stringify(data), onSave]); return status; }

export default function EditTopicPage({ params }) {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const topicId = resolvedParams.id;

    const [isLoading, setIsLoading] = useState(true);
    const [topicData, setTopicData] = useState({ title: '', materialSlug: '', order: 0, content: [] });
    const [allMaterials, setAllMaterials] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleAutoSave = useCallback(async (dataToSave) => {
        if (!topicId) return;
        setIsSaving(true);
        try {
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

            if (newTagsToCreate.length > 0) {
                const batch = writeBatch(db);
                newTagsToCreate.forEach(tag => {
                    const tagRef = doc(collection(db, 'tags'));
                    batch.set(tagRef, tag);
                });
                await batch.commit();
            }

            const contentToSave = dataToSave.content.map(({ id, ...rest }) => rest);

            if (topicId === 'new') {
                // Create new document
                const docRef = await addDoc(collection(db, 'topics'), {
                    ...dataToSave,
                    content: contentToSave,
                    tags: tagSlugs,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                toast.success("تم إنشاء الشرح بنجاح!");
                router.replace(`/admin/topics/${docRef.id}`);
            } else {
                // Update existing document
                const docRef = doc(db, 'topics', topicId);
                await updateDoc(docRef, {
                    ...dataToSave,
                    content: contentToSave,
                    tags: tagSlugs,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Autosave error: ", error);
            toast.error("فشل الحفظ التلقائي.");
        } finally {
            setIsSaving(false);
        }
    }, [topicId, selectedTags, router]);

    const saveStatus = useAutosave(topicData, handleAutoSave);

    useEffect(() => {
        if (!topicId) return;

        const fetchData = async () => {
            try {
                const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
                const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc'));
                const [materialsSnapshot, tagsSnapshot] = await Promise.all([getDocs(materialsQuery), getDocs(tagsQuery)]);

                const materialsList = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const tagsList = tagsSnapshot.docs.map(doc => ({ value: doc.data().slug, label: doc.data().name }));

                setAllMaterials(materialsList);
                setAllTags(tagsList);

                if (topicId === 'new') {
                    // Initialize for new topic
                    setTopicData({ title: '', materialSlug: '', order: 0, content: [] });
                    setIsLoading(false);
                    return;
                }

                const docRef = doc(db, 'topics', topicId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const validContent = Array.isArray(data.content) ? data.content : [];
                    const contentWithIds = validContent.map(block => ({ ...block, id: uuidv4() }));
                    setTopicData({ ...data, content: contentWithIds });

                    if (data.tags) {
                        const currentTags = data.tags.map(slug => tagsList.find(t => t.value === slug)).filter(Boolean);
                        setSelectedTags(currentTags);
                    }
                } else {
                    toast.error("الشرح غير موجود!");
                    router.push('/admin/topics');
                }
            } catch (error) {
                console.error(error);
                toast.error("فشل في جلب البيانات.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [topicId, router]);

    const handleFieldChange = (field, value) => { setTopicData(prev => ({ ...prev, [field]: value })); };
    const setContent = (newContent) => { setTopicData(prev => ({ ...prev, content: newContent })); };

    const addContentBlock = (type) => {
        let newBlockData;
        switch (type) {
            case 'subheading': newBlockData = { en: '', ar: '' }; break;
            case 'paragraph': newBlockData = { en: '', ar: '' }; break;
            case 'terminal_command': newBlockData = { cmd: '', style: 'linux' }; break;
            case 'terminal_output': newBlockData = ''; break;
            case 'note': newBlockData = { en: '', ar: '' }; break;
            case 'orderedList': newBlockData = ['']; break;
            case 'videoEmbed': newBlockData = { url: '', caption: '' }; break;
            case 'image': newBlockData = { url: '', caption: '' }; break;
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

    const selectStyles = { control: (s) => ({ ...s, backgroundColor: '#0a0a0f', borderColor: '#30363d', color: 'white' }), menu: (s) => ({ ...s, backgroundColor: '#0a0a0f' }), option: (s, { isFocused }) => ({ ...s, backgroundColor: isFocused ? '#1f6feb' : '#0a0a0f', color: '#e0e0e0' }), multiValue: (s) => ({ ...s, backgroundColor: '#1f6feb' }), multiValueLabel: (s) => ({ ...s, color: 'white' }), input: (s) => ({ ...s, color: 'white' }) };

    if (isLoading) return <p className="p-6 text-center">جاري تحميل بيانات الشرح...</p>;

    const safeContent = Array.isArray(topicData.content) ? topicData.content : [];

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6" dir="rtl">
                {/* Preview Section */}
                <div className="bg-background-dark border border-border-color rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[calc(100vh-100px)] sticky top-6 custom-scrollbar">
                    <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2 border-b border-border-color pb-4">
                        <span>👁️</span> معاينة حية
                    </h2>
                    <div className="prose prose-invert max-w-none">
                        <h1 className="text-4xl font-extrabold mb-4 text-text-primary">{topicData.title || 'عنوان الدرس...'}</h1>
                        {safeContent.map(block => (
                            <BlockPreview key={block.id} block={block} />
                        ))}
                    </div>
                </div>

                {/* Editor Section */}
                <div className="space-y-6">
                    <div className="bg-surface-dark p-6 rounded-xl border border-border-color shadow-lg">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-secondary mb-1">عنوان الدرس</label>
                            <input type="text" value={topicData.title} onChange={(e) => handleFieldChange('title', e.target.value)} className="w-full p-3 rounded-lg bg-background-dark border border-border-color focus:border-primary-blue outline-none text-lg font-bold" placeholder="مثال: مقدمة في الشبكات..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">المادة التابعة لها</label>
                                <select value={topicData.materialSlug} onChange={(e) => handleFieldChange('materialSlug', e.target.value)} className="w-full p-3 rounded-lg bg-background-dark border border-border-color focus:border-primary-blue outline-none">
                                    <option value="">اختر المادة...</option>
                                    {allMaterials.map(m => <option key={m.id} value={m.slug}>{m.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">الترتيب</label>
                                <input type="number" value={topicData.order} onChange={(e) => handleFieldChange('order', parseInt(e.target.value))} className="w-full p-3 rounded-lg bg-background-dark border border-border-color focus:border-primary-blue outline-none" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-secondary mb-1">الوسوم (Tags)</label>
                            <Select isMulti name="tags" options={allTags} value={selectedTags} onChange={setSelectedTags} className="basic-multi-select" classNamePrefix="select" placeholder="ابحث أو أضف وسوم..." styles={selectStyles} />
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-color">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAutoSave(topicData)}
                                    disabled={isSaving || (topicId === 'new' && !topicData.title)}
                                    className={`px-6 py-2 rounded font-bold transition-all ${isSaving ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary-blue hover:bg-blue-600 text-white shadow-lg hover:shadow-primary-blue/30'}`}
                                >
                                    {isSaving ? 'جاري الحفظ...' : (topicId === 'new' ? 'إنشاء الشرح' : 'حفظ التغييرات')}
                                </button>
                                <div className="text-sm text-text-secondary">
                                    {saveStatus === 'saved' && !isSaving && <span className="text-green-400 flex items-center gap-1">✓ تم الحفظ تلقائياً</span>}
                                    {saveStatus === 'unsaved' && !isSaving && <span className="text-red-400">تغييرات غير محفوظة</span>}
                                </div>
                            </div>
                            <button onClick={() => router.push('/admin/topics')} className="text-text-secondary hover:text-white transition-colors">إغلاق</button>
                        </div>
                    </div>

                    {/* Draggable Blocks */}
                    <SortableContext items={safeContent.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {safeContent.map((block, index) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    onContentChange={(data) => handleContentChange(block.id, data)}
                                    onRemove={() => removeContentBlock(block.id)}
                                    addListItem={() => addListItem(block.id)}
                                    removeListItem={(idx) => removeListItem(block.id, idx)}
                                    onListChange={(idx, val) => handleListChange(block.id, idx, val)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Add Block Buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sticky bottom-6 bg-surface-dark/90 backdrop-blur p-4 rounded-xl border border-border-color shadow-2xl z-20">
                        <button onClick={() => addContentBlock('subheading')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-primary-blue/20 hover:text-primary-blue transition-all border border-border-color">
                            <span className="text-xl font-bold">H2</span>
                            <span className="text-xs">عنوان فرعي</span>
                        </button>
                        <button onClick={() => addContentBlock('paragraph')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-primary-blue/20 hover:text-primary-blue transition-all border border-border-color">
                            <span className="text-xl">¶</span>
                            <span className="text-xs">نص</span>
                        </button>
                        <button onClick={() => addContentBlock('terminal_command')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-green-500/20 hover:text-green-400 transition-all border border-border-color">
                            <span className="text-xl font-mono">$</span>
                            <span className="text-xs">أمر</span>
                        </button>
                        <button onClick={() => addContentBlock('terminal_output')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-gray-500/20 hover:text-gray-400 transition-all border border-border-color">
                            <span className="text-xl font-mono">Run</span>
                            <span className="text-xs">مخرجات</span>
                        </button>
                        <button onClick={() => addContentBlock('note')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-red-500/20 hover:text-red-400 transition-all border border-border-color">
                            <span className="text-xl">!</span>
                            <span className="text-xs">ملاحظة</span>
                        </button>
                        <button onClick={() => addContentBlock('orderedList')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-primary-blue/20 hover:text-primary-blue transition-all border border-border-color">
                            <span className="text-xl">1.</span>
                            <span className="text-xs">قائمة</span>
                        </button>
                        <button onClick={() => addContentBlock('videoEmbed')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-red-600/20 hover:text-red-600 transition-all border border-border-color">
                            <span className="text-xl">▶</span>
                            <span className="text-xs">فيديو</span>
                        </button>
                        <button onClick={() => addContentBlock('image')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-background-dark hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-border-color">
                            <span className="text-xl">🖼️</span>
                            <span className="text-xs">صورة</span>
                        </button>
                    </div>
                </div>
            </div>
        </DndContext>
    );
}