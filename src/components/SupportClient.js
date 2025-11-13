'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ChevronDown, ChevronUp, HelpCircle, Coffee, Heart, CreditCard, Send } from 'lucide-react';
import { sendMessage } from '@/app/actions/support';
import toast from 'react-hot-toast';

// مكون السؤال والجواب
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
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="pb-4 text-text-secondary leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default function SupportClient() {
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

  return (
    <div className="mx-auto max-w-4xl p-6">
      
      {/* --- Header (للتنقل) --- */}
      <header className="mb-12 flex items-center justify-between py-4 border-b border-border-color/50">
        <Link href="/" className="text-3xl font-bold text-text-primary no-underline hover:opacity-80 transition-opacity">
          Kawn<span className="text-primary-blue">Hub</span>
        </Link>
        
        <nav className="flex items-center gap-6">
             <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium">
                المنصة
             </Link>
             <Link href="/lab" className="hidden sm:block text-text-secondary transition-colors hover:text-text-primary font-medium">
                المختبر 🧪
             </Link>
        </nav>
      </header>

      {/* --- عنوان الصفحة --- */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-text-primary">مركز المساعدة</h1>
        <p className="text-text-secondary text-lg">
          نحن هنا لدعم رحلتك التعليمية. تواصل معنا أو ساهم في استمرار المشروع.
        </p>
      </div>

      {/* --- قسم الدعم المادي (Donations) --- */}
      <div className="mb-16 relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-8 text-center">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-yellow-500/20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/10">
                <Coffee size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ادعم استمرار KawnHub</h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8">
                هذا المشروع قائم بجهود شخصية لخدمة الطلاب. 
                مساهمتك تساعدنا في تغطية تكاليف السيرفرات وتطوير الميزات القادمة.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
                <a 
                    href="#" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#0070BA] px-6 py-3 font-bold text-white transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20"
                >
                    <CreditCard size={20} />
                    <span>تبرع عبر PayPal</span>
                </a>

                <a 
                    href="#" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-surface-dark border border-border-color px-6 py-3 font-bold text-text-primary transition-transform hover:-translate-y-1 hover:border-primary-purple hover:text-primary-purple"
                >
                    <Heart size={20} />
                    <span>دعم عبر Ko-fi / دوكان</span>
                </a>
            </div>
        </div>
      </div>

      {/* --- الشبكة الرئيسية: تواصل + نموذج --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* العمود الأيمن */}
        <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Mail className="text-primary-blue" /> تواصل خارجي
            </h3>
            <a href="mailto:kawnhub@outlook.com" className="flex items-center gap-4 p-4 rounded-xl border border-border-color bg-surface-dark hover:border-primary-blue transition-colors">
                <div className="bg-primary-blue/10 p-2 rounded-lg text-primary-blue"><Mail size={20} /></div>
                <div>
                    <div className="font-bold text-sm">عبر الإيميل</div>
                    <div className="text-xs text-text-secondary">kawnhub@outlook.com</div>
                </div>
            </a>
            
            <div className="p-4 rounded-xl bg-surface-dark/50 border border-border-color text-center">
                <p className="text-xs text-text-secondary">
                    نرد عادةً خلال 24 ساعة.
                </p>
            </div>
        </div>

        {/* العمود الأيسر: نموذج المراسلة الداخلي */}
        <div className="lg:col-span-2">
            <div className="bg-surface-dark border border-border-color rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-blue to-primary-purple"></div>
                
                <h3 className="font-bold text-xl mb-2">راسلنا من هنا مباشرة 🚀</h3>
                <p className="text-text-secondary text-sm mb-6">رسالتك تصل للإدارة فوراً ويتم مراجعتها.</p>

                <form id="supportForm" action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">إيميلك (للرد عليك)</label>
                            <input type="email" name="email" required placeholder="ex: s2020...@jic.edu.sa" className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-sm focus:border-primary-blue outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">نوع الرسالة</label>
                            <select name="type" className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-sm focus:border-primary-blue outline-none">
                                <option value="suggestion">💡 اقتراح ميزة</option>
                                <option value="bug">🐛 تبليغ عن مشكلة</option>
                                <option value="other">📩 استفسار عام</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">الرسالة</label>
                        <textarea name="message" required rows="4" placeholder="اكتب تفاصيل رسالتك هنا..." className="w-full rounded-lg bg-background-dark border border-border-color p-3 text-sm focus:border-primary-blue outline-none"></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white font-bold py-3 rounded-lg hover:bg-primary-blue/90 transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'جاري الإرسال...' : <><span>إرسال</span> <Send size={18} /></>}
                    </button>
                </form>
            </div>
        </div>

      </div>

      {/* --- الأسئلة الشائعة (كاملة الآن) --- */}
      <div className="bg-surface-dark border border-border-color rounded-2xl p-8 mt-16">
        <div className="flex items-center gap-3 mb-8 border-b border-border-color pb-4">
          <HelpCircle className="text-primary-blue" />
          <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
        </div>
        
        <div className="flex flex-col">
          <FaqItem 
            question="هل المنصة مجانية بالكامل؟" 
            answer="نعم، النسخة الحالية (v2.0) مجانية بالكامل لجميع الطلاب. هدفنا هو توفير المعرفة للجميع." 
          />
          <FaqItem 
            question="كيف أبلغ عن خطأ في أمر أو شرح؟" 
            answer="نقدر حرصك! يمكنك استخدام نموذج المراسلة أعلاه واختيار 'تبليغ عن مشكلة'، وسنقوم بتصحيح الخطأ فوراً." 
          />
          <FaqItem 
            question="هل يمكنني المساهمة بالمحتوى؟" 
            answer="نرحب بمساهمات الطلاب المتميزين في كتابة وتدقيق الشروحات. تواصل معنا عبر نموذج المراسلة للتفاصيل." 
          />
          <FaqItem 
            question="متى سيتم إطلاق المختبر التفاعلي؟" 
            answer="نحن نعمل عليه حالياً! من المتوقع إطلاقه في النسخة القادمة (v3.0) وسيكون نقلة نوعية في التدريب العملي." 
          />
           <FaqItem 
            question="كيف سيتم استخدام التبرعات؟" 
            answer="جميع المساهمات تذهب مباشرة لدفع فواتير الاستضافة، قواعد البيانات، وتطوير الميزات القادمة." 
          />
        </div>
      </div>
    </div>
  );
}