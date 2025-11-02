import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import LandingPageClient from '@/components/LandingPageClient'; // نستورد المكون الجديد

// --- دالة جلب العدّاد (تعمل في الخادم) ---
async function getVisitCount() {
    try {
        const visitDoc = await getDoc(doc(db, 'stats', 'visits'));
        if (visitDoc.exists()) {
            return visitDoc.data().count;
        }
        return 0; // إذا لم يكن المستند موجودًا
    } catch (error) {
        console.error("Error fetching visit count: ", error);
        return 0; // نرجع صفرًا في حالة حدوث خطأ
    }
}

// --- صفحة الهبوط (مكون خادم) ---
export default async function LandingPage() {
    
    // 1. نجلب العدّاد من الخادم
    const visitsCount = await getVisitCount();

    // 2. نمرر العدّاد كـ prop إلى مكون العميل
    return (
        <LandingPageClient visitsCount={visitsCount} />
    );
}

