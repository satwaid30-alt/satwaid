"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import {
    MapPin,
    Truck,
    Package,
    ChevronLeft,
    CheckCircle2,
    ShoppingBag,
    ArrowRight,
    Camera,
    Upload,
    FileText,
    Info,
    Check,
    Eye
} from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import ActionModal from "@/components/ActionModal";
import OrderTimeline from "@/components/OrderTimeline";

export default function ShippingConfirmationPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null
    });

    const [form, setForm] = useState({
        tracking_number: "",
        shipping_proof: ""
    });

    const [uploading, setUploading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        fetchOrderDetail();

        // Setup Socket.io for Real-time Updates
        const userStr = localStorage.getItem("user");
        let socket;
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
                socket = io(getSocketUrl(), {
                    auth: {
                        token: token ? `Bearer ${token}` : null
                    }
                });
                socket.emit("join_user", userData.id);

                socket.on("new_notification", () => {
                    fetchOrderDetail(); // Auto-refresh when status changes
                });
            } catch (e) {
                console.error("Socket connection error in pengiriman", e);
            }
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [id]);

    const fetchOrderDetail = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/orders/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                const orderData = result.data;
                if (!["waiting_shipment", "payment_verified"].includes(orderData.status)) {
                    router.replace(`/user/toko/pesanan-masuk/detail/${id}`);
                    return;
                }
                setOrder(orderData);
                if (orderData.tracking_number) {
                    setForm(prev => ({ ...prev, tracking_number: orderData.tracking_number }));
                }
                if (orderData.shipping_proof) {
                    setForm(prev => ({ ...prev, shipping_proof: orderData.shipping_proof }));
                }
            } else {
                setModalConfig({
                    isOpen: true,
                    type: "warning",
                    title: "Gagal Memuat",
                    message: "Gagal memuat detail pesanan. Silakan coba lagi.",
                    onConfirm: () => router.push("/user/toko/pesanan-masuk")
                });
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
            setModalConfig({
                isOpen: true,
                type: "danger",
                title: "Kesalahan Koneksi",
                message: "Terjadi kesalahan saat menghubungkan ke server.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Max 500KB
        if (file.size > 500 * 1024) {
            setModalConfig({
                isOpen: true,
                type: "warning",
                title: "File Terlalu Besar",
                message: "Ukuran file bukti pengiriman maksimal adalah 500KB."
            });
            e.target.value = ""; // Reset input
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`${getApiUrl()}/upload`, {
                method: "POST",
                body: formData
            });
            const result = await res.json();
            if (res.ok) {
                setForm({ ...form, shipping_proof: result.url });
            } else {
                alert("Gagal mengunggah gambar");
            }
        } catch (err) {
            console.error(err);
            alert("Kesalahan koneksi saat mengunggah");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.tracking_number) {
            setModalConfig({
                isOpen: true,
                type: "warning",
                title: "Data Tidak Lengkap",
                message: "Mohon masukkan nomor resi pengiriman terlebih dahulu."
            });
            return;
        }

        if (!form.shipping_proof) {
            setModalConfig({
                isOpen: true,
                type: "warning",
                title: "Bukti Belum Diunggah",
                message: "Silakan unggah bukti foto pengiriman (resi/paket) untuk melanjutkan."
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

            if (!token) {
                setModalConfig({
                    isOpen: true,
                    type: "danger",
                    title: "Sesi Tidak Ditemukan",
                    message: "Sesi login Anda tidak ditemukan. Silakan login ulang terlebih dahulu.",
                    onConfirm: () => router.replace("/login")
                });
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`${getApiUrl()}/orders/${id}/ship-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    type: "success",
                    title: "Pengiriman Terkirim!",
                    message: "Informasi pengiriman berhasil disimpan. Pembeli akan segera menerima notifikasi nomor resi Anda.",
                    onConfirm: () => router.replace("/user/toko/pesanan-masuk")
                });
            } else if (response.status === 401 || response.status === 403) {
                // Token expired atau tidak valid — arahkan ke login
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setModalConfig({
                    isOpen: true,
                    type: "warning",
                    title: "Sesi Habis",
                    message: "Sesi login Anda telah habis. Silakan login ulang untuk melanjutkan.",
                    onConfirm: () => router.replace("/login")
                });
            } else {
                const result = await response.json();
                setModalConfig({
                    isOpen: true,
                    type: "danger",
                    title: "Gagal Update",
                    message: result.message || "Gagal memperbarui status pengiriman."
                });
            }
        } catch (err) {
            console.error(err);
            setModalConfig({
                isOpen: true,
                type: "danger",
                title: "Kesalahan Sistem",
                message: "Terjadi kesalahan koneksi saat mengirim data."
            });
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 bg-zinc-950">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-black animate-pulse uppercase tracking-widest text-[10px]">Memuat Formulir Pengiriman...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                    href={`/user/toko/pesanan-masuk/detail/${id}`}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group self-start"
                >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={18} />
                    </div>
                    <span className="text-sm font-bold">Kembali ke Detail</span>
                </Link>
                <div className="text-left sm:text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tahap Sekarang</p>
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Konfirmasi Pengiriman
                    </span>
                </div>
            </div>

            {/* Unified Stepper Section */}
            <OrderStepper order={order} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: Shipping Form */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative overflow-hidden">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Kirim Pesanan</h2>
                                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Masukkan nomor resi dan bukti pengiriman</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Nomor Resi */}
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2 group-focus-within:text-blue-500 transition-colors">
                                        <FileText size={12} /> Nomor Resi Pengiriman <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={form.tracking_number}
                                            onChange={(e) => setForm({ ...form, tracking_number: e.target.value.toUpperCase() })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:border-blue-500 transition-all font-black text-lg placeholder:text-zinc-800"
                                            placeholder="CONTOH: JNE123456789"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                            <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                                                <Info size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bukti Pengiriman Upload */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Camera size={12} /> Bukti Foto Pengiriman <span className="text-red-500">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            className={`relative aspect-video rounded-[2rem] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-4 group cursor-pointer
                                                ${form.shipping_proof ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-blue-500/50 hover:bg-blue-500/5'}`}
                                        >
                                            {form.shipping_proof ? (
                                                <>
                                                    <img
                                                        src={`${getApiUrl()}${form.shipping_proof}`}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                                        alt="Bukti Pengiriman"
                                                    />
                                                    <div className="relative z-20 flex flex-col items-center gap-2.5">
                                                        <div className="w-12 h-12 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center">
                                                            <Check size={24} />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setIsPreviewOpen(true);
                                                                }}
                                                                className="flex items-center gap-1.5 text-[10px] font-black text-zinc-950 uppercase tracking-widest bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-full transition-all"
                                                            >
                                                                <Eye size={12} /> Review Foto
                                                            </button>
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-zinc-950/80 px-3 py-1.5 rounded-full">Ganti Foto</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-zinc-900 text-zinc-500 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:text-blue-500 transition-all border border-zinc-800">
                                                        {uploading ? (
                                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Upload size={32} />
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white font-black text-sm uppercase tracking-tight">Upload Foto Paket</p>
                                                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-1">Format JPG/PNG • Max 500KB</p>
                                                    </div>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                        </div>

                                        <div className="bg-zinc-950/50 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
                                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed italic border-b border-zinc-800 pb-3 mb-3">
                                                Pastikan foto struk atau paket terlihat jelas dan tajam dengan ukuran file maksimal 500KB agar proses verifikasi lancar.
                                            </p>
                                            <ul className="space-y-3">
                                                {[
                                                    "Foto resi harus terlihat jelas",
                                                    "Foto paket sebelum diserahkan ke kurir",
                                                    "Pastikan nomor resi sesuai dengan fisik",
                                                    "Simpan bukti fisik hingga paket diterima"
                                                ].map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <CheckCircle2 size={12} className="text-blue-500" />
                                                        </div>
                                                        <span className="text-xs text-zinc-500 font-medium leading-relaxed">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href={`/user/toko/pesanan-masuk/detail/${id}`}
                                        className="flex-1 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-center text-sm uppercase tracking-widest"
                                    >
                                        Batal
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || uploading}
                                        className="flex-[2] py-5 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                Konfirmasi Pengiriman <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Riwayat / Timeline */}
                    <OrderTimeline order={order} formatPrice={formatPrice} />
                </div>

                {/* RIGHT: Product Summary */}
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 space-y-8">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag size={16} className="text-blue-500" /> Ringkasan Pesanan
                        </h3>

                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                                <img
                                    src={order.product?.images?.[0]}
                                    alt={order.product?.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                                        {order.product?.species}
                                    </span>
                                    <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                                        ID : {order.product?.product_id || "-"}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black text-white leading-tight">{order.product?.name}</h4>
                                <p className="text-sm font-bold text-zinc-500">{order.quantity} Ekor • {formatPrice(order.price)} / ekor</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-zinc-800">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold">Total Pembayaran</span>
                                <span className="text-xl font-black text-white">{formatPrice(order.total_price)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold italic uppercase tracking-widest">Sudah Dibayar Oleh Pembeli</span>
                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md font-black uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={10} /> LUNAS
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alamat Pengiriman Recap */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 space-y-6">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" /> Alamat Tujuan Pengiriman
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-zinc-950/50 rounded-[2rem] border border-zinc-800">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Penerima</p>
                                    <p className="text-lg font-black text-white">{order.receiver_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">No. Telepon</p>
                                    <p className="text-sm text-white font-bold">{order.phone_number}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Alamat Lengkap</p>
                                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{order.shipping_address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal for Notifications & Success */}
            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText="Oke, Lanjutkan"
            />

            {/* Photo Review Lightbox/Modal */}
            {isPreviewOpen && form.shipping_proof && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <div
                        className="relative max-w-4xl max-h-[85vh] w-full p-4 flex flex-col items-center justify-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute -top-12 right-4 text-zinc-400 hover:text-white p-2 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                        >
                            Tutup [X]
                        </button>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3 max-w-full overflow-hidden flex items-center justify-center">
                            <img
                                src={`${getApiUrl()}${form.shipping_proof}`}
                                className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                                alt="Review Bukti Pengiriman"
                            />
                        </div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Review Bukti Pengiriman Anda</p>
                    </div>
                </div>
            )}
        </div>
    );
}
