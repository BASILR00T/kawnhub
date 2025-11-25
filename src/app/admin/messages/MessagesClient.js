'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Mail, Bug, Lightbulb, Inbox, Calendar, Loader2, CheckCircle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessagesClient() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // DEBUG: Removed orderBy to check if index is the issue
      const q = query(collection(db, 'messages'));
      const querySnapshot = await getDocs(q);
      console.log("Fetched messages count:", querySnapshot.size);

      const msgs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAtRaw: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن'
        };
      });

      // Sort manually in client using raw date
      msgs.sort((a, b) => b.createdAtRaw - a.createdAtRaw);

      setMessages(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error.code === 'failed-precondition') {
        toast.error("مطلوب إنشاء فهرس (Index) في Firebase. راجع الكونسول.");
        console.log("Create index link:", error.message);
      } else {
        toast.error("فشل تحميل الرسائل: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: true } : msg));
      toast.success('تم نقل الرسالة للأرشيف');
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'bug':
        return { icon: <Bug size={18} />, color: 'text-red-400', bg: 'bg-red-500/10', label: 'بلاغ عن مشكلة' };
      case 'suggestion':
        return { icon: <Lightbulb size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'اقتراح' };
      default:
        return { icon: <Mail size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'استفسار عام' };
    }
  };

  const filteredMessages = messages.filter(msg => showArchived ? msg.read : !msg.read);

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
          {showArchived ? 'الأرشيف' : 'صندوق الوارد'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${showArchived ? 'bg-primary-blue text-white' : 'bg-surface-dark text-text-secondary hover:bg-white/5'}`}
          >
            <Archive size={16} />
            {showArchived ? 'عرض الوارد' : 'الأرشيف'}
          </button>
          <button onClick={fetchMessages} className="text-sm font-bold text-primary-blue hover:bg-primary-blue/10 px-3 py-1.5 rounded-lg transition-colors">
            تحديث
          </button>
          <div className="text-sm font-medium text-text-secondary bg-surface-dark px-4 py-2 rounded-full border border-border-color">
            العدد: <span className="text-primary-blue font-bold">{filteredMessages.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
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

                  <div className="flex items-center gap-2">
                    {!msg.read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="flex items-center gap-2 text-sm font-bold text-green-400 bg-green-500/10 px-4 py-2 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                        title="نقل للأرشيف"
                      >
                        <CheckCircle size={16} /> تمت القراءة
                      </button>
                    )}
                    <a href={`mailto:${msg.email}?subject=رد على رسالتك في KawnHub`} className="hidden md:flex items-center gap-2 text-sm font-bold text-primary-blue bg-primary-blue/10 px-4 py-2 rounded-lg hover:bg-primary-blue hover:text-white transition-all">
                      <Mail size={16} /> الرد الآن
                    </a>
                  </div>
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
            <h3 className="text-xl font-bold text-text-primary">{showArchived ? 'الأرشيف فارغ' : 'صندوق الوارد فارغ'}</h3>
            <p className="text-text-secondary mt-2">{showArchived ? 'لم تقم بأرشفة أي رسائل بعد.' : 'لا توجد رسائل جديدة من الطلاب حتى الآن.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}