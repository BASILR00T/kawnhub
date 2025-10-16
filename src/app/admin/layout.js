import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background-dark text-text-primary font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-surface-dark p-6 border-l border-border-color">
        <h1 className="text-2xl font-bold text-primary-blue mb-8">لوحة التحكم</h1>
      <nav className="flex flex-col space-y-4">
        <Link href="/admin" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
          الرئيسية (Dashboard)
        </Link>
        <Link href="/admin/materials" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
          إدارة المواد
        </Link>
        {/* THE NEW LINK IS HERE 👇 */}
        <Link href="/admin/topics" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
          إدارة الشروحات
        </Link>
        <Link href="/admin/tags" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
          إدارة الوسوم
        </Link>
        <hr className="border-border-color my-4" />
        <Link href="/" className="px-4 py-2 rounded-md hover:bg-primary-blue/10 transition-colors">
          العودة للموقع الرئيسي
        </Link>
      </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      
    </div>
  );
}