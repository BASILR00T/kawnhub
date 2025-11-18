'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// دالة لإنشاء مادة جديدة
export async function addMaterial(formData) {
  try {
    const title = formData.get('title');
    const slug = formData.get('slug');
    const courseCode = formData.get('courseCode');
    const order = Number(formData.get('order'));
    const icon = formData.get('icon');
    const descriptionEn = formData.get('descriptionEn');
    const descriptionAr = formData.get('descriptionAr');
    const targetMajors = formData.getAll('targetMajors'); // getAll لجلب المصفوفة

    const newMaterial = {
      title,
      slug,
      courseCode,
      order,
      icon,
      description: { en: descriptionEn, ar: descriptionAr },
      targetMajors,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'materials'), newMaterial);

    // ✅ الأهم: إخبار Vercel بتحديث هذه الصفحات
    revalidatePath('/hub'); // صفحة المنصة
    revalidatePath('/');   // صفحة الهبوط (للمواد المميزة)
    revalidatePath('/admin/materials'); // صفحة الإدارة

  } catch (error) {
    console.error("Error adding document: ", error);
    return { error: 'فشل إنشاء المادة' };
  }
  
  redirect('/admin/materials'); // إعادة توجيه بعد النجاح
}

// دالة لتعديل مادة
export async function updateMaterial(materialId, formData) {
  try {
    const updatedMaterial = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      courseCode: formData.get('courseCode'),
      order: Number(formData.get('order')),
      icon: formData.get('icon'),
      description: { 
        en: formData.get('descriptionEn'), 
        ar: formData.get('descriptionAr') 
      },
      targetMajors: formData.getAll('targetMajors')
    };

    const docRef = doc(db, 'materials', materialId);
    await updateDoc(docRef, updatedMaterial);

    // ✅ إخبار Vercel بالتحديث
    revalidatePath('/hub');
    revalidatePath('/');
    revalidatePath('/admin/materials');
    revalidatePath(`/materials/${updatedMaterial.slug}`); // تحديث صفحة المادة نفسها

  } catch (error) {
    console.error("Error updating document: ", error);
    return { error: 'فشل تحديث المادة' };
  }

  redirect('/admin/materials');
}

// دالة لحذف مادة
export async function deleteMaterial(materialId) {
  try {
    await deleteDoc(doc(db, 'materials', materialId));

    // ✅ إخبار Vercel بالتحديث
    revalidatePath('/hub');
    revalidatePath('/');
    revalidatePath('/admin/materials');
    
    return { success: 'تم حذف المادة بنجاح' };

  } catch (error) {
    console.error("Error deleting document: ", error);
    return { error: 'فشل حذف المادة' };
  }
}
