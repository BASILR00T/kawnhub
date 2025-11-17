'use client';

import { useState, useEffect, useCallback } from 'react'; // 1. استيراد useCallback
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore'; // 2. استيراد getDoc
import toast from 'react-hot-toast';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. تغيير من "مراقبة" (onSnapshot) إلى "جلب مرة واحدة" (getDoc)
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'users', user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBookmarkedIds(docSnap.data()?.favorites || []);
        } else {
          setBookmarkedIds([]); // لا يوجد ملف (مثل الأدمن)
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]); // يعمل مرة واحدة عند تحميل المستخدم

  const toggleBookmark = useCallback(async (topicId) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لحفظ الشروحات');
      return;
    }

    const userRef = doc(db, 'users', user.email);
    const isBookmarked = bookmarkedIds.includes(topicId);

    try {
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // إنشاء ملف للأدمن (كما فعلنا سابقاً)
        await setDoc(userRef, {
            email: user.email,
            name: user.displayName || 'Admin',
            role: 'admin',
            favorites: [topicId],
            createdAt: new Date(),
        });
        setBookmarkedIds([topicId]); // 4. تحديث الحالة محلياً
        toast.success('تم الحفظ في المفضلة');
      } else {
        // تحديث عادي
        if (isBookmarked) {
          await updateDoc(userRef, { favorites: arrayRemove(topicId) });
          setBookmarkedIds(prev => prev.filter(id => id !== topicId)); // 4. تحديث الحالة محلياً
          toast.success('تمت الإزالة من المفضلة');
        } else {
          await updateDoc(userRef, { favorites: arrayUnion(topicId) });
          setBookmarkedIds(prev => [...prev, topicId]); // 4. تحديث الحالة محلياً
          toast.success('تم الحفظ في المفضلة');
        }
      }
    } catch (error) {
      console.error("Bookmark Error:", error);
      toast.error('حدث خطأ، حاول لاحقاً');
    }
  }, [user, bookmarkedIds]); // 5. إضافة bookmarkedIds للـ dependency

  return { bookmarkedIds, toggleBookmark, loading };
}