import SupportClient from '@/components/SupportClient';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export const metadata = {
  title: 'الدعم والمساعدة - KawnHub',
  description: 'تواصل معنا واحصل على إجابات لاستفساراتك',
};

// دالة جلب الداعمين (Server-Side)
async function getSupporters() {
  try {
    const q = query(collection(db, 'supporters'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // تحويل التاريخ لنص
      createdAt: doc.data().createdAt?.toDate().toISOString() || null
    }));
  } catch (error) {
    console.error("Error fetching supporters:", error);
    return [];
  }
}

export default async function SupportPage() {
  // جلب البيانات هنا
  const supporters = await getSupporters();

  // تمريرها للمكون
  return <SupportClient initialSupporters={supporters} />;
}