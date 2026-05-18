"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    ShoppingBag,
    MapPin,
    Truck,
    CreditCard,
    Clock,
    Package,
    ChevronLeft,
    Wallet,
    Copy,
    Banknote,
    Receipt,
    Info,
    X,
    CheckCircle2
} from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";
import { copyToClipboard } from "@/app/utils/clipboard";

export default function PaymentPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(null);
    const [paymentProof, setPaymentProof] = useState("");
    const [uploading, setUploading] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                setOrder(result.data);
                // If already paid or other status, redirect to transaction detail
                // if (result.data.status !== 'waiting_payment') {
                //     router.push(`/user/pesanan/transaksi/${id}`);
                // }
            } else {
                alert("Gagal memuat detail pesanan");
                router.push("/user/pesanan");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Max 500KB
        if (file.size > 500 * 1024) {
            alert("Ukuran gambar terlalu besar. Maksimal adalah 500KB.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formData,
            });
            const result = await res.json();
            if (res.ok) {
                setPaymentProof(process.env.NEXT_PUBLIC_API_URL + result.url);
            } else {
                alert(result.message || "Gagal mengunggah gambar");
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            alert("Terjadi kesalahan saat mengunggah gambar");
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentProof) {
            alert("Harap unggah bukti pembayaran terlebih dahulu.");
            return;
        }

        setConfirming(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/confirm-payment`, {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ payment_proof: paymentProof })
            });
            if (res.ok) {
                setShowSuccess(true);
                setTimeout(() => {
                    router.push(`/user/pesanan/transaksi/${id}`);
                }, 3000);
            }
        } catch (err) {
            console.error("Error confirming payment:", err);
            alert("Kesalahan sistem");
        } finally {
            setConfirming(false);
        }
    };

    const handleResetPayment = async () => {
        if (!confirm("Apakah Anda yakin ingin membatalkan konfirmasi dan mengulang proses pembayaran?")) return;

        setResetting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/reset-payment`, {
                method: "PUT"});
            if (res.ok) {
                fetchOrderDetails();
                setPaymentProof("");
            }
        } catch (err) {
            console.error("Error resetting payment:", err);
        } finally {
            setResetting(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    };

    const handleCopy = async (text, type) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopySuccess(type);
            setTimeout(() => setCopySuccess(null), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 bg-black">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse">Menyiapkan invoice...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/user/pesanan/transaksi/${id}`}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={18} />
                    </div>
                    <span className="text-sm font-bold">Kembali</span>
                </Link>
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20">
                    <Clock size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Menunggu Pembayaran</span>
                </div>
            </div>

            {/* Stepper Section */}
            <OrderStepper currentStatus={order.status} />

            {/* Success Overlay */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-zinc-900 border border-emerald-500/50 p-12 rounded-[3rem] text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg rotate-[15deg]">
                            <CheckCircle2 size={48} className="text-zinc-950" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">SUCCESS!</h2>
                            <p className="text-zinc-400 text-sm font-medium">Pembayaran Anda sedang diverifikasi oleh penjual.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Bank & Timeline */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Admin Payment Methods Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <Wallet size={18} className="text-emerald-500" /> Rekening Pembayaran (Admin)
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 font-medium italic">Silahkan transfer ke salah satu rekening di bawah ini</p>
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Verifikasi Manual</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { bank: "BCA", acc: "1234567890", name: "REPTILE HAVEN" },
                                    { bank: "BRI", acc: "0987654321", name: "REPTILE HAVEN" },
                                    { bank: "BNI", acc: "1122334455", name: "REPTILE HAVEN" },
                                    { bank: "Mandiri", acc: "5544332211", name: "REPTILE HAVEN" },
                                    { bank: "DANA", acc: "081234567890", name: "REPTILE HAVEN" },
                                    { bank: "GOPAY", acc: "081234567890", name: "REPTILE HAVEN" },
                                    { bank: "OVO", acc: "081234567890", name: "REPTILE HAVEN" },
                                    { bank: "QRIS", acc: "SCAN QR", name: "REPTILE HAVEN", isQR: true }
                                ].map((method, idx) => (
                                    <div key={idx} className="bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-2xl hover:border-emerald-500/30 transition-all group/item flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{method.bank}</span>
                                                <div className="flex-1 h-[1px] bg-zinc-800/50"></div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black text-white tracking-wider font-mono truncate">{method.acc}</p>
                                                <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">a/n {method.name}</p>
                                            </div>
                                        </div>
                                        {!method.isQR && (
                                            <button
                                                onClick={() => handleCopy(method.acc, method.bank)}
                                                className="shrink-0 p-2.5 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-90"
                                            >
                                                {copySuccess === method.bank ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                            </button>
                                        )}
                                        {method.isQR && (
                                            <div className="shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-lg shadow-white/5">
                                                <div className="w-full h-full border-2 border-black border-dashed"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed italic">
                                    Pastikan nominal transfer sesuai dengan total tagihan. Simpan bukti transfer Anda untuk diunggah pada formulir di sebelah kanan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Riwayat Perjalanan */}
                    <OrderTimeline order={order} formatPrice={formatPrice} />
                </div>

                {/* Right Column: Invoice & Total */}
                <div className="lg:col-span-5 space-y-8 sticky top-10">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white">
                            <Receipt size={150} />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Rincian Invoice</h3>
                                    <p className="text-sm font-black text-white tracking-wider">{order.order_id}</p>
                                </div>
                            </div>

                            {/* Product Summary */}
                            <div className="flex gap-4 items-start bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                                    <img
                                        src={order.product?.images?.[0] || '/placeholder.png'}
                                        alt="Product"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">
                                            {order.product?.species}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                                            ID : {order.product?.product_id || "-"}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-white line-clamp-1">{order.product?.name}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{order.quantity} x {formatPrice(order.price)}</p>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tight italic">Subtotal Produk</span>
                                    <span className="text-white font-black">{formatPrice(order.price * order.quantity)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tight italic">Biaya Admin</span>
                                    <span className="text-white font-black">{formatPrice(order.admin_fee)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tight italic">Ongkos Kirim</span>
                                    <span className="text-white font-black">
                                        {order.product?.is_free_shipping ? (
                                            <span className="text-emerald-500">Gratis</span>
                                        ) : (
                                            formatPrice(order.shipping_cost)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-tight italic">Biaya Packing</span>
                                    <span className="text-white font-black">
                                        {order.product?.is_free_packing ? (
                                            <span className="text-emerald-500">Gratis</span>
                                        ) : (
                                            formatPrice(order.packing_cost)
                                        )}
                                    </span>
                                </div>

                                <div className="h-px bg-zinc-800 border-dashed border-zinc-700"></div>

                                <div className="flex justify-between items-end pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Total Tagihan</p>
                                        <div className="p-2 bg-zinc-950 border border-amber-500/20 rounded-2xl flex items-center justify-between group">
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-white tracking-tighter">{formatPrice(order.total_price)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(order.total_price.toString(), 'amount')}
                                                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 hover:text-amber-500 relative"
                                            >
                                                <Copy size={24} />
                                                {copySuccess === 'amount' && (
                                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 text-[8px] font-black px-2 py-1 rounded-md animate-in fade-in slide-in-from-bottom-1">COPIED</span>
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            {order.status === 'waiting_payment' ? (
                                <div className="space-y-4">
                                    {/* Image Upload Area */}
                                    <div className="bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-[2rem] p-8 text-center space-y-4 relative group hover:border-emerald-500/50 transition-all">
                                        {paymentProof ? (
                                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                                                <img src={paymentProof} alt="Bukti Bayar" className="w-full h-full object-contain" />
                                                <button
                                                    onClick={() => setPaymentProof("")}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-4 space-y-4">
                                                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-zinc-600 group-hover:text-emerald-500 transition-colors">
                                                    {uploading ? <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <Info size={32} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-white uppercase tracking-widest italic">Upload Bukti Bayar</p>
                                                    <p className="text-[9px] text-zinc-500 font-medium italic">Format: JPG, PNG • Maks: 500KB</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    disabled={uploading}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={confirming || showSuccess || uploading || !paymentProof}
                                        className={`w-full py-3.5 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl ${confirming || showSuccess || uploading || !paymentProof
                                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                            : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"}`}
                                    >
                                        {confirming ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={20} />
                                                Konfirmasi Pembayaran
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : order.status === 'processing' ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-zinc-950 shadow-lg">
                                            <Clock size={24} className="animate-pulse" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black text-white uppercase tracking-widest italic">Sedang Diproses</p>
                                            <p className="text-[10px] text-zinc-500 font-medium">Pembayaran Anda sedang dalam antrean verifikasi.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleResetPayment}
                                        disabled={resetting}
                                        className="w-full py-3 sm:py-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500/70 rounded-2xl sm:rounded-[2rem] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {resetting ? (
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            "Batal Konfirmasi & Upload Ulang"
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] text-center">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Pesanan sedang dalam tahap {order.status}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
