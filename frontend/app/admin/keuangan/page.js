"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
    Search,
    Filter,
    Download,
    Store,
    DollarSign,
    CheckCircle2,
    Clock,
    ChevronRight,
    User,
    Mail,
    Phone,
    ArrowUpRight,
    FileText
} from "lucide-react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";

export default function KeuanganAdminPage() {
    const [shops, setShops] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const headers = {
                'Authorization': token ? `Bearer ${token}` : ''
            };

            // Fetch all shops
            const shopsRes = await fetch(`${getApiUrl()}/shops`, { headers });
            const shopsResult = await shopsRes.json();

            // Fetch all orders to calculate financial stats per shop
            const ordersRes = await fetch(`${getApiUrl()}/orders`, { headers });
            const ordersResult = await ordersRes.json();

            if (shopsRes.ok) {
                setShops(shopsResult.data || []);
            }
            if (ordersRes.ok) {
                setOrders(ordersResult.data || []);
            }
        } catch (err) {
            console.error("Error fetching admin finance data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Setup Socket.io for Real-time Admin Finance Notifications
        let socket;
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem("admin_token") : null;
            socket = io(getSocketUrl(), {
                auth: {
                    token: token ? `Bearer ${token}` : null
                }
            });

            socket.on("connect", () => {
                console.log("[Socket] Admin Finance Connected");
                socket.emit("join_admin");
            });

            socket.on("admin_notification", (data) => {
                console.log("[Socket] Received admin notification:", data);
                if (data.type === "disbursement_request") {
                    // Trigger a re-fetch of data to show the new request in the notification table instantly
                    fetchData();

                    setActionModal({
                        isOpen: true,
                        type: 'info',
                        title: data.title || 'Pengajuan Baru',
                        message: data.message || 'Ada pengajuan pencairan dana baru dari seller.',
                        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
                    });
                }
            });

            socket.on("order_updated_admin", (data) => {
                console.log("[Socket] Received order update admin event:", data);
                fetchData();
            });

            socket.on("new_notification", (data) => {
                console.log("[Socket] Received general notification event:", data);
                if (data.type === "disbursement" || data.type === "disbursement_request") {
                    fetchData();
                }
            });
        } catch (e) {
            console.error("Socket connection error:", e);
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    // Removed local getImageUrl function in favor of central helper from @/app/utils/api

    // Global Stats Calculations
    const totalDisbursed = orders.filter(o => o.disbursed_at || o.disbursement_proof).reduce((acc, curr) => {
        const total = (Number(curr.price || 0) * Number(curr.quantity || 1)) +
            Number(curr.shipping_cost || 0) +
            Number(curr.packing_cost || 0);
        return acc + total;
    }, 0);

    const totalPending = orders.filter(o => !o.disbursed_at && !o.disbursement_proof && (o.status === 'completed' || o.status === 'disbursement_requested')).reduce((acc, curr) => {
        const total = (Number(curr.price || 0) * Number(curr.quantity || 1)) +
            Number(curr.shipping_cost || 0) +
            Number(curr.packing_cost || 0);
        return acc + total;
    }, 0);

    const pendingDisbursements = orders.filter(o => o.status === 'disbursement_requested' && !o.disbursed_at && !o.disbursement_proof);

    const untransferredOrders = orders.filter(o => 
        !o.disbursed_at && 
        !o.disbursement_proof && 
        ['completed', 'disbursement_requested'].includes(o.status)
    );

    // Filter Shops based on search query
    const filteredShops = shops.filter(shop => {
        const query = searchQuery.toLowerCase();
        return (
            shop.name?.toLowerCase().includes(query) ||
            shop.owner?.name?.toLowerCase().includes(query) ||
            shop.owner?.email?.toLowerCase().includes(query) ||
            shop.city?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Keuangan Seller</h1>
                    <p className="text-zinc-500 font-medium">Manajemen data keuangan, saldo, dan riwayat transfer per toko seller</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Dana Sudah Cair</p>
                        <h3 className="text-2xl font-black text-white mt-1">
                            {formatPrice(totalDisbursed)}
                        </h3>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Menunggu Transfer</p>
                        <h3 className="text-2xl font-black text-white mt-1">
                            {formatPrice(totalPending)}
                        </h3>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Store size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Toko Seller</p>
                        <h3 className="text-2xl font-black text-white mt-1">{shops.length} Toko</h3>
                    </div>
                </div>
            </div>

            {/* Notification Table Section */}
            {pendingDisbursements.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Notifikasi Pengajuan Dana</h2>
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                                {pendingDisbursements.length} Pengajuan Baru
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Perlu Segera Ditransfer</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-950/30 border-b border-zinc-800">
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Toko Seller</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Invoice ID</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tanggal Diajukan</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Atas Nama Bank</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Jumlah Pencairan</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {pendingDisbursements.map((req, index) => {
                                    const total = (Number(req.price || 0) * Number(req.quantity || 1)) +
                                        Number(req.shipping_cost || 0) +
                                        Number(req.packing_cost || 0);

                                    const owner = req.shop?.owner;
                                    let bankAccounts = owner?.bank_accounts;
                                    if (typeof bankAccounts === 'string') {
                                        try {
                                            bankAccounts = JSON.parse(bankAccounts);
                                        } catch (e) {
                                            bankAccounts = null;
                                        }
                                    }
                                    const primaryBank = (Array.isArray(bankAccounts) && bankAccounts.length > 0) ? bankAccounts[0] : null;
                                    const sBankName = primaryBank ? (primaryBank.bank_name || primaryBank.bankName || "-") : (req.shop?.bank_name || "-");
                                    const sBankAccount = primaryBank ? (primaryBank.account_number || primaryBank.accountNumber || primaryBank.bank_account || "-") : (req.shop?.bank_account || "-");
                                    const sBankHolder = primaryBank ? (primaryBank.account_name || primaryBank.accountName || primaryBank.bank_holder || owner?.name || "-") : (req.shop?.bank_holder || owner?.name || "-");

                                    return (
                                        <tr key={req.id} className="hover:bg-zinc-800/20 transition-colors border-b border-zinc-800/40">
                                            <td className="px-6 py-5 text-center text-xs font-bold text-zinc-500 font-mono">{index + 1}</td>
                                            <td className="px-6 py-5 font-black text-white text-sm">{req.shop?.name || "Toko dihapus"}</td>
                                            <td className="px-6 py-5 font-mono text-xs text-amber-500 font-bold">{req.order_id}</td>
                                            <td className="px-6 py-5 text-xs text-zinc-400 font-bold">
                                                {req.disbursement_requested_at ? new Date(req.disbursement_requested_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs">
                                                    <p className="font-black text-zinc-300 uppercase">{sBankName}</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold font-mono">{sBankAccount}</p>
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">an. {sBankHolder}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-black text-emerald-500 text-sm">{formatPrice(total)}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/admin/keuangan/upload/${req.id}`}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-xl shadow-amber-500/10"
                                                    >
                                                        <ArrowUpRight size={12} /> Proses Pencairan
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Table Belum Transfer */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Transaksi Belum Ditransfer</h2>
                            <p className="text-zinc-500 text-xs font-medium">Transaksi yang sudah selesai tetapi dana escrow belum dicairkan ke toko penjual</p>
                        </div>
                    </div>
                    {untransferredOrders.length > 0 && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                            {untransferredOrders.length} Transaksi
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {untransferredOrders.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-950/30 border-b border-zinc-800">
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Toko Seller</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Invoice ID</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status Dana</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Rekening Tujuan</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Jumlah Bersih</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {untransferredOrders.map((req, index) => {
                                    const total = (Number(req.price || 0) * Number(req.quantity || 1)) +
                                        Number(req.shipping_cost || 0) +
                                        Number(req.packing_cost || 0) -
                                        Number(req.additional_fee || 0);

                                    const owner = req.shop?.owner;
                                    let bankAccounts = owner?.bank_accounts;
                                    if (typeof bankAccounts === 'string') {
                                        try {
                                            bankAccounts = JSON.parse(bankAccounts);
                                        } catch (e) {
                                            bankAccounts = null;
                                        }
                                    }
                                    const primaryBank = (Array.isArray(bankAccounts) && bankAccounts.length > 0) ? bankAccounts[0] : null;
                                    const sBankName = primaryBank ? (primaryBank.bank_name || primaryBank.bankName || "-") : (req.shop?.bank_name || "-");
                                    const sBankAccount = primaryBank ? (primaryBank.account_number || primaryBank.accountNumber || primaryBank.bank_account || "-") : (req.shop?.bank_account || "-");
                                    const sBankHolder = primaryBank ? (primaryBank.account_name || primaryBank.accountName || primaryBank.bank_holder || owner?.name || "-") : (req.shop?.bank_holder || owner?.name || "-");

                                    return (
                                        <tr key={req.id} className="hover:bg-zinc-800/20 transition-colors border-b border-zinc-800/40">
                                            <td className="px-6 py-5 text-center text-xs font-bold text-zinc-500 font-mono">{index + 1}</td>
                                            <td className="px-6 py-5">
                                                <div className="font-black text-white text-sm">{req.shop?.name || "Toko dihapus"}</div>
                                                <div className="text-[10px] text-zinc-500 font-medium">Owner: {owner?.name || "-"}</div>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs text-amber-500 font-bold">{req.order_id}</td>
                                            <td className="px-6 py-5">
                                                {req.status === 'disbursement_requested' ? (
                                                    <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse">
                                                        Diajukan Tarik
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                        Selesai (Belum Tarik)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs">
                                                    <p className="font-black text-zinc-300 uppercase">{sBankName}</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold font-mono">{sBankAccount}</p>
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">an. {sBankHolder}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-black text-emerald-500 text-sm">{formatPrice(total)}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/admin/keuangan/upload/${req.id}`}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-xl shadow-emerald-500/10 active:scale-95"
                                                    >
                                                        <ArrowUpRight size={12} /> Transfer Sekarang
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center space-y-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-3xl">
                            <CheckCircle2 size={40} className="text-zinc-700 mx-auto" />
                            <div className="space-y-1">
                                <p className="text-white font-black uppercase tracking-widest text-sm">Semua Beres!</p>
                                <p className="text-zinc-500 text-xs font-medium">Tidak ada transaksi selesai yang menunggak untuk ditransfer.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Filter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-3 flex items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Nama Toko, Seller, Kota, atau Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toko / Seller</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kontak Owner</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Total Produk</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Pesanan Selesai</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dana Ditransfer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Belum Transfer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Pendapatan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={9} className="px-8 py-6 h-24 bg-zinc-900/50"></td>
                                    </tr>
                                ))
                            ) : filteredShops.length > 0 ? (
                                filteredShops.map((shop, index) => {
                                    // Filter orders specifically belonging to this shop
                                    const shopOrders = orders.filter(o => o.shop_id === shop.id || o.shop?.id === shop.id);

                                    // Total completed orders count
                                    const completedCount = shopOrders.filter(o =>
                                        ['completed', 'disbursement_requested'].includes(o.status) ||
                                        !!(o.disbursed_at || o.disbursement_proof)
                                    ).length;

                                    // Total disbursed amount for this shop
                                    const shopDisbursed = shopOrders.filter(o => o.disbursed_at || o.disbursement_proof).reduce((acc, curr) => {
                                        const total = (Number(curr.price || 0) * Number(curr.quantity || 1)) +
                                            Number(curr.shipping_cost || 0) +
                                            Number(curr.packing_cost || 0) -
                                            Number(curr.additional_fee || 0);
                                        return acc + total;
                                    }, 0);

                                    // Total pending disbursement amount for this shop
                                    const shopPending = shopOrders.filter(o =>
                                        !o.disbursed_at &&
                                        !o.disbursement_proof &&
                                        (o.status === 'completed' || o.status === 'disbursement_requested')
                                    ).reduce((acc, curr) => {
                                        const total = (Number(curr.price || 0) * Number(curr.quantity || 1)) +
                                            Number(curr.shipping_cost || 0) +
                                            Number(curr.packing_cost || 0) -
                                            Number(curr.additional_fee || 0);
                                        return acc + total;
                                    }, 0);

                                    return (
                                        <tr key={shop.id} className="hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/50">
                                            <td className="px-6 py-6 text-center text-xs font-bold text-zinc-500 font-mono">
                                                {index + 1}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center text-emerald-500 shrink-0">
                                                        {shop.logo_url ? (
                                                            <img
                                                                src={getImageUrl(shop.logo_url)}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <Store size={22} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white leading-snug">{shop.name}</p>
                                                        <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mt-0.5">
                                                            Kode: <span className="font-mono text-zinc-400">{shop.shop_code || `#${shop.id}`}</span>
                                                            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                                            <span>{shop.city || "-"}</span>
                                                        </p>
                                                        {/* Level Keanggotaan Badge */}
                                                        {(() => {
                                                            const level = shop.membership_level || 'Standard Seller';
                                                            let badgeStyle = 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50';
                                                            if (level === 'Pro Seller') badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
                                                            else if (level === 'Enterprise Seller') badgeStyle = 'bg-purple-500/15 text-purple-400 border-purple-500/25';
                                                            return (
                                                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${badgeStyle}`}>
                                                                    {level}
                                                                </span>
                                                            );
                                                        })()}
                                                        {/* Status Upgrade Terbaru */}
                                                        {(() => {
                                                            const latestUpgrade = shop.upgrades && shop.upgrades.length > 0
                                                                ? [...shop.upgrades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                                                                : null;
                                                            if (!latestUpgrade) return null;
                                                            if ((shop.membership_level || 'Standard Seller') === 'Standard Seller' && latestUpgrade.status !== 'pending_verification') {
                                                                return null;
                                                            }
                                                            let upgradeStyle = 'bg-zinc-700/40 text-zinc-500 border-zinc-600/40';
                                                            let upgradeLabel = latestUpgrade.status;
                                                            if (latestUpgrade.status === 'pending_verification') {
                                                                upgradeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                                                upgradeLabel = '⏳ Upgrade Pending';
                                                            } else if (latestUpgrade.status === 'approved') {
                                                                upgradeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                                                upgradeLabel = '✓ Upgrade Disetujui';
                                                            } else if (latestUpgrade.status === 'rejected') {
                                                                upgradeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
                                                                upgradeLabel = '✕ Upgrade Ditolak';
                                                            }
                                                            return (
                                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${upgradeStyle}`}>
                                                                    {upgradeLabel} · {latestUpgrade.plan_name}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-black text-zinc-300 flex items-center gap-1.5">
                                                        <User size={12} className="text-emerald-500" />
                                                        {shop.owner?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5">
                                                        <Mail size={10} />
                                                        {shop.owner?.email || "-"}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-500/80 font-bold flex items-center gap-1.5">
                                                        <Phone size={10} />
                                                        +62 {shop.whatsapp || "-"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center text-sm font-black text-zinc-300">
                                                {shop.listings?.length || 0}
                                            </td>
                                            <td className="px-8 py-6 text-center text-sm font-black text-emerald-500">
                                                {completedCount}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-emerald-500">
                                                    {formatPrice(shopDisbursed)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-amber-500">
                                                    {formatPrice(shopPending)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-white">
                                                    {formatPrice(shopDisbursed + shopPending)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/admin/keuangan/detail-pembayaran/${shop.id}`}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 hover:border-zinc-600 group/btn shadow-inner"
                                                    >
                                                        <FileText size={14} className="text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                                                        Detail Keuangan
                                                        <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-700 shadow-inner">
                                                <Store size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white font-black uppercase tracking-widest">Tidak Ada Data</p>
                                                <p className="text-zinc-500 text-xs font-medium">Data toko seller tidak ditemukan.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && filteredShops.length > 0 && (
                    <div className="px-8 py-5 bg-zinc-950/30 border-t border-zinc-800 flex items-center justify-between">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Menampilkan {filteredShops.length} toko seller</p>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black uppercase disabled:opacity-50" disabled>Prev</button>
                            <button className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-[10px] font-black uppercase">Next</button>
                        </div>
                    </div>
                )}
            </div>

            <ActionModal
                isOpen={actionModal.isOpen}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                onConfirm={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
