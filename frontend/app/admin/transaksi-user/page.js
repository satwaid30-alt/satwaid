"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Receipt,
    Search,
    Filter,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    Image as ImageIcon,
    AlertCircle,
    ChevronRight,
    User,
    Store,
    Truck,
    CreditCard,
    ShieldAlert,
    MapPin
} from "lucide-react";

export default function AdminTransactionPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProof, setSelectedProof] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`);
            const result = await res.json();
            if (res.ok) {
                setOrders(result.data);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    };

    // Label status transaksi buyer-seller yang mudah dipahami
    const getStatusLabel = (status) => {
        switch (status) {
            case "pending_shipping_info": return "Menunggu Alamat";
            case "waiting_shipping_cost": return "Menunggu Ongkir";
            case "waiting_payment": return "Menunggu Pembayaran";
            case "processing": return "Verifikasi Pembayaran";
            case "payment_verified": return "Siap Dikirim";
            case "waiting_shipment": return "Siap Dikirim";
            case "shipped": return "Dalam Pengiriman";
            case "completed": return "Selesai";
            case "disbursement_requested": return "Selesai";
            case "disbursed": return "Selesai";
            case "cancelled": return "Dibatalkan";
            case "cancelled_dismissed": return "Dibatalkan";
            case "complained": return "Komplain";
            default: return status?.replace(/_/g, " ") || "-";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
            case "disbursement_requested":
            case "disbursed":
                return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "processing":
            case "payment_verified":
            case "waiting_shipment":
                return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "shipped":
                return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            case "waiting_payment":
            case "waiting_shipping_cost":
            case "pending_shipping_info":
                return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "cancelled":
            case "cancelled_dismissed":
                return "text-red-500 bg-red-500/10 border-red-500/20";
            case "complained":
                return "text-orange-500 bg-orange-500/10 border-orange-500/20";
            default:
                return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
            case "disbursement_requested":
            case "disbursed":
                return <CheckCircle2 size={10} />;
            case "shipped": return <Truck size={10} />;
            case "processing":
            case "payment_verified":
            case "waiting_shipment":
                return <CreditCard size={10} />;
            case "waiting_payment":
            case "waiting_shipping_cost":
            case "pending_shipping_info":
                return <Clock size={10} />;
            case "cancelled":
            case "cancelled_dismissed":
                return <XCircle size={10} />;
            case "complained": return <ShieldAlert size={10} />;
            default: return <AlertCircle size={10} />;
        }
    };

    // Filter: status 'completed' juga include disbursement_requested & disbursed
    const filteredOrders = orders.filter(order => {
        let matchesStatus = false;
        if (filterStatus === "all") {
            matchesStatus = true;
        } else if (filterStatus === "completed") {
            matchesStatus = ["completed", "disbursement_requested", "disbursed"].includes(order.status);
        } else if (filterStatus === "cancelled") {
            matchesStatus = ["cancelled", "cancelled_dismissed"].includes(order.status);
        } else if (filterStatus === "processing") {
            matchesStatus = ["processing", "payment_verified", "waiting_shipment"].includes(order.status);
        } else {
            matchesStatus = order.status === filterStatus;
        }

        const matchesSearch =
            order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // Ringkasan jumlah per status
    const counts = {
        all: orders.length,
        waiting_payment: orders.filter(o => o.status === "waiting_payment").length,
        processing: orders.filter(o => ["processing", "payment_verified", "waiting_shipment"].includes(o.status)).length,
        shipped: orders.filter(o => o.status === "shipped").length,
        completed: orders.filter(o => ["completed", "disbursement_requested", "disbursed"].includes(o.status)).length,
        cancelled: orders.filter(o => ["cancelled", "cancelled_dismissed"].includes(o.status)).length,
        complained: orders.filter(o => o.status === "complained").length,
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchQuery]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Data Transaksi...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Receipt className="text-emerald-500" size={28} /> Transaksi Buyer & Seller
                    </h1>
                    <p className="text-xs text-zinc-500 font-medium italic uppercase tracking-widest">Monitor seluruh transaksi produk antara pembeli dan penjual</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                    <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Transaksi</span>
                        <span className="text-sm font-black text-emerald-500">{orders.length}</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: "Menunggu Bayar", count: counts.waiting_payment, colorClass: "amber" },
                    { label: "Diproses", count: counts.processing, colorClass: "blue" },
                    { label: "Dikirim", count: counts.shipped, colorClass: "purple" },
                    { label: "Selesai", count: counts.completed, colorClass: "emerald" },
                    { label: "Dibatalkan", count: counts.cancelled, colorClass: "red" },
                    { label: "Komplain", count: counts.complained, colorClass: "orange" },
                ].map(card => (
                    <div key={card.label} className={`p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col gap-2 transition-all`}>
                        <p className="text-2xl font-black text-white">{card.count}</p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari ID Pesanan, Nama Pembeli, Produk, atau Toko..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
                    />
                </div>
                <div className="md:col-span-4 relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-black uppercase tracking-widest appearance-none cursor-pointer"
                    >
                        <option value="all">Semua Status ({counts.all})</option>
                        <option value="waiting_payment">Menunggu Pembayaran ({counts.waiting_payment})</option>
                        <option value="processing">Verifikasi / Siap Kirim ({counts.processing})</option>
                        <option value="shipped">Dalam Pengiriman ({counts.shipped})</option>
                        <option value="completed">Selesai ({counts.completed})</option>
                        <option value="cancelled">Dibatalkan ({counts.cancelled})</option>
                        <option value="complained">Komplain ({counts.complained})</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Pesanan & Produk</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pembeli</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Penjual / Toko</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Total Tagihan</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Transaksi</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Bukti Bayar</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {currentItems.length > 0 ? currentItems.map((order, index) => (
                                <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-6 text-center">
                                        <span className="text-xs font-black text-zinc-600">{indexOfFirstItem + index + 1}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-white tracking-wider font-mono">{order.order_id}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{order.product?.name}</span>
                                                <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                                                    ID: {order.product?.product_id || "-"}
                                                </span>
                                            </div>
                                            {order.tracking_number && (
                                                <div className="flex items-center gap-1 pt-1">
                                                    <Truck size={9} className="text-blue-400" />
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Resi: {order.tracking_number}</span>
                                                </div>
                                            )}
                                            {["cancelled", "cancelled_dismissed"].includes(order.status) && order.rejection_reason && (
                                                <div className="pt-2 border-t border-zinc-800/50 mt-2">
                                                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                        <AlertCircle size={8} /> Alasan Batal
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 italic leading-snug">{order.rejection_reason}</p>
                                                </div>
                                            )}
                                            {order.status === "complained" && order.complaint_description && (
                                                <div className="pt-2 border-t border-zinc-800/50 mt-2">
                                                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                        <ShieldAlert size={8} /> Komplain
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 italic leading-snug line-clamp-2">{order.complaint_description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User size={12} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{order.receiver_name || order.user?.username || "User Anonymous"}</span>
                                            </div>
                                            {order.shipping_address && (
                                                <div className="flex items-start gap-1.5">
                                                    <MapPin size={10} className="text-zinc-600 mt-0.5 shrink-0" />
                                                    <span className="text-[9px] text-zinc-600 leading-tight line-clamp-2">{order.shipping_address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <Store size={12} className="text-zinc-600" />
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter italic">{order.shop?.name || order.product?.shop?.name || "Toko Unknown"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right font-mono">
                                        <span className="text-sm font-black text-white">{formatPrice(order.total_price)}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex justify-center">
                                            {order.payment_proof ? (
                                                <button
                                                    onClick={() => setSelectedProof(order.payment_proof)}
                                                    className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-zinc-950 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/5"
                                                >
                                                    <ImageIcon size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Lihat</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-700 italic">
                                                    <Clock size={14} />
                                                    <span className="text-[9px] font-black uppercase">Belum Ada</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex justify-center">
                                            <Link
                                                href={`/admin/transaksi-user/detail/${order.id}`}
                                                className="p-2.5 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all active:scale-90 flex items-center gap-1.5 group/link"
                                                title="Lihat Detail"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                                                <AlertCircle size={32} />
                                            </div>
                                            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] italic">Tidak ada data transaksi ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > itemsPerPage && (
                    <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Menampilkan <span className="text-white">{indexOfFirstItem + 1}</span> - <span className="text-white">{Math.min(indexOfLastItem, filteredOrders.length)}</span> dari <span className="text-white">{filteredOrders.length}</span> Transaksi
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-xl hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all border ${currentPage === i + 1
                                            ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-xl hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Payment Proof */}
            {selectedProof && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative max-w-4xl w-full bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                <ImageIcon size={18} className="text-emerald-500" /> Bukti Pembayaran Pembeli
                            </h3>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-2 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-950 flex items-center justify-center min-h-[400px]">
                            <img
                                src={selectedProof}
                                alt="Payment Proof"
                                className="max-h-[70vh] object-contain rounded-xl shadow-2xl shadow-black/50"
                            />
                        </div>
                        <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-4">
                            <a
                                href={selectedProof}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <ExternalLink size={14} /> Buka Tab Baru
                            </a>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
