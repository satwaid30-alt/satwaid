"use client";

import { useState, useEffect, use } from "react";
import {
    ChevronLeft,
    ArrowUpRight,
    CheckCircle2,
    CreditCard,
    Info,
    AlertCircle,
    DollarSign,
    Package,
    MapPin,
    Calendar,
    Send
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getImageUrl } from "@/app/utils/api";

export default function PengajuanPencairanPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

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
                // Redirect if already disbursed or not completed
                if (result.data.disbursement_proof) {
                    router.push("/user/toko/pengajuan-keuangan");
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const ownerEmail = order?.shop?.owner?.email || "";
            const res = await fetch(`${getApiUrl()}/orders/${id}/request-disbursement`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({ email: ownerEmail })
            });

            const result = await res.json();

            if (res.ok) {
                setActionModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Pengajuan Berhasil',
                    message: result.message || `Permintaan pencairan dana untuk invoice ${order.order_id} telah dikirim ke Admin. Silakan tunggu 1-3 hari kerja.`,
                    onConfirm: () => router.push("/user/toko/pengajuan-keuangan")
                });
            } else {
                throw new Error(result.message || "Gagal mengirim pengajuan");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Terjadi kesalahan saat mengirim pengajuan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse text-xs uppercase tracking-widest">Memuat data pengajuan...</p>
            </div>
        );
    }

    if (!order) return null;

    const totalDana = Number(order.price) * Number(order.quantity) + Number(order.shipping_cost) + Number(order.packing_cost);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href="/user/toko/pengajuan-keuangan"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px]">Batal</span>
                </Link>
                <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] font-black text-emerald-500 font-mono tracking-wider">{order.order_id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Summary Info */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10 relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                    <DollarSign size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Pengajuan Pencairan</h2>
                                    <p className="text-zinc-500 text-sm font-medium">Ajukan penarikan dana ke rekening Anda</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informasi Produk</p>
                                        <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase">Selesai</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shrink-0">
                                            <img src={getImageUrl(order.product?.images) || "https://placehold.co/100x100?text=No+Image"} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-black text-sm line-clamp-1">{order.product?.name}</h3>
                                            <p className="text-xs text-zinc-500 font-bold mt-1 italic">{formatPrice(order.price)} x {order.quantity}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Rincian Dana Pencairan</p>
                                    <div className="bg-zinc-950/30 rounded-3xl border border-zinc-800 p-6 space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-widest">Harga Produk</span>
                                            <span className="text-white font-black">{formatPrice(order.price * order.quantity)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-widest">Ongkos Kirim</span>
                                            {order.product?.is_free_shipping ? (
                                                <span className="text-emerald-500 font-black italic">GRATIS</span>
                                            ) : (
                                                <span className="text-white font-black">{formatPrice(order.shipping_cost)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-widest">Biaya Packing</span>
                                            {order.product?.is_free_packing ? (
                                                <span className="text-emerald-500 font-black italic">GRATIS</span>
                                            ) : (
                                                <span className="text-white font-black">{formatPrice(order.packing_cost)}</span>
                                            )}
                                        </div>
                                        <div className="h-px bg-zinc-800"></div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-sm font-black text-white uppercase tracking-widest italic">Estimasi Diterima</span>
                                            <span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatPrice(totalDana)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-medium italic ml-1">* Estimasi belum termasuk biaya transfer antar bank (jika ada).</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-3xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98] group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Kirim Pengajuan Sekarang
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-emerald-500">
                            <DollarSign size={400} />
                        </div>
                    </div>
                </div>

                {/* Account Details Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <CreditCard size={14} className="text-emerald-500" /> Rekening Tujuan
                            </h4>
                            <div className="bg-zinc-950/50 rounded-3xl p-6 border border-zinc-800/50 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Nama Bank</p>
                                        <p className="text-sm font-black text-white uppercase">{sellerBank.bankName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Nomor Rekening</p>
                                        <p className="text-lg font-black text-white tracking-widest">{sellerBank.bankAccount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Atas Nama</p>
                                        <p className="text-sm font-black text-white">{sellerBank.bankHolder}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-2">Email Pemilik</p>
                                        <p className="text-sm font-black text-white">{order?.shop?.owner?.email || "-"}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800/50">
                                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                                        Admin akan mengirimkan dana ke rekening yang tertera di atas. Pastikan data sudah benar.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Informasi</p>
                                <p className="text-[11px] text-amber-500/70 font-medium leading-relaxed">
                                    Pengajuan ini hanya bersifat notifikasi ke Admin. Admin akan segera memproses transfer bukti pembayaran.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ActionModal
                isOpen={actionModal.isOpen}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                onConfirm={actionModal.onConfirm}
            />
        </div>
    );
}
