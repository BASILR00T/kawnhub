import React from 'react';

// --- Icon Components (No change here) ---
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const ComputerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> );
const LinuxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 13.66a4.33 4.33 0 0 0-1.06-1.06 2.5 2.5 0 0 0-3.88 0A4.33 4.33 0 0 0 8 13.66 M2 16.22a9.42 9.42 0 0 0 1.94 3.63c3.48 3.49 9.1 3.49 12.58 0A9.42 9.42 0 0 0 18.46 18M6.2 13.31a12.5 12.5 0 0 0-3.66 3.66c-1.35 2.12.06 5 2.18 6.35 2.12 1.35 5 .06 6.35-2.18a12.5 12.5 0 0 0 3.66-3.66 M12 2a6 6 0 0 0-6 6c0 4.5 6 11.5 6 11.5s6-7 6-11.5a6 6 0 0 0-6-6Z"></path></svg> );
const NetworkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> );
const ArrowIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> );

const BentoCard = ({ children, className, isPreview }) => {
    const Tag = isPreview ? 'div' : 'a'; // Render as 'div' in preview, 'a' otherwise
    return (
        <Tag href={isPreview ? null : '#'} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color bg-surface-dark p-6  transition-transform duration-300 ease-in-out hover:-translate-y-1 ${className}`}>
            <div className="absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(45deg, var(--primary-blue), var(--primary-purple))', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </Tag>
    );
};

export default function HubInterface({ isPreview = false }) { // Default isPreview to false
    const LogoTag = isPreview ? 'div' : 'a'; // Render logo as 'div' in preview
    const NavTag = isPreview ? 'span' : 'a'; // Render nav items as 'span' in preview

    return (
        <div className="mx-auto max-w-6xl p-6">
            <header className="mb-12 flex items-center justify-between">
                <LogoTag href={isPreview ? null : "/"} className="text-3xl font-bold text-text-primary no-underline">
                    Kawn<span className="text-primary-blue">Hub</span>
                </LogoTag>
                <nav className="hidden items-center gap-6 md:flex">
                    <NavTag href={isPreview ? null : "#"} className="text-text-secondary">جميع المواد</NavTag>
                    <NavTag href={isPreview ? null : "/lab"} className="text-text-secondary">المختبر 🧪</NavTag>
                </nav>
            </header>

            <main className="grid grid-cols-6 auto-rows-[220px] gap-4">
                <BentoCard className="col-span-6 md:col-span-4" isPreview={isPreview}>
                    <div className='flex-grow'><h3 className="text-2xl font-bold mb-2">مركزك للمعرفة التقنية</h3><p className="text-text-secondary">مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.</p></div>
                    <div className="relative mt-4"><input type="search" placeholder="ابحث هنا..." className="w-full rounded-lg border border-border-color bg-background-dark p-4 pr-12 text-lg" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"><SearchIcon /></span></div>
                </BentoCard>
                {/* Other cards will now also respect the isPreview prop */}
                 <BentoCard className="col-span-6 md:col-span-2" isPreview={isPreview}><div className='flex-grow'><h3 className="text-xl font-bold">أحدث إضافة</h3><p className="mt-2 font-semibold">تأمين منافذ السويتش</p><p className="mt-1 text-sm text-text-secondary">شرح مفصل لآلية عمل Port Security.</p></div><span className="self-start mt-4 font-bold text-primary-blue no-underline flex items-center gap-2">اقرأ الشرح <ArrowIcon /></span></BentoCard>
                <BentoCard className="col-span-3 md:col-span-2" isPreview={isPreview}><div className="text-text-secondary group-hover:text-primary-blue mb-4"><ComputerIcon /></div><div className="flex-grow"><h3 className="text-lg font-bold">PC Config</h3><p className="text-sm text-text-secondary mt-2">أوامر فحص النظام وإصلاح مشاكل ويندوز.</p></div><div className="self-end text-text-secondary opacity-0 group-hover:opacity-100"><ArrowIcon /></div></BentoCard>
                <BentoCard className="col-span-3 md:col-span-2" isPreview={isPreview}><div className="text-text-secondary group-hover:text-primary-blue mb-4"><LinuxIcon /></div><div className="flex-grow"><h3 className="text-lg font-bold">NOS</h3><p className="text-sm text-text-secondary mt-2">إدارة المستخدمين والصلاحيات في Linux.</p></div><div className="self-end text-text-secondary opacity-0 group-hover:opacity-100"><ArrowIcon /></div></BentoCard>
                <BentoCard className="col-span-3 md:col-span-2" isPreview={isPreview}><div className="text-text-secondary group-hover:text-primary-blue mb-4"><NetworkIcon /></div><div className="flex-grow"><h3 className="text-lg font-bold">Network 2</h3><p className="text-sm text-text-secondary mt-2">بروتوكولات التوجيه وإعدادات السويتش.</p></div><div className="self-end text-text-secondary opacity-0 group-hover:opacity-100"><ArrowIcon /></div></BentoCard>
            </main>
        </div>
    );
}