/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... إعدادات الصور السابقة ...
  images: {
    remotePatterns: [
       // ...
    ],
  },
  
  // إضافة رؤوس الأمان
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // منع تضمين الموقع في iFrame
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // منع تخمين نوع الملفات
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=()" } // منع الوصول للكاميرا والموقع
        ],
      },
    ];
  },
};

export default nextConfig;