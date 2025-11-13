import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // استيراد ملف السياق الجديد
import { Cairo } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata = {
  title: 'KawnHub v2.0',
  description: 'مرجعك التقني الأول لطلاب الكلية الصناعية',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-background-dark text-text-primary`}>
        {/* تغليف التطبيق بالكامل بالمزود */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}