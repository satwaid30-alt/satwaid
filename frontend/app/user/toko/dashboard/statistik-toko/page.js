"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Trophy,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  FileText,
  User,
  ShoppingBag as OrderIcon
} from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function StoreStatisticsPage() {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    let socket;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchShop(parsed.id);

        // Setup Socket.io for Real-time Updates
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null
          }
        });
        socket.emit("join_user", parsed.id);

        socket.on("new_notification", () => {
          if (shop?.id) {
            fetchShopOrders(shop.id);
            fetchShopListings(shop.id);
          } else {
            fetchShop(parsed.id);
          }
        });
      } catch (e) {
        console.error("Error parsing user or establishing socket connection", e);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [shop?.id]);

  const fetchShop = async (userId) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/shops/user/${userId}`
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setShop(result.data);
        setHasShop(true);
        await Promise.all([
          fetchShopOrders(result.data.id),
          fetchShopListings(result.data.id)
        ]);
      } else {
        setHasShop(false);
      }
    } catch (err) {
      console.error("Error fetching shop:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopOrders = async (shopId) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/orders/shop/${shopId}`
      );
      const result = await response.json();
      if (response.ok) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchShopListings = async (shopId) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/listings/shop/${shopId}`
      );
      const result = await response.json();
      if (response.ok) {
        setListings(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  // Helper function to format prices
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Calculated Metrics
  const stats = useMemo(() => {
    // 1. Order status classifications
    const completedOrders = orders.filter((o) =>
      ["completed", "disbursement_requested", "disbursed"].includes(o.status)
    );
    const inProgressOrders = orders.filter((o) =>
      [
        "pending_shipping_info",
        "waiting_shipping_cost",
        "waiting_payment",
        "processing",
        "shipped",
        "complained",
      ].includes(o.status)
    );
    const cancelledOrders = orders.filter((o) =>
      ["cancelled", "rejected"].includes(o.status)
    );

    // 2. Revenue calculations (total_price - admin_fee to match dashboard seller page)
    const netRevenue = completedOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total_price) || 0) - (parseFloat(o.admin_fee) || 0),
      0
    );
    const avgOrderValue = completedOrders.length > 0 ? netRevenue / completedOrders.length : 0;

    // 3. Conversion rate
    const successRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

    // 4. Listings status and types
    const totalListings = listings.length;
    const activeListings = listings.filter((l) => l.status === "active").length;
    const pendingListings = listings.filter((l) => l.status === "pending").length;
    const rejectedListings = listings.filter((l) => l.status === "rejected").length;
    const directSellListings = listings.filter((l) => l.type === "sell").length;
    const auctionListings = listings.filter((l) => l.type === "auction").length;

    return {
      completedCount: completedOrders.length,
      inProgressCount: inProgressOrders.length,
      cancelledCount: cancelledOrders.length,
      netRevenue,
      avgOrderValue,
      successRate,
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      directSellListings,
      auctionListings,
    };
  }, [orders, listings]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold text-sm">Memuat data statistik...</p>
      </div>
    );
  }

  if (!hasShop) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-lg mx-auto mt-10">
        <div className="w-20 h-20 bg-zinc-800 text-zinc-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard size={40} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Toko Belum Aktif</h3>
        <p className="text-zinc-500 mb-8">
          Anda harus membuat toko terlebih dahulu sebelum dapat mengakses statistik dan data analitik performa penjualan.
        </p>
        <Link
          href="/user/toko/dashboard"
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-8 py-3 rounded-xl transition-all inline-block"
        >
          Ke Dashboard Utama
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          Statistik Toko
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Analisis mendalam performa toko{" "}
          <span className="text-amber-500 font-bold">{shop?.name || "Reptile Shop"}</span>.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-full md:w-fit overflow-x-auto custom-scrollbar">
        {[
          {
            id: "dashboard",
            label: "Statistik Toko",
            icon: LayoutDashboard,
            href: "/user/toko/dashboard/statistik-toko",
          },
          {
            id: "riwayat",
            label: `Pesanan Selesai (${orders.filter((o) => ["completed", "disbursement_requested", "disbursed"].includes(o.status)).length})`,
            icon: CheckCircle2,
            href: "/user/toko/dashboard",
          },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
              tab.id === "dashboard"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Main Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/5 transition-transform group-hover:scale-110">
            <DollarSign size={80} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Total Pendapatan
          </p>
          <p className="text-xl md:text-2xl font-black text-emerald-400 mt-2">
            {formatPrice(stats.netRevenue)}
          </p>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Akumulasi transaksi selesai
          </div>
        </div>

        {/* Card 2: Jumlah Produk */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-blue-500/5 transition-transform group-hover:scale-110">
            <Package size={80} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Jumlah Produk
          </p>
          <p className="text-xl md:text-2xl font-black text-white mt-2">
            {stats.totalListings} <span className="text-xs text-zinc-500 font-bold">Produk</span>
          </p>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium flex gap-2">
            <span className="text-emerald-500">{stats.activeListings} Aktif</span>
            <span>•</span>
            <span className="text-amber-500">{stats.pendingListings} Pending</span>
          </div>
        </div>

        {/* Card 3: Pesanan Sukses */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-amber-500/5 transition-transform group-hover:scale-110">
            <ShoppingBag size={80} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Metrik Penjualan
          </p>
          <p className="text-xl md:text-2xl font-black text-amber-400 mt-2">
            {stats.completedCount} <span className="text-xs text-zinc-500 font-bold">Pesanan Sukses</span>
          </p>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium flex gap-2">
            <span className="text-blue-400">{stats.inProgressCount} Proses</span>
            <span>•</span>
            <span className="text-red-400">{stats.cancelledCount} Batal</span>
          </div>
        </div>

        {/* Card 4: Rating Toko */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-purple-500/5 transition-transform group-hover:scale-110">
            <Star size={80} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Rating Toko
          </p>
          <p className="text-xl md:text-2xl font-black text-white mt-2 flex items-center gap-1.5">
            {shop?.avgRating || "5.0"}
            <Star size={18} className="fill-amber-500 text-amber-500 shrink-0" />
          </p>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Dari {shop?.totalRatings || 0} penilaian & {shop?.totalReviews || 0} ulasan
          </div>
        </div>
      </div>

      {/* Detail Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Conversion & Performance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-500" /> Performa Penjualan & Konversi
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Analisis rasio pemesanan sukses di toko Anda</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1">
              <Percent size={12} /> {stats.successRate.toFixed(1)}% Sukses
            </div>
          </div>

          {/* Success rate visual gauge */}
          <div className="p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex justify-between text-xs font-bold text-zinc-400">
              <span>Rasio Penyelesaian Pesanan</span>
              <span className="text-white">{stats.successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all duration-1000"
                style={{ width: `${stats.successRate || 0}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              *Rasio sukses menunjukkan persentase pesanan selesai terverifikasi tanpa pembatalan dari total pesanan masuk. Pertahankan rasio di atas 85% untuk reputasi toko prima.
            </p>
          </div>

          {/* Detailed distribution grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Rata-rata Nilai Transaksi
              </span>
              <div>
                <p className="text-base font-black text-white mt-1">
                  {formatPrice(stats.avgOrderValue)}
                </p>
                <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                  Per Pesanan Selesai
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Total Transaksi Diproses
              </span>
              <div>
                <p className="text-base font-black text-blue-400 mt-1">
                  {stats.inProgressCount} <span className="text-xs text-zinc-500 font-bold">Unit</span>
                </p>
                <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                  Sedang Dikirim / Menunggu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Portfolio Distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Package size={18} className="text-blue-400" /> Distribusi Produk
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Breakdown portofolio listing produk Anda</p>
          </div>

          <div className="space-y-4">
            {/* Visual bar split */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
                  Jual Langsung ({stats.directSellListings})
                </span>
                <span className="text-amber-500 flex items-center gap-1.5">
                  Lelang ({stats.auctionListings})
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full transition-all duration-700"
                  style={{
                    width: `${
                      stats.totalListings > 0
                        ? (stats.directSellListings / stats.totalListings) * 100
                        : 50
                    }%`
                  }}
                ></div>
                <div
                  className="bg-amber-500 h-full transition-all duration-700"
                  style={{
                    width: `${
                      stats.totalListings > 0
                        ? (stats.auctionListings / stats.totalListings) * 100
                        : 50
                    }%`
                  }}
                ></div>
              </div>
            </div>

            {/* List detail */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold">Total Iklan Toko</span>
                <span className="text-white font-black">{stats.totalListings} Produk</span>
              </div>
              <div className="h-px bg-zinc-800"></div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold">Produk Aktif Terverifikasi</span>
                <span className="text-emerald-400 font-black">{stats.activeListings} Aktif</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold">Menunggu Verifikasi Admin</span>
                <span className="text-amber-500 font-black">{stats.pendingListings} Pending</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold">Ditolak Admin</span>
                <span className="text-red-400 font-black">{stats.rejectedListings} Ditolak</span>
              </div>
            </div>

            {/* Warning block if there are rejected products */}
            {stats.rejectedListings > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide">
                    Ada Produk Ditolak Admin
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Terdapat {stats.rejectedListings} produk Anda yang ditolak admin karena kendala verifikasi data. Buka halaman <Link href="/user/toko/daftar-produk" className="text-red-400 font-bold underline hover:opacity-85">Daftar Produk</Link> untuk melihat alasannya.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart Section (Under Development) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 relative overflow-hidden">
        {/* Decorative background visual resembling a blurred chart */}
        <div className="absolute inset-0 opacity-10 flex items-end justify-center pointer-events-none">
          <svg className="w-full h-48 text-amber-500" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M0,80 Q15,40 30,60 T60,20 T90,50 T100,10 L100,100 L0,100 Z"
              fill="currentColor"
            />
            <path
              d="M0,80 Q15,40 30,60 T60,20 T90,50 T100,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-500" /> Chart Tren Pendapatan
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Visualisasi analisis tren fluktuasi pendapatan toko Anda</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">
            Tahap Pengembangan
          </span>
        </div>

        <div className="py-16 text-center relative z-10 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 text-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/5 animate-pulse">
            <Clock size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-wide">
              Fitur Sedang Dikembangkan
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kami sedang menyiapkan visualisasi grafik interaktif untuk menganalisis pendapatan harian, mingguan, dan bulanan toko Anda. Fitur ini akan segera tersedia!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
