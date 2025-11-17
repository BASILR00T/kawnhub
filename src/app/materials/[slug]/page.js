import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import MaterialClient from '@/components/MaterialClient';
import { notFound } from 'next/navigation';

// --- 1. جلب بيانات المادة (مع الإصلاح) ---
async function getMaterial(slug) {
  const q = query(collection(db, 'materials'), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const data = snapshot.docs[0].data();
  // ✅ الحل: تحويل التاريخ هنا
  return {
    ...data,
    createdAt: data.createdAt?.toDate().toISOString() || null
  };
}

// --- 2. جلب الشروحات (الكود سليم من المرة السابقة) ---
async function getTopics(slug) {
  const q = query(collection(db, 'topics'), where('materialSlug', '==', slug), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
  }));
}

// --- 3. جلب شرح محدد (الكود سليم من المرة السابقة) ---
async function getTopicById(id) {
    if (!id) return null;
    const snap = await getDoc(doc(db, 'topics', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || null,
        updatedAt: data.updatedAt?.toDate().toISOString() || null,
    };
}

export default async function MaterialPage({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  const { slug } = awaitedParams;
  const topicId = awaitedSearchParams.topic; 

  const [material, topics] = await Promise.all([
    getMaterial(slug),
    getTopics(slug)
  ]);

  if (!material) {
    notFound(); 
  }

  let initialTopic = null;
  if (topicId) {
    initialTopic = await getTopicById(topicId);
  }
  
  if (!initialTopic && topics.length > 0) {
    initialTopic = topics[0];
  }

  return (
    <MaterialClient 
        material={material} 
        topics={topics} 
        initialTopic={initialTopic} 
    />
  );
}