'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- 1. دالة نسخ الشرح ---
export async function duplicateTopicAction(originalTopicId) {
  try {
    // أ. جلب الشرح الأصلي
    const originalRef = doc(db, 'topics', originalTopicId);
    const originalSnap = await getDoc(originalRef);

    if (!originalSnap.exists()) {
      return { success: false, message: 'الشرح الأصلي غير موجود' };
    }

    const originalData = originalSnap.data();

    // ب. تجهيز البيانات الجديدة
    const newTopicData = {
      ...originalData, // نسخ كل الحقول (المحتوى، الوسوم، المادة...)
      title: `${originalData.title} (نسخة)`, // تمييز العنوان
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // ج. إنشاء المستند الجديد
    await addDoc(collection(db, 'topics'), newTopicData);

    // د. تحديث الكاش
    revalidatePath('/admin/topics');
    revalidatePath('/hub');

    return { success: true, message: 'تم استنساخ الشرح بنجاح' };

  } catch (error) {
    console.error("Duplication Error:", error);
    return { success: false, message: 'فشل عملية النسخ' };
  }
}

// --- 2. دالة حذف الشرح (سنحتاجها أيضاً) ---
export async function deleteTopicAction(topicId) {
  try {
    await deleteDoc(doc(db, 'topics', topicId));
    
    revalidatePath('/admin/topics');
    revalidatePath('/hub');
    
    return { success: true, message: 'تم حذف الشرح' };
  } catch (error) {
    return { success: false, message: 'فشل الحذف' };
  }
}