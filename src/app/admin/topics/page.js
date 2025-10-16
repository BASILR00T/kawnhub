'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );

export default function TopicsPage() {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTopics = async () => {
        const topicsCol = collection(db, 'topics');
        const q = query(topicsCol, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const handleDelete = async (id, title) => {
        if (window.confirm(`هل أنت متأكد أنك تريد حذف الشرح: "${title}"؟`)) {
            try {
                await deleteDoc(doc(db, 'topics', id));
                setTopics(topics.filter(topic => topic.id !== id));
                alert('تم حذف الشرح بنجاح.');
            } catch (error) {
                console.error("Error removing topic: ", error);
                alert('حدث خطأ أثناء حذف الشرح.');
            }
        }
    };

    if (isLoading) return <p>جاري تحميل الشروحات...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">إدارة الشروحات</h1>
                <Link href="/admin/topics/new" className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90">
                    <span>إضافة شرح جديد</span>
                </Link>
            </div>
            <div className="bg-surface-dark border border-border-color rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-black/20">
                         <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">عنوان الشرح</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">المادة التابع لها</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">الترتيب</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {topics.length > 0 ? topics.map((topic) => (
                            <tr key={topic.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{topic.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">{topic.materialSlug}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{topic.order}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-4">
                                        <Link href={`/admin/topics/${topic.id}`} className="text-text-secondary hover:text-primary-blue transition-colors">
                                            <EditIcon />
                                        </Link>
                                        <button onClick={() => handleDelete(topic.id, topic.title)} className="text-text-secondary hover:text-red-500 transition-colors">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center py-10 text-text-secondary">لا توجد شروحات حاليًا. قم بإضافة أول شرح لك!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}