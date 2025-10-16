'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditTagPage({ params }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const tagId = params.id;

    // State for form fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    // Fetch the specific tag's data
    useEffect(() => {
        if (!tagId) return;
        const fetchTag = async () => {
            const docRef = doc(db, 'tags', tagId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setName(data.name);
                setSlug(data.slug);
            } else {
                alert("لا يوجد وسم بهذا المعرف!");
                router.push('/admin/tags');
            }
            setIsLoading(false);
        };
        fetchTag();
    }, [tagId, router]);

    // Handle form submission to update the document
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const docRef = doc(db, 'tags', tagId);
            await updateDoc(docRef, { name, slug });
            alert('تم تحديث الوسم بنجاح!');
            router.push('/admin/tags');
        } catch (error) {
            console.error("Error updating document: ", error);
            alert('حدث خطأ أثناء تحديث الوسم.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <p>جاري تحميل بيانات الوسم...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">تعديل الوسم</h1>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl p-8 bg-surface-dark border border-border-color rounded-lg">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">اسم الوسم (Name)</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required />
                </div>
                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">المعرّف (slug)</label>
                    <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-background-dark p-3" required />
                </div>
                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white disabled:bg-gray-500">
                        {isLoading ? 'جاري التحديث...' : 'حفظ التعديلات'}
                    </button>
                    <Link href="/admin/tags" className="text-sm font-medium text-text-secondary hover:underline">
                        إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}