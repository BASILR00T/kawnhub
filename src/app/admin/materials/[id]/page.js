'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// ✅ 1. استيراد useParams
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const majorsList = [
  { id: 'CS', name: 'علوم الحاسب' },
  { id: 'IT', name: 'تقنية المعلومات' },
  { id: 'ISE', name: 'هندسة النظم' },
  { id: 'Common', name: 'سنة مشتركة' },
];

export default function EditMaterialPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    // ✅ 2. استخدام الهوك لجلب params
    const params = useParams();
    const materialId = params.id;

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [order, setOrder] = useState(0);
    const [icon, setIcon] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [targetMajors, setTargetMajors] = useState([]);

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
                setTargetMajors(data.targetMajors || []);
            } else {
                toast.error("لا توجد مادة بهذا المعرف!");
                router.push('/admin/materials');
            }
            setIsLoading(false);
        };

        fetchMaterial();
    }, [materialId, router]);

    const handleMajorsChange = (majorId) => {
        setTargetMajors((prev) => 
            prev.includes(majorId) 
              ? prev.filter(m => m !== majorId)
              : [...prev, majorId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (targetMajors.length === 0) {
            toast.error('الرجاء اختيار تخصص واحد على الأقل.');
            return;
        }
        setIsLoading(true);

        const updatedMaterial = {
            title,
            slug,
            courseCode,
            order: Number(order),
            icon,
            description: { en: descriptionEn, ar: descriptionAr },
            targetMajors: targetMajors
        };

        try {
            const docRef = doc(db, 'materials', materialId);
            await updateDoc(docRef, updatedMaterial);
            toast.success('تم تحديث المادة بنجاح!');
            router.push('/admin/materials');
        } catch (error) {
            console.error("Error updating document: ", error);
            toast.error('حدث خطأ أثناء تحديث المادة.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <p>جاري تحميل بيانات المادة...</p>;
    }

    return (
        <div>
            <Toaster position="bottom-center" />
            <h1 className="text-3xl font-bold mb-8">تعديل المادة</h1>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                
                {/* ... (باقي الحقول كما هي) ... */}
                <div> <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان المادة</label> <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required /> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">الرابط (slug)</label> <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required /> </div> <div> <label htmlFor="courseCode" className="block text-sm font-medium text-text-secondary mb-2">كود المادة</label> <input type="text" id="courseCode" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required /> </div> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label> <input type="number" id="order" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required /> </div> <div> <label htmlFor="icon" className="block text-sm font-medium text-text-secondary mb-2">الأيقونة</label> <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required /> </div> </div>
                
                <div className="pt-4 border-t border-border-color">
                    <label className="block text-sm font-medium text-text-secondary mb-3">التخصصات المستهدفة</label>
                    <div className="flex flex-wrap gap-4">
                        {majorsList.map((major) => (
                            <label key={major.id} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border-color bg-surface-dark">
                                <input
                                    type="checkbox"
                                    checked={targetMajors.includes(major.id)}
                                    onChange={() => handleMajorsChange(major.id)}
                                    className="h-4 w-4 rounded text-primary-blue bg-background-dark border-border-color focus:ring-primary-blue"
                                />
                                <span className="font-medium">{major.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div> <label htmlFor="descriptionEn" className="block text-sm font-medium text-text-secondary mb-2">الوصف (EN)</label> <textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3"></textarea> </div>
                <div> <label htmlFor="descriptionAr" className="block text-sm font-medium text-text-secondary mb-2">الوصف (AR)</label> <textarea id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3"></textarea> </div>
                
                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white">
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