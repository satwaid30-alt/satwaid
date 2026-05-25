"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, Edit2, ExternalLink, Image as ImageIcon, Link as LinkIcon, Save, X, CheckCircle, AlertCircle, Layout, ArrowRight } from "lucide-react";

export default function ManageAds() {
    const [ads, setAds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Notification states
    const [notification, setNotification] = useState({ show: false, type: "success", message: "" });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

    const PLACEMENT_OPTIONS = [
        "Beranda",
        "Spesies",
        "Genetik & Morph",
        "Komunitas",
        "Toko",
        "Lelang"
    ];

    const SHOP_CATEGORIES = [
        "Semua Kategori",
        "Reptil",
        "Mamalia",
        "Burung",
        "Ikan",
        "Amfibi",
        "Serangga",
        "Invertebrata Lainnya",
        "Unggas",
        "Hewan Lainnya",
        "Pakan Hewan",
        "Perlengkapan & Aksesoris"
    ];

    // Form states
    const [formData, setFormData] = useState({
        placement: "Beranda",
        category: "Semua Kategori",
        title: "",
        badge: "",
        button_text: "",
        description: "",
        link_url: "",
        image_url: "",
        mobile_image_url: "",
        status: "Aktif"
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [previewMobileImage, setPreviewMobileImage] = useState(null);

    useEffect(() => {
        fetchAds();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ ...notification, show: false }), 3000);
    };

    const fetchAds = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/advertisements`);
            const data = await res.json();
            if (res.ok) {
                setAds(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch ads", err);
            showNotification("error", "Gagal memuat data iklan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (ad = null) => {
        if (ad) {
            setEditingAd(ad);
            setFormData({
                placement: ad.placement,
                category: ad.category || "Semua Kategori",
                title: ad.title || "",
                badge: ad.badge || "",
                button_text: ad.button_text || "",
                description: ad.description || "",
                link_url: ad.link_url || "",
                image_url: ad.image_url,
                mobile_image_url: ad.mobile_image_url || "",
                status: ad.status
            });
            setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL}${ad.image_url}`);
            setPreviewMobileImage(ad.mobile_image_url ? `${process.env.NEXT_PUBLIC_API_URL}${ad.mobile_image_url}` : null);
        } else {
            setEditingAd(null);
            setFormData({
                placement: "Beranda",
                category: "Semua Kategori",
                title: "",
                badge: "",
                button_text: "",
                description: "",
                link_url: "",
                image_url: "",
                mobile_image_url: "",
                status: "Aktif"
            });
            setPreviewImage(null);
            setPreviewMobileImage(null);
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        const uploadData = new FormData();
        uploadData.append("image", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: uploadData
            });
            const data = await res.json();
            if (res.ok) {
                setFormData(prev => ({ ...prev, image_url: data.url }));
                showNotification("success", "Gambar berhasil diunggah");
            }
        } catch (err) {
            console.error("Upload failed", err);
            showNotification("error", "Gagal mengunggah gambar");
        }
    };

    const handleMobileImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewMobileImage(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        const uploadData = new FormData();
        uploadData.append("image", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: uploadData
            });
            const data = await res.json();
            if (res.ok) {
                setFormData(prev => ({ ...prev, mobile_image_url: data.url }));
                showNotification("success", "Gambar mobile berhasil diunggah");
            }
        } catch (err) {
            console.error("Mobile upload failed", err);
            showNotification("error", "Gagal mengunggah gambar mobile");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image_url) {
            showNotification("error", "Harap unggah gambar iklan");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingAd 
                ? `${process.env.NEXT_PUBLIC_API_URL}/advertisements/${editingAd.id}` 
                : `${process.env.NEXT_PUBLIC_API_URL}/advertisements`;
            const method = editingAd ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchAds();
                showNotification("success", editingAd ? "Iklan berhasil diperbarui" : "Iklan berhasil diterbitkan");
            } else {
                showNotification("error", "Gagal menyimpan iklan");
            }
        } catch (err) {
            console.error("Failed to save ad", err);
            showNotification("error", "Kesalahan sistem saat menyimpan");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (id) => {
        setDeleteConfirm({ show: true, id });
    };

    const handleDelete = async () => {
        const id = deleteConfirm.id;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/advertisements/${id}`, {
                method: "DELETE"});
            if (res.ok) {
                setDeleteConfirm({ show: false, id: null });
                fetchAds();
                showNotification("success", "Iklan berhasil dihapus");
            } else {
                showNotification("error", "Gagal menghapus iklan");
            }
        } catch (err) {
            console.error("Delete failed", err);
            showNotification("error", "Kesalahan sistem saat menghapus");
        }
    };

    return (
        <div className="space-y-8 relative max-w-7xl mx-auto">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 backdrop-blur-md border ${
                    notification.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                    {notification.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-white">{notification.message}</p>
                    <button onClick={() => setNotification({ ...notification, show: false })} className="ml-4 opacity-70 hover:opacity-100 text-white">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-zinc-900/90 border border-zinc-800/50 w-full max-w-md rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full pointer-events-none" />
                        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 relative z-10">Hapus Iklan?</h2>
                        <p className="text-zinc-400 font-medium mb-8 relative z-10">Tindakan ini tidak dapat dibatalkan. Iklan akan dihapus secara permanen.</p>
                        <div className="flex items-center gap-4 relative z-10">
                            <button 
                                onClick={() => setDeleteConfirm({ show: false, id: null })}
                                className="flex-1 py-4 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-bold rounded-2xl transition-all border border-white/5"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-500/20"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] backdrop-blur-md">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Ads Manager
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        Kelola Iklan
                    </h1>
                    <p className="text-zinc-400 font-medium mt-2 max-w-xl">Atur banner promosi, lelang, dan sponsorship untuk berbagai halaman dalam platform.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-6 py-4 bg-white text-zinc-950 font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group w-full md:w-auto"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Tambah Iklan Baru
                </button>
            </div>

            {/* Ads Grid */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center gap-4 relative z-10">
                    <div className="w-14 h-14 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    <p className="text-zinc-400 font-medium animate-pulse mt-2">Memuat data iklan...</p>
                </div>
            ) : ads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                    {ads.map((ad) => (
                        <div key={ad.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-[2rem] overflow-hidden group hover:border-emerald-500/30 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col shadow-xl shadow-black/20 hover:shadow-emerald-500/5 hover:-translate-y-1">
                            {/* Image Preview */}
                            <div className="h-52 relative overflow-hidden bg-zinc-950">
                                <img 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${ad.image_url}`} 
                                    alt={ad.placement} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
                                            ad.status === 'Aktif' 
                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                            : 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400'}`}>
                                        {ad.status === 'Aktif' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                        {ad.status}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 backdrop-blur-md shadow-lg bg-zinc-950/40 border-zinc-800 text-zinc-300`}>
                                        {ad.mobile_image_url ? "Desktop + Mobile" : "Desktop Only"}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col relative">
                                <div className="absolute top-0 right-6 -translate-y-1/2 w-12 h-12 bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl flex items-center justify-center shadow-xl group-hover:border-emerald-500/30 transition-colors">
                                    <Layout size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                </div>

                                <h3 className="text-xl font-black text-white mb-2 pr-14">
                                    {ad.placement}
                                    {ad.placement === "Toko" && ad.category && ad.category !== "Semua Kategori" && (
                                        <span className="block text-xs font-bold text-emerald-500 mt-1">{ad.category}</span>
                                    )}
                                </h3>
                                
                                {ad.title && (
                                    <p className="text-sm font-bold text-zinc-300 mb-1">{ad.title}</p>
                                )}
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1 font-medium">{ad.description || `Tanpa deskripsi`}</p>
                                
                                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6 bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl truncate group-hover:border-zinc-700 transition-colors">
                                    <LinkIcon size={14} className="shrink-0 text-emerald-500" />
                                    <span className="truncate">{ad.link_url || "Tidak ada link tautan"}</span>
                                </div>

                                <div className="flex items-center gap-3 pt-5 border-t border-zinc-800/50">
                                    <button 
                                        onClick={() => handleOpenModal(ad)}
                                        className="flex-1 py-3 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/5 hover:border-white/10"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => confirmDelete(ad.id)}
                                        className="w-[3.25rem] py-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold rounded-xl transition-all flex items-center justify-center border border-rose-500/10 hover:border-rose-500/30"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2.5rem] relative z-10 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-3xl" />
                        <Megaphone size={36} className="text-emerald-500 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white">Belum Ada Iklan</h3>
                    <p className="text-zinc-500 font-medium mt-2 max-w-sm mx-auto">Mulai promosikan konten atau sponsorship dengan menambahkan iklan pertama Anda.</p>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-zinc-900/90 border border-zinc-800/80 w-full max-w-3xl rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                        
                        <div className="p-8 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">{editingAd ? "Edit Iklan" : "Buat Iklan Baru"}</h2>
                                <p className="text-sm text-zinc-400 mt-2 font-medium">Sesuaikan detail iklan agar terlihat sempurna di halaman tujuan.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Placement */}
                                <div className="space-y-2.5">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Penempatan Iklan <Layout size={12} className="text-emerald-500" />
                                    </label>
                                    <select 
                                        required
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer hover:border-zinc-700"
                                        value={formData.placement}
                                        onChange={(e) => setFormData({...formData, placement: e.target.value})}
                                    >
                                        {PLACEMENT_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2.5">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Status Iklan
                                    </label>
                                    <select 
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer hover:border-zinc-700"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Kategori Toko (Dinamis jika placement == Toko) */}
                            {formData.placement === "Toko" && (
                                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Kategori Spesifik Toko
                                    </label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer hover:border-zinc-700"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        >
                                            {SHOP_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="text-white bg-zinc-900">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Detail Carousel Toko (Dinamis jika placement == Toko atau Lelang) */}
                            {(formData.placement === "Toko" || formData.placement === "Lelang") && (
                                <div className="space-y-6 border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-[2rem] animate-in fade-in slide-in-from-top-3 duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
                                    
                                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Konten UI (Badge, Judul, Tombol)
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                                Judul Promo (Title)
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600 hover:border-zinc-700"
                                                placeholder="Diskon Ongkir / Promo Mitra"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                                Badge Label
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600 hover:border-zinc-700"
                                                placeholder="PROMO EKSKLUSIF"
                                                value={formData.badge}
                                                onChange={(e) => setFormData({...formData, badge: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                            Teks Tombol CTA
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600 hover:border-zinc-700"
                                            placeholder="Klaim Promo Sekarang"
                                            value={formData.button_text}
                                            onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Link URL */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Tujuan Klik <LinkIcon size={12} className="text-emerald-500" />
                                </label>
                                <input 
                                    type="url" 
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600 hover:border-zinc-700"
                                    placeholder="https://toko-anda.com atau /toko/nama-toko"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                                <textarea 
                                    rows="3"
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600 hover:border-zinc-700 resize-none custom-scrollbar"
                                    placeholder="Jelaskan isi promosi Anda..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Gambar / Banner Desktop <ImageIcon size={12} className="text-emerald-500" />
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        id="ad-image" 
                                        onChange={handleImageUpload}
                                    />
                                    <label 
                                        htmlFor="ad-image"
                                        className={`w-full aspect-[21/9] md:aspect-[3/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative group hover:bg-zinc-900/50 ${
                                            previewImage ? 'border-emerald-500/50 hover:border-emerald-500' : 'border-zinc-700 hover:border-emerald-500/50 bg-zinc-950/30'}`}
                                    >
                                        {previewImage ? (
                                            <>
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">Ganti Gambar</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-8">
                                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all duration-300">
                                                    <ImageIcon className="text-zinc-600 group-hover:text-emerald-500 transition-colors" size={28} />
                                                </div>
                                                <p className="text-zinc-300 font-bold text-base mb-1">Klik untuk unggah banner desktop</p>
                                                <p className="text-zinc-600 font-medium text-xs">Rekomendasi ukuran: 2400 x 800 px (Rasio 3:1)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Image Upload Mobile */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Gambar / Banner Mobile (Opsional) <ImageIcon size={12} className="text-emerald-500" />
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        id="ad-image-mobile" 
                                        onChange={handleMobileImageUpload}
                                    />
                                    <label 
                                        htmlFor="ad-image-mobile"
                                        className={`w-full aspect-[16/9] md:aspect-[3/1] max-w-md mx-auto rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative group hover:bg-zinc-900/50 ${
                                            previewMobileImage ? 'border-emerald-500/50 hover:border-emerald-500' : 'border-zinc-700 hover:border-emerald-500/50 bg-zinc-950/30'}`}
                                    >
                                        {previewMobileImage ? (
                                            <>
                                                <img src={previewMobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">Ganti Gambar Mobile</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-6">
                                                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all duration-300">
                                                    <ImageIcon className="text-zinc-600 group-hover:text-emerald-500 transition-colors" size={22} />
                                                </div>
                                                <p className="text-zinc-300 font-bold text-sm mb-0.5">Klik untuk unggah banner mobile</p>
                                                <p className="text-zinc-600 font-medium text-[10px]">Rekomendasi ukuran: 800 x 800 px atau 800 x 450 px</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 flex flex-col-reverse md:flex-row items-center gap-4 bg-zinc-900/50 -mx-8 -mb-8 p-8 border-t border-zinc-800/80">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full md:w-auto md:flex-1 py-4 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold rounded-2xl transition-all border border-transparent hover:border-white/10"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full md:w-auto md:flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {editingAd ? "Simpan Perubahan" : `Terbitkan Iklan Sekarang`}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

