"use client";

import { useEffect, useState } from "react";
import { 
    ShoppingBag, 
    Store, 
    Wallet,
    TrendingUp,
    Clock,
    ArrowUpRight,
    Users2
} from "lucide-react";

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCommunities: 0,
        totalShops: 0,
        adminRevenue: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [shopEarnings, setShopEarnings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem("admin_user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/admin/stats`);
            if (!response.ok) throw new Error("Gagal mengambil data dari server");
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
                setShopEarnings(data.shopEarnings || []);
                
                // Process recent activities into a unified format
                const activities = [];
                
                data.recentActivity.products.forEach(p => {
                    activities.push({
                        title: "Produk Baru",
                        desc: `${p.name} dari Toko ${p.shop?.name || 'Unknown'}`,
                        time: new Date(p.created_at).toLocaleDateString(),
                        type: "success"});
                });

                data.recentActivity.shops.forEach(s => {
                    activities.push({
                        title: "Toko Baru",
                        desc: `Toko ${s.name} telah bergabung.`,
                        time: new Date(s.created_at).toLocaleDateString(),
                        type: "info"});
                });

                data.recentActivity.orders.forEach(o => {
                    activities.push({
                        title: "Menunggu Pembayaran",
                        desc: `Order #${o.order_id.substring(0, 8)} menunggu konfirmasi.`,
                        time: new Date(o.updated_at || o.created_at).toLocaleDateString(),
                        type: "warning"});
                });

                setRecentActivities(activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5));
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayStats = [
        { name: "Total Produk", value: stats.totalProducts, icon: ShoppingBag, trend: "Live Data", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { name: "Total Komunitas", value: stats.totalCommunities, icon: Users2, trend: "Live Data", color: "text-blue-500", bg: "bg-blue-500/10" },
        { name: "Total Toko", value: stats.totalShops, icon: Store, trend: "Live Data", color: "text-amber-500", bg: "bg-amber-500/10" },
        { name: "Pendapatan Admin", value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.adminRevenue), icon: Wallet, trend: "Live Data", color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Halo, {user?.name || "Admin"}! 👋</h1>
                    <p className="text-zinc-500 font-medium">Selamat datang kembali di pusat kendali konten Reptile Haven.</p>
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
                                <p className="text-xs font-bold text-emerald-500">{stat.trend}</p>
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
                                                            <img src={shop.logo_url} className="w-full h-full object-cover" alt={shop.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-black text-[10px]">
                                                                {shop.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold group-hover:text-white transition-colors line-clamp-1">{shop.name}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Seller Profile</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    <span className="text-emerald-500 font-black text-sm">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(shop.totalEarnings)}
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
        </div>
    );
}

