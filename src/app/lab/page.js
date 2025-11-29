'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TerminalComponent from '@/components/lab/TerminalComponent';
import { CheckCircle, Circle, Terminal, BookOpen, ArrowRight } from 'lucide-react';

const challenges = [
    {
        id: 1,
        title: 'البداية: استكشاف الملفات',
        description: 'استخدم الأمر ls لعرض الملفات الموجودة في المجلد الحالي.',
        hint: 'اكتب ls ثم اضغط Enter',
        check: (history) => history.some(h => h.content === 'ls')
    },
    {
        id: 2,
        title: 'إنشاء مجلد جديد',
        description: 'قم بإنشاء مجلد جديد باسم "projects".',
        hint: 'استخدم الأمر mkdir projects',
        check: (history) => history.some(h => h.content && h.content.includes('mkdir projects'))
    },
    {
        id: 3,
        title: 'الدخول للمجلد',
        description: 'ادخل إلى المجلد الذي أنشأته للتو.',
        hint: 'استخدم الأمر cd projects',
        check: (history) => history.some(h => h.content && h.content.includes('cd projects'))
    },
    {
        id: 4,
        title: 'إنشاء ملف',
        description: 'أنشئ ملفاً جديداً باسم "app.py" داخل المجلد.',
        hint: 'استخدم الأمر touch app.py',
        check: (history) => history.some(h => h.content && h.content.includes('touch app.py'))
    },
    {
        id: 5,
        title: 'أين أنا؟',
        description: 'تأكد من مسارك الحالي.',
        hint: 'استخدم الأمر pwd',
        check: (history) => history.some(h => h.content === 'pwd')
    }
];

export default function LabPage() {
    const [completedChallenges, setCompletedChallenges] = useState([]);
    const [initialCommand, setInitialCommand] = useState(null);

    useEffect(() => {
        // Read command from URL
        const params = new URLSearchParams(window.location.search);
        const commandParam = params.get('command');
        if (commandParam) {
            setInitialCommand(commandParam);
        }
    }, []);

    const handleCommandExecuted = (cmd) => {
        // Simple check logic
        const newCompleted = [...completedChallenges];

        if (cmd === 'ls' && !newCompleted.includes(1)) newCompleted.push(1);
        if (cmd.includes('mkdir projects') && !newCompleted.includes(2)) newCompleted.push(2);
        if (cmd.includes('cd projects') && !newCompleted.includes(3)) newCompleted.push(3);
        if (cmd.includes('touch app.py') && !newCompleted.includes(4)) newCompleted.push(4);
        if (cmd === 'pwd' && !newCompleted.includes(5)) newCompleted.push(5);

        setCompletedChallenges(newCompleted);
    };

    return (
        <div className="min-h-screen bg-background-dark text-text-primary p-6 md:p-12">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Terminal className="text-primary-blue" />
                        المختبر التفاعلي
                        <span className="text-xs bg-primary-blue/10 text-primary-blue px-2 py-1 rounded border border-primary-blue/20">Beta</span>
                    </h1>
                    <p className="text-text-secondary mt-2">بيئة محاكاة لنظام Linux لتطبيق الأوامر بشكل عملي وآمن.</p>
                </div>
                <Link href="/" className="text-text-secondary hover:text-white flex items-center gap-2 transition-colors">
                    العودة للرئيسية <ArrowRight size={16} className="rtl:rotate-180" />
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Challenges */}
                <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                    <div className="bg-surface-dark border border-border-color rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="text-primary-purple" size={20} />
                            التحديات
                        </h2>
                        <div className="space-y-4">
                            {challenges.map((challenge) => {
                                const isCompleted = completedChallenges.includes(challenge.id);
                                return (
                                    <div
                                        key={challenge.id}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-background-dark border-border-color'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 ${isCompleted ? 'text-green-500' : 'text-text-secondary'}`}>
                                                {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${isCompleted ? 'text-green-400' : 'text-text-primary'}`}>{challenge.title}</h3>
                                                <p className="text-sm text-text-secondary mt-1">{challenge.description}</p>
                                                {!isCompleted && (
                                                    <div className="mt-2 text-xs font-mono text-primary-blue bg-primary-blue/5 px-2 py-1 rounded inline-block">
                                                        تلميح: {challenge.hint}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main: Terminal */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                    <TerminalComponent
                        onCommand={handleCommandExecuted}
                        initialCommand={initialCommand}
                    />

                    <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-text-secondary">
                        <p className="font-bold text-blue-400 mb-1">ملاحظة هامة:</p>
                        هذه بيئة محاكاة (Simulator) تعمل على متصفحك فقط. الملفات التي تنشئها هنا مؤقتة وستختفي عند تحديث الصفحة.
                        الهدف هو التدريب على كتابة الأوامر والتعامل مع الطرفية.
                    </div>
                </div>
            </div>
        </div>
    );
}