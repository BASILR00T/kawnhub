import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import LandingPageClient from '@/components/LandingPageClient';

// --- 1. دالة جلب العدّاد ---
async function getVisitCount() {
    try {
        const visitDoc = await getDoc(doc(db, 'stats', 'visits'));
        // نتأكد من وجود البيانات وإلا نعيد 0
        return visitDoc.exists() ? visitDoc.data().count : 0;
    } catch (error) {
        console.error("Error fetching visit count: ", error);
        return 0;
    }
}

// --- 2. دالة جلب المواد المميزة (أول 3 مواد فقط) ---
async function getFeaturedMaterials() {
    try {
        const materialsRef = collection(db, 'materials');
        // ترتيب حسب order وجلب أول 3 فقط
        const q = query(materialsRef, orderBy('order', 'asc'), limit(3));
        const snapshot = await getDocs(q);
        
        // تحويل البيانات لنسق JSON بسيط
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching materials: ", error);
        return [];
    }
}

// --- مكون الخادم الرئيسي ---
export default async function LandingPage() {
    // جلب البيانات بشكل متوازي لسرعة التحميل
    const [visitsCount, featuredMaterials] = await Promise.all([
        getVisitCount(),
        getFeaturedMaterials()
    ]);

    // تمرير البيانات لمكون العميل
    return (
        <LandingPageClient 
            visitsCount={visitsCount} 
            featuredMaterials={featuredMaterials} 
        />
    );
}