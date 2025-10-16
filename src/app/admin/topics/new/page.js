'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

export default function NewTopicPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // State for form fields
    const [title, setTitle] = useState('');
    const [materialSlug, setMaterialSlug] = useState('');
    const [order, setOrder] = useState(0);
    const [content, setContent] = useState([]);

    // State for dropdown options
    const [allMaterials, setAllMaterials] = useState([]);
    
    useEffect(() => {
        const fetchData = async () => {
            const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
            const materialsSnapshot = await getDocs(materialsQuery);
            setAllMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // --- Content Block Functions ---
    const addContentBlock = (type) => {
        let newBlock;
        switch (type) {
            case 'subheading': //  الكتلة الجديدة: عنوان فرعي
                newBlock = { type: 'subheading', data: '' };
                break;
            case 'paragraph':
                newBlock = { type: 'paragraph', data: { en: '', ar: '' } };
                break;
            case 'ciscoTerminal':
                newBlock = { type: 'ciscoTerminal', data: '' };
                break;
            default:
                return;
        }
        setContent([...content, newBlock]);
    };

    const handleContentChange = (index, field, value) => {
        const updatedContent = [...content];
        if (typeof updatedContent[index].data === 'object' && updatedContent[index].data !== null) {
            updatedContent[index].data[field] = value;
        } else {
            updatedContent[index].data = value;
        }
        setContent(updatedContent);
    };
    
    const removeContentBlock = (index) => {
        const updatedContent = content.filter((_, i) => i !== index);
        setContent(updatedContent);
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const newTopic = { title, materialSlug, order: Number(order), content };

        try {
            await addDoc(collection(db, 'topics'), newTopic);
            alert('تم حفظ الشرح بنجاح!');
            router.push('/admin/topics');
        } catch (error) {
            console.error("Error adding topic: ", error);
            alert('حدث خطأ أثناء حفظ الشرح.');
            setIsLoading(false);
        }
    };

    if (isLoading) return <p>جاري تحميل البيانات...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إضافة شرح جديد</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Section */}
                <div className="p-6 bg-surface-dark border border-border-color rounded-lg">
                    <h2 className="text-xl font-bold mb-4">المعلومات الأساسية</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان الشرح (باللغة الإنجليزية)</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="material" className="block text-sm font-medium text-text-secondary mb-2">المادة التابع لها</label>
                                <select id="material" value={materialSlug} onChange={(e) => setMaterialSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required>
                                    <option value="">اختر مادة...</option>
                                    {allMaterials.map(mat => <option key={mat.id} value={mat.slug}>{mat.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label>
                                <input type="number" id="order" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Blocks Section */}
                <div className="p-6 bg-surface-dark border border-border-color rounded-lg">
                     <h2 className="text-xl font-bold mb-4">محتوى الشرح (الكتل)</h2>
                     <div className="space-y-6">
                        {content.map((block, index) => (
                            <div key={index} className="p-4 border border-border-color rounded bg-background-dark relative">
                                <button type="button" onClick={() => removeContentBlock(index)} className="absolute top-2 left-2 text-red-500 text-xl font-bold">&times;</button>
                                
                                {/* عرض حقل العنوان الفرعي الجديد */}
                                {block.type === 'subheading' && (
                                    <div>
                                        <label className="text-xs text-text-secondary">عنوان فرعي</label>
                                        <input type="text" placeholder="مثال: SSH Configuration" value={block.data} onChange={(e) => handleContentChange(index, null, e.target.value)} className="w-full rounded-md border border-border-color bg-surface-dark p-2 font-bold text-lg"></input>
                                    </div>
                                )}

                                {block.type === 'paragraph' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-secondary">فقرة نصية</label>
                                        <textarea placeholder="النص بالإنجليزية" value={block.data.en} onChange={(e) => handleContentChange(index, 'en', e.target.value)} rows="3" className="w-full rounded-md border border-border-color bg-surface-dark p-2"></textarea>
                                        <textarea placeholder="النص بالعربية" value={block.data.ar} onChange={(e) => handleContentChange(index, 'ar', e.target.value)} rows="3" className="w-full rounded-md border border-border-color bg-surface-dark p-2"></textarea>
                                    </div>
                                )}
                                 {block.type === 'ciscoTerminal' && (
                                    <div>
                                         <label className="text-xs text-text-secondary">كتلة أوامر Cisco</label>
                                        <textarea placeholder="...router>" value={block.data} onChange={(e) => handleContentChange(index, null, e.target.value)} rows="5" className="w-full rounded-md border border-border-color bg-black font-mono text-green-400 p-2"></textarea>
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                     <div className="mt-6 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-secondary">إضافة كتلة جديدة:</span>
                        {/* إضافة زر العنوان الفرعي الجديد */}
                        <button type="button" onClick={() => addContentBlock('subheading')} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">عنوان فرعي</button>
                        <button type="button" onClick={() => addContentBlock('paragraph')} className="text-xs bg-primary-blue/20 text-primary-blue px-3 py-1 rounded-full">فقرة نصية</button>
                        <button type="button" onClick={() => addContentBlock('ciscoTerminal')} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">أوامر Cisco</button>
                     </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white disabled:bg-gray-500">
                        {isLoading ? 'جاري الحفظ...' : 'حفظ الشرح'}
                    </button>
                    <Link href="/admin/topics" className="text-sm font-medium text-text-secondary hover:underline">إلغاء</Link>
                </div>
            </form>
        </div>
    );
}