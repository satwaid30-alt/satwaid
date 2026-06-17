/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan akses dev dari perangkat lain di jaringan lokal (HP/tablet via LAN)
  allowedDevOrigins: ["http://10.10.11.202:3000", "http://10.10.11.202"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "10.10.11.202",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      // --- Halaman Toko / Lelang Publik ---
      {
        source: "/produk/:id",
        destination: "/toko/detail-produk/:id",
      },
      {
        source: "/lelang-hewan/:id",
        destination: "/toko/detail-lelang/:id",
      },
      {
        source: "/toko/:id",
        destination: "/detail-toko/:id",
      },

      // --- Panel Akun User (Buyer) ---
      {
        source: "/akun/pengaturan",
        destination: "/user/pengaturan",
      },
      {
        source: "/akun/pesanan",
        destination: "/user/pesanan",
      },
      {
        source: "/akun/pesanan/lelang",
        destination: "/user/pesanan/lelang",
      },
      {
        source: "/akun/pesanan/riwayat-pembelian",
        destination: "/user/pesanan/riwayat-pembelian",
      },
      {
        source: "/akun/pesanan/pengembalian-dana",
        destination: "/user/pesanan/pengembalian-dana",
      },
      {
        source: "/akun/komunitas",
        destination: "/user/komunitas",
      },
      {
        source: "/akun/pengaduan",
        destination: "/user/pengaduan",
      },
      {
        source: "/akun/pengaturan/keamanan",
        destination: "/user/pengaturan/keamanan",
      },

      {
        source: "/akun/pengaturan/edit",
        destination: "/user/pengaturan/edit",
      },

      // --- Panel Toko Seller (Dashboard Seller) ---
      {
        source: "/toko-saya/dashboard",
        destination: "/user/toko/dashboard",
      },
      {
        source: "/toko-saya/produk",
        destination: "/user/toko/daftar-produk",
      },
      {
        source: "/toko-saya/jual",
        destination: "/user/toko/jual-produk",
      },
      {
        source: "/toko-saya/lelang",
        destination: "/user/toko/lelang-produk",
      },
      {
        source: "/toko-saya/pesanan-masuk",
        destination: "/user/toko/pesanan-masuk",
      },
      {
        source: "/toko-saya/upgrade",
        destination: "/user/toko/upgrade-toko",
      },
      {
        source: "/toko-saya/profil",
        destination: "/user/toko",
      },
      {
        source: "/toko-saya/profil/:id",
        destination: "/user/toko/detail-toko/:id",
      },
      {
        source: "/toko-saya/keuangan",
        destination: "/user/toko/pengajuan-keuangan",
      },

      // --- Panel Admin ---
      {
        source: "/panel-admin",
        destination: "/admin/dashboard",
      },
      {
        source: "/panel-admin/iklan",
        destination: "/admin/iklan",
      },
      {
        source: "/panel-admin/transaksi",
        destination: "/admin/transaksi-user",
      },
      {
        source: "/panel-admin/toko",
        destination: "/admin/toko-user",
      },
      {
        source: "/panel-admin/toko/detail-produk",
        destination: "/admin/toko-user/detail-produk",
      },
      {
        source: "/panel-admin/keuangan",
        destination: "/admin/keuangan",
      },
      {
        source: "/panel-admin/pengembalian-dana",
        destination: "/admin/pengembalian-dana",
      },
      {
        source: "/panel-admin/users",
        destination: "/admin/users",
      },
      {
        source: "/panel-admin/komunitas",
        destination: "/admin/komunitas",
      },
      {
        source: "/panel-admin/control-menu",
        destination: "/admin/control-menu",
      },
      {
        source: "/panel-admin/reset-profil",
        destination: "/admin/reset-profil",
      },
      {
        source: "/panel-admin/reset-toko",
        destination: "/admin/reset-toko",
      },
      {
        source: "/panel-admin/upgrade-toko",
        destination: "/admin/upgrade-toko",
      },
      {
        source: "/panel-admin/pengaduan",
        destination: "/admin/pengaduan",
      },
      {
        source: "/panel-admin/morph-groups",
        destination: "/admin/morph-groups",
      },
      {
        source: "/panel-admin/settings",
        destination: "/admin/settings",
      },
    ];
  },
};

export default nextConfig;
