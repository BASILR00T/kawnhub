/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. السماح بصور البروفايل من جوجل
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      // 2. السماح بصور البروفايل من مصادر جوجل الأخرى (احتياطاً)
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
      // 3. (اختياري) إذا كنت تستخدم صور من Firebase Storage مستقبلاً
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;