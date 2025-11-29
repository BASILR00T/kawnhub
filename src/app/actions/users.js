'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// --- دالة الحفظ الشاملة (إنشاء أو تعديل) ---
export async function saveUserFull(formData) {
  const email = formData.get('email');
  const name = formData.get('name');
  const role = formData.get('role'); // 'student' | 'editor' | 'admin'
  const major = formData.get('major');

  if (!email || !role) return { success: false, message: 'البيانات الأساسية ناقصة' };

  try {
    // 1. التعامل مع القائمة البيضاء (Admins Collection)
    const adminRef = doc(db, 'admins', email);

    if (role === 'admin' || role === 'editor' || role === 'owner') {
      // إذا اخترت له رتبة إدارية، نضيفه للقائمة البيضاء
      await setDoc(adminRef, { email, role });
    } else {
      // إذا اخترت "طالب"، نحذفه من القائمة البيضاء (سحب صلاحيات)
      // لا تقلق، لن يحدث خطأ إذا لم يكن موجوداً
      await deleteDoc(adminRef);
    }

    // 2. تحديث الملف الشخصي (Users Collection)
    // هذا يضمن أن الاسم والتخصص يظهران بشكل صحيح في الموقع
    const userRef = doc(db, 'users', email);
    const userSnap = await getDoc(userRef);

    const userData = {
      email,
      role, // نحدث الرتبة هنا أيضاً للعرض
      ...(name && { name }), // نحدث الاسم فقط إذا تم إدخاله
      ...(major && { major }),
      updatedAt: serverTimestamp()
    };

    if (userSnap.exists()) {
      await updateDoc(userRef, userData);
    } else {
      // إذا كنا نضيف مستخدماً جديداً يدوياً وليس له حساب
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        photoURL: null, // صورة افتراضية
        favorites: []
      });
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'تم تحديث بيانات المستخدم والصلاحيات بنجاح' };

  } catch (error) {
    console.error("Save User Error:", error);
    return { success: false, message: `حدث خطأ: ${error.message}` };
  }
}

// --- دالة الحذف النهائي ---
export async function deleteUserAction(email) {
  try {
    // نحذف من المكانين لضمان التنظيف الكامل
    await deleteDoc(doc(db, 'admins', email));
    await deleteDoc(doc(db, 'users', email));

    revalidatePath('/admin/users');
    return { success: true, message: 'تم حذف المستخدم وكافة بياناته نهائياً' };
  } catch (error) {
    return { success: false, message: 'فشل الحذف' };
  }
}