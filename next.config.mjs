/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/?admin=1',
        permanent: false,
      },
      {
        source: '/product/navratri-special-attar-2ml',
        destination: '/product/diwali-special-attar-2ml',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
