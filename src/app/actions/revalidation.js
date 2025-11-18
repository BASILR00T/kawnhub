'use server';

import { revalidatePath } from 'next/cache';

// هذه الدالة كل وظيفتها هي إجبار Vercel على تحديث الكاش لهذه المسارات
export async function revalidatePublicPages() {
  try {
    revalidatePath('/hub');        // صفحة المنصة الرئيسية
    revalidatePath('/');          // صفحة الهبوط (للمواد المميزة)
    revalidatePath('/admin/materials'); // صفحة إدارة المواد (احتياطي)
    
    // (لاحقاً، إذا أردت تحديث صفحة المادة نفسها، ستحتاج revalidatePath('/materials/[slug]'))
    
    return { success: true };
  } catch (error) {
    console.error("Revalidation Error:", error);
    return { success: false, error: 'فشل تحديث الكاش' };
  }
}