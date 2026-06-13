"use client";

import { useState, useEffect, use } from "react";
import {
    ChevronLeft,
    Receipt,
    FileText,
    ArrowUpRight,
    Calendar,
    ShoppingBag,
    CreditCard,
    DollarSign,
    Info,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl, getImageUrl } from "@/app/utils/api";

export default function DetailPencairanPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showZoom, setShowZoom] = useState(false);

    // Helper to get Seller/Shop Owner bank info
    const getSellerBankInfo = () => {
        const owner = order?.shop?.owner;
        let bankAccounts = owner?.bank_accounts;
        
        // If it is a string representation of JSON, parse it
        if (typeof bankAccounts === 'string') {
            try {
                bankAccounts = JSON.parse(bankAccounts);
            } catch (e) {
                bankAccounts = null;
            }
        }
        
        if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
            const primaryBank = bankAccounts[0];
            return {
                bankName: primaryBank.bank_name || primaryBank.bankName || "-",
                bankAccount: primaryBank.account_number || primaryBank.accountNumber || primaryBank.bank_account || "-",
                bankHolder: primaryBank.account_name || primaryBank.accountName || primaryBank.bank_holder || owner.name || "-"
            };
        }
        
        // Fallbacks
        return {
            bankName: order?.shop?.bank_name || "-",
            bankAccount: order?.shop?.bank_account || "-",
            bankHolder: order?.shop?.bank_holder || owner?.name || "-"
        };
    };

    const sellerBank = getSellerBankInfo();

    const fetchOrderDetail = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getApiUrl()}/orders/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                setOrder(result.data);
                if (!result.data.disbursement_proof) {
                    // router.push("/user/toko/riwayat-transaksi");
                }
            } else {
                router.push("/user/toko/pengajuan-keuangan");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };



    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                Memuat Detail...
            </div>
        );
    }

    if (!order) return null;

    const cleanTotal = (Number(order.price) * Number(order.quantity)) +
        Number(order.shipping_cost) +
        Number(order.packing_cost) -
        (Number(order.additional_fee) || 0);

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/user/toko/pengajuan-keuangan"
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black uppercase tracking-[0.2em] text-[10px]">Kembali</span>
                        <span className="text-xs text-zinc-600 font-bold">Pengajuan Keuangan</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Status Pencairan</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-black text-emerald-500 uppercase italic">Dana Berhasil Ditransfer</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Image / Proof Section - Compact */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden group relative">
                        <div className="p-8 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                    <Receipt size={20} />
                                </div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight italic">Bukti Transfer Asli</h2>
                            </div>
                            <a
                                href={getImageUrl(order.disbursement_proof)}
                                target="_blank"
                                className="text-[10px] font-black text-zinc-500 hover:text-emerald-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                <ArrowUpRight size={14} /> Lihat Fullscreen
                            </a>
                        </div>

                        <div className="aspect-[1/1] bg-zinc-950 flex items-center justify-center p-4 relative">
                            {order.disbursement_proof?.toLowerCase().endsWith('.pdf') ? (
                                <div className="flex flex-col items-center gap-6 text-zinc-500 py-20">
                                    <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800">
                                        <FileText size={48} className="text-emerald-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black uppercase tracking-widest text-sm">Dokumen Digital PDF</p>
                                        <p className="text-xs text-zinc-500 font-medium mt-1 italic">Klik tombol dibawah untuk mengunduh</p>
                                    </div>
                                    <a
                                        href={getImageUrl(order.disbursement_proof)}
                                        target="_blank"
                                        className="px-8 py-3 bg-emerald-500 text-zinc-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all"
                                    >
                                        Unduh Bukti Transfer
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="cursor-zoom-in group/img relative"
                                        onClick={() => setShowZoom(true)}
                                    >
                                        <img
                                            src={getImageUrl(order.disbursement_proof)}
                                            className="max-w-full max-h-full object-contain rounded-2xl transition-transform duration-500 group-hover/img:scale-[1.02]"
                                            alt="Bukti Transfer"
                                        />
                                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                                            <div className="bg-zinc-950/80 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Klik untuk Memperbesar</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    {order.disbursement_notes && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex gap-6 items-start">
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Info size={24} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Catatan dari Admin:</h4>
                                <p className="text-sm text-zinc-300 font-medium italic leading-relaxed">
                                    {order.disbursement_notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Sidebar - Dominant */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Financial Summary */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                    <DollarSign size={20} />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Ringkasan Dana</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest">Subtotal Produk</span>
                                        <span className="text-white font-black">{formatPrice(order.price * order.quantity)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest">Biaya Pengiriman</span>
                                        <span className={Number(order.shipping_cost) === 0 ? "text-emerald-500 font-black italic" : "text-white font-black"}>
                                            {Number(order.shipping_cost) === 0 ? "Gratis" : formatPrice(order.shipping_cost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest">Biaya Packing</span>
                                        <span className={Number(order.packing_cost) === 0 ? "text-emerald-500 font-black italic" : "text-white font-black"}>
                                            {Number(order.packing_cost) === 0 ? "Gratis" : formatPrice(order.packing_cost)}
                                        </span>
                                    </div>
                                    {order.additional_fee > 0 && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-red-500/70 font-bold uppercase tracking-widest">Potongan Transfer</span>
                                            <span className="text-red-500 font-black">-{formatPrice(order.additional_fee)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-zinc-800"></div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-black text-white uppercase tracking-widest italic">Total Diterima</span>
                                        <span className="text-lg font-black text-emerald-500">{formatPrice(cleanTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={14} /> Dikirim Ke Rekening
                                </h4>
                                <div className="bg-zinc-950/30 rounded-3xl p-6 border border-zinc-800/50 space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Penerima</p>
                                        <p className="text-sm font-black text-white">{sellerBank.bankHolder}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Detail Akun</p>
                                            <p className="text-xs font-black text-zinc-400 uppercase leading-none">{sellerBank.bankName} - {sellerBank.bankAccount}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase">Verified</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-zinc-500">
                                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Tanggal Transfer</p>
                                    <p className="text-xs font-bold text-zinc-300">
                                        {order.disbursed_at ? new Date(order.disbursed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -right-10 -bottom-10 text-emerald-500 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none rotate-12">
                            <CheckCircle2 size={240} />
                        </div>
                    </div>

                    {/* Order Origin */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-zinc-800/50 transition-all">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                            <img
                                src={getImageUrl(order.product?.images || order.product_image)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt={order.product?.name || "Produk"}
                            />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Terikat Pesanan:</h4>
                            <p className="text-sm font-black text-white line-clamp-1 group-hover:text-emerald-500 transition-colors uppercase italic">{order.product?.name || order.product_name || "Produk dihapus"}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-zinc-500 font-mono">{order.order_id}</span>
                                <span className="px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">
                                    ID: {order.product?.product_id || "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Overlay */}
            {showZoom && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
                    onClick={() => setShowZoom(false)}
                >
                    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl"></div>

                    {/* Close Button */}
                    <button
                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all z-10 border border-white/10"
                        onClick={() => setShowZoom(false)}
                    >
                        <ChevronLeft className="rotate-45" size={24} />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={getImageUrl(order.disbursement_proof)}
                            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-500 rounded-lg"
                            alt="Zoom Bukti Transfer"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest backdrop-blur-md">
                        Klik di mana saja untuk menutup
                    </div>
                </div>
            )}
        </div>
    );
}
