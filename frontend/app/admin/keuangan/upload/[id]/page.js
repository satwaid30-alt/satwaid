"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    ShoppingBag,
    User,
    Calendar,
    CreditCard,
    DollarSign,
    Info,
    Receipt
} from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function UploadFinanceDocPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [notes, setNotes] = useState("");
    const [additionalFee, setAdditionalFee] = useState(0);

    const getImageUrl = (path) => {
        if (!path) return "https://placehold.co/100x100?text=No+Image";
        let finalPath = path;
        try {
            if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('{'))) {
                const parsed = JSON.parse(path);
                finalPath = Array.isArray(parsed) ? parsed[0] : parsed;
            } else if (Array.isArray(path)) {
                finalPath = path[0];
            }
        } catch (e) { }
        if (!finalPath) return "https://placehold.co/100x100?text=No+Image";
        if (typeof finalPath !== 'string') return "https://placehold.co/100x100?text=Invalid+Path";
        if (finalPath.startsWith('http') || finalPath.startsWith('data:')) return finalPath;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const formattedPath = finalPath.startsWith('/') ? finalPath : `/${finalPath}`;
        return `${baseUrl}${formattedPath}`;
    };

    // Calculate total disbursement
    const totalDisbursement = (Number(order?.price || 0) * Number(order?.quantity || 1)) +
        Number(order?.shipping_cost || 0) +
        Number(order?.packing_cost || 0) -
        Number(additionalFee || 0);

    useEffect(() => {
        if (order) {
            setAdditionalFee(order.additional_fee || 0);
            setNotes(order.disbursement_notes || "");
        }
    }, [order]);

    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    const fetchOrderDetail = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                setOrder(result.data);
            } else {
                alert("Gagal memuat detail transaksi");
                router.push("/admin/keuangan");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Silakan pilih file terlebih dahulu");
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload the file first to get the URL
            const formData = new FormData();
            formData.append('image', selectedFile);

            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.message || "Gagal mengunggah file");

            const fileUrl = uploadData.url;

            // 2. Call the disburse API
            const disburseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/disburse`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disbursement_proof: fileUrl,
                    disbursement_notes: notes,
                    additional_fee: additionalFee
                })
            });

            if (disburseRes.ok) {
                setActionModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Dana Dicairkan',
                    message: `Bukti transfer untuk invoice ${order.order_id} berhasil diunggah. Seller akan mendapatkan notifikasi.`,
                    onConfirm: () => router.push(`/admin/keuangan/detail-pembayaran/${order.shop_id}`)
                });
            } else {
                const errData = await disburseRes.json();
                throw new Error(errData.message || "Gagal menyimpan data pencairan");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Terjadi kesalahan saat memproses data");
        } finally {
            setIsUploading(false);
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
                <p className="text-zinc-500 font-bold animate-pulse">Memuat detail transaksi...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/admin/keuangan/detail-pembayaran/${order.shop_id}`}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px]">Kembali ke Keuangan</span>
                </Link>
                <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] font-black text-emerald-500 font-mono tracking-wider">{order.order_id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Upload Form */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                    <Upload size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                        {order.disbursed_at ? "Detail Pencairan" : "Upload Bukti"}
                                    </h2>
                                    <p className="text-zinc-500 text-sm font-medium">
                                        {order.disbursed_at ? "Informasi penyelesaian transaksi" : "Unggah dokumen penyelesaian transaksi"}
                                    </p>
                                </div>
                            </div>

                            {order.disbursed_at ? (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-zinc-950">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Status Pencairan</p>
                                                    <p className="text-sm font-black text-white uppercase">Selesai Ditransfer</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Tanggal Cair</p>
                                                <p className="text-xs font-bold text-zinc-300">
                                                    {new Date(order.disbursed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bukti Transfer</label>
                                        <div className="relative group rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video">
                                            <img
                                                src={getImageUrl(order.disbursement_proof)}
                                                className="w-full h-full object-contain"
                                                alt="Bukti Transfer"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a
                                                    href={getImageUrl(order.disbursement_proof)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-3 bg-white text-zinc-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                                                >
                                                    Lihat Resolusi Penuh
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {order.disbursement_notes && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Catatan Admin</label>
                                            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-zinc-400 text-sm font-medium italic">
                                                &quot;{order.disbursement_notes}&quot;
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <Link
                                            href={`/admin/keuangan/detail-pembayaran/${order.shop_id}`}
                                            className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 border border-zinc-700"
                                        >
                                            <ChevronLeft size={20} /> Kembali ke Daftar
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                                accept="image/*,.pdf"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="block bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-12 text-center hover:border-emerald-500/50 transition-all cursor-pointer group-hover:bg-zinc-950"
                                            >
                                                {previewUrl ? (
                                                    <div className="space-y-4">
                                                        {selectedFile?.type.includes('image') ? (
                                                            <img src={previewUrl} className="max-h-48 mx-auto rounded-2xl shadow-2xl border border-zinc-800" alt="Preview" />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                                                                <FileText size={40} />
                                                            </div>
                                                        )}
                                                        <p className="text-sm font-bold text-white">{selectedFile?.name}</p>
                                                        <button type="button" onClick={(e) => { e.preventDefault(); setPreviewUrl(null); setSelectedFile(null); }} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Hapus File</button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-zinc-700 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                                                            <FileText size={32} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Pilih File Bukti Transaksi</p>
                                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">PNG, JPG, atau PDF (Max. 5MB)</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Biaya Tambahan / Admin Transfer (Opsional)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    value={additionalFee}
                                                    onChange={(e) => setAdditionalFee(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Catatan Tambahan</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 px-6 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                                                placeholder="Tuliskan keterangan mengenai dokumen ini..."
                                                rows={4}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUploading || !selectedFile}
                                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                                Sedang Mengunggah...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={20} /> Konfirmasi & Simpan
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-emerald-500">
                            <Receipt size={300} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary Card */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-inner">
                                <img src={getImageUrl(order.product?.images)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-white line-clamp-1">{order.product?.name}</h3>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatPrice(order.price)} x {order.quantity}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detail Penerima Dana</h4>
                            <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/50 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <CreditCard size={14} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Nama Bank</p>
                                        <p className="text-sm font-black text-white uppercase">{order.bank_name || order.shop?.bank_name || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <Info size={14} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Nomor Rekening</p>
                                        <p className="text-sm font-black text-white tracking-widest">{order.bank_account || order.shop?.bank_account || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <User size={14} className="text-pink-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Atas Nama</p>
                                        <p className="text-sm font-black text-white">{order.bank_holder || order.shop?.bank_holder || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                <span className="uppercase tracking-tighter">Harga Produk</span>
                                <span className="text-white">{formatPrice(Number(order.price || 0) * Number(order.quantity || 1))}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                <span className="uppercase tracking-tighter">Ongkos Kirim</span>
                                <span className="text-white">{formatPrice(order.shipping_cost)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                <span className="uppercase tracking-tighter">Biaya Packing</span>
                                <span className="text-white">{formatPrice(order.packing_cost)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                <span className="uppercase tracking-tighter">Biaya Tambahan</span>
                                <span className="text-red-500">-{formatPrice(additionalFee)}</span>
                            </div>
                            <div className="h-px bg-zinc-800"></div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-black text-white uppercase tracking-widest">Dana Dicairkan</span>
                                <span className="text-2xl font-black text-emerald-500 tracking-tighter">
                                    {formatPrice(totalDisbursement)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <div className="space-y-1">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Instruksi Admin</p>
                            <p className="text-[11px] text-amber-500/70 font-medium leading-relaxed">
                                Pastikan nominal transfer sesuai dengan &quot;Dana Dicairkan&quot; dan nomor rekening tujuan sudah divalidasi kebenarannya.
                            </p>
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
