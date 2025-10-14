import React from 'react';
import Link from 'next/link';

// This is the template for all material pages
export default function MaterialPage({ params }) {
    return (
        <div className="mx-auto max-w-6xl p-6 font-sans">
            <header className="mb-12 flex items-center justify-between py-4">
                <Link href="/hub" className="text-3xl font-bold text-text-primary no-underline">
                    Kawn<span className="text-primary-blue">Hub</span>
                </Link>
                <nav>
                    <Link href="/" className="text-text-secondary transition-colors hover:text-text-primary font-medium">
                        &larr; العودة للرئيسية
                    </Link>
                </nav>
            </header>

            <main>
                <h1 className="text-4xl font-bold text-text-primary mb-4">
                    المادة: <span className="text-primary-blue">{params.slug}</span>
                </h1>
                <p className="text-lg text-text-secondary">
                    هنا سيتم عرض جميع الشروحات والمواضيع الخاصة بهذه المادة... (قيد الإنشاء)
                </p>
            </main>
        </div>
    );
}