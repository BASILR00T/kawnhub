import Link from 'next/link';

export default function PlaceholderPage() {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-background-dark">
          <h1 className="text-5xl font-bold mb-4">
              Kawn<span className="text-primary-blue">Hub</span>
          </h1>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent mb-4">
              الموقع قيد التطوير
          </h2>
          <p className="text-xl text-text-secondary max-w-xl">
              نعمل حاليًا على إطلاق النسخة الجديدة قريبًا. شكرًا لزيارتك!
          </p>
      </div>
  );
}