'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod'; // 1. استيراد zod

// 2. تعريف مخطط التحقق (Schema)
const schema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  type: z.enum(['suggestion', 'bug', 'other'], { message: "نوع الرسالة غير مقبول" }),
  // نحدد الحد الأقصى 500 حرف لتجنب تخزين نصوص ضخمة
  message: z.string().min(10, { message: "الرسالة قصيرة جداً" }).max(1000, { message: "الرسالة طويلة جداً" }).trim(),
});

export async function sendMessage(formData) {
  // استخراج البيانات الخام
  const rawData = {
    email: formData.get('email'),
    type: formData.get('type'),
    message: formData.get('message'),
  };

  // 3. التحقق من البيانات
  const validatedFields = schema.safeParse(rawData);

  // إذا فشل التحقق، نرجع رسالة الخطأ الأولى
  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.issues[0].message
    };
  }

  try {
    // نستخدم البيانات النظيفة (validatedFields.data) فقط
    await addDoc(collection(db, 'messages'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
      read: false,
    });

    return { success: true, message: 'تم إرسال رسالتك بنجاح!' };
  } catch (error) {
    console.error("Support Error:", error);
    return { success: false, message: 'حدث خطأ تقني، حاول لاحقاً.' };
  }
}