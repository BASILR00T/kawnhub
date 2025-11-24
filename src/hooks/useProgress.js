'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export function useProgress() {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات مرة واحدة
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'users', user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCompletedIds(docSnap.data()?.completedTopics || []);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  // دالة التبديل (تم / لم يتم)
  const toggleComplete = useCallback(async (topicId) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لحفظ تقدمك');
      return;
    }

    const userRef = doc(db, 'users', user.email);
    const isCompleted = completedIds.includes(topicId);

    try {
      // تحديث الحالة محلياً فوراً (Optimistic UI)
      if (isCompleted) {
        setCompletedIds(prev => prev.filter(id => id !== topicId));
      } else {
        setCompletedIds(prev => [...prev, topicId]);
      }

      // التحديث في القاعدة
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
          // إنشاء ملف احتياطي
          await setDoc(userRef, {
              email: user.email,
              role: 'student',
              completedTopics: [topicId],
              createdAt: new Date()
          }, { merge: true });
      } else {
          await updateDoc(userRef, {
             completedTopics: isCompleted ? arrayRemove(topicId) : arrayUnion(topicId)
          });
      }
      
      if (!isCompleted) toast.success('كفو! تم تسجيل إنجازك 🎉');

    } catch (error) {
      console.error("Progress Error:", error);
      toast.error('حدث خطأ في حفظ التقدم');
      // تراجع في حال الخطأ
      if (isCompleted) setCompletedIds(prev => [...prev, topicId]);
      else setCompletedIds(prev => prev.filter(id => id !== topicId));
    }
  }, [user, completedIds]);

  return { completedIds, toggleComplete, loading };
}