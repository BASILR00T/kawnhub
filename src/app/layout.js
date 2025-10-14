import { Tajawal } from "next/font/google";
import "./globals.css"; // This line is CRITICAL

const tajawalFont = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "KawnHub | مركزك للمعرفة التقنية",
  description: "مرجعك السريع والمباشر لكل الأوامر، المفاهيم، والشروحات العملية.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawalFont.className}>{children}</body>
    </html>
  );
}