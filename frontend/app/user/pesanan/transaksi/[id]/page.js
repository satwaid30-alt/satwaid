"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
    Package,
    MapPin,
    Truck,
    CreditCard,
    CheckCircle2,
    Clock,
    ChevronLeft,
    AlertCircle,
    Info,
    Calendar,
    ShoppingBag,
    XCircle,
    ChevronRight,
    ShieldAlert
} from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";
import ShippingInfo from "@/components/ShippingInfo";

export default function TransactionProcessPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);
    const [shippingForm, setShippingForm] = useState({
        receiver_name: "",
        phone_number: "",
        shipping_address: "",
        bank_name: "",
        bank_account: "",
        bank_holder: ""
    });
    const [isProfileComplete, setIsProfileComplete] = useState(true);
    const [showProfileWarning, setShowProfileWarning] = useState(false);

    // Cancel Confirmation Modal State
    const [showCancelModal, setShowCancelModal] = useState(false);
    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchOrderDetail();

        // Setup Socket.io for Real-time Updates
        const userStr = localStorage.getItem("user");
        let socket;
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                socket = io(process.env.NEXT_PUBLIC_API_URL);
                socket.emit("join_user", userData.id);
                
                socket.on("new_notification", () => {
                    fetchOrderDetail(); // Auto-refresh when status changes
                });
            } catch (e) {
                console.error("Socket connection error", e);
            }
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [id]);

    const fetchOrderDetail = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                const orderData = result.data;
                setOrder(orderData);

                // Pre-fill from order if exists, otherwise fetch from user profile
                if (orderData.receiver_name && orderData.phone_number && orderData.shipping_address) {
                    setShippingForm(prev => ({
                        ...prev,
                        receiver_name: orderData.receiver_name,
                        phone_number: orderData.phone_number,
                        shipping_address: orderData.shipping_address,
                        bank_name: orderData.bank_name || prev.bank_name,
                        bank_account: orderData.bank_account || prev.bank_account,
                        bank_holder: orderData.bank_holder || prev.bank_holder
                    }));
                }

                // Always fetch user profile to get latest bank info if not in order
                const userStr = localStorage.getItem("user");
                if (userStr && (!orderData.bank_account)) {
                    const user = JSON.parse(userStr);
                    const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`);
                    const userResult = await userRes.json();
                    if (userRes.ok && userResult.data) {
                        const userData = userResult.data;
                        const mainBank = userData.bank_accounts?.[0] || {};

                        // Check if profile is complete
                        const isComplete = !!(userData.address && userData.phone && userData.city && userData.province);
                        setIsProfileComplete(isComplete);

                        setShippingForm(prev => ({
                            ...prev,
                            receiver_name: "", // Wajib kosongkan sesuai request
                            phone_number: prev.phone_number || userData.phone || "",
                            shipping_address: prev.shipping_address || userData.address || "",
                            bank_name: mainBank.bankName || "",
                            bank_account: mainBank.accountNumber || "",
                            bank_holder: mainBank.accountName || ""
                        }));
                    }
                }
            } else {
                alert("Gagal memuat detail transaksi");
                router.push("/user/pesanan");
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancelOrder = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        setIsCancelling(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    cancellation_reason: 'Dibatalkan oleh pembeli'
                })
            });
            if (response.ok) {
                setShowCancelModal(false);
                router.push("/user/pesanan");
            } else {
                const err = await response.json();
                alert(err.message || "Gagal membatalkan transaksi");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        setIsUpdatingShipping(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/shipping-info`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_name: shippingForm.receiver_name,
                    phone_number: shippingForm.phone_number,
                    shipping_address: shippingForm.shipping_address,
                    bank_name: shippingForm.bank_name,
                    bank_account: shippingForm.bank_account,
                    bank_holder: shippingForm.bank_holder
                })
            });
            if (response.ok) {
                setShowShippingModal(false);
                setShowSuccessModal(true);
                fetchOrderDetail();
            } else {
                alert("Gagal menyimpan data pengiriman");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsUpdatingShipping(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse">Memuat proses transaksi...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/user/pesanan"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={18} />
                    </div>
                    <span className="text-sm font-bold">Kembali</span>
                </Link>
            </div>

            {/* Stepper Section */}
            <OrderStepper order={order} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Action Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Timeline for Mobile - Top */}
                    <div className="block lg:hidden">
                        <OrderTimeline order={order} formatPrice={formatPrice} />
                    </div>
                    {/* Dynamic Action Card based on Status */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                                {['completed', 'disbursement_requested', 'disbursed'].includes(order.status) ? <CheckCircle2 size={48} /> :
                                    order.status === 'complained' ? <ShieldAlert size={48} className="text-red-500" /> :
                                        <Info size={48} />}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {order.status === 'pending_shipping_info' ? "Lengkapi Data Pengiriman" :
                                        order.status === 'waiting_shipping_cost' ? "Menunggu Input Ongkir" :
                                            order.status === 'waiting_payment' ? "Selesaikan Pembayaran" :
                                                order.status === 'processing' ? "Menunggu Verifikasi" :
                                                    ['waiting_shipment', 'payment_verified'].includes(order.status) ? "Pesanan Sedang Diproses" :
                                                        order.status === 'shipped' ? "Pesanan Dalam Perjalanan" :
                                                            order.status === 'complained' ? "Pesanan Dikomplain" :
                                                                ['completed', 'disbursement_requested', 'disbursed'].includes(order.status) ? "Transaksi Selesai" : "Status Unknown"}
                                </h2>
                                <p className="text-zinc-400 font-medium leading-relaxed max-w-xl text-[14px] ">
                                    {order.status === 'pending_shipping_info' ? "Silakan masukkan detail penerima dan alamat lengkap agar penjual bisa menentukan biaya pengiriman." :
                                        order.status === 'waiting_shipping_cost' ? "Penjual sedang menghitung biaya pengiriman dan packing. Anda akan menerima notifikasi jika invoice sudah siap." :
                                            order.status === 'waiting_payment' ? "Biaya pengiriman sudah ditentukan. Silakan lakukan pembayaran agar pesanan bisa segera diproses." :
                                                order.status === 'processing' ? "Pembayaran Anda telah diterima. Admin sedang memverifikasi data transaksi Anda." :
                                                    ['waiting_shipment', 'payment_verified'].includes(order.status) ? "Pembayaran terverifikasi! Penjual sedang menyiapkan paket Anda untuk segera dikirim." :
                                                        order.status === 'shipped' ? "Paket Anda telah diserahkan ke kurir dengan nomor resi di bawah. Silakan pantau secara berkala." :
                                                            order.status === 'complained' ? "Anda telah mengajukan komplain untuk pesanan ini. Mohon tunggu tanggapan dari penjual atau bantuan admin." :
                                                                ['completed', 'disbursement_requested', 'disbursed'].includes(order.status) ? "Terima kasih telah berbelanja! Pesanan Anda telah sampai dan transaksi dinyatakan selesai." : ""}
                                </p>
                            </div>
                            <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
                                {order.status === 'pending_shipping_info' && (
                                    <button
                                        onClick={() => {
                                            if (!isProfileComplete) {
                                                setShowProfileWarning(true);
                                            } else {
                                                setShowShippingModal(true);
                                            }
                                        }}
                                        className="w-full md:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Lengkapi Sekarang <MapPin size={20} />
                                    </button>
                                )}
                                {order.status === 'waiting_payment' && (
                                    <Link
                                        href={`/user/pesanan/bayar/${id}`}
                                        className="w-full md:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Bayar Sekarang <CreditCard size={20} />
                                    </Link>
                                )}
                                {order.status === 'shipped' && (
                                    <Link
                                        href={`/user/pesanan/transaksi-selesai/${id}`}
                                        className="w-full md:w-auto px-10 py-5 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Konfirmasi Barang <CheckCircle2 size={20} />
                                    </Link>
                                )}
                                {['pending_shipping_info', 'waiting_shipping_cost', 'waiting_payment'].includes(order.status) && (
                                    <button
                                        onClick={handleCancelOrder}
                                        className="w-full md:w-auto px-10 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black rounded-2xl transition-all border border-red-500/20 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        Batalkan Transaksi <XCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Info Component (For Shipped/Completed Status) */}
                    <ShippingInfo order={order} />



                    {/* Timeline / Riwayat Perjalanan - Bottom for Desktop */}
                    <OrderTimeline order={order} formatPrice={formatPrice} className="hidden lg:block" />
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Alamat Pengiriman */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} className="text-pink-500" /> Alamat Pengiriman
                            </h3>
                            {order.status === 'pending_shipping_info' && (
                                <button onClick={() => setShowShippingModal(true)} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter underline">Ubah</button>
                            )}
                        </div>
                        {order.shipping_address ? (
                            <div className="p-5 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-white font-black uppercase tracking-tight">{order.receiver_name || "Nama Belum Diisi"}</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-medium line-clamp-3">{order.shipping_address || "Alamat belum dilengkapi"}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                            <Info size={12} className="text-zinc-400" />
                                        </div>
                                        <p className="text-[12px] font-bold tracking-tight text-zinc-400">{order.phone_number || "-"}</p>
                                    </div>

                                    {/* Bank Info Integrated */}
                                    {/* {(order.bank_account || shippingForm.bank_account) && (
                                        <div className="flex items-center gap-2 text-emerald-500/80">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <CreditCard size={12} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black uppercase tracking-tighter">
                                                    {order.bank_name || shippingForm.bank_name}
                                                </p>
                                                <p className="text-[11px] font-black tracking-widest text-white">
                                                    {order.bank_account || shippingForm.bank_account}
                                                </p>
                                            </div>
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                                <MapPin size={24} className="text-zinc-700 animate-pulse" />
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Belum Ada Alamat</p>
                            </div>
                        )}
                    </div>

                    {/* Ringkasan Biaya */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl space-y-8">
                        <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={14} className="text-emerald-500" /> Ringkasan Pembayaran
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-100 uppercase tracking-tighter">Harga Produk</span>
                                <span className="text-white">{formatPrice(order.price * order.quantity)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-100 uppercase tracking-tighter">Biaya Pengiriman</span>
                                <span className="text-white font-bold">
                                    {order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : (order.product?.is_free_shipping ? <span className="text-emerald-500">Gratis</span> : formatPrice(0))}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-100 uppercase tracking-tighter">Biaya Packing</span>
                                <span className="text-white font-bold">
                                    {order.packing_cost > 0 ? formatPrice(order.packing_cost) : (order.product?.is_free_packing ? <span className="text-emerald-500">Gratis</span> : formatPrice(0))}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-100 uppercase tracking-tighter">Biaya Admin</span>
                                <span className="text-white font-bold">
                                    {formatPrice(order.admin_fee || 0)}
                                </span>
                            </div>
                            <div className="h-px bg-zinc-800"></div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-black text-white uppercase tracking-widest">Total Bayar</span>
                                <span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatPrice(order.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Modal */}
            {showShippingModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isUpdatingShipping && setShowShippingModal(false)}></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2rem] lg:rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 my-auto max-h-[90vh] flex flex-col">
                        <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-4">
                                    <MapPin size={32} />
                                </div>
                                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">Data Pengiriman</h3>
                                <p className="text-zinc-500 text-[11px] lg:text-sm font-medium">Lengkapi detail tujuan pengiriman Anda</p>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
                                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Informasi Penting</p>
                                    <p className="text-[12px] text-amber-500/80 font-medium leading-relaxed">
                                        Pastikan alamat ditulis secara lengkap mencakup <span className="font-bold">Provinsi, Kota/Kabupaten, Kecamatan,</span> hingga <span className="font-bold">Kelurahan/Desa</span> untuk akurasi perhitungan ongkos kirim.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleShippingSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Penerima</label>
                                    <input
                                        required
                                        type="text"
                                        value={shippingForm.receiver_name}
                                        onChange={(e) => setShippingForm({ ...shippingForm, receiver_name: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                                        placeholder="Contoh: John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                                    <input
                                        required
                                        type="tel"
                                        value={shippingForm.phone_number}
                                        onChange={(e) => setShippingForm({ ...shippingForm, phone_number: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                                        placeholder="Contoh: 08123456789"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={shippingForm.shipping_address}
                                        onChange={(e) => setShippingForm({ ...shippingForm, shipping_address: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all resize-none font-bold"
                                        placeholder="Tuliskan alamat lengkap pengiriman..."
                                    />
                                </div>

                                <div className="pt-4 border-t border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-emerald-500" />
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Informasi Rekening</p>
                                        </div>
                                        <Link
                                            href="/user/pengaturan"
                                            className="text-[8px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter underline flex items-center gap-1"
                                        >
                                            Ubah di Profil <ChevronRight size={10} />
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nama Bank</label>
                                            <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-xs text-zinc-400 font-bold">
                                                {shippingForm.bank_name || "-"}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nomor Rekening</label>
                                            <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-xs text-zinc-400 font-bold">
                                                {shippingForm.bank_account || "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Atas Nama</label>
                                        <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-xs text-zinc-400 font-bold">
                                            {shippingForm.bank_holder || "-"}
                                        </div>
                                    </div>

                                    {!shippingForm.bank_account && (
                                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2 items-center">
                                            <AlertCircle size={12} className="text-amber-500 shrink-0" />
                                            <p className="text-[9px] text-amber-500/70 font-medium">Data rekening belum diatur. Disarankan mengisinya di profil untuk mempermudah refund/transaksi.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        disabled={isUpdatingShipping}
                                        onClick={() => setShowShippingModal(false)}
                                        className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdatingShipping}
                                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isUpdatingShipping ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                                Menyimpan...
                                            </>
                                        ) : "Simpan & Lanjut"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Cancel Transaction Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => !isCancelling && setShowCancelModal(false)}
                    ></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-6 text-center">
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <AlertCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Batalkan Transaksi?</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                    Apakah Anda yakin ingin membatalkan transaksi ini? <br />
                                    <span className="text-red-500/70 font-bold">Stok produk akan dikembalikan ke penjual.</span>
                                </p>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    disabled={isCancelling}
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all disabled:opacity-50"
                                >
                                    Tidak
                                </button>
                                <button
                                    disabled={isCancelling}
                                    onClick={confirmCancelOrder}
                                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCancelling ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        "Ya, Batalkan"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Success Notification Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-500"
                        onClick={() => setShowSuccessModal(false)}
                    ></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[2.2rem] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 size={44} className="animate-in zoom-in duration-700" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Data Tersimpan!</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                    Informasi pengiriman berhasil diperbarui. Silakan tunggu penjual menentukan biaya pengiriman.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                Oke, Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Incomplete Warning Modal */}
            {showProfileWarning && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowProfileWarning(false)}></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 lg:p-10 space-y-6 text-center">
                            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                                <ShieldAlert size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Profil Belum Lengkap</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                    Maaf, Anda harus melengkapi data <span className="text-white font-bold">Alamat, Kota, Provinsi, dan Nomor Telepon</span> di pengaturan profil terlebih dahulu sebelum dapat melanjutkan transaksi.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Link
                                    href="/user/pengaturan"
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Lengkapi Profil Sekarang <ChevronRight size={18} />
                                </Link>
                                <button
                                    onClick={() => setShowProfileWarning(false)}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all"
                                >
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
