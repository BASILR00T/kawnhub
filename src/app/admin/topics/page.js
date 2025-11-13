'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; //  الخطوة 1: نستورد 'useRouter'
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'; //  الخطوة 2: نستورد 'addDoc' و 'serverTimestamp'
import toast, { Toaster } from 'react-hot-toast';

// --- (Icon Components remain the same) ---
const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );

export default function TopicsPage() {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false); //  حالة لمنع الضغط المتكرر
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter(); //  نجهز الـ router

    useEffect(() => {
        const q = query(collection(db, 'topics'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const topicsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTopics(topicsList);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching topics: ", error);
            toast.error('فشل في جلب الشروحات!');
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id, title) => {
        // ... (handleDelete logic remains the same)
        if (window.confirm(`هل أنت متأكد أنك تريد حذف الشرح: "${title}"؟`)) {
            const toastId = toast.loading('جاري الحذف...');
            try {
                await deleteDoc(doc(db, 'topics', id));
                toast.success('تم حذف الشرح بنجاح.', { id: toastId });
            } catch (error) {
                console.error("Error removing topic: ", error);
                toast.error('حدث خطأ أثناء الحذف.', { id: toastId });
            }
        }
    };

    //  الخطوة 3: إنشاء دالة "الإنشاء الفوري"
    const handleCreateDraft = async () => {
        setIsCreating(true);
        const toastId = toast.loading('جاري إنشاء مسودة جديدة...');
        
        try {
            //  إنشاء مستند مسودة بقيم افتراضية
            const timestamp = serverTimestamp();
            const newTopicData = {
                title: "شرح جديد (مسودة)",
                materialSlug: "", //  يتركه فارغًا ليختاره المستخدم
                order: 99,
                content: [],
                tags: [],
                createdAt: timestamp,
                updatedAt: timestamp
            };

            const docRef = await addDoc(collection(db, 'topics'), newTopicData);
            
            toast.success('تم إنشاء المسودة!', { id: toastId });
            
            //  الخطوة 4: التوجيه فورًا إلى صفحة التعديل
            router.push(`/admin/topics/${docRef.id}`);
            
        } catch (error) {
            console.error("Error creating draft: ", error);
            toast.error('فشل في إنشاء المسودة.', { id: toastId });
            setIsCreating(false);
        }
    };

    const filteredTopics = topics.filter(topic =>
        (topic.title && topic.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (topic.materialSlug && topic.materialSlug.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) return <p className="p-8 text-center text-text-secondary">جاري تحميل الشروحات...</p>;

    return (
        <div>
            <Toaster position="bottom-center" />
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">إدارة الشروحات</h1>
                <div className="flex items-center gap-4">
                    <input 
                        type="text" 
                        placeholder="ابحث بالعنوان أو المادة..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-lg border border-border-color bg-surface-dark p-2 text-sm w-48 text-text-primary focus:ring-2 focus:ring-primary-blue focus:outline-none"
                    />
                    {/* الخطوة 5: تحويل الرابط إلى زر ذكي */}
                    <button
                        onClick={handleCreateDraft}
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-sm font-bold text-white transition-transform duration-200 hover:scale-105 shadow-lg shadow-primary-blue/30 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <span>{isCreating ? 'جاري الإنشاء...' : 'إضافة شرح جديد'}</span>
                    </button>
                </div>
            </div>
            {/* ... (Table rendering remains the same) ... */}
            <div className="bg-surface-dark border border-border-color rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-black/20"><tr className="rtl:text-right ltr:text-left">
                        <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">عنوان الشرح</th>
                        <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">المادة</th>
                        <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">الترتيب</th>
                        <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider"># الكتل</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr></thead>
                    <tbody className="divide-y divide-border-color">
                        {filteredTopics.length > 0 ? filteredTopics.map((topic) => (
                            <tr key={topic.id} className="rtl:text-right ltr:text-left hover:bg-black/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{topic.title}</td>
                                <td className="px-6 py-4 whitespace-nowP text-sm text-text-secondary font-mono">{topic.materialSlug}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{topic.order}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{Array.isArray(topic.content) ? topic.content.length : 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-4">
                                        <Link href={`/admin/topics/${topic.id}`} className="text-text-secondary hover:text-primary-blue transition-colors"><EditIcon /></Link>
                                        <button onClick={() => handleDelete(topic.id, topic.title)} className="text-text-secondary hover:text-red-500 transition-colors"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="text-center py-10 text-text-secondary">
                                {searchTerm ? "لا توجد نتائج بحث مطابقة." : "لا توجد شروحات حاليًا. قم بإضافة أول شرح لك!"}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}