'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// إضافة أو تحديث مستخدم
export async function saveUser(formData) {
  const email = formData.get('email');
  const role = formData.get('role'); // 'admin' | 'editor' | 'student'

  if (!email || !role) return { success: false, message: 'البيانات ناقصة' };

  try {
    // نستخدم الإيميل كـ ID للمستند لضمان عدم التكرار
    await setDoc(doc(db, 'admins', email), {
      email,
      role,
      updatedAt: new Date()
    });

    // تحديث البيانات في الصفحة فوراً
    revalidatePath('/admin/users');
    return { success: true, message: 'تم حفظ المستخدم بنجاح' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'حدث خطأ أثناء الحفظ' };
  }
}

// حذف مستخدم
export async function deleteUser(email) {
  try {
    await deleteDoc(doc(db, 'admins', email));
    revalidatePath('/admin/users');
    return { success: true, message: 'تم حذف المستخدم' };
  } catch (error) {
    return { success: false, message: 'فشل الحذف' };
  }
}