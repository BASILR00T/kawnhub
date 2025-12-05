import Link from 'next/link';
import { Terminal, Bot, Rocket, Code, GraduationCap } from 'lucide-react';

export const metadata = {
    title: 'KawnHub V2 - القادم مذهل',
    description: 'نظرة أولية على النسخة الجديدة من منصة كون هب. تجربة تعليمية تفاعلية بالكامل.',
};

export default function V2PromoPage() {
    return (
        <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative selection:bg-primary-purple selection:text-white">

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary-blue/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-primary-purple/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] left-[50%] w-[20vw] h-[20vw] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">

                {/* Badge */}
                <div className="mb-8 animate-fade-in-up">
                    <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-primary-blue shadow-lg shadow-primary-blue/10">
                        ✨ قادمة قريباً
                    </span>
                </div>

                {/* Hero Text */}
                <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight animate-fade-in-up delay-100 font-arabic bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400">
                    مستقبل التعليم التقني <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-purple">بين يديك</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 text-center max-w-2xl mb-12 animate-fade-in-up delay-200 font-arabic leading-relaxed">
                    نعمل في الكواليس لبناء تجربة تعليمية لا تكتفي بالمشاهدة فقط.
                    في <span className="text-white font-bold">KawnHub V2</span>، أنت المبرمج، وأنت المدير، وأنت المبدع.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-16 animate-fade-in-up delay-300">
                    <FeatureCard
                        icon={<Terminal className="w-8 h-8" />}
                        title="مختبرات تفاعلية"
                        desc="طبق ما تعلمته فوراً. تيرمنال لينكس ومحرر أكواد بايثون مدمج مباشرة في المتصفح."
                        color="bg-green-500/10 text-green-400 border-green-500/20"
                    />
                    <FeatureCard
                        icon={<Bot className="w-8 h-8" />}
                        title="مساعد ذكي AI"
                        desc="واجهت مشكلة في الكود؟ مساعدنا الذكي جاهز لشرح الخطأ واقتراح الحلول في ثوانٍ."
                        color="bg-primary-purple/10 text-primary-purple border-primary-purple/20"
                    />
                    <FeatureCard
                        icon={<Rocket className="w-8 h-8" />}
                        title="سرعة فائقة"
                        desc="واجهة جديدة كلياً، مبنية بأحدث تقنيات الويب لضمان تصفح سلس وبدون انقطاع."
                        color="bg-primary-blue/10 text-primary-blue border-primary-blue/20"
                    />
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center gap-4 animate-fade-in-up delay-500">
                    <div className="p-[1px] rounded-2xl bg-gradient-to-r from-primary-blue to-primary-purple">
                        <div className="bg-[#050507] rounded-2xl p-1">
                            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-blue/20 to-primary-purple/20 hover:from-primary-blue/30 hover:to-primary-purple/30 text-white font-bold transition-all duration-300 backdrop-blur-sm border border-white/5 font-arabic text-lg">
                                انتظرونا قريباً 🚀
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-arabic">
                        بالتوفيق في اختباراتكم النهائية!
                    </p>
                </div>

            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }) {
    return (
        <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl ${color.replace('text-', 'shadow-')}/5 border-white/5 bg-white/5 group`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} transition-colors`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 font-arabic text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                {title}
            </h3>
            <p className="text-gray-400 font-arabic text-sm leading-relaxed">
                {desc}
            </p>
        </div>
    );
}
