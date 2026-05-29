/** @type {import('next').NextConfig} */
const nextConfig = {
    // Izinkan akses dev dari perangkat lain di jaringan lokal (HP/tablet via LAN)
    allowedDevOrigins: [
        'http://10.10.11.202:3000',
        'http://10.10.11.202',
    ],

    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4000',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '10.10.11.202',
                port: '4000',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
