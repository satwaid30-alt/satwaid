"use client";

import { useState, useEffect, useMemo, use } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    X,
    Image as ImageIcon,
    Gavel,
    Tag,
    Truck,
    AlertCircle,
    ScrollText,
    Save, ChevronRight,
    Loader2
} from "lucide-react";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

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

const isVideoUrl = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm") || lower.endsWith(".mkv") || lower.endsWith(".3gp");
};

const formatRupiah = (value) => {
    if (value === null || value === undefined) return "";
    const clean = value.toString().replace(/\D/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
};

export default function EditListingPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState("Ukuran foto tidak boleh melebihi 1MB. Silakan kompres foto Anda.");
    const [mediaType, setMediaType] = useState("image");

    const validateVideoFile = (file, inputRef) => {
        return new Promise((resolve) => {
            if (!file) {
                resolve(false);
                return;
            }

            // 1. Block dangerous extensions
            const blockedExtensions = [".php", ".exe", ".svg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"];
            const fileName = file.name.toLowerCase();
            if (blockedExtensions.some((ext) => fileName.endsWith(ext))) {
                setShowErrorModal(true);
                setErrorModalMessage("Format file tersebut tidak diperbolehkan. Silakan unggah file video.");
                if (inputRef) inputRef.value = null;
                resolve(false);
                return;
            }

            // 2. Validate allowed video MIME types
            if (!file.type.startsWith("video/")) {
                setShowErrorModal(true);
                setErrorModalMessage("Hanya file video yang diperbolehkan.");
                if (inputRef) inputRef.value = null;
                resolve(false);
                return;
            }

            // 3. Validate file size (max 20 MB)
            const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB
            if (file.size > MAX_VIDEO_SIZE) {
                setShowErrorModal(true);
                setErrorModalMessage("Ukuran video tidak boleh melebihi 20MB. Silakan pilih video yang lebih kecil.");
                if (inputRef) inputRef.value = null;
                resolve(false);
                return;
            }

            // 4. Validate duration (max 15 seconds)
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = function () {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                if (duration > 15.5) {
                    setShowErrorModal(true);
                    setErrorModalMessage("Durasi video maksimal adalah 15 detik.");
                    if (inputRef) inputRef.value = null;
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
            video.onerror = function () {
                setShowErrorModal(true);
                setErrorModalMessage("Gagal membaca metadata video. Pastikan file video valid.");
                if (inputRef) inputRef.value = null;
                resolve(false);
            };
            video.src = URL.createObjectURL(file);
        });
    };

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

    // ── Image Upload Security Validator ──────────────────────────────────────────
    const validateImageFile = (file, inputRef) => {
        if (!file) return false;

        // 1. Block dangerous extensions
        const blockedExtensions = [".php", ".exe", ".svg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"];
        const fileName = file.name.toLowerCase();
        if (blockedExtensions.some((ext) => fileName.endsWith(ext))) {
            setShowErrorModal(true);
            setErrorModalMessage("Format file tersebut tidak diperbolehkan. Hanya gambar JPG, PNG, atau WEBP yang diterima.");
            if (inputRef) inputRef.value = null;
            return false;
        }

        // 2. Block dangerous & document MIME types
        const blockedMime = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/x-php", "application/x-httpd-php", "text/x-php",
            "application/octet-stream", "image/svg+xml",
        ];
        if (blockedMime.includes(file.type)) {
            setShowErrorModal(true);
            setErrorModalMessage("Tipe file tersebut tidak diperbolehkan. Hanya gambar JPG, PNG, atau WEBP yang diterima.");
            if (inputRef) inputRef.value = null;
            return false;
        }

        // 3. Validate allowed image MIME types
        const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
        if (!allowedMime.includes(file.type)) {
            setShowErrorModal(true);
            setErrorModalMessage("Hanya gambar berformat JPG, PNG, WEBP, atau GIF yang diperbolehkan.");
            if (inputRef) inputRef.value = null;
            return false;
        }

        // 4. Validate file size (max 1 MB)
        if (file.size > 1 * 1024 * 1024) {
            setShowErrorModal(true);
            setErrorModalMessage("Ukuran foto tidak boleh melebihi 1MB. Silakan kompres foto Anda.");
            if (inputRef) inputRef.value = null;
            return false;
        }

        return true;
    };

    // ── Random file rename before upload ─────────────────────────────────────────
    const renameFileRandom = (file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
        return new File([file], randomName, { type: file.type });
    };

    const fetchListingData = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/listings/${id}`);
            const result = await res.json();

            if (res.ok && result.data) {
                const data = result.data;
                const hasVideo = data.images && data.images.some(img => isVideoUrl(img));
                setMediaType(hasVideo ? "video" : "image");
                setReptileData({
                    name: data.name || "",
                    species: data.species || "",
                    price: data.price ? formatRupiah(data.price) : "",
                    description: data.description || "",
                    sex: data.sex || "",
                    shipping_description: data.shipping_description || "",
                    images: data.images || [],
                    start_bid: data.start_bid ? formatRupiah(data.start_bid) : "",
                    multiple: data.multiple ? formatRupiah(data.multiple) : "",
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
                    const shopRes = await fetch(`${getApiUrl()}/shops/user/${data.user_id}`);
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
                price: listingType === "sell" && reptileData.price ? parseInt(reptileData.price.toString().replace(/\D/g, ""), 10) : null,
                start_bid: listingType === "auction" && reptileData.start_bid ? parseInt(reptileData.start_bid.toString().replace(/\D/g, ""), 10) : null,
                multiple: listingType === "auction" && reptileData.multiple ? parseInt(reptileData.multiple.toString().replace(/\D/g, ""), 10) : null,
                end_date: listingType === "auction" ? (reptileData.end_date || null) : null,
            };

            const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
            const response = await fetch(`${getApiUrl()}/listings/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
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
            <div className="flex items-center justify-center min-h-[80vh] bg-zinc-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
                    <Tag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="max-w-5xl mx-auto py-6 sm:py-10 px-0 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
                {/* Header */}
                <div className="px-4 sm:px-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/user/toko/daftar-produk"
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-3 group font-black text-[10px] uppercase tracking-widest"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Daftar
                        </Link>
                        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Tag className="text-emerald-500" size={24} />
                            Edit Produk
                        </h1>
                        <p className="text-zinc-500 mt-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Perbarui informasi dan media produk Anda secara akurat</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border ${reptileData.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            Status: {reptileData.status}
                        </span>
                    </div>
                </div>

                <div className="bg-transparent sm:bg-zinc-900 border-none sm:border border-zinc-800 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden">
                    <form onSubmit={handleUpdateListing} className="px-0 py-6 sm:p-8 md:p-10 space-y-8">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Nama Produk / Judul Iklan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Ball Python Piebald High White"
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-700"
                                        value={reptileData.name}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Kategori / Spesies <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer"
                                        value={reptileData.species}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setReptileData(prev => ({
                                                ...prev,
                                                species: val,
                                                images: val !== "Ikan" && mediaType === "video" ? [] : prev.images
                                            }));
                                            if (val !== "Ikan") {
                                                setMediaType("image");
                                            }
                                        }}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer text-sm"
                                            value={reptileData.sex}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, sex: e.target.value }))}
                                        >
                                            <option value="" disabled>Pilih</option>
                                            <option value="Jantan">Jantan</option>
                                            <option value="Betina">Betina</option>
                                            <option value="Unsex">Unsex</option>
                                            <option value="Unknown">Unknown</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Stok <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                                            value={reptileData.stock}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, stock: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Jangkauan Pengiriman <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer text-sm"
                                        value={reptileData.shipping_type}
                                        onChange={(e) => setReptileData(prev => ({ ...prev, shipping_type: e.target.value }))}
                                    >
                                        <option value="" disabled>Pilih Jangkauan Pengiriman</option>
                                        <option value="Pengiriman Dalam Pulau/ Wilayah">Pengiriman Dalam Pulau/ Wilayah</option>
                                        <option value="Pengiriman Seluruh Pulau/ Wilayah">Pengiriman Seluruh Pulau/ Wilayah</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Direct Sale Pricing & Options */}
                        {listingType === "sell" ? (
                            <div className="sm:p-6 sm:bg-zinc-950/50 sm:border sm:border-zinc-800 sm:rounded-3xl space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap ml-1">
                                            <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Harga Satuan</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black">Rp</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                required
                                                placeholder="Contoh: 1.500.000"
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-14 pr-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-700"
                                                value={reptileData.price}
                                                onChange={(e) => setReptileData(prev => ({ ...prev, price: formatRupiah(e.target.value) }))}
                                            />
                                        </div>
                                        <p className="text-[11px] font-bold text-amber-500/80 italic leading-tight px-1">
                                            * Belum termasuk ongkir &amp; packing.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Opsi Tambahan</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={reptileData.is_free_shipping}
                                                        onChange={(e) => setReptileData(prev => ({ ...prev, is_free_shipping: e.target.checked }))}
                                                    />
                                                    <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                        <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Ongkir</span>
                                                    <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengiriman</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={reptileData.is_free_packing}
                                                        onChange={(e) => setReptileData(prev => ({ ...prev, is_free_packing: e.target.checked }))}
                                                    />
                                                    <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                        <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Packing</span>
                                                    <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengemasan</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="sm:p-6 sm:bg-zinc-950/50 sm:border sm:border-zinc-800 sm:rounded-3xl space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap ml-1">
                                            <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">OB / Start Bid (Rp) <span className="text-red-500">*</span></label>
                                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Harga Satuan</span>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold"
                                            value={reptileData.start_bid}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, start_bid: formatRupiah(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Kelipatan / Multiple (Rp) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold"
                                            value={reptileData.multiple}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, multiple: formatRupiah(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Waktu Berakhir <span className="text-red-500">*</span></label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold"
                                            value={reptileData.end_date}
                                            onChange={(e) => setReptileData(prev => ({ ...prev, end_date: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="h-px bg-zinc-800/50"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="px-1 py-1">
                                        <p className="text-[11px] font-bold text-amber-500/80 italic leading-tight">
                                            * Belum termasuk ongkir &amp; packing.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Opsi Tambahan</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={reptileData.is_free_shipping}
                                                        onChange={(e) => setReptileData(prev => ({ ...prev, is_free_shipping: e.target.checked }))}
                                                    />
                                                    <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                        <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Ongkir</span>
                                                    <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengiriman</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={reptileData.is_free_packing}
                                                        onChange={(e) => setReptileData(prev => ({ ...prev, is_free_packing: e.target.checked }))}
                                                    />
                                                    <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                                                        <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Packing</span>
                                                    <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengemasan</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rich Text Editors */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Deskripsi Produk <span className="text-red-500">*</span></label>
                                <div className="quill-dark-editor">
                                    <ReactQuill
                                        theme="snow"
                                        value={reptileData.description}
                                        onChange={(content) => setReptileData(prev => ({ ...prev, description: content }))}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Tuliskan kondisi kesehatan, karakter, riwayat makan, dan detail lainnya secara lengkap..."
                                        className="bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-1">
                                    <div className="flex items-center gap-2">
                                        <Truck size={14} className="text-emerald-500 shrink-0" />
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest break-words">Kebijakan Pengiriman & Garansi</label>
                                    </div>
                                    <span className="w-fit text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Otomatis dari Profil</span>
                                </div>
                                <div className="p-4 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8"></div>
                                    <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed description-content relative z-10 break-words" dangerouslySetInnerHTML={{ __html: reptileData.shipping_description || '<span className="italic opacity-50">Mengambil data kebijakan dari profil toko Anda...</span>' }}></div>
                                    <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                        <p className="text-[10px] text-zinc-500 font-bold italic leading-relaxed break-words">Kebijakan ini diambil otomatis dari pengaturan toko Anda agar seragam.</p>
                                        <Link href="/user/toko/edit-toko" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0">
                                            Ubah di Profil <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tipe Media Selection (Only for Ikan Category) */}
                        {reptileData.species === "Ikan" && (
                            <div className="space-y-3 bg-zinc-900/40 p-5 border border-zinc-800 rounded-2xl">
                                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">
                                    Tipe Media Produk <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMediaType("image");
                                            setReptileData(prev => ({ ...prev, images: [] }));
                                        }}
                                        className={`py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                                            mediaType === "image"
                                                ? "bg-emerald-500 border-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/10"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Gambar / Foto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMediaType("video");
                                            setReptileData(prev => ({ ...prev, images: [] }));
                                        }}
                                        className={`py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                                            mediaType === "video"
                                                ? "bg-emerald-500 border-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/10"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Video
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image/Video Upload */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                                    {mediaType === "video" ? "Video Produk (Maks 1)" : "Foto Produk (Maks 3)"} <span className="text-red-500">*</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {reptileData.images.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                        {isVideoUrl(img) ? (
                                            <video src={getImageUrl(img)} controls className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={getImageUrl(img)} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        )}
                                        {/* Delete button - always visible on mobile, hover on desktop */}
                                        <div className="absolute top-2 right-2 sm:absolute sm:inset-0 sm:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:flex sm:items-center sm:justify-center sm:backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...reptileData.images];
                                                    newImages.splice(index, 1);
                                                    setReptileData({ ...reptileData, images: newImages });
                                                }}
                                                className="bg-red-500/90 text-white p-2 rounded-xl hover:bg-red-500 transition-all active:scale-90 backdrop-blur-sm sm:bg-red-500 sm:p-2.5 sm:rounded-full"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {mediaType === "video" ? (
                                    // Video Upload Input
                                    reptileData.images.length < 1 && (
                                        isUploading ? (
                                            <div className="aspect-square bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-emerald-500">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Mengunggah...</span>
                                            </div>
                                        ) : (
                                            <label className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer group hover:bg-emerald-500/5">
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/mkv,video/avi,video/quicktime,video/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const raw = e.target.files[0];
                                                        if (!raw) return;
                                                        const isValid = await validateVideoFile(raw, e.target);
                                                        if (!isValid) return;
                                                        const file = renameFileRandom(raw);
                                                        
                                                        const token = localStorage.getItem("token");
                                                        setIsUploading(true);
                                                        try {
                                                            const { objectKey } = await uploadImageToS3(file, token, "listings");
                                                            setReptileData((prev) => ({
                                                                ...prev,
                                                                images: [...prev.images, objectKey],
                                                            }));
                                                        } catch (err) {
                                                            console.error("Upload failed:", err);
                                                            setErrorModalMessage(err.message || "Gagal mengunggah video. Silakan coba lagi.");
                                                            setShowErrorModal(true);
                                                        } finally {
                                                            setIsUploading(false);
                                                            e.target.value = null;
                                                        }
                                                    }}
                                                />
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Video</span>
                                            </label>
                                        )
                                    )
                                ) : (
                                    // Image Upload Input
                                    reptileData.images.length < 3 && (
                                        isUploading ? (
                                            <div className="aspect-square bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-emerald-500">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Mengunggah...</span>
                                            </div>
                                        ) : (
                                            <label className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer group hover:bg-emerald-500/5">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const raw = e.target.files[0];
                                                        if (!validateImageFile(raw, e.target)) return;
                                                        const file = renameFileRandom(raw);
                                                        
                                                        const token = localStorage.getItem("token");
                                                        setIsUploading(true);
                                                        try {
                                                            const { objectKey } = await uploadImageToS3(file, token, "listings");
                                                            setReptileData(prev => ({
                                                                ...prev,
                                                                images: [...prev.images, objectKey]
                                                            }));
                                                        } catch (err) {
                                                            console.error("Upload failed:", err);
                                                            setErrorModalMessage(err.message || "Gagal mengunggah foto. Silakan coba lagi.");
                                                            setShowErrorModal(true);
                                                        } finally {
                                                            setIsUploading(false);
                                                            e.target.value = null;
                                                        }
                                                    }}
                                                />
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Foto</span>
                                            </label>
                                        )
                                    )
                                )}
                            </div>
                            <div className="px-1">
                                {mediaType === "video" ? (
                                    <p className="text-[11px] font-bold text-amber-500/80 italic">
                                        * Durasi video maksimal 15 detik dan ukuran maksimal 20MB (Maks 1 Video).
                                    </p>
                                ) : (
                                    <p className="text-[11px] font-bold text-amber-500/80 italic">
                                        * Ukuran foto maksimal 1MB per file. Pastikan foto jelas dan terang (Maks 3 Foto).
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-800">
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploading || reptileData.images.length === 0}
                                className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale ${listingType === "sell"
                                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                                    : "bg-amber-500 hover:bg-amber-400 text-zinc-950"}`}
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
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center relative z-10 animate-in zoom-in-95 duration-300">
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
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all active:scale-95"
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
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center relative z-10 animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                                <CheckCircle2 size={48} className="relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-3">Berhasil!</h3>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Perubahan iklan Anda telah berhasil disimpan dan sedang menunggu <span className="text-emerald-500 font-bold">verifikasi ulang</span> oleh admin.
                            </p>
                            <button
                                onClick={() => router.push("/user/toko/daftar-produk")}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all"
                            >
                                Kembali ke Daftar Iklan
                            </button>
                        </div>
                    </div>
                )}

                    {/* Error Modal */}
                    {showErrorModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowErrorModal(false)}></div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-12 text-center relative z-10 animate-in zoom-in-95 duration-300">
                                <div className="w-24 h-24 bg-red-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <AlertCircle size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4">File Tidak Valid!</h3>
                                <p className="text-zinc-400 mb-10 leading-relaxed font-medium">
                                    {errorModalMessage}
                                </p>
                                <button onClick={() => setShowErrorModal(false)} className="w-full bg-red-500 hover:bg-red-400 text-zinc-950 font-black py-4 rounded-2xl transition-all">
                                    Saya Mengerti
                                </button>
                            </div>
                        </div>
                    )}


                <style jsx global>{`
                .quill-dark-editor .ql-toolbar {
                    background-color: #09090b !important;
                    border-color: #18181b !important;
                    border-top-left-radius: 1rem;
                    border-top-right-radius: 1rem;
                }
                .quill-dark-editor .ql-container {
                    border-color: #18181b !important;
                    border-bottom-left-radius: 1rem;
                    border-bottom-right-radius: 1rem;
                    min-height: 180px;
                    font-size: 0.875rem;
                }
                .quill-dark-editor .ql-editor.ql-blank::before { color: #52525b !important; font-style: normal; }
                .quill-dark-editor .ql-snow .ql-stroke { stroke: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-fill { fill: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-picker { color: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-picker-options { background-color: #09090b !important; border-color: #18181b !important; }
                
                .description-content ul, .ql-editor ul {
                    list-style-type: disc !important;
                    list-style-position: outside !important;
                    padding-left: 1.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content ol, .ql-editor ol {
                    list-style-type: decimal !important;
                    list-style-position: outside !important;
                    padding-left: 1.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content li, .ql-editor li {
                    display: list-item !important;
                    margin-bottom: 0.5rem !important;
                    color: inherit !important;
                }
                .description-content li p, .ql-editor li p {
                    display: inline !important;
                }
            `}</style>
            </div>
        </div>
    );
}
