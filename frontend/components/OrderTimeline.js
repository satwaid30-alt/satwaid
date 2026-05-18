"use client";

import { Clock, CheckCircle2, ShieldAlert } from "lucide-react";

export default function OrderTimeline({ order, formatPrice, className = "" }) {
    if (!order) return null;

    const normalizedStatus = ['disbursement_requested', 'disbursed'].includes(order.status) ? 'completed' : order.status;

    const allSteps = [
        { 
            id: 'data_pembeli',
            label: 'Data Pembeli', 
            sub: 'Lengkapi alamat dan informasi penerima',
            isCompleted: !['pending_shipping_info'].includes(normalizedStatus),
            date: order.address_filled_at || null 
        },
        { 
            id: 'ongkir',
            label: 'Penetapan Ongkir', 
            sub: 'Penjual memasukkan biaya kirim dan packing',
            isCompleted: !['pending_shipping_info', 'waiting_shipping_cost'].includes(normalizedStatus),
            date: order.shipping_cost_set_at || null 
        },
        { 
            id: 'pembayaran',
            label: 'Pembayaran', 
            sub: 'Unggah bukti transfer untuk diverifikasi',
            isCompleted: ['processing', 'payment_verified', 'shipped', 'completed', 'complained'].includes(normalizedStatus),
            date: order.payment_uploaded_at || null 
        },
        { 
            id: 'verifikasi',
            label: 'Verifikasi Admin', 
            sub: 'Validasi pembayaran oleh pihak admin',
            isCompleted: ['payment_verified', 'shipped', 'completed', 'complained'].includes(normalizedStatus),
            date: order.payment_verified_at || null 
        },
        { 
            id: 'pengiriman',
            label: 'Pengiriman', 
            sub: 'Pesanan dikirim dan nomor resi diinput',
            isCompleted: ['shipped', 'completed', 'complained'].includes(normalizedStatus),
            date: order.shipped_at || null 
        },
        { 
            id: 'selesai',
            label: normalizedStatus === 'complained' ? 'Komplain Diajukan' : 'Pesanan Selesai', 
            sub: normalizedStatus === 'complained' ? 'Pesanan diterima dengan catatan komplain' : 'Barang diterima dan transaksi ditutup',
            isCompleted: ['completed', 'complained'].includes(normalizedStatus),
            date: normalizedStatus === 'complained' ? order.updated_at : (order.completed_at || null) 
        },
    ];

    // Find next step to be taken
    const nextStepIndex = allSteps.findIndex(step => !step.isCompleted);

    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 shadow-2xl space-y-8 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3 shrink-0">
                    <Clock size={18} className="text-emerald-500" /> Perjalanan Transaksi
                </h3>
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 h-px bg-zinc-800 hidden md:block"></div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Inv</span>
                        <span className="text-[11px] font-black text-emerald-500 tracking-wider">{order.order_id}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                {allSteps.map((step, i) => {
                    const isUpcoming = !step.isCompleted;
                    const isActive = i === nextStepIndex;

                    return (
                        <div key={i} className={`flex gap-4 items-start relative transition-all duration-500 ${isUpcoming ? "opacity-40 grayscale" : "opacity-100"}`}>
                            <div className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center z-10 shrink-0 transition-all duration-700 ${
                                step.isCompleted ? (normalizedStatus === 'complained' && step.id === 'selesai' ? "bg-red-500 border-red-400/20 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-emerald-500 border-emerald-400/20 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]") : "bg-zinc-900 border-zinc-800 text-zinc-700"}`}>
                                {step.isCompleted ? (
                                    normalizedStatus === 'complained' && step.id === 'selesai' ? <ShieldAlert size={12} className="animate-in zoom-in duration-500" /> : <CheckCircle2 size={12} className="animate-in zoom-in duration-500" />
                                ) : (
                                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                )}
                            </div>
                            <div className="space-y-1 pt-0.5 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-xs font-black tracking-tight ${step.isCompleted ? "text-white" : "text-zinc-500"}`}>{step.label}</p>
                                        {isActive && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[7px] font-black text-emerald-500 uppercase animate-pulse">Aktif</span>
                                        )}
                                    </div>
                                    {step.date && (
                                        <span className="text-[9px] font-bold text-zinc-600">
                                            {new Date(step.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(step.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">{step.sub}</p>
                                
                                {step.id === 'shipping' && order.tracking_number && step.isCompleted && (
                                    <div className="mt-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Resi</span>
                                        <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-wider">{order.tracking_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
