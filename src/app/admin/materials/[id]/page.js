'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditMaterialPage({ params }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const materialId = params.id;

    // State for form fields
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [order, setOrder] = useState(0);
    const [icon, setIcon] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');

    // Fetch the specific material's data when the page loads
    useEffect(() => {
        if (!materialId) return;

        const fetchMaterial = async () => {
            const docRef = doc(db, 'materials', materialId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setTitle(data.title);
                setSlug(data.slug);
                setCourseCode(data.courseCode || '');
                setOrder(data.order);
                setIcon(data.icon);
                setDescriptionEn(data.description.en);
                setDescriptionAr(data.description.ar);
            } else {
                alert("لا توجد مادة بهذا المعرف!");
                router.push('/admin/materials');
            }
            setIsLoading(false);
        };

        fetchMaterial();
    }, [materialId, router]);

    // Handle form submission to update the document
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const updatedMaterial = {
            title,
            slug,
            courseCode,
            order: Number(order),
            icon,
            description: { en: descriptionEn, ar: descriptionAr }
        };

        try {
            const docRef = doc(db, 'materials', materialId);
            await updateDoc(docRef, updatedMaterial);
            alert('تم تحديث المادة بنجاح!');
            router.push('/admin/materials');
        } catch (error) {
            console.error("Error updating document: ", error);
            alert('حدث خطأ أثناء تحديث المادة.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <p>جاري تحميل بيانات المادة...</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">تعديل المادة</h1>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* The form structure is identical to the "new" page */}
                <div> <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان المادة (باللغة الإنجليزية)</label> <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">الرابط (slug)</label> <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> <div> <label htmlFor="courseCode" className="block text-sm font-medium text-text-secondary mb-2">كود المادة</label> <input type="text" id="courseCode" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label> <input type="number" id="order" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> <div> <label htmlFor="icon" className="block text-sm font-medium text-text-secondary mb-2">اسم الأيقونة</label> <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> </div>
                <div> <label htmlFor="descriptionEn" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة الإنجليزية)</label> <textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea> </div>
                <div> <label htmlFor="descriptionAr" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة العربية)</label> <textarea id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea> </div>
                
                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90 disabled:bg-gray-500">
                        {isLoading ? 'جاري التحديث...' : 'حفظ التعديلات'}
                    </button>
                    <Link href="/admin/materials" className="text-sm font-medium text-text-secondary hover:underline">
                        إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}