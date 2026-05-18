"use client";

import { useState, useEffect, useMemo, use } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    CheckCircle2,
    X,
    Image as ImageIcon,
    Gavel,
    Tag,
    Trash2,
    Truck,
    AlertCircle,
    ScrollText,
    Save, ChevronRight
} from "lucide-react";

// Import ReactQuill dynamically to avoid SSR errors
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote', 'code-block'
];

export default function EditListingPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [listingType, setListingType] = useState("sell");
    const [reptileData, setReptileData] = useState({
        name: "",
        species: "",
        price: "",
        description: "",
        sex: "",
        shipping_description: "",
        images: [],
        start_bid: "",
        multiple: "",
        end_date: "",
        status: "active",
        is_free_shipping: false,
        is_free_packing: false,
        stock: 1
    });

    useEffect(() => {
        fetchListingData();
    }, [id]);

    const fetchListingData = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`);
            const result = await res.json();

            if (res.ok && result.data) {
                const data = result.data;
                setReptileData({
                    name: data.name || "",
                    species: data.species || "",
                    price: data.price || "",
                    description: data.description || "",
                    sex: data.sex || "",
                    shipping_description: data.shipping_description || "",
                    images: data.images || [],
                    start_bid: data.start_bid || "",
                    multiple: data.multiple || "",
                    end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
                    status: data.status || "active",
                    is_free_shipping: data.is_free_shipping || false,
                    is_free_packing: data.is_free_packing || false,
                    shipping_type: data.shipping_type || "",
                    stock: data.stock || 1
                });
                setListingType(data.type || "sell");

                // Fetch Shop policies
                try {
                    const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/user/${data.user_id}`);
                    const shopResult = await shopRes.json();
                    if (shopRes.ok && shopResult.data) {
                        setReptileData(prev => ({
                            ...prev,
                            shipping_description: `<strong>Kebijakan Pengiriman:</strong><br/>${shopResult.data.shipping_policy || '-'}<br/><br/><strong>Kebijakan Garansi:</strong><br/>${shopResult.data.warranty_policy || '-'}`
                        }));
                    }
                } catch (shopErr) {
                    console.error("Error fetching shop policies:", shopErr);
                }
            } else {
                alert("Gagal memuat data iklan");
                router.push("/user/toko/daftar-produk");
            }
        } catch (err) {
            console.error("Error fetching listing:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateListing = async (e) => {
        if (e) e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmUpdate = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);

        try {
            const payload = {
                ...reptileData,
                type: listingType,
                status: "pending", // Always set to pending on edit for re-verification
                // Sanitize numeric fields to null if empty string
                price: listingType === "sell" ? (reptileData.price || null) : null,
                start_bid: listingType === "auction" ? (reptileData.start_bid || null) : null,
                multiple: listingType === "auction" ? (reptileData.multiple || null) : null,
                end_date: listingType === "auction" ? (reptileData.end_date || null) : null,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                alert(result.message || "Gagal memperbarui iklan");
            }
        } catch (err) {
            console.error("Error updating listing:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold animate-pulse">Memuat data iklan...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="max-w-4xl mx-auto py-6 sm:py-10 px-0 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="px-4 sm:px-0 mb-6 sm:mb-8 flex items-center justify-between">
                    <Link
                        href="/user/toko/daftar-produk"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all group font-black text-[10px] uppercase tracking-widest"
                    >
                        <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all shrink-0">
                            <ChevronLeft size={16} />
                        </div>
                        <span className="hidden sm:block">Kembali ke Daftar</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${reptileData.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {reptileData.status}
                        </span>
                    </div>
                </div>

                {/* Form Container - flat on mobile, card on sm+ */}
                <div className="sm:bg-zinc-900 sm:border sm:border-zinc-800 sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden relative">
                    <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

                    <div className="px-4 sm:px-8 md:px-12 pt-6 sm:pt-10 pb-2 relative z-10">
                        <h2 className="text-xl sm:text-3xl font-black text-white mb-1 flex items-center gap-3">
                            <Edit className="text-emerald-500 shrink-0" size={24} />
                            Edit Produk
                        </h2>
                        <p className="text-zinc-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest">Perbarui informasi dan media produk Anda secara akurat.</p>
                    </div>

                    <form onSubmit={handleUpdateListing} className="px-4 sm:px-8 md:px-12 pb-8 sm:pb-12 pt-6 space-y-10 relative z-10">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2 px-0">
                                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                    <ScrollText size={16} />
                                </div>
                                <h2 className="text-base sm:text-xl font-black text-white tracking-tight uppercase">Informasi Dasar Produk</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Produk / Judul Iklan <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: Ball Python Piebald High White"
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner text-sm"
                                        value={reptileData.name}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Kategori / Spesies <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                                        value={reptileData.species}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, species: e.target.value }))}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        <option value="Reptil">Reptil</option>
                                        <option value="Mamalia">Mamalia</option>
                                        <option value="Burung">Burung</option>
                                        <option value="Ikan">Ikan</option>
                                        <option value="Amfibi">Amfibi</option>
                                        <option value="Serangga">Serangga</option>
                                        <option value="Invertebrata Lainnya">Invertebrata Lainnya</option>
                                        <option value="Unggas">Unggas</option>
                                        <option value="Hewan Lainnya">Hewan Lainnya</option>
                                        <option value="Pakan Hewan">Pakan Hewan</option>
                                        <option value="Perlengkapan & Aksesoris">Perlengkapan & Aksesoris</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                                        value={reptileData.sex}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, sex: e.target.value }))}
                                    >
                                        <option value="">Pilih Jenis Kelamin</option>
                                        <option value="Jantan">Jantan</option>
                                        <option value="Betina">Betina</option>
                                        <option value="Unsex">Unsex</option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Jumlah Stok <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold shadow-inner text-sm"
                                        value={reptileData.stock}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, stock: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-8 pt-10 border-t border-zinc-800/50">
                            <div className="flex items-center gap-3 mb-4 px-0">
                                <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20">
                                    <Tag size={16} />
                                </div>
                                <h2 className="text-base sm:text-xl font-black text-white tracking-tight uppercase">Harga & Metode Penjualan</h2>
                            </div>

                            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 w-full sm:w-fit shadow-inner">
                                <button
                                    type="button"
                                    disabled // Type cannot be changed during edit to maintain data integrity
                                    onClick={() => setListingType("sell")}
                                    className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 opacity-50 cursor-not-allowed ${listingType === "sell" ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"}`}
                                >
                                    <Tag size={16} /> Jual Langsung
                                </button>
                                <button
                                    type="button"
                                    disabled // Type cannot be changed during edit
                                    onClick={() => setListingType("auction")}
                                    className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 opacity-50 cursor-not-allowed ${listingType === "auction" ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-white"}`}
                                >
                                    <Gavel size={16} /> Sistem Lelang
                                </button>
                            </div>

                            {listingType === "sell" ? (
                                <div className="space-y-2 max-w-md animate-in slide-in-from-left-4 duration-300">
                                    <label className="text-sm font-bold text-zinc-300">Harga Jual (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-14 pr-5 py-4 focus:outline-none focus:border-emerald-500 transition-all"
                                            value={reptileData.price}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>
                                    <p className="text-[12px] text-yellow-500 font-bold italic pl-1">
                                        * Perhatian: Harga tidak termasuk ongkir dan biaya packing, kecuali Anda mencentang opsi yang tersedia.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-300">OB / Start Bid (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all"
                                            value={reptileData.start_bid}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, start_bid: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-300">Kelipatan / Multiple (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all"
                                            value={reptileData.multiple}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, multiple: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-300">Waktu Berakhir</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all"
                                            value={reptileData.end_date}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, end_date: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-span-full">
                                        <p className="text-[12px] text-yellow-500 font-bold italic pl-1">
                                            * Perhatian: Harga tidak termasuk ongkir dan biaya packing, kecuali Anda mencentang opsi yang tersedia.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Shipping & Type Options */}
                            <div className="space-y-6 p-6 bg-zinc-950/50 border border-zinc-800 rounded-[2rem] animate-in fade-in duration-500">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Jenis Jangkauan Pengiriman <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                                        value={reptileData.shipping_type}
                                        onChange={(e) => setReptileData({ ...reptileData, shipping_type: e.target.value })}
                                    >
                                        <option value="" disabled>Pilih Jangkauan Pengiriman</option>
                                        <option value="Pengiriman Dalam Pulau/ Wilayah">Pengiriman Dalam Pulau/ Wilayah</option>
                                        <option value="Pengiriman Seluruh Pulau/ Wilayah">Pengiriman Seluruh Pulau/ Wilayah</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-emerald-500/30 transition-all">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={reptileData.is_free_shipping}
                                                onChange={(e) => setReptileData(prev => ({ ...prev, is_free_shipping: e.target.checked }))}
                                            />
                                            <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                <CheckCircle2 size={14} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-zinc-300 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">Gratis Ongkir</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-blue-500/30 transition-all">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={reptileData.is_free_packing}
                                                onChange={(e) => setReptileData(prev => ({ ...prev, is_free_packing: e.target.checked }))}
                                            />
                                            <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                                                <CheckCircle2 size={14} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-zinc-300 group-hover:text-blue-400 transition-colors uppercase tracking-widest">Gratis Packing</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-6 pt-10 border-t border-zinc-800">
                            <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <ScrollText size={18} />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-widest">Deskripsi Lengkap</h3>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Deskripsi Detail <span className="text-red-500">*</span></label>
                                    <div className="quill-dark-editor">
                                        <ReactQuill
                                            theme="snow"
                                            modules={quillModules}
                                            formats={quillFormats}
                                            value={reptileData.description}
                                            onChange={(val) => setReptileData(prev => ({ ...prev, description: val }))}
                                            className="bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-1">
                                        <div className="flex items-center gap-2">
                                            <Truck size={14} className="text-emerald-500" />
                                            <label className="text-[10px] sm:text-xs font-black text-zinc-300 uppercase tracking-widest">Kebijakan Pengiriman & Garansi</label>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 w-fit">Otomatis dari Profil</span>
                                    </div>
                                    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8"></div>
                                        <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed description-content relative z-10 break-words" dangerouslySetInnerHTML={{ __html: reptileData.shipping_description || '<span className="italic opacity-50 text-[10px]">Mengambil data kebijakan dari profil toko Anda...</span>' }}></div>
                                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                            <p className="text-[10px] text-zinc-500 font-bold italic">Kebijakan ini diambil otomatis dari pengaturan toko Anda agar seragam.</p>
                                            <Link href="/user/toko/edit-toko" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                                                Ubah di Profil <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="space-y-6 pt-10 border-t border-zinc-800">
                            <div className="flex items-center gap-3 text-purple-500 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <ImageIcon size={18} />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-widest">Media Foto</h3>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Minimal 1 Foto • Maks 500KB / Foto</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {reptileData.images.map((img, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-800">
                                            <img src={img} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = [...reptileData.images];
                                                        newImages.splice(index, 1);
                                                        setReptileData({ ...reptileData, images: newImages });
                                                    }}
                                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-400 transition-all active:scale-90"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {reptileData.images.length < 3 && (
                                        <label className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer group hover:bg-emerald-500/5">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    if (file.size > 500 * 1024) {
                                                        alert("Ukuran foto terlalu besar! Maksimal 500KB.");
                                                        return;
                                                    }

                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        setReptileData(prev => ({
                                                            ...prev,
                                                            images: [...prev.images, event.target.result]
                                                        }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                    e.target.value = null;
                                                }}
                                            />
                                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                                <ImageIcon size={20} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">Unggah Foto</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-800">
                            <button
                                type="submit"
                                disabled={isSubmitting || reptileData.images.length === 0}
                                className={`w-full py-5 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 group active:scale-[0.98] ${listingType === "sell"
                                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
                                    : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"} ${isSubmitting || reptileData.images.length === 0 ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                                        Simpan Perubahan Iklan
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center mt-4 flex items-center justify-center gap-2">
                                <AlertCircle size={12} className="text-amber-500" />
                                Apabila melakukan perubahan maka produk akan di verifikasi ulang
                            </p>
                        </div>
                    </form>
                </div>

                {/* Confirm Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300"></div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3">Konfirmasi Perubahan</h3>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Peringatan: Apabila melakukan perubahan maka produk akan <span className="text-amber-500 font-bold">diverifikasi ulang</span> oleh admin. Apakah Anda yakin ingin melanjutkan?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmUpdate}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    Ya, Saya Mengerti & Lanjutkan
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300"></div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20 relative">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                                <CheckCircle2 size={48} className="relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-3">Berhasil!</h3>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Perubahan iklan Anda telah berhasil disimpan dan sedang menunggu <span className="text-emerald-500 font-bold">verifikasi ulang</span> oleh admin.
                            </p>
                            <button
                                onClick={() => router.push("/user/toko/daftar-produk")}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Kembali ke Daftar Iklan
                            </button>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                .quill-dark-editor .ql-toolbar {
                    background: #09090b !important;
                    border-color: #27272a !important;
                    border-radius: 1rem 1rem 0 0 !important;
                }
                .quill-dark-editor .ql-container {
                    background: #09090b !important;
                    border-color: #27272a !important;
                    border-radius: 0 0 1rem 1rem !important;
                    min-height: 200px;
                    font-family: inherit;
                }
                .quill-dark-editor .ql-editor {
                    color: #d4d4d8 !important;
                    font-size: 0.875rem !important;
                }
                .quill-dark-editor .ql-stroke {
                    stroke: #71717a !important;
                }
                .quill-dark-editor .ql-fill {
                    fill: #71717a !important;
                }
                .quill-dark-editor .ql-picker {
                    color: #71717a !important;
                }
            `}</style>
            </div>
        </div>
    );
}

function Edit(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    );
}
