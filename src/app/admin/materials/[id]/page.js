'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateMaterial } from '@/app/actions/materials'; // 1. استيراد الأكشن
import toast, { Toaster } from 'react-hot-toast';

const majorsList = [
  { id: 'CS', name: 'علوم الحاسب' },
  { id: 'IT', name: 'تقنية المعلومات' },
  { id: 'ISE', name: 'هندسة النظم' },
  { id: 'Common', name: 'سنة مشتركة' },
];

export default function EditMaterialPage() {
    const router = useRouter();
    const params = useParams();
    const materialId = params.id;
    
    const [isLoading, setIsLoading] = useState(true);
    const [materialData, setMaterialData] = useState(null); // حالة لتخزين البيانات
    
    // --- State للتخصصات ---
    const [targetMajors, setTargetMajors] = useState([]);

    useEffect(() => {
        if (!materialId) return;
        const fetchMaterial = async () => {
            const docRef = doc(db, 'materials', materialId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setMaterialData(data);
                setTargetMajors(data.targetMajors || []); // تحميل التخصصات المحفوظة
            } else {
                toast.error("المادة غير موجودة!");
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

    // 2. دالة وسيطة للتعامل مع الإرسال
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (targetMajors.length === 0) {
            toast.error('الرجاء اختيار تخصص واحد على الأقل.');
            return;
        }
        
        setIsLoading(true);
        const formData = new FormData(event.target);
        
        // استدعاء السيرفر أكشن
        const result = await updateMaterial(materialId, formData);

        if (result?.error) {
            toast.error(result.error);
            setIsLoading(false);
        }
    };

    if (isLoading || !materialData) {
        return <p>جاري تحميل بيانات المادة...</p>;
    }

    return (
        <div>
            <Toaster position="bottom-center" />
            <h1 className="text-3xl font-bold mb-8">تعديل المادة: {materialData.title}</h1>
            
            {/* 3. ربط الدالة بالنموذج */}
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان المادة</label>
                    <input type="text" id="title" name="title" defaultValue={materialData.title} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">الرابط (slug)</label>
                        <input type="text" id="slug" name="slug" defaultValue={materialData.slug} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required />
                    </div>
                    <div>
                        <label htmlFor="courseCode" className="block text-sm font-medium text-text-secondary mb-2">كود المادة</label>
                        <input type="text" id="courseCode" name="courseCode" defaultValue={materialData.courseCode} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label>
                        <input type="number" id="order" name="order" defaultValue={materialData.order} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required />
                    </div>
                    <div>
                        <label htmlFor="icon" className="block text-sm font-medium text-text-secondary mb-2">الأيقونة (Lucide)</label>
                        <input type="text" id="icon" name="icon" defaultValue={materialData.icon} className="w-full rounded-lg border border-border-color bg-surface-dark p-3" required />
                    </div>
                </div>
                
                <div className="pt-4 border-t border-border-color">
                    <label className="block text-sm font-medium text-text-secondary mb-3">التخصصات المستهدفة</label>
                    <div className="flex flex-wrap gap-4">
                        {majorsList.map((major) => (
                            <label key={major.id} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border-color bg-surface-dark">
                                <input
                                    type="checkbox"
                                    name="targetMajors"
                                    value={major.id}
                                    checked={targetMajors.includes(major.id)}
                                    onChange={() => handleMajorsChange(major.id)}
                                    className="h-4 w-4 rounded text-primary-blue bg-background-dark border-border-color focus:ring-primary-blue"
                                />
                                <span className="font-medium">{major.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="descriptionEn" className="block text-sm font-medium text-text-secondary mb-2">الوصف (EN)</label>
                    <textarea id="descriptionEn" name="descriptionEn" defaultValue={materialData.description.en} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3"></textarea>
                </div>
                <div>
                    <label htmlFor="descriptionAr" className="block text-sm font-medium text-text-secondary mb-2">الوصف (AR)</label>
                    <textarea id="descriptionAr" name="descriptionAr" defaultValue={materialData.description.ar} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3"></textarea>
                </div>
                
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