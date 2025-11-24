'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { Edit, Trash2, Copy, Plus, FileText, Loader2 } from 'lucide-react';

export default function TopicsPage() {
    const [topics, setTopics] = useState([]);
    const [materials, setMaterials] = useState({}); // لتخزين أسماء المواد
    const [isLoading, setIsLoading] = useState(true);

    // جلب البيانات
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. جلب الشروحات
            const topicsQ = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'));
            const topicsSnap = await getDocs(topicsQ);
            const topicsData = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. جلب المواد (لربط الـ Slug بالاسم)
            const matSnap = await getDocs(collection(db, 'materials'));
            const matMap = {};
            matSnap.docs.forEach(doc => {
                const data = doc.data();
                matMap[data.slug] = data.title;
            });

            setMaterials(matMap);
            setTopics(topicsData);
        } catch (error) {
            console.error(error);
            toast.error('فشل جلب البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- دالة التعامل مع النسخ (Client Side) ---
    const handleDuplicate = async (id, title) => {
        if (!confirm(`هل تريد استنساخ "${title}"؟`)) return;
        const toastId = toast.loading('جاري استنساخ الشرح...');

        try {
            // 1. جلب الشرح الأصلي
            const originalRef = doc(db, 'topics', id);
            const originalSnap = await getDoc(originalRef);

            if (!originalSnap.exists()) {
                throw new Error('الشرح الأصلي غير موجود');
            }

            const originalData = originalSnap.data();

            // 2. تجهيز البيانات الجديدة
            // نحذف الـ ID القديم ونحدث التواريخ
            const { id: _, ...dataToCopy } = originalData;

            const newTopicData = {
                ...dataToCopy,
                title: `${originalData.title} (نسخة)`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // 3. إنشاء المستند
            await addDoc(collection(db, 'topics'), newTopicData);

            toast.success('تم استنساخ الشرح بنجاح');
            fetchData(); // تحديث القائمة
        } catch (error) {
            console.error("Duplicate Error:", error);
            toast.error('فشل عملية النسخ: ' + error.message);
        } finally {
            toast.dismiss(toastId);
        }
    };

    // --- دالة التعامل مع الحذف (Client Side) ---
    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الشرح؟')) return;

        const toastId = toast.loading('جاري الحذف...');
        try {
            await deleteDoc(doc(db, 'topics', id));
            toast.success('تم حذف الشرح');
            fetchData();
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error('فشل الحذف');
        } finally {
            toast.dismiss(toastId);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-blue" size={32} /></div>;

    return (
        <div className="space-y-6">
            <Toaster position="bottom-center" />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">إدارة الشروحات</h1>
                <Link
                    href="/admin/topics/new"
                    className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-blue/90 transition-colors"
                >
                    <Plus size={20} /> إضافة شرح جديد
                </Link>
            </div>

            <div className="bg-surface-dark border border-border-color rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                    <thead className="bg-black/20 text-text-secondary border-b border-border-color">
                        <tr>
                            <th className="p-4 font-medium">عنوان الشرح</th>
                            <th className="p-4 font-medium">المادة</th>
                            <th className="p-4 font-medium">آخر تحديث</th>
                            <th className="p-4 font-medium text-left">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {topics.map((topic) => (
                            <tr key={topic.id} className="hover:bg-white/5 transition group">
                                <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                                    <FileText size={16} className="text-primary-blue" />
                                    {topic.title}
                                </td>
                                <td className="p-4 text-text-secondary">
                                    <span className="bg-primary-purple/10 text-primary-purple px-2 py-1 rounded text-xs border border-primary-purple/20">
                                        {materials[topic.materialSlug] || topic.materialSlug}
                                    </span>
                                </td>
                                <td className="p-4 text-text-secondary font-mono text-xs">
                                    {topic.updatedAt?.toDate ? topic.updatedAt.toDate().toLocaleDateString('ar-EG') : '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/admin/topics/${topic.id}`} className="p-2 rounded-lg text-text-secondary hover:text-primary-blue hover:bg-primary-blue/10 transition" title="تعديل">
                                            <Edit size={16} />
                                        </Link>

                                        <button
                                            onClick={() => handleDuplicate(topic.id, topic.title)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-green-400 hover:bg-green-500/10 transition"
                                            title="استنساخ (Copy)"
                                        >
                                            <Copy size={16} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(topic.id)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition"
                                            title="حذف"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {topics.length === 0 && (
                            <tr><td colSpan="4" className="p-12 text-center text-text-secondary">لا توجد شروحات مضافة.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}