"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import {
    Star,
    MessageSquare,
    AlertTriangle,
    Upload,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ShieldAlert,
    Camera,
    Send,
    Truck,
    Package
} from "lucide-react";

export default function TransactionCompletePage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("complete"); // "complete" or "complain"

    // Complete Form State
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");

    // Complain Form State
    const [complaintDesc, setComplaintDesc] = useState("");
    const [complaintImage, setComplaintImage] = useState(null);
    const [complaintImagePreview, setComplaintImagePreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: "", message: "", type: "success" });

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
                console.error("Socket connection error in transaksi-selesai", e);
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
                if (orderData.status !== "shipped") {
                    const finalStatuses = ["completed", "complained", "cancelled", "disbursement_requested", "disbursed"];
                    if (finalStatuses.includes(orderData.status)) {
                        router.replace("/user/pesanan");
                    } else {
                        router.replace(`/user/pesanan/transaksi/${id}`);
                    }
                    return;
                }
                setOrder(orderData);
            } else {
                setModalConfig({
                    title: "Gagal",
                    message: "Gagal memuat detail pesanan",
                    type: "error"
                });
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
                setModalConfig({
                    title: "Ukuran Terlalu Besar",
                    message: "Ukuran foto maksimal adalah 500kb untuk efisiensi sistem.",
                    type: "error"
                });
                setShowSuccessModal(true);
                return;
            }
            setComplaintImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setComplaintImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitComplete = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
            const res = await fetch(`${getApiUrl()}/orders/${id}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ rating, review })
            });
            if (res.ok) {
                setModalConfig({
                    title: "Terima kasih!",
                    message: "Pesanan telah selesai. Penilaian Anda sangat berharga bagi kami dan penjual.",
                    type: "success"
                });
                setShowSuccessModal(true);
            } else {
                setModalConfig({
                    title: "Opps!",
                    message: "Terjadi kesalahan saat memproses penyelesaian pesanan.",
                    type: "error"
                });
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error("Error completing order:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitComplain = async (e) => {
        e.preventDefault();
        if (!complaintDesc) {
            setModalConfig({
                title: "Deskripsi Kosong",
                message: "Harap isi deskripsi komplain agar penjual dapat memahami masalah Anda.",
                type: "error"
            });
            setShowSuccessModal(true);
            return;
        }
        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (complaintImage) {
                const formData = new FormData();
                formData.append('image', complaintImage);
                const uploadRes = await fetch(`${getApiUrl()}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const uploadResult = await uploadRes.json();
                if (uploadRes.ok) {
                    imageUrl = uploadResult.url;
                }
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
            const res = await fetch(`${getApiUrl()}/orders/${id}/complain`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    complaint_description: complaintDesc,
                    complaint_image: imageUrl
                })
            });
            if (res.ok) {
                setModalConfig({
                    title: "Komplain Terkirim",
                    message: "Komplain Anda telah diajukan. Mohon tunggu tanggapan dari pihak penjual.",
                    type: "complaint"
                });
                setShowSuccessModal(true);
            } else {
                setModalConfig({
                    title: "Gagal Mengirim",
                    message: "Terjadi kesalahan sistem saat mencoba mengirim komplain Anda.",
                    type: "error"
                });
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error("Error complaining order:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse">Memuat data...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/user/pesanan/transaksi/${id}`}
                    replace
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={18} />
                    </div>
                    <span className="text-sm font-bold">Kembali ke Transaksi</span>
                </Link>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">ID Pesanan</p>
                    <p className="text-xs font-black text-white">{order.order_id}</p>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl md:rounded-[3rem] overflow-hidden">
                {/* Product Header */}
                <div className="p-6 md:p-8 bg-zinc-950/50 border-b border-zinc-800 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-[2rem] overflow-hidden border-2 border-zinc-800 shrink-0 relative group">
                        <img
                            src={order.product?.images?.[0]}
                            alt={order.product?.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1.5 md:mb-2">Konfirmasi Barang Sampai</p>
                        <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{order.product?.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                            <span className="px-3 py-1 md:px-4 md:py-1.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                {order.quantity} Ekor
                            </span>
                            <span className="px-3 py-1 md:px-4 md:py-1.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                {order.shop?.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 p-1.5 md:p-2 gap-1.5 md:gap-2">
                    <button
                        onClick={() => setActiveTab("complete")}
                        className={`flex-1 py-4 md:py-6 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 transition-all ${activeTab === "complete"
                            ? "bg-blue-500 text-zinc-950 font-black"
                            : "text-zinc-500 hover:text-white font-bold"}`}
                    >
                        <CheckCircle2 size={18} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm uppercase tracking-widest">Diterima</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("complain")}
                        className={`flex-1 py-4 md:py-6 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 transition-all ${activeTab === "complain"
                            ? "bg-red-500 text-white font-black"
                            : "text-zinc-500 hover:text-white font-bold"}`}
                    >
                        <AlertTriangle size={18} className="md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-sm uppercase tracking-widest">Komplain</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-10">
                    {activeTab === "complete" ? (
                        <form onSubmit={handleSubmitComplete} className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Star size={14} className="text-amber-500" /> Berikan Penilaian Toko
                                </label>
                                <div className="flex items-center justify-center gap-3 md:gap-4 py-6 md:py-8 bg-zinc-950/50 rounded-2xl md:rounded-[2.5rem] border border-zinc-800">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`transition-all hover:scale-125 ${star <= rating ? "text-amber-500" : "text-zinc-800"}`}
                                        >
                                            <Star className="w-8 h-8 md:w-12 md:h-12" fill={star <= rating ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">
                                    {rating === 1 ? "Sangat Buruk" :
                                        rating === 2 ? "Buruk" :
                                            rating === 3 ? "Biasa Saja" :
                                                rating === 4 ? "Puas" : "Sangat Puas"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} className="text-blue-500" /> Komentar / Review Toko
                                </label>
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Ceritakan pengalaman Anda berbelanja di toko ini..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl md:rounded-[2rem] py-4 px-6 md:py-6 md:px-8 text-white focus:outline-none focus:border-blue-500 transition-all min-h-[120px] md:min-h-[150px] text-sm md:text-base font-medium placeholder:text-zinc-800"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 md:py-6 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-2xl md:rounded-3xl transition-all uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} className="md:w-5 md:h-5" />
                                        Selesaikan Pesanan
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitComplain} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4">
                                <ShieldAlert size={24} className="text-red-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Peringatan Komplain</p>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                                        Pastikan Anda memiliki bukti foto/video unboxing yang jelas. Komplain tanpa bukti yang kuat dapat ditolak oleh sistem moderasi.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Camera size={14} className="text-red-500" /> Upload Bukti Foto (Maks 500kb)
                                </label>
                                <div className="flex flex-col items-center justify-center">
                                    {complaintImagePreview ? (
                                        <div className="relative group w-full max-w-md aspect-video rounded-3xl overflow-hidden border-2 border-red-500/50">
                                            <img
                                                src={complaintImagePreview}
                                                className="w-full h-full object-cover"
                                                alt="Preview"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setComplaintImage(null);
                                                    setComplaintImagePreview(null);
                                                }}
                                                className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-full max-w-md aspect-video rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all group">
                                            <div className="w-16 h-16 bg-zinc-900 text-zinc-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Upload size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-white uppercase tracking-widest">Klik untuk Upload</p>
                                                <p className="text-[10px] text-zinc-600 font-medium">JPG, PNG atau WEBP (Maks. 500kb)</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>


                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-red-500" /> Deskripsi Masalah / Komplain
                                </label>
                                <textarea
                                    value={complaintDesc}
                                    onChange={(e) => setComplaintDesc(e.target.value)}
                                    placeholder="Jelaskan secara detail masalah yang Anda temukan pada paket..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl md:rounded-[2rem] py-4 px-6 md:py-6 md:px-8 text-white focus:outline-none focus:border-red-500 transition-all min-h-[120px] md:min-h-[150px] text-sm md:text-base font-medium placeholder:text-zinc-800"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 bg-red-500 hover:bg-red-400 text-white font-black rounded-3xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <ShieldAlert size={20} />
                                        Ajukan Komplain Resmi
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Warning Section */}
            <div className="p-8 bg-zinc-950/30 rounded-[2.5rem] border border-zinc-800 border-dashed text-center">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic leading-relaxed">
                    *Harap berhati-hati dalam memberikan penilaian. Review Anda akan tampil di profil toko dan membantu pembeli lain.
                </p>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300"></div>
                    <div className="relative bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] text-center animate-in zoom-in-95 duration-300">
                        <div className={`w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 rounded-2xl md:rounded-[2rem] flex items-center justify-center ${modalConfig.type === 'error' ? 'bg-red-500/10 text-red-500' :
                            modalConfig.type === 'complaint' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-blue-500/10 text-blue-500'}`}>
                            {modalConfig.type === 'error' ? <XCircle className="w-8 h-8 md:w-12 md:h-12" /> :
                                modalConfig.type === 'complaint' ? <ShieldAlert className="w-8 h-8 md:w-12 md:h-12" /> :
                                    <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />}
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-3 md:mb-4">{modalConfig.title}</h2>
                        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8 font-medium">
                            {modalConfig.message}
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                if (modalConfig.type !== 'error') {
                                    router.replace(`/user/pesanan/transaksi/${id}`);
                                }
                            }}
                            className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest transition-all text-xs md:text-sm ${modalConfig.type === 'error' ? 'bg-zinc-800 text-white hover:bg-zinc-700' :
                                modalConfig.type === 'complaint' ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' :
                                    'bg-blue-500 text-zinc-950 hover:bg-blue-400'}`}
                        >
                            {modalConfig.type === 'error' ? 'Tutup' : 'Kembali ke Transaksi'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
