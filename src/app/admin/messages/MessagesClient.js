'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // استيراد الكونتكست
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Mail, Bug, Lightbulb, Inbox, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessagesClient() {
  const { user } = useAuth(); // 1. جلب المستخدم
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. لا تقم بالجلب إلا إذا كان المستخدم موجوداً (مسجل دخول)
    if (!user) return;

    const fetchMessages = async () => {
      try {
        // جلب البيانات
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        // 3. تعريف المتغير data (هذا ما كان ناقصاً)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? 
            doc.data().createdAt.toDate().toLocaleDateString('ar-EG', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) : 'تاريخ غير معروف'
        }));
        
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        // عرض رسالة خطأ توضيحية
        if (error.code === 'permission-denied') {
            toast.error("ليس لديك صلاحية لعرض الرسائل.");
        } else if (error.code === 'failed-precondition') {
            toast.error("يجب إنشاء فهرس (Index) في Firebase.");
            console.log("Check console for Index Link");
        } else {
            toast.error("فشل جلب الرسائل.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]); // إعادة التشغيل عند تغيير حالة المستخدم

  const getTypeStyle = (type) => {
    switch(type) {
      case 'bug': 
        return { icon: <Bug size={18} />, color: 'text-red-400', bg: 'bg-red-500/10', label: 'بلاغ عن مشكلة' };
      case 'suggestion': 
        return { icon: <Lightbulb size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'اقتراح' };
      default: 
        return { icon: <Mail size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'استفسار عام' };
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary-blue" size={32} />
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-text-primary">
          <Inbox className="text-primary-blue" /> 
          صندوق الوارد
        </h1>
        <div className="text-sm font-medium text-text-secondary bg-surface-dark px-4 py-2 rounded-full border border-border-color">
          إجمالي الرسائل: <span className="text-primary-blue font-bold">{messages.length}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const style = getTypeStyle(msg.type);
            return (
              <div key={msg.id} className="bg-surface-dark border border-border-color rounded-xl p-6 transition hover:border-primary-blue/50 group relative overflow-hidden">
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${style.bg.replace('/10', '')}`}></div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${style.bg} ${style.color} border border-white/5`}>
                      {style.icon}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-text-primary flex items-center gap-2">
                        {msg.email}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-secondary mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {msg.createdAt}</span>
                        <span className={`px-2 py-0.5 rounded-md ${style.bg} ${style.color} font-bold`}>
                            {style.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a href={`mailto:${msg.email}?subject=رد على رسالتك في KawnHub`} className="hidden md:flex items-center gap-2 text-sm font-bold text-primary-blue bg-primary-blue/10 px-4 py-2 rounded-lg hover:bg-primary-blue hover:text-white transition-all">
                    <Mail size={16} /> الرد الآن
                  </a>
                </div>

                <div className="bg-background-dark/50 p-4 rounded-lg border border-white/5 text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </div>

                <div className="mt-4 md:hidden">
                   <a href={`mailto:${msg.email}`} className="text-sm text-primary-blue font-bold">الرد عبر الإيميل &larr;</a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-surface-dark border border-dashed border-border-color rounded-2xl">
            <div className="inline-flex p-4 rounded-full bg-background-dark mb-4 text-text-secondary">
                <Inbox size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">صندوق الوارد فارغ</h3>
            <p className="text-text-secondary mt-2">لا توجد رسائل جديدة من الطلاب حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}