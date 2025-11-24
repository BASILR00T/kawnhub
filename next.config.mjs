/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '**' },
      { protocol: 'https', hostname: '*.googleusercontent.com', pathname: '**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=()" },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com https://vercel.live https://*.firebaseapp.com https://apis.google.com https://accounts.google.com;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;