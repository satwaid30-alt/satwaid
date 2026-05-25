"use client";

import { useState } from "react";
import {
    Truck,
    Info,
    CheckCircle2,
    Calendar,
    ShoppingBag,
    Package,
    Search,
    XCircle
} from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

export default function ShippingInfo({ order }) {
    const [showImageZoom, setShowImageZoom] = useState(false);

    if (!order || (order.status !== 'shipped' && order.status !== 'completed')) {
        return null;
    }

    return (
        <>
            {/* Detailed Shipping Info */}
            <div className="bg-transparent sm:bg-zinc-900 border-none sm:border sm:border-zinc-800 rounded-none sm:rounded-[3rem] p-0 sm:p-10 shadow-none sm:shadow-2xl space-y-8 sm:space-y-10 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-10 rounded-full"></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-500/10 text-blue-500 rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-inner shrink-0">
                            <Truck size={24} className="md:hidden" />
                            <Truck size={40} className="hidden md:block" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight">Detail Pengiriman</h2>
                            <p className="text-zinc-500 text-[10px] md:text-[14px] font-medium uppercase tracking-widest">Pelacakan paket Anda</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    {/* Tracking Number Section */}
                    <div className="space-y-6">
                        <div className="bg-transparent sm:bg-zinc-950/50 p-0 sm:p-8 rounded-none sm:rounded-[2.5rem] border-none sm:border sm:border-zinc-800 space-y-6 shadow-none sm:shadow-inner">
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Info size={14} className="text-blue-500" /> Nomor Resi Pelacakan
                                </p>
                                <p className="text-2xl font-black text-white tracking-[0.2em] break-all">
                                    {order.tracking_number || "RESI-BELUM-TERSEDIA"}
                                </p>
                            </div>
                            <div className="pt-6 border-t border-zinc-800 flex items-start gap-4">
                                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800 shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                                    Pesanan Anda telah diserahkan ke kurir. Silakan gunakan nomor resi di atas untuk melacak posisi paket melalui situs resmi ekspedisi.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Shipping Proof Section */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-0 sm:ml-1 flex items-center gap-2">
                            <ShoppingBag size={14} className="text-blue-500" /> Bukti Foto Pengiriman
                        </p>
                        <div
                            onClick={() => setShowImageZoom(true)}
                            className="aspect-[4/3] rounded-2xl sm:rounded-[2.5rem] bg-zinc-950 border border-zinc-800 overflow-hidden relative group cursor-pointer shadow-inner"
                        >
                            {order.shipping_proof ? (
                                <>
                                    <img
                                        src={order.shipping_proof.startsWith("http") ? order.shipping_proof : `${getApiUrl()}${order.shipping_proof}`}
                                        alt="Bukti Pengiriman"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <div className="px-6 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 backdrop-blur-md">
                                            Klik untuk Memperbesar
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-800">
                                    <Package size={64} className="animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Foto tidak tersedia</p>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium italic text-center px-4">
                            *Foto ini adalah bukti fisik paket Anda saat diserahkan ke kurir oleh penjual.
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Zoom Lightbox */}
            {showImageZoom && order.shipping_proof && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-300"
                        onClick={() => setShowImageZoom(false)}
                    ></div>
                    <div className="relative z-10 w-full max-w-5xl h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowImageZoom(false)}
                            className="absolute top-0 right-0 md:-top-12 md:-right-12 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-zinc-950 rounded-full flex items-center justify-center transition-all border border-white/10"
                        >
                            <XCircle size={32} />
                        </button>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
                            <img
                                src={order.shipping_proof.startsWith("http") ? order.shipping_proof : `${getApiUrl()}${order.shipping_proof}`}
                                alt="Zoom Bukti Pengiriman"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

