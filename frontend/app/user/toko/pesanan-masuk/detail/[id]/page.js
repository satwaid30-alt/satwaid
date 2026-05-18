"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
    ShoppingBag,
    MapPin,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    XCircle,
    Package,
    Truck,
    Info,
    ChevronLeft,
    ScrollText,
    ChevronDown,
    CreditCard,
    ShieldAlert
} from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";

export default function OrderDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const [successMessage, setSuccessMessage] = useState("");
    const [isProductCardOpen, setIsProductCardOpen] = useState(false);

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
                setOrder(result.data);
            } else {
                alert("Gagal memuat detail pesanan");
                router.push("/user/toko/pesanan-masuk");
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        const num = parseFloat(price) || 0;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(num);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "pending_shipping_info": return "Menunggu Alamat";
            case "waiting_shipping_cost": return "Perlu Input Ongkir";
            case "waiting_payment": return "Menunggu Pembayaran";
            case "processing": return "Menunggu Verifikasi";
            case "payment_verified": return "Perlu Dikirim";
            case "waiting_shipment": return "Perlu Dikirim";
            case "shipped": return "Dikirim";
            case "complained": return "Dikomplain";
            case "completed": return "Selesai";
            case "disbursement_requested": return "Selesai";
            case "disbursed": return "Selesai";
            case "cancelled": return "Dibatalkan";
            default: return status;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending_shipping_info": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
            case "waiting_shipping_cost": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
            case "waiting_payment": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "processing": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "payment_verified": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "waiting_shipment": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "shipped": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "complained": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "disbursement_requested": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "disbursed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse">Memuat detail pesanan...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-7xl mx-auto pt-2 pb-10 lg:py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 space-y-8">
            {/* Success Message Notification */}
            {successMessage && (
                <div className="fixed top-24 right-10 z-[200] bg-emerald-500 text-zinc-950 px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10">
                    <CheckCircle2 size={24} />
                    {successMessage}
                </div>
            )}

            {/* Back Button */}
            <Link
                href="/user/toko/pesanan-masuk"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
            >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                    <ChevronLeft size={18} />
                </div>
                <span className="text-sm font-bold">Kembali ke Pesanan Masuk</span>
            </Link>

            {/* Stepper Section */}
            <div className="hidden md:block">
                <OrderStepper order={order} />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: Product & Buyer Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Main Order Card (Accordion) */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setIsProductCardOpen(!isProductCardOpen)}
                            className="w-full flex items-center justify-between p-8 hover:bg-zinc-800/50 transition-all border-b border-zinc-800/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isProductCardOpen ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="text-left">
                                    <h2 className={`text-xl font-black uppercase tracking-tight ${isProductCardOpen ? "text-emerald-500" : "text-white"}`}>Rincian Produk & Pembeli</h2>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{order.order_id} • {order.product?.name}</p>
                                </div>
                            </div>
                            <ChevronDown size={24} className={`text-emerald-500 transition-transform duration-500 ${isProductCardOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isProductCardOpen && (
                            <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Product Image */}
                                    <div className="w-full md:w-64 aspect-square rounded-[2rem] overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner relative group">
                                        {order.product?.images?.[activeImageIndex] ? (
                                            <img
                                                src={order.product.images[activeImageIndex]}
                                                alt={order.product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                                <Package size={64} />
                                            </div>
                                        )}
                                        {order.product?.images?.length > 1 && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                                                {order.product.images.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex(i);
                                                        }}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeImageIndex === i ? "bg-emerald-500 w-3" : "bg-white/30"}`}
                                                    ></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-[9px] text-emerald-500 rounded font-black uppercase tracking-widest border border-emerald-500/20">
                                                    {order.product?.species}
                                                </span>
                                                <span className="px-2 py-0.5 bg-zinc-800 text-[9px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-700">
                                                    ID Produk: {order.product?.product_id || "-"}
                                                </span>
                                            </div>
                                            <h1 className="text-3xl font-black text-white leading-tight">{order.product?.name}</h1>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Harga</p>
                                                <p className="text-lg font-black text-white">{formatPrice(order.price)}</p>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jumlah</p>
                                                <p className="text-lg font-black text-white">{order.quantity} Ekor</p>
                                            </div>
                                        </div>

                                        {/* Shipping Type Info */}
                                        <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-dashed border-blue-500/20 rounded-2xl">
                                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-zinc-950 font-black border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Jangkauan</p>
                                                <p className="text-sm font-black text-white">{order.product?.shipping_type || "Tidak ditentukan"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-800/50"></div>

                                {/* Descriptions Section (Transparent Layout) */}
                                <div className="px-2 py-4 md:px-8 md:py-10 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <ScrollText size={16} /> Deskripsi Produk
                                            </p>
                                            <div className="flex-1 h-px bg-zinc-800/50"></div>
                                        </div>
                                        <div
                                            className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: order.product?.description || "Tidak ada deskripsi." }}
                                        ></div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Truck size={16} /> Info Pengiriman
                                            </p>
                                            <div className="flex-1 h-px bg-zinc-800/50"></div>
                                        </div>
                                        <div
                                            className="text-sm text-zinc-400 leading-relaxed description-content font-medium prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: order.product?.shipping_description || "Tidak ada informasi pengiriman." }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>                    {/* Timeline / Riwayat Perjalanan */}
                    <OrderTimeline order={order} formatPrice={formatPrice} />
                </div>

                {/* RIGHT: Transaction Summary & Action */}
                <div className="lg:col-span-4 space-y-6 sticky top-24">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={16} className="text-emerald-500" /> Rincian Pembayaran
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold">Subtotal Produk</span>
                                <span className="text-white font-black">{formatPrice(order.price * order.quantity)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold">Ongkos Kirim</span>
                                <span className="text-white font-black">
                                    {order.product?.is_free_shipping ? (
                                        <span className="text-emerald-500">Gratis</span>
                                    ) : (
                                        order.shipping_cost !== null ? formatPrice(order.shipping_cost) : formatPrice(0)
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold">Biaya Packing</span>
                                <span className="text-white font-black">
                                    {order.product?.is_free_packing ? (
                                        <span className="text-emerald-500">Gratis</span>
                                    ) : (
                                        order.packing_cost !== null ? formatPrice(order.packing_cost) : formatPrice(0)
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold">Biaya Admin</span>
                                <span className="text-white font-black">{formatPrice(order.admin_fee || 5000)}</span>
                            </div>
                            <div className="h-px bg-zinc-800"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Tagihan</span>
                                <span className="text-3xl font-black text-emerald-500 tracking-tighter">{formatPrice(order.total_price)}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            {order.status === 'waiting_shipping_cost' && (
                                <Link
                                    href={`/user/toko/pesanan-masuk/biaya-kirim/${order.id}`}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Input Ongkir & Packing
                                </Link>
                            )}

                            {['waiting_shipment', 'payment_verified'].includes(order.status) && (
                                <Link
                                    href={`/user/toko/pesanan-masuk/pengiriman/${order.id}`}
                                    className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-zinc-950 rounded-2xl transition-all font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Truck size={22} /> Masukkan Resi Pengiriman
                                </Link>
                            )}

                            <button
                                onClick={() => {
                                    const phone = order.user?.phone || order.phone_number || '';
                                    const formatted = phone.replace(/^0/, '62').replace(/\D/g, '');
                                    window.open(`https://wa.me/${formatted}`, '_blank');
                                }}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition-all font-black text-xs border border-zinc-700 flex items-center justify-center gap-2 active:scale-95"
                            >
                                Hubungi Pembeli
                            </button>
                        </div>
                    </div>

                    {/* Shipping Details Moved Here - Inside the same sidebar column */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} className="text-pink-500" /> Informasi Pengiriman
                        </h3>
                        {order.shipping_address ? (
                            <div className="space-y-5">
                                <div className="p-5 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-white font-black uppercase tracking-tight">{order.receiver_name}</p>
                                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{order.shipping_address}</p>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                <Info size={12} className="text-zinc-400" />
                                            </div>
                                            <p className="text-[11px] font-bold tracking-tight">{order.phone_number}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Info Section */}
                                {order.tracking_number && (
                                    <div className="p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Resi Pengiriman</p>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                                                <Truck size={10} /> Terkirim
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-black text-white tracking-wider">{order.tracking_number}</p>
                                        </div>
                                        {order.shipping_proof && (
                                            <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 w-fit">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-4 pt-3 mb-2">Bukti Pengiriman</p>
                                                <div className="px-4 pb-4">
                                                    <img
                                                        src={order.shipping_proof.startsWith('http') ? order.shipping_proof : `${process.env.NEXT_PUBLIC_API_URL}${order.shipping_proof}`}
                                                        alt="Bukti Pengiriman"
                                                        className="w-32 h-32 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform duration-500 border border-zinc-800"
                                                        onClick={() => window.open(order.shipping_proof.startsWith('http') ? order.shipping_proof : `${process.env.NEXT_PUBLIC_API_URL}${order.shipping_proof}`, '_blank')}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                                <MapPin size={24} className="text-zinc-700 animate-pulse" />
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Belum Ada Alamat</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .description-content {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                }
                .description-content ul {
                    list-style-type: disc !important;
                    list-style-position: outside !important;
                    margin-left: 1.25rem !important;
                    margin-top: 0.75rem !important;
                    margin-bottom: 0.75rem !important;
                    padding-left: 0.5rem !important;
                }
                .description-content ol {
                    list-style-type: decimal !important;
                    list-style-position: outside !important;
                    margin-left: 1.25rem !important;
                    margin-top: 0.75rem !important;
                    margin-bottom: 0.75rem !important;
                    padding-left: 0.5rem !important;
                }
                .description-content li {
                    margin-bottom: 0.5rem !important;
                    padding-left: 0.25rem !important;
                    line-height: 1.6 !important;
                }
                .description-content p {
                    margin-bottom: 1rem !important;
                }
            `}</style>
        </div >
    );
}
