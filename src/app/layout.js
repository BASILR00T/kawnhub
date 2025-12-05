import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Cairo, Inter } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'KawnHub v2.0',
  description: 'مرجعك التقني الأول لطلاب الكلية الصناعية',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${inter.variable} font-sans bg-background-dark text-text-primary`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}