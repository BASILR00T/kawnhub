'use client'; 

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const HubPreview = dynamic(() => import('@/components/HubInterface'), {
    loading: () => <p className="text-center text-text-secondary">جاري تحميل المعاينة...</p>,
    ssr: false
});

// --- Icon Components ---
const ArrowIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const FolderIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> );
const CodeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> );
const BeakerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15M6 3v12c0 3.3 2.7 6 6 6s6-2.7 6-6V3m-6 6h.01"></path></svg>);
const GithubIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>);
const LinkedinIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>);


// --- Landing Page Component ---
export default function LandingPage() {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    // ... Intersection Observer logic (No changes) ...
    const observer = new IntersectionObserver( (entries) => { if (entries[0].isIntersecting) { setIsPreviewVisible(true); observer.unobserve(previewRef.current); } }, { threshold: 0.1 } ); if (previewRef.current) observer.observe(previewRef.current); return () => { if (previewRef.current) observer.unobserve(previewRef.current); };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      
      {/* ... Header, Hero, Why, Showcase sections (No Changes) ... */}
       <header className="mb-12 flex items-center justify-between py-4"> <a href="/" className="text-3xl font-bold text-text-primary no-underline"> Kawn<span className="text-primary-blue">Hub</span> </a> <nav className="flex items-center gap-6"> <Link href="/hub" className="text-text-secondary transition-colors hover:text-text-primary font-medium">المنصة</Link> <Link href="/lab" className="hidden sm:block text-text-secondary transition-colors hover:text-text-primary font-medium">المختبر 🧪</Link> </nav> </header> <main className="flex min-h-[70vh] items-center justify-center text-center"> <div className="flex flex-col items-center"> <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl"> مرجعك التقني الأول. <br /> <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">مرتب، سريع، وتفاعلي.</span> </h1> <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary md:text-xl"> KawnHub هو منصة مصممة لطلاب التقنية، تجمع كل الشروحات والأوامر العملية في مكان واحد سهل الوصول، عشان تسرّع رحلتك التعليمية. </p> <Link href="/hub" className="mt-10 inline-flex items-center gap-3 rounded-xl bg-primary-blue px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary-blue/20 transition-all duration-300 hover:bg-primary-blue/90 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-primary-blue/50"> <span>ادخل للمنصة الحين</span> <ArrowIcon /> </Link> </div> </main>
       <section className="py-24"> <div className="text-center"> <h2 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">ليش KawnHub بالذات؟</h2> <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">طفشت من حوسة الملاحظات والملفات قبل الاختبار؟ ضيعت وقتك تدور على أمر واحد؟ حنا جبنا لك الحل.</p> </div> <div className="group mt-16 grid grid-cols-1 gap-8 md:grid-cols-3"> <div className="flex flex-col items-center text-center transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:scale-105"> <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue"><FolderIcon /></div> <h3 className="mt-6 text-xl font-bold">كل شيء مرتب</h3> <p className="mt-2 text-base text-text-secondary">كل موادك وشروحاتك والأوامر اللي تحتاجها مجمعة في مكان واحد. بدون ما تضيع وقتك تدور.</p> </div> <div className="flex flex-col items-center text-center transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:scale-105"> <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue"><SearchIcon /></div> <h3 className="mt-6 text-xl font-bold">بحث صاروخي</h3> <p className="mt-2 text-base text-text-secondary">اكتب أي شيء يخطر ببالك، والأمر اللي تبيه يطلع لك بثواني. لا عاد تدور بيدك بين الملفات.</p> </div> <div className="flex flex-col items-center text-center transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:scale-105"> <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue"><CodeIcon /></div> <h3 className="mt-6 text-xl font-bold">الزبدة، وبدون فلسفة</h3> <p className="mt-2 text-base text-text-secondary">ركزنا على الأوامر والشغل العملي اللي بتطبقه صدق في اللاب وسوق العمل.</p> </div> </div> </section>
       <section ref={previewRef} className="py-24 [perspective:1000px]"> <div className="text-center mb-16"> <h2 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">واجهة مصممة لك</h2> <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">تصميم عصري وبسيط يخليك توصل للمعلومة اللي تبيها بأسرع وقت ممكن.</p> </div> <Link href="/hub" className="group block relative mx-auto max-w-5xl rounded-xl transition-opacity duration-1000" style={{ opacity: isPreviewVisible ? 1 : 0, minHeight: '500px' }}> <div className="relative rounded-xl border border-border-color bg-surface-dark/50 shadow-2xl shadow-black/30 transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateX(7deg)_rotateY(-3deg)]"> <div className="flex items-center gap-2 p-4 border-b border-border-color"> <div className="h-3 w-3 rounded-full bg-red-500"></div> <div className="h-3 w-3 rounded-full bg-yellow-400"></div> <div className="h-3 w-3 rounded-full bg-green-500"></div> </div> <div className="pointer-events-none">{isPreviewVisible && <HubPreview isPreview={true} />}</div> <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [transform:translateZ(60px)]"> <div className="text-3xl font-bold text-text-primary tracking-wider" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>شيك على القسم</div> </div> </div> </Link> </section>
       <section className="py-24"> <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"> <div className="text-center lg:text-right"> <div className="inline-flex items-center gap-2 rounded-full bg-primary-purple/10 px-4 py-2 text-primary-purple"> <BeakerIcon /> <span className="font-bold">قريبًا...</span> </div> <h2 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl"> المختبر التفاعلي </h2> <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-lg text-text-secondary"> التعلم بالتجربة هو الأساس. نجهز لك محاكي تفاعلي يخليك تطبق الأوامر وتشوف النتيجة قدامك مباشرة، كأنك على جهاز حقيقي. </p> <Link href="/lab" className="mt-8 inline-flex items-center gap-3 rounded-xl bg-primary-purple px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary-purple/20 transition-all duration-300 hover:bg-primary-purple/90 hover:-translate-y-1"> <span>جرّب الديمو الأولي</span> </Link> </div> <div className="rounded-xl border border-border-color bg-black/50 p-6 font-mono text-sm text-left dir-ltr"> <p className="text-text-secondary">Initializing KawnHub v2.0 kernel...</p> <p className="text-green-400">System ready. Welcome, student.</p> <p className="text-text-secondary mt-4">Type 'help' to see available commands.</p> <div className="flex items-center mt-2"> <span className="text-primary-blue">KawnHub:~$</span> <span className="ml-2 h-4 w-2 animate-pulse bg-white"></span> </div> </div> </div> </section>

      {/* 6. "About Me" Section - NEW */}
      <section className="py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center rounded-2xl border border-border-color bg-surface-dark p-12">
              {/* Image Column */}
              <div className="flex justify-center lg:col-span-1">
                  <Image
                    src="/images/profile.png" 
                    alt="logo"
                    width={200}
                    height={200}
                    className="rounded-2xl object-cover border-1 border-primary-blue shadow-lg"
                  />
              </div>
              {/* Text Column */}
              <div className="text-center lg:text-right lg:col-span-2">
                  <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                      قصة المشروع
                  </h2>
                  <p className="mt-4 text-lg text-text-secondary">
                      أنا باسل، طالب تقنية معلومات مثلي مثلك. بدأت فكرة KawnHub من معاناتي الشخصية مع كثرة الأوامر وتشتت المراجع بين مواد الشبكات والأنظمة وغيرها. الهدف كان بسيط: أبني لنفسي ولزملائي مكان واحد، مرتب وواضح، يجمع لنا الزبدة اللي نحتاجها وقت التطبيق والاختبار.
                  </p>
                  <div className="mt-6 flex justify-center lg:justify-start gap-4">
                      <a href="https://github.com/BASILR00T" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary-blue transition-colors">
                          <GithubIcon />
                      </a>
                      <a href="https://www.linkedin.com/in/bassel-x-sami-37942b208/" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary-blue transition-colors">
                          <LinkedinIcon />
                      </a>
                  </div>
              </div>
          </div>
      </section>

      {/* 7. Footer - NEW */}
      <footer className="py-8 border-t border-border-color">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              &copy; {new Date().getFullYear()} KawnHub. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-4">
                <a href="https://github.com/BASILR00T/kawnhub" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary-blue transition-colors">
                  <GithubIcon />
                </a>
                <a href="https://www.linkedin.com/in/bassel-x-sami-37942b208/" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary-blue transition-colors">
                  <LinkedinIcon />
                </a>
            </div>
        </div>
      </footer>

    </div>
  );
}