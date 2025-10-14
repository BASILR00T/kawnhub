export const metadata = {
  title: "KawnHub | قيد الإنشاء",
  description: "الموقع قيد التطوير حاليًا.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      {/* THE FIX IS HERE 👇 */}
      <body style={{ margin: 0 }}> 
        {children}
      </body>
    </html>
  );
}