'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Code, Cpu, Globe, Check, Sparkles } from 'lucide-react';

// قائمة التخصصات المتاحة
const majors = [
  { id: 'CS', name: 'علوم الحاسب', icon: Code, desc: 'Computer Science' },
  { id: 'IT', name: 'تقنية المعلومات', icon: Globe, desc: 'Information Technology' },
  { id: 'ISE', name: 'هندسة النظم', icon: Cpu, desc: 'ISE / SWE' },
  { id: 'Common', name: 'مشترك / أخرى', icon: GraduationCap, desc: 'Common Year / Others' },
];

export default function MajorSelector() {
  const { user, updateMajor } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // تظهر النافذة فقط إذا:
    // 1. المستخدم مسجل دخول (user exists)
    // 2. ليس أدمن (not admin)
    // 3. لم يختر تخصصاً من قبل (!user.major)
    if (user && !user.isAdmin && !user.major) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    await updateMajor(selected); // استدعاء دالة التحديث من AuthContext
    setIsSaving(false);
    setIsOpen(false); // إغلاق النافذة
  };

  // إذا لم تنطبق الشروط، لا نعرض شيئاً
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-surface-dark border border-border-color rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative">
        
        {/* زخرفة خلفية */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-blue via-purple-500 to-primary-blue"></div>

        <div className="p-8 text-center border-b border-border-color/50 bg-gradient-to-b from-primary-blue/5 to-transparent">
          <div className="mx-auto w-16 h-16 bg-primary-blue/20 rounded-full flex items-center justify-center text-primary-blue mb-4 shadow-lg shadow-primary-blue/20">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">حدّد مسارك الدراسي</h2>
          <p className="text-text-secondary text-lg">
            ساعدنا نرتب لك المواد ونعرض لك اللي يهمك أول بأول.
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {majors.map((major) => {
              const Icon = major.icon;
              const isSelected = selected === major.id;
              return (
                <button
                  key={major.id}
                  onClick={() => setSelected(major.id)}
                  className={`relative flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-200 group ${
                    isSelected 
                      ? 'border-primary-blue bg-primary-blue/10 shadow-lg shadow-primary-blue/10 scale-[1.02]' 
                      : 'border-border-color bg-background-dark hover:border-primary-blue/50 hover:bg-surface-dark'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-primary-blue text-white rounded-full p-1 shadow-md animate-in zoom-in">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  <div className={`p-3 rounded-full mb-3 transition-colors ${isSelected ? 'bg-primary-blue text-white' : 'bg-surface-dark text-text-secondary group-hover:text-primary-blue'}`}>
                    <Icon size={28} />
                  </div>
                  <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-text-primary'}`}>{major.name}</span>
                  <span className="text-xs text-text-secondary mt-1 font-mono opacity-70">{major.desc}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={!selected || isSaving}
            className="w-full py-4 rounded-xl bg-primary-blue text-white font-bold text-lg shadow-lg shadow-primary-blue/25 hover:bg-primary-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {isSaving ? 'جاري حفظ إعداداتك...' : 'تأكيد واختيار التخصص'}
          </button>
        </div>

      </div>
    </div>
  );
}