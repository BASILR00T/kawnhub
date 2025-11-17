'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast'; // استيراد toast

// قائمة التخصصات الثابتة
const majorsList = [
  { id: 'CS', name: 'علوم الحاسب' },
  { id: 'IT', name: 'تقنية المعلومات' },
  { id: 'ISE', name: 'هندسة النظم' },
  { id: 'Common', name: 'سنة مشتركة' },
];

export default function NewMaterialPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // State للنموذج
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [order, setOrder] = useState(1);
    const [icon, setIcon] = useState('BookOpen'); // أيقونة افتراضية
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    
    // --- ✅ 1. State جديد للتخصصات ---
    const [targetMajors, setTargetMajors] = useState([]);

    // --- ✅ 2. دالة للتعامل مع مربعات الاختيار ---
    const handleMajorsChange = (majorId) => {
        setTargetMajors((prev) => 
            prev.includes(majorId) 
              ? prev.filter(m => m !== majorId) // إزالة التحديد
              : [...prev, majorId] // إضافة التحديد
        );
    };

    // --- 3. تحديث دالة الحفظ (تستخدم addDoc) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (targetMajors.length === 0) {
            toast.error('الرجاء اختيار تخصص واحد على الأقل لهذه المادة.');
            return;
        }
        setIsLoading(true);

        const newMaterial = {
            title,
            slug,
            courseCode,
            order: Number(order),
            icon,
            description: { en: descriptionEn, ar: descriptionAr },
            targetMajors: targetMajors, // إضافة التخصصات
            createdAt: serverTimestamp() // إضافة تاريخ الإنشاء
        };

        try {
            await addDoc(collection(db, 'materials'), newMaterial);
            toast.success('تم إنشاء المادة بنجاح!');
            router.push('/admin/materials');
        } catch (error) {
            console.error("Error adding document: ", error);
            toast.error('حدث خطأ أثناء إنشاء المادة.');
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Toaster position="bottom-center" />
            <h1 className="text-3xl font-bold mb-8">إضافة مادة جديدة</h1>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                
                {/* (باقي الحقول: العنوان، الكود، ... الخ) */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان المادة (باللغة الإنجليزية)</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">الرابط (slug)</label>
                        <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="network-1" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required />
                    </div>
                    <div>
                        <label htmlFor="courseCode" className="block text-sm font-medium text-text-secondary mb-2">كود المادة</label>
                        <input type="text" id="courseCode" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="NET-212" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label>
                        <input type="number" id="order" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required />
                    </div>
                    <div>
                        <label htmlFor="icon" className="block text-sm font-medium text-text-secondary mb-2">اسم الأيقونة (Lucide)</label>
                        <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Network" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required />
                    </div>
                </div>
                
                {/* --- ✅ 4. قسم اختيار التخصصات --- */}
                <div className="pt-4 border-t border-border-color">
                    <label className="block text-sm font-medium text-text-secondary mb-3">التخصصات المستهدفة (اختر واحد أو أكثر)</label>
                    <div className="flex flex-wrap gap-4">
                        {majorsList.map((major) => (
                            <label key={major.id} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border-color bg-surface-dark hover:bg-background-dark">
                                <input
                                    type="checkbox"
                                    checked={targetMajors.includes(major.id)}
                                    onChange={() => handleMajorsChange(major.id)}
                                    className="h-4 w-4 rounded text-primary-blue bg-background-dark border-border-color focus:ring-primary-blue"
                                />
                                <span className="font-medium">{major.name} ({major.id})</span>
                            </label>
                        ))}
                    </div>
                </div>
                {/* --- نهاية القسم --- */}

                <div>
                    <label htmlFor="descriptionEn" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة الإنجليزية)</label>
                    <textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea>
                </div>
                <div>
                    <label htmlFor="descriptionAr" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة العربية)</label>
                    <textarea id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90 disabled:bg-gray-500">
                        {isLoading ? 'جاري الإنشاء...' : 'إنشاء المادة'}
                    </button>
                    <Link href="/admin/materials" className="text-sm font-medium text-text-secondary hover:underline">
                        إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}