import React, { Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import HubInterface from '@/components/HubInterface';

//  دالة مساعدة لتحويل البيانات المعقدة إلى بسيطة (Serializable)
function serializeData(doc) {
    const data = doc.data();
    //  نتأكد من أن كل حقول الوقت تتحول إلى نص
    const serializedData = { id: doc.id };
    for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
            serializedData[key] = data[key].toDate().toISOString();
        } else {
            serializedData[key] = data[key];
        }
    }
    return serializedData;
}

// دالة لجلب كل البيانات من السيرفر
async function getHubData() {
  try {
    const materialsQuery = query(collection(db, 'materials'), orderBy('order', 'asc'));
    const tagsQuery = query(collection(db, 'tags'), orderBy('name', 'asc'));
    
    //  الخطوة 1: تحديث الاستعلام ليقرأ 'updatedAt'
    //  هذا سيجلب الشروحات مرتبة من الأحدث (سواء تم إنشاؤها أو تعديلها)
    const topicsQuery = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'));
    
    //  الخطوة 2: استعلام منفصل لأحدث شرح
    const latestTopicQuery = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'), limit(1));

    const [materialsSnapshot, topicsSnapshot, tagsSnapshot, latestTopicSnapshot] = await Promise.all([
      getDocs(materialsQuery),
      getDocs(topicsQuery),
      getDocs(tagsQuery),
      getDocs(latestTopicQuery)
    ]);

    const materials = materialsSnapshot.docs.map(serializeData);
    const topics = topicsSnapshot.docs.map(serializeData);
    const tags = tagsSnapshot.docs.map(serializeData);
    
    const latestTopic = latestTopicSnapshot.empty ? null : serializeData(latestTopicSnapshot.docs[0]);

    return { materials, topics, tags, latestTopic };
  } catch (error) {
    console.error("Error fetching hub data: ", error);
    return { materials: [], topics: [], tags: [], latestTopic: null };
  }
}

// هذا الآن Server Component
export default async function HubPage() {
  // 1. جلب البيانات في السيرفر
  const { materials, topics, tags, latestTopic } = await getHubData();

  // 2. تمرير البيانات البسيطة كـ props إلى مكون العميل
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-xl text-text-secondary">جاري تحميل المنصة...</p>
        </div>
    }>
      <HubInterface 
        initialMaterials={materials}
        initialTopics={topics}
        initialTags={tags}
        initialLatestTopic={latestTopic}
      />
    </Suspense>
  );
}