"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Store,
    MapPin,
    Phone,
    Calendar,
    ShoppingBag,
    Ban,
    UserCheck,
    ArrowLeft,
    Fingerprint,
    CreditCard,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    Info,
    Mail,
    IdCard,
    Globe,
    Truck,
    ShieldHalf
} from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getLogoUrl } from "@/app/utils/api";

export default function AdminDetailTokoPage() {
    const params = useParams();
    const router = useRouter();
    const [shop, setShop] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: "warning",
        title: "",
        message: "",
        onConfirm: null
    });

    useEffect(() => {
        fetchShopDetail();
    }, [params.id]);

    const fetchShopDetail = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/shops/${params.id}`);
            const result = await response.json();
            if (response.ok) {
                setShop(result.data);
            } else {
                router.push("/admin/toko-user");
            }
        } catch (err) {
            console.error("Error fetching shop detail:", err);
            router.push("/admin/toko-user");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        try {
            const response = await fetch(`${getApiUrl()}/shops/${shop.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    type: "success",
                    title: "Berhasil!",
                    message: `Status toko telah diperbarui menjadi ${status.toUpperCase()}.`,
                    onConfirm: () => fetchShopDetail()
                });
            }
        } catch (err) {
            console.error("Error updating shop status:", err);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "suspended":
                return "bg-red-500/10 text-red-500 border-red-500/20";
            case "pending":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            default:
                return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
                    <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                </div>
            </div>
        );
    }

    if (!shop) return null;

    return (
        <div className="min-h-screen bg-zinc-950 p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Link
                        href="/admin/toko-user"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all group font-bold text-sm"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Daftar Toko
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl overflow-hidden shrink-0">
                            {shop.logo_url ? (
                                <img src={getLogoUrl(shop.logo_url)} className="w-full h-full object-cover" alt={shop.name} />
                            ) : (
                                <Store size={40} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{shop.name}</h1>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(shop.status)}`}>
                                    {shop.status}
                                </span>
                            </div>
                            <p className="text-zinc-500 mt-2 font-medium flex items-center gap-2">
                                <Fingerprint size={14} className="text-emerald-500" />
                                ID: <span className="text-zinc-300 font-bold tracking-widest">#{shop.id}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {shop.status?.toLowerCase() === 'pending' && (
                        <button
                            onClick={() => handleUpdateStatus('active')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck size={20} />
                            Verifikasi & Aktifkan
                        </button>
                    )}
                    {shop.status?.toLowerCase() === 'active' && (
                        <button
                            onClick={() => handleUpdateStatus('suspended')}
                            className="bg-zinc-800 hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl border border-zinc-700 transition-all flex items-center gap-2"
                        >
                            <Ban size={20} />
                            Suspend Toko
                        </button>
                    )}
                    {shop.status?.toLowerCase() === 'suspended' && (
                        <button
                            onClick={() => handleUpdateStatus('active')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <UserCheck size={20} />
                            Aktifkan Kembali
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                                <IdCard className="text-emerald-500" size={20} />
                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Informasi Legal</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Nama Pemilik</label>
                                    <p className="text-white font-bold">{shop.owner?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Email Terdaftar</label>
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <Mail size={14} className="text-zinc-600" />
                                        {shop.owner?.email || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Nomor NIK (KTP)</label>
                                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                        <p className="text-emerald-500 font-black tracking-[0.2em]">{shop.nik || 'Belum diverifikasi'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                                <Globe className="text-emerald-500" size={20} />
                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Lokasi & Kontak</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Wilayah</label>
                                    <p className="text-white font-bold">{shop.city}, {shop.province}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">WhatsApp Business</label>
                                    <p className="text-emerald-500 font-black flex items-center gap-2">
                                        <Phone size={14} />
                                        +62 {shop.whatsapp}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Alamat Lengkap</label>
                                    <p className="text-zinc-400 text-xs leading-relaxed">{shop.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rich Content Sections */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 space-y-8">
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <Info className="text-emerald-500" size={20} />
                                    <h3 className="font-black text-white uppercase tracking-widest text-sm">Tentang Toko</h3>
                                </div>
                                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 text-zinc-300 leading-relaxed shop-content-preview"
                                     dangerouslySetInnerHTML={{ __html: shop.description || 'Tidak ada deskripsi.' }}>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Truck className="text-emerald-500" size={20} />
                                        <h3 className="font-black text-white uppercase tracking-widest text-xs">Kebijakan Pengiriman</h3>
                                    </div>
                                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800 text-zinc-400 text-xs leading-relaxed shop-content-preview"
                                         dangerouslySetInnerHTML={{ __html: shop.shipping_policy || 'Tidak ada kebijakan pengiriman.' }}>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <ShieldHalf className="text-emerald-500" size={20} />
                                        <h3 className="font-black text-white uppercase tracking-widest text-xs">Kebijakan Garansi</h3>
                                    </div>
                                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800 text-zinc-400 text-xs leading-relaxed shop-content-preview"
                                         dangerouslySetInnerHTML={{ __html: shop.warranty_policy || 'Tidak ada kebijakan garansi.' }}>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Financial */}
                <div className="space-y-8">
                    {/* Marketplace Stats */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-zinc-950 shadow-2xl shadow-emerald-500/10">
                        <h3 className="font-black uppercase tracking-widest text-xs opacity-60 mb-6">Marketplace Stats</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={24} />
                                    <span className="font-black">Total Iklan</span>
                                </div>
                                <span className="text-3xl font-black">{shop.listings?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar size={24} />
                                    <span className="font-black">Terdaftar Sejak</span>
                                </div>
                                <span className="font-bold text-sm">
                                    {new Date(shop.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bank Accounts */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                            <CreditCard className="text-emerald-500" size={20} />
                            <h3 className="font-black text-white uppercase tracking-widest text-sm">Rekening Pembayaran</h3>
                        </div>
                        <div className="space-y-4">
                            {shop.owner?.bank_accounts && shop.owner.bank_accounts.length > 0 ? (
                                shop.owner.bank_accounts.map((bank, idx) => (
                                    <div key={idx} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/50 transition-all">
                                        <div className="w-12 h-12 bg-zinc-900 text-emerald-500 rounded-xl flex items-center justify-center font-black text-[10px] uppercase border border-emerald-500/10">
                                            {(bank.bank_name || bank.bankName || "BNK").substring(0, 3)}
                                        </div>
                                        <div>
                                            <p className="text-white font-black tracking-widest text-sm leading-tight">{bank.account_number || bank.accountNumber}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">an. {bank.account_name || bank.accountName}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-800">
                                    <p className="text-xs text-zinc-600 font-medium italic px-4">Seller belum menambahkan rekening bank untuk penarikan dana.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Verification Guide */}
                    <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2rem] space-y-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            Checklist Verifikasi
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                NIK Valid 16 Digit
                            </li>
                            <li className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Nama Toko Sesuai Etika
                            </li>
                            <li className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Lokasi Wilayah Terdeteksi
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
            />

            <style jsx global>{`
                .shop-content-preview p { margin-bottom: 0.5rem; }
                .shop-content-preview ul, .shop-content-preview ol { padding-left: 1.25rem; margin-bottom: 0.5rem; }
                .shop-content-preview ul { list-style-type: disc; }
                .shop-content-preview ol { list-style-type: decimal; }`}</style>
        </div>
    );
}
