"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";
import Link from "next/link";
import {
    Store,
    Search,
    Filter,
    MoreVertical,
    Eye,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    MapPin,
    Phone,
    Calendar,
    ExternalLink,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Ban,
    UserCheck,
    X,
    Info,
    Fingerprint,
    CreditCard,
} from "lucide-react";

export default function AdminTokoUserPage() {
    const [shops, setShops] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedShop, setSelectedShop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Confirm Action State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: '', // 'active', 'suspended', 'delete'
        shopId: null,
        shopName: ''
    });

    const [rejectionModal, setRejectionModal] = useState({
        isOpen: false,
        shopId: null,
        shopName: '',
        reason: ''
    });

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/shops`);
            const result = await response.json();
            if (response.ok) {
                setShops(result.data);
            }
        } catch (err) {
            console.error("Error fetching shops:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAction = (shop, type) => {
        setConfirmModal({
            isOpen: true,
            type,
            shopId: shop.id,
            shopName: shop.name
        });
    };

    const processStatusUpdate = async () => {
        const { shopId, type } = confirmModal;
        try {
            let response;
            if (type === 'delete') {
                response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
                    method: "DELETE"});
            } else {
                response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json"},
                    body: JSON.stringify({ status: type })
                });
            }

            if (response.ok) {
                fetchShops();
                setConfirmModal({ isOpen: false, type: '', shopId: null, shopName: '' });
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error("Error processing shop action:", err);
        }
    };

    const processRejection = async () => {
        const { shopId, reason } = rejectionModal;
        if (!reason.trim()) {
            alert("Harap isi alasan penolakan.");
            return;
        }

        try {
            const response = await fetch(`${getApiUrl()}/shops/${shopId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ 
                    status: 'rejected',
                    rejection_reason: reason
                })
            });

            if (response.ok) {
                fetchShops();
                setRejectionModal({ isOpen: false, shopId: null, shopName: '', reason: '' });
            }
        } catch (err) {
            console.error("Error rejecting shop:", err);
        }
    };

    // Filter Logic
    const filteredShops = shops.filter(shop => {
        const matchesSearch =
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (shop.owner?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Match status (handling case sensitivity)
        const currentStatus = shop.status?.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        const matchesStatus = statusFilter === "All" || currentStatus === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "suspended":
                return "bg-red-500/10 text-red-500 border-red-500/20";
            case "pending":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "rejected":
                return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            default:
                return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6 lg:p-10 space-y-8 animate-in fade-in duration-700 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Store className="text-emerald-500" size={32} />
                        Manajemen Toko User
                    </h1>
                    <p className="text-zinc-500 mt-1 font-medium">Pantau dan kelola semua toko yang terdaftar di platform.</p>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                    <div className="px-4 py-2 text-center border-r border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Toko</p>
                        <p className="text-xl font-black text-white">{shops.length}</p>
                    </div>
                    <div className="px-4 py-2 text-center">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Suspended</p>
                        <p className="text-xl font-black text-red-500">{shops.filter(s => s.status?.toLowerCase() === "suspended").length}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama toko atau pemilik..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all shadow-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all appearance-none shadow-xl"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">Semua Status</option>
                        <option value="pending">Menunggu Verifikasi (Pending)</option>
                        <option value="active">Aktif</option>
                        <option value="suspended">Ditangguhkan (Suspend)</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informasi Toko</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pemilik</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Total Produk</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Terdaftar</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi Cepat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredShops.map((shop) => (
                                <tr key={shop.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden">
                                                {shop.logo_url ? <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={24} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">{shop.name}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <MapPin size={10} /> {shop.city}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div>
                                            <p className="font-bold text-zinc-200 leading-tight">{shop.owner?.name || "Unknown"}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{shop.owner?.email || "-"}</p>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20">
                                            <ShoppingBag size={12} />
                                            <span className="text-xs font-black">{shop.listings?.length || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs font-bold text-zinc-300">
                                                {new Date(shop.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">Terdaftar</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(shop.status)}`}>
                                                {shop.status || 'active'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/admin/toko-user/detail-toko/${shop.id}`}
                                                className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all hover:bg-zinc-700 border border-zinc-700"
                                                title="Detail Lengkap"
                                            >
                                                <Eye size={18} />
                                            </Link>

                                            {shop.status?.toLowerCase() === 'active' ? (
                                                <button
                                                    onClick={() => handleConfirmAction(shop, 'suspended')}
                                                    className="w-10 h-10 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all border border-amber-500/20"
                                                    title="Suspend Toko"
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleConfirmAction(shop, 'active')}
                                                        className="w-10 h-10 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all border border-emerald-500/20"
                                                        title="Aktifkan Toko"
                                                    >
                                                        <UserCheck size={18} />
                                                    </button>
                                                    {shop.status?.toLowerCase() === 'pending' && (
                                                        <button
                                                            onClick={() => setRejectionModal({
                                                                isOpen: true,
                                                                shopId: shop.id,
                                                                shopName: shop.name,
                                                                reason: ''
                                                            })}
                                                            className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/20"
                                                            title="Tolak Verifikasi"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleConfirmAction(shop, 'delete')}
                                                className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/20"
                                                title="Hapus Toko Permanen"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Confirm Action Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${confirmModal.type === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                confirmModal.type === 'delete' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}>
                                {confirmModal.type === 'active' ? <UserCheck size={40} /> :
                                    confirmModal.type === 'delete' ? <Trash2 size={40} /> :
                                        <Ban size={40} />}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">
                                    {confirmModal.type === 'active' ? 'Aktifkan Toko?' :
                                        confirmModal.type === 'delete' ? 'Hapus Toko Permanen?' :
                                            'Suspend Toko?'}
                                </h3>
                                <p className="text-zinc-500 text-sm font-medium px-4">
                                    Apakah Anda yakin ingin {
                                        confirmModal.type === 'active' ? 'mengaktifkan' :
                                            confirmModal.type === 'delete' ? 'menghapus permanen' :
                                                'menonaktifkan (suspend)'
                                    } toko
                                    <span className="text-white font-bold block mt-1">{confirmModal.shopName}</span>
                                </p>
                            </div>

                            {confirmModal.type === 'suspended' && (
                                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-left">
                                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase tracking-tight">
                                        Seluruh iklan dari toko ini akan disembunyikan dari publik secara otomatis.
                                    </p>
                                </div>
                            )}

                            {confirmModal.type === 'delete' && (
                                <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
                                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase tracking-tight">
                                        Tindakan ini tidak dapat dibatalkan. Seluruh data toko dan iklan akan dihapus secara permanen dari database.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={processStatusUpdate}
                                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${confirmModal.type === 'active' ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-emerald-500/20' :
                                        'bg-red-500 text-white hover:bg-red-400 shadow-red-500/20'
                                        }`}
                                >
                                    Ya, {confirmModal.type === 'active' ? 'Aktifkan' :
                                        confirmModal.type === 'delete' ? 'Hapus Permanen' :
                                            'Suspend'} Toko
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                    className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg p-10 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in duration-200">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                                    <XCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Tolak Verifikasi Toko</h3>
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{rejectionModal.shopName}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-2">Alasan Penolakan & Masukan</label>
                                <textarea
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white p-6 rounded-3xl focus:outline-none focus:border-red-500 transition-all min-h-[150px] text-sm leading-relaxed placeholder:text-zinc-700"
                                    placeholder="Contoh: NIK tidak valid, foto logo melanggar aturan, atau deskripsi kurang jelas..."
                                    value={rejectionModal.reason}
                                    onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                                ></textarea>
                                <div className="flex items-start gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                                    <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                        Alasan ini akan ditampilkan kepada penjual di halaman profil toko mereka agar dapat diperbaiki.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={processRejection}
                                    className="w-full py-4 bg-red-500 text-white hover:bg-red-400 rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-500/20"
                                >
                                    Konfirmasi Tolak Verifikasi
                                </button>
                                <button
                                    onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                                    className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm hover:text-white hover:bg-zinc-700 transition-all"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
