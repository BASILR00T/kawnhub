import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import LandingPageClient from '@/components/LandingPageClient';

// 1. دالة جلب العداد
async function getVisitCount() {
  try {
    const visitDoc = await getDoc(doc(db, 'stats', 'visits'));
    return visitDoc.exists() ? visitDoc.data().count : 0;
  } catch (error) {
    console.error("Error fetching visits:", error);
    return 0;
  }
}

// 2. دالة جلب المواد (مع الإصلاح)
async function getFeaturedMaterials() {
  try {
    const materialsRef = collection(db, 'materials');
    const q = query(materialsRef, orderBy('order', 'asc'), limit(3)); 
    const snapshot = await getDocs(q);
    
    // ✅ الحل: تحويل البيانات (Serialization)
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // تحويل أي تاريخ إلى نص آمن
            createdAt: data.createdAt?.toDate().toISOString() || null
        };
    });
  } catch (error) {
    console.error("Error fetching featured materials:", error);
    return [];
  }
}

export default async function LandingPage() {
  const [visitsCount, featuredMaterials] = await Promise.all([
    getVisitCount(),
    getFeaturedMaterials()
  ]);

  return (
    <LandingPageClient 
      visitsCount={visitsCount} 
      featuredMaterials={featuredMaterials} 
    />
  );
}