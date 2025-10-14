import React from 'react';
import Link from 'next/link';

// --- Mock Data (بيانات مؤقتة) ---
// In the future, this data will come from our database.
const mockTopics = [
    { id: 'intro', title: 'مقدمة عن الشبكات' },
    { id: 'osi-model', title: 'نموذج OSI' },
    { id: 'ip-addressing', title: 'عنونة IP' },
    { id: 'subnetting', title: 'تقسيم الشبكات (Subnetting)' },
    { id: 'routing-protocols', title: 'بروتوكولات التوجيه' },
];

// This is the template for all material pages
export default function MaterialPage({ params }) {
    // We use a simple function to make the title more readable
    const formatSlug = (slug) => {
        return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="mx-auto max-w-7xl p-6 font-sans">
            <header className="mb-8 flex items-center justify-between py-4 border-b border-border-color">
                <Link href="/hub" className="text-3xl font-bold text-text-primary no-underline">
                    Kawn<span className="text-primary-blue">Hub</span>
                </Link>
                <nav>
                    {/* THE FIX IS HERE 👇: This now links back to the hub */}
                    <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        <span>العودة للمنصة</span>
                    </Link>
                </nav>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* --- Sidebar (Navigation) --- */}
                <aside className="md:col-span-1">
                    <div className="sticky top-8">
                        <h2 className="text-xl font-bold mb-4 text-text-primary">مواضيع المادة</h2>
                        <ul className="space-y-3">
                            {mockTopics.map((topic) => (
                                <li key={topic.id}>
                                    <a href="#" className="block text-text-secondary hover:text-text-primary hover:bg-surface-dark p-2 rounded-md transition-colors">
                                        {topic.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* --- Main Content --- */}
                <main className="md:col-span-3">
                    <div className="prose prose-invert max-w-none">
                        <h1 className="text-4xl font-bold text-text-primary mb-4">
                           {/* We show a placeholder title for now */}
                           مقدمة عن {formatSlug(params.slug)}
                        </h1>
                        <p className="text-lg text-text-secondary">
                            هذا هو الشرح الخاص بالموضوع المحدد. سيتم هنا عرض الفقرات، القوائم، والأمثلة العملية بطريقة واضحة ومنظمة لتسهيل الفهم والمراجعة.
                        </p>
                        
                        <h3 className="text-2xl font-bold mt-8">مثال عملي</h3>
                        <p>لتطبيق هذا المفهوم، نستخدم الأمر التالي في واجهة الأوامر:</p>
                        
                        {/* Code Block Example */}
                        <div className="bg-black/80 rounded-lg border border-border-color font-mono text-base overflow-hidden my-6">
                           <div className="bg-surface-dark p-2 text-xs text-text-secondary border-b border-border-color">
                                Terminal
                           </div>
                           <pre className="p-4 overflow-x-auto"><code>
{`router> enable
router# configure terminal
router(config)# interface fa0/1
router(config-if)# ip address 192.168.1.1 255.255.255.0
router(config-if)# no shutdown`}
                           </code></pre>
                        </div>

                        <p>بعد تنفيذ هذه الأوامر، سيتم تفعيل المنفذ وتعيين عنوان IP له، مما يسمح له بالاتصال بالشبكة.</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
