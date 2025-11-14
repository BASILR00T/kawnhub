'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ChevronDown, ChevronUp, HelpCircle, Coffee, Heart, Send, ShoppingBag, ScanLine, Crown, Star, Copy } from 'lucide-react';
import { sendMessage } from '@/app/actions/support';
import toast from 'react-hot-toast';

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border-color last:border-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-right transition-colors hover:text-primary-blue"
      >
        <span className="font-bold text-lg">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="pb-4 text-text-secondary leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export default function SupportClient({ initialSupporters = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const result = await sendMessage(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success(result.message);
      document.getElementById('supportForm').reset();
    } else {
      toast.error(result.message);
    }
  };

  const copyEmail = () => {
      navigator.clipboard.writeText('support@kawnhub.com');
      toast.success('تم نسخ الإيميل!');
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      
      {/* Header */}
      <header className="mb-12 flex items-center justify-between py-4 border-b border-border-color/50">
        <Link href="/" className="text-3xl font-bold text-text-primary no-underline hover:opacity-80 transition-opacity">
          Kawn<span className="text-primary-blue">Hub</span>
        </Link>
        <nav className="flex items-center gap-6">
             <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium">المنصة</Link>
             <Link href="/lab" className="hidden sm:block text-text-secondary transition-colors hover:text-text-primary font-medium">المختبر 🧪</Link>
        </nav>
      </header>

      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-text-primary">مركز المساعدة</h1>
        <p className="text-text-secondary text-lg">نحن هنا لدعم رحلتك التعليمية. تواصل معنا أو ساهم في استمرار المشروع.</p>
      </div>

      {/* --- القسم الأول: الشبكة (دعم + قائمة الشرف) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* بطاقة الدعم (دُكان) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-yellow-500/20 blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between h-full">
                <div className="flex-1 text-center md:text-right">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/10">
                        <Coffee size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">ادعم استمرار KawnHub</h2>
                    <p className="text-text-secondary mb-6 leading-relaxed text-sm">
                        المشروع قائم بجهود شخصية. مساهمتك عبر "دُكان" تساعدنا في دفع فواتير السيرفرات.
                    </p>
                    <div className="flex justify-center md:justify-start">
                        <a href="https://tip.dokan.sa/ibesooo" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl bg-[#7E22CE] px-6 py-3 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/30 hover:bg-[#6B21A8]">
                            <ShoppingBag size={20} />
                            <span>دعم عبر دُكان تب</span>
                            <Heart size={16} className="text-pink-300 group-hover:animate-pulse" />
                        </a>
                    </div>
                </div>
                <div className="flex-shrink-0 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white p-3 rounded-lg shadow-2xl transform transition-transform group-hover:scale-[1.02]">
                        <Image src="/images/dokkan-qr.svg" alt="Scan to Support" width={130} height={130} className="rounded-md" />
                        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-800">
                            <ScanLine size={12} /> <span>امسح للدعم السريع</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* قائمة الشرف الجانبية */}
        <div className="lg:col-span-1 bg-surface-dark border border-yellow-500/20 rounded-2xl p-6 flex flex-col h-full min-h-[300px]">
            <div className="flex items-center gap-2 mb-4 border-b border-yellow-500/10 pb-3">
                <Crown className="text-yellow-400" size={20} />
                <h3 className="font-bold text-text-primary text-lg">أبطال KawnHub</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                {initialSupporters.length > 0 ? (
                    initialSupporters.map((supporter) => (
                        <div key={supporter.id} className="flex items-center gap-3 p-2 rounded-lg bg-background-dark/50 hover:bg-yellow-500/10 transition-colors border border-transparent hover:border-yellow-500/20">
                            <div className="bg-yellow-500/10 p-1.5 rounded-full text-yellow-400 shrink-0">
                                <Star size={12} fill="currentColor" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary leading-tight">{supporter.name}</p>
                                <p className="text-[10px] text-text-secondary mt-0.5">
                                    {new Date(supporter.createdAt).toLocaleDateString('ar-EG')}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-text-secondary">
                        <div className="inline-block p-3 rounded-full bg-yellow-500/5 mb-2 text-yellow-500/50">
                            <Star size={24} />
                        </div>
                        <p className="text-sm">كن أول من يخلد اسمه هنا! 🌟</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-border-color/50 text-center">
                <p className="text-[10px] text-yellow-500/60">شكراً لكل من ساهم في رحلتنا ❤️</p>
            </div>
        </div>
      </div>

      {/* --- القسم الثاني: التواصل (تم توسيعه ليأخذ العرض الكامل) --- */}
      <div className="mb-16"> {/* ✅ تمت إزالة max-w-3xl ليأخذ العرض الكامل */}
        <div className="bg-surface-dark border border-border-color rounded-2xl p-8 relative overflow-hidden shadow-lg">
            {/* شريط علوي جمالي */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-blue via-purple-500 to-primary-blue"></div>
            
            <div className="text-center mb-8">
                <h3 className="font-bold text-2xl mb-2 flex items-center justify-center gap-2">
                    <Send className="text-primary-blue" size={24} /> 
                    تواصل معنا
                </h3>
                <p className="text-text-secondary text-sm">
                    واجهت مشكلة؟ عندك اقتراح؟ أرسل لنا رسالة وسنرد عليك في أقرب وقت.
                </p>
            </div>

            <form id="supportForm" action={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">إيميلك (للرد عليك)</label>
                        <input type="email" name="email" required placeholder="example@jic.edu.sa" className="w-full rounded-xl bg-background-dark border border-border-color p-3.5 text-sm focus:border-primary-blue outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">نوع الرسالة</label>
                        <select name="type" className="w-full rounded-xl bg-background-dark border border-border-color p-3.5 text-sm focus:border-primary-blue outline-none transition-all">
                            <option value="suggestion">💡 اقتراح ميزة جديدة</option>
                            <option value="bug">🐛 تبليغ عن مشكلة</option>
                            <option value="other">📩 استفسار عام</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5">الرسالة</label>
                    <textarea name="message" required rows="5" placeholder="اكتب تفاصيل رسالتك هنا..." className="w-full rounded-xl bg-background-dark border border-border-color p-3.5 text-sm focus:border-primary-blue outline-none transition-all"></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white font-bold py-4 rounded-xl hover:bg-primary-blue/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary-blue/20 disabled:opacity-50 disabled:transform-none">
                    {isSubmitting ? 'جاري الإرسال...' : <><span>إرسال الرسالة</span> <Send size={18} /></>}
                </button>
            </form>

            {/* قسم الإيميل */}
            <div className="mt-8 pt-6 border-t border-border-color/50 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-text-secondary">
                <span>تفضل استخدام الإيميل؟</span>
                <button 
                    onClick={copyEmail} 
                    className="flex items-center gap-2 text-text-primary hover:text-primary-blue font-mono bg-background-dark border border-border-color px-3 py-1.5 rounded-lg transition-colors"
                    title="نسخ الإيميل"
                >
                    <Mail size={14} />
                    BSA717@outlook.sa
                    <Copy size={12} className="opacity-50" />
                </button>
            </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-surface-dark border border-border-color rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-border-color pb-4">
          <HelpCircle className="text-primary-blue" />
          <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
        </div>
        <div className="flex flex-col">
          <FaqItem question="هل المنصة مجانية بالكامل؟" answer="نعم، النسخة الحالية (v2.0) مجانية بالكامل لجميع الطلاب." />
          <FaqItem question="كيف أبلغ عن خطأ في أمر أو شرح؟" answer="نقدر حرصك! يمكنك استخدام نموذج المراسلة أعلاه واختيار 'تبليغ عن مشكلة'." />
          <FaqItem question="هل يمكنني المساهمة بالمحتوى؟" answer="نرحب بمساهمات الطلاب المتميزين. تواصل معنا عبر النموذج للتفاصيل." />
          <FaqItem question="متى سيتم إطلاق المختبر التفاعلي؟" answer="نحن نعمل عليه حالياً! من المتوقع إطلاقه في النسخة القادمة (v3.0)." />
           <FaqItem question="كيف سيتم استخدام الدعم المادي؟" answer="جميع المساهمات تذهب لدفع فواتير الاستضافة وتطوير المشروع." />
        </div>
      </div>
    </div>
  );
}