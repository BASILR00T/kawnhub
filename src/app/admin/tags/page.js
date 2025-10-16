'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// Icon Components
const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> );

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchTags = async () => {
        setIsLoading(true);
        const tagsCol = collection(db, 'tags');
        const q = query(tagsCol, orderBy('name', 'asc'));
        const tagsSnapshot = await getDocs(q);
        const tagsList = tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTags(tagsList);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (Submit logic remains the same)
        if (!newName || !newSlug) return alert('الرجاء ملء جميع الحقول.');
        setIsLoading(true);
        try {
            await addDoc(collection(db, 'tags'), { name: newName, slug: newSlug });
            setNewName(''); setNewSlug('');
            await fetchTags();
        } catch (error) {
            console.error("Error adding tag: ", error);
            alert('حدث خطأ أثناء إضافة الوسم.');
            setIsLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`هل أنت متأكد أنك تريد حذف الوسم: "${name}"؟`)) {
            try {
                await deleteDoc(doc(db, 'tags', id));
                setTags(tags.filter(tag => tag.id !== id));
            } catch (error) {
                console.error("Error removing tag: ", error);
                alert('حدث خطأ أثناء حذف الوسم.');
            }
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة الوسوم (Tags)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form for adding a new tag */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-bold mb-4">إضافة وسم جديد</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-surface-dark border border-border-color rounded-lg">
                        {/* ... Form fields remain the same ... */}
                        <div> <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">اسم الوسم (Name)</label> <input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> <div> <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">المعرّف (slug)</label> <input type="text" id="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div>
                        <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center rounded-md bg-primary-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90 disabled:bg-gray-500">
                            {isLoading ? 'جاري الحفظ...' : 'إضافة الوسم'}
                        </button>
                    </form>
                </div>
                {/* List of existing tags */}
                <div className="md:col-span-2">
                     <h2 className="text-xl font-bold mb-4">الوسوم الحالية</h2>
                     <div className="bg-surface-dark border border-border-color rounded-lg p-4 space-y-2">
                        {isLoading && tags.length === 0 ? <p className="text-text-secondary">جاري تحميل الوسوم...</p> : 
                        tags.map(tag => (
                            <div key={tag.id} className="flex justify-between items-center p-3 bg-background-dark rounded-md">
                                <div>
                                    <span className="font-bold">{tag.name}</span>
                                    <span className="text-xs text-text-secondary font-mono bg-black/30 px-2 py-1 rounded mr-3">{tag.slug}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link href={`/admin/tags/${tag.id}`} className="text-text-secondary hover:text-primary-blue"><EditIcon /></Link>
                                    <button onClick={() => handleDelete(tag.id, tag.name)} className="text-text-secondary hover:text-red-500"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
}