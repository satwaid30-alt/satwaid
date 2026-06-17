"use client";

import { useEffect, useState } from "react";
import { 
    ShoppingBag, 
    Store, 
    Wallet,
    TrendingUp,
    Clock,
    ArrowUpRight,
    Users2,
    Search,
    Download,
    Printer,
    Calendar,
    FileSpreadsheet
} from "lucide-react";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCommunities: 0,
        totalShops: 0,
        adminRevenue: 0,
        adminRevenueCount: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [shopEarnings, setShopEarnings] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(price) || 0);
    };

    const fetchStats = async () => {
        try {
            const apiUrl = getApiUrl();
            const token = localStorage.getItem("admin_token");
            const response = await fetch(`${apiUrl}/admin/stats`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ""
                }
            });
            if (!response.ok) throw new Error("Gagal mengambil data dari server");
            const data = await response.json();
            if (data.success) {
                const nextStats = data.stats || {};
                setStats({
                    totalProducts: Number(nextStats.totalProducts) || 0,
                    totalCommunities: Number(nextStats.totalCommunities) || 0,
                    totalShops: Number(nextStats.totalShops) || 0,
                    adminRevenue: Number(nextStats.adminRevenue) || 0,
                    adminRevenueCount: Number(nextStats.adminRevenueCount) || 0
                });

                setCompletedOrders(data.completedOrders || []);

                setShopEarnings(
                    (data.shopEarnings || [])
                        .map((shop) => ({
                            ...shop,
                            totalEarnings: Number(shop.totalEarnings) || 0
                        }))
                        .filter((shop) => shop.totalEarnings > 0)
                );

                const recentActivity = data.recentActivity || {};
                const activities = [];

                (recentActivity.products || []).forEach((p) => {
                    const timestamp = new Date(p.created_at).getTime();
                    activities.push({
                        title: "Produk Baru",
                        desc: `${p.name} dari Toko ${p.shop?.name || "Tidak diketahui"}`,
                        time: formatDate(p.created_at),
                        timestamp,
                        type: "success"
                    });
                });

                (recentActivity.shops || []).forEach((s) => {
                    const timestamp = new Date(s.created_at).getTime();
                    activities.push({
                        title: "Toko Baru",
                        desc: `Toko ${s.name} telah bergabung.`,
                        time: formatDate(s.created_at),
                        timestamp,
                        type: "info"
                    });
                });

                (recentActivity.orders || []).forEach((o) => {
                    const dateValue = o.updated_at || o.created_at;
                    const timestamp = new Date(dateValue).getTime();
                    activities.push({
                        title: "Menunggu Pembayaran",
                        desc: `Order #${(o.order_id || "").substring(0, 8)} menunggu konfirmasi.`,
                        time: formatDate(dateValue),
                        timestamp,
                        type: "warning"
                    });
                });

                setRecentActivities(
                    activities
                        .filter((activity) => !Number.isNaN(activity.timestamp))
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 5)
                );
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.resolve();
            const userData = localStorage.getItem("admin_user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
            fetchStats();
        };
        loadInitialData();
    }, []);

    const getFilteredOrders = () => {
        return completedOrders.filter((order) => {
            const shopName = (order.shop?.name || "").toLowerCase();
            const orderId = (order.order_id || "").toLowerCase();
            const matchQuery = shopName.includes(searchQuery.toLowerCase()) || orderId.includes(searchQuery.toLowerCase());

            if (!matchQuery) return false;

            if (dateFilter === "all") return true;

            const orderDate = new Date(order.updated_at || order.created_at);
            const now = new Date();

            if (dateFilter === "today") {
                return (
                    orderDate.getDate() === now.getDate() &&
                    orderDate.getMonth() === now.getMonth() &&
                    orderDate.getFullYear() === now.getFullYear()
                );
            }

            if (dateFilter === "this_month") {
                return (
                    orderDate.getMonth() === now.getMonth() &&
                    orderDate.getFullYear() === now.getFullYear()
                );
            }

            return true;
        });
    };

    const exportToCSV = () => {
        const filtered = getFilteredOrders();
        if (filtered.length === 0) {
            alert("Tidak ada data transaksi untuk diekspor");
            return;
        }

        const headers = ["ID Pesanan", "Toko Penjual", "Tanggal Selesai", "Total Transaksi", "Fee Admin (Pendapatan Admin)"];
        const rows = filtered.map(order => [
            order.order_id,
            order.shop?.name || "Tidak diketahui",
            new Date(order.updated_at || order.created_at).toLocaleString("id-ID"),
            order.total_price,
            order.admin_fee
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_pendapatan_admin_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printReport = () => {
        const filtered = getFilteredOrders();
        if (filtered.length === 0) {
            alert("Tidak ada data transaksi untuk dicetak");
            return;
        }

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Mohon izinkan pop-up untuk mencetak laporan");
            return;
        }

        const totalRevenue = filtered.reduce((sum, o) => sum + (Number(o.admin_fee) || 0), 0);
        const totalAmount = filtered.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

        const rowsHtml = filtered.map((order, idx) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${order.order_id}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${order.shop?.name || "Tidak diketahui"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(order.updated_at || order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatPrice(order.total_price)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatPrice(order.admin_fee)}</td>
            </tr>
        `).join("");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Laporan Pendapatan Admin - SatwaID</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; margin: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #10b981; }
                        .header p { margin: 0; color: #666; font-size: 14px; }
                        .meta-info { margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 10px; font-weight: bold; text-align: left; }
                        .summary { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; font-size: 14px; }
                        .summary-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .summary-total { font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 8px; }
                        @media print {
                            body { margin: 20px; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>LAPORAN PENDAPATAN ADMIN</h1>
                        <p>Platform E-Commerce & Komunitas SatwaID</p>
                    </div>
                    <div class="meta-info">
                        <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}<br>
                        <strong>Filter Tanggal:</strong> ${dateFilter === 'all' ? 'Semua Waktu' : dateFilter === 'today' ? 'Hari Ini' : 'Bulan Ini'}<br>
                        <strong>Total Transaksi:</strong> ${filtered.length} transaksi selesai
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%; text-align: center;">No</th>
                                <th style="width: 25%;">ID Pesanan</th>
                                <th style="width: 25%;">Toko Penjual</th>
                                <th style="width: 15%;">Tanggal</th>
                                <th style="text-align: right; width: 15%;">Total Nilai</th>
                                <th style="text-align: right; width: 15%;">Fee Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <div class="summary">
                        <div class="summary-item">
                            <span>Total Nilai Transaksi:</span>
                            <span>${formatPrice(totalAmount)}</span>
                        </div>
                        <div class="summary-item summary-total">
                            <span>Total Pendapatan Admin:</span>
                            <span>${formatPrice(totalRevenue)}</span>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const displayStats = [
        { name: "Total Produk", value: stats.totalProducts, icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { name: "Total Komunitas", value: stats.totalCommunities, icon: Users2, color: "text-blue-500", bg: "bg-blue-500/10" },
        { name: "Total Toko", value: stats.totalShops, icon: Store, color: "text-amber-500", bg: "bg-amber-500/10" },
        { 
            name: "Pendapatan Admin", 
            value: formatPrice(stats.adminRevenue), 
            icon: Wallet, 
            color: "text-purple-500", 
            bg: "bg-purple-500/10",
            trend: `${stats.adminRevenueCount || 0} Transaksi Berhasil`,
            trendColor: "text-purple-400"
        },
    ];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Halo, {user?.name || "Admin"}! 👋</h1>
                    <p className="text-zinc-500 font-medium">Selamat datang kembali di pusat kendali konten SatwaiD.</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl">
                    <Clock className="text-emerald-500" size={20} />
                    <span className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] animate-pulse">
                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl mb-4" />
                            <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
                            <div className="h-8 bg-zinc-800 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-zinc-800 rounded w-1/4" />
                        </div>
                    ))
                ) : (
                    displayStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.name} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-1">{stat.name}</p>
                                <h3 className="text-3xl font-black mb-2">{stat.value}</h3>
                                {stat.trend && (
                                    <p className={`text-xs font-bold ${stat.trendColor || 'text-emerald-500'}`}>{stat.trend}</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                        <h3 className="text-xl font-bold">Aktivitas Terkini</h3>
                        <button className="text-sm font-bold text-emerald-500 hover:text-emerald-400">Lihat Semua</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                             [...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-6 p-6 animate-pulse">
                                    <div className="w-3 h-3 rounded-full bg-zinc-800 mt-2" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
                                        <div className="h-3 bg-zinc-800 rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : recentActivities.length > 0 ? (
                            recentActivities.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-6 p-6 rounded-3xl hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-800 group">
                                    <div className="mt-1">
                                        <div className={`w-3 h-3 rounded-full ${
                                            activity.type === 'success' ? 'bg-emerald-500' : 
                                            activity.type === 'info' ? 'bg-blue-500' : 'bg-amber-500'
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold mb-1 group-hover:text-emerald-400 transition-colors">{activity.title}</h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed">{activity.desc}</p>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 whitespace-nowrap uppercase tracking-widest">{activity.time}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-zinc-500 font-bold italic">Tidak ada aktivitas terbaru.</div>
                        )}
                    </div>
                </div>

                {/* Shop Earnings Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <TrendingUp className="text-emerald-500" size={20} />
                            Penghasilan Toko
                        </h3>
                    </div>
                    <div className="flex-1 p-4">
                        <div className="overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                                        <th className="px-4 py-4 text-left font-black">Toko</th>
                                        <th className="px-4 py-4 text-right font-black">Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-5 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-800 rounded-xl" />
                                                    <div className="h-4 bg-zinc-800 rounded w-24" />
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    <div className="h-4 bg-zinc-800 rounded w-16 ml-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : shopEarnings.length > 0 ? (
                                        shopEarnings.map((shop, idx) => (
                                            <tr key={idx} className="group hover:bg-zinc-800/30 transition-all">
                                                <td className="px-4 py-5 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 p-0.5 group-hover:border-emerald-500/50 transition-colors">
                                                        {shop.logo_url ? (
                                                            <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" alt={shop.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-black text-[10px]">
                                                                {shop.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold group-hover:text-white transition-colors line-clamp-1">{shop.name}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Pendapatan Bersih</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    <span className="text-emerald-500 font-black text-sm">
                                                        {formatPrice(shop.totalEarnings)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="py-10 text-center text-zinc-500 font-bold italic text-xs">Belum ada penghasilan toko.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Transaction & Revenue Report */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 flex flex-col">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Laporan Detail Transaksi & Pendapatan Admin</h3>
                        <p className="text-sm text-zinc-500 font-medium">Rekap transaksi selesai yang menghasilkan biaya admin platform.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                        {/* Search */}
                        <div className="relative min-w-[240px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari ID atau Toko..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
                            />
                        </div>

                        {/* Date Filter */}
                        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 gap-1 text-xs font-bold">
                            <button 
                                onClick={() => setDateFilter("all")} 
                                className={`px-4 py-2 rounded-xl transition-all ${dateFilter === "all" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Semua
                            </button>
                            <button 
                                onClick={() => setDateFilter("today")} 
                                className={`px-4 py-2 rounded-xl transition-all ${dateFilter === "today" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Hari Ini
                            </button>
                            <button 
                                onClick={() => setDateFilter("this_month")} 
                                className={`px-4 py-2 rounded-xl transition-all ${dateFilter === "this_month" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={exportToCSV}
                                className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 px-4 py-2.5 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/30 font-bold transition-all text-xs"
                            >
                                <FileSpreadsheet size={16} />
                                Ekspor CSV
                            </button>
                            <button 
                                onClick={printReport}
                                className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 px-4 py-2.5 rounded-2xl border border-purple-500/20 hover:border-purple-500/30 font-bold transition-all text-xs"
                            >
                                <Printer size={16} />
                                Cetak PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden border border-zinc-800/50 rounded-3xl bg-zinc-950/20">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                                    <th className="px-6 py-4 text-left font-black">No</th>
                                    <th className="px-6 py-4 text-left font-black">ID Pesanan</th>
                                    <th className="px-6 py-4 text-left font-black">Toko Penjual</th>
                                    <th className="px-6 py-4 text-left font-black">Tanggal</th>
                                    <th className="px-6 py-4 text-right font-black">Total Transaksi</th>
                                    <th className="px-6 py-4 text-right font-black">Fee Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {isLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-5"><div className="h-4 bg-zinc-800 rounded w-4" /></td>
                                            <td className="px-6 py-5"><div className="h-4 bg-zinc-800 rounded w-20" /></td>
                                            <td className="px-6 py-5"><div className="h-4 bg-zinc-800 rounded w-28" /></td>
                                            <td className="px-6 py-5"><div className="h-4 bg-zinc-800 rounded w-16" /></td>
                                            <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-800 rounded w-16 ml-auto" /></td>
                                            <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-800 rounded w-16 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : getFilteredOrders().length > 0 ? (
                                    getFilteredOrders().map((order, idx) => (
                                        <tr key={order.order_id} className="group hover:bg-zinc-800/30 transition-all">
                                            <td className="px-6 py-5 text-xs text-zinc-500 font-bold">{idx + 1}</td>
                                            <td className="px-6 py-5 text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">{order.order_id}</td>
                                            <td className="px-6 py-5 text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{order.shop?.name || "Tidak diketahui"}</td>
                                            <td className="px-6 py-5 text-xs text-zinc-400 font-medium">{formatDate(order.updated_at || order.created_at)}</td>
                                            <td className="px-6 py-5 text-xs text-right font-bold text-zinc-400">{formatPrice(order.total_price)}</td>
                                            <td className="px-6 py-5 text-xs text-right font-black text-purple-400">{formatPrice(order.admin_fee)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center text-zinc-500 font-bold italic text-xs">Tidak ada data transaksi yang cocok.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {getFilteredOrders().length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 text-xs font-bold">
                        <div className="text-zinc-500">
                            Menampilkan {getFilteredOrders().length} transaksi selesai
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-zinc-400">
                                Total Nilai: <span className="text-zinc-200 font-black">{formatPrice(getFilteredOrders().reduce((sum, o) => sum + (Number(o.total_price) || 0), 0))}</span>
                            </div>
                            <div className="text-purple-400 bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                                Total Pendapatan: <span className="font-black">{formatPrice(getFilteredOrders().reduce((sum, o) => sum + (Number(o.admin_fee) || 0), 0))}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

