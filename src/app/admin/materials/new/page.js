'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; //  الخطوة 1: نستورد الـ router للتنقل
import { db } from '@/lib/firebase'; // نستورد اتصال قاعدة البيانات
import { collection, addDoc } from 'firebase/firestore'; // نستورد أدوات الكتابة

export default function NewMaterialPage() {
    const router = useRouter(); // نجهز الـ router
    const [isLoading, setIsLoading] = useState(false); // حالة لتتبع عملية الحفظ

    // نفس متغيرات الحالة السابقة لتخزين قيم النموذج
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [order, setOrder] = useState(0);
    const [icon, setIcon] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');

    //  الخطوة 2: نحدّث دالة الحفظ لتكون 'async' وتتصل بـ Firebase
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // نبدأ عملية التحميل

        // نجهز البيانات بالشكل الصحيح لقاعدة البيانات
        const newMaterial = {
            title,
            slug,
            courseCode,
            order: Number(order), // نتأكد أن الترتيب هو رقم
            icon,
            description: { en: descriptionEn, ar: descriptionAr }
        };

        try {
            // نرسل البيانات إلى مجموعة 'materials'
            await addDoc(collection(db, 'materials'), newMaterial);
            alert('تم حفظ المادة بنجاح!');
            router.push('/admin/materials'); // نرجع المستخدم لصفحة إدارة المواد
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('حدث خطأ أثناء حفظ المادة. يرجى مراجعة الـ console.');
            setIsLoading(false); // نوقف التحميل في حال حدوث خطأ
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إضافة مادة جديدة</h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* ... (حقول النموذج تبقى كما هي بدون تغيير) ... */}
                <div> <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">عنوان المادة (باللغة الإنجليزية)</label> <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">الرابط (slug)</label> <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> <div> <label htmlFor="courseCode" className="block text-sm font-medium text-text-secondary mb-2">كود المادة</label> <input type="text" id="courseCode" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label htmlFor="order" className="block text-sm font-medium text-text-secondary mb-2">الترتيب</label> <input type="number" id="order" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> <div> <label htmlFor="icon" className="block text-sm font-medium text-text-secondary mb-2">اسم الأيقونة</label> <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50" required /> </div> </div>
                <div> <label htmlFor="descriptionEn" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة الإنجليزية)</label> <textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea> </div>
                <div> <label htmlFor="descriptionAr" className="block text-sm font-medium text-text-secondary mb-2">الوصف (باللغة العربية)</label> <textarea id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows="3" className="w-full rounded-lg border border-border-color bg-surface-dark p-3 text-text-primary focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/50"></textarea> </div>

                {/* الخطوة 3: نعدل الأزرار لتعكس حالة التحميل */}
                <div className="flex items-center gap-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="inline-flex items-center gap-2 rounded-md bg-primary-blue px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-blue/90 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'جاري الحفظ...' : 'حفظ المادة'}
                    </button>
                    <Link href="/admin/materials" className="text-sm font-medium text-text-secondary hover:underline">
                        إلغاء
                    </Link>
                </div>
            </form>
        </div>
    );
}