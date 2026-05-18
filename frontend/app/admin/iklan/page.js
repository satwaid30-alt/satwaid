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
        "Toko"
    ];

    // Form states
    const [formData, setFormData] = useState({
        placement: "Beranda",
        description: "",
        link_url: "",
        image_url: "",
        status: "Aktif"
    });
    const [previewImage, setPreviewImage] = useState(null);

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
                description: ad.description || "",
                link_url: ad.link_url || "",
                image_url: ad.image_url,
                status: ad.status
            });
            setPreviewImage(`${process.env.NEXT_PUBLIC_API_URL}${ad.image_url}`);
        } else {
            setEditingAd(null);
            setFormData({
                placement: "Beranda",
                description: "",
                link_url: "",
                image_url: "",
                status: "Aktif"
            });
            setPreviewImage(null);
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
        <div className="space-y-8 relative">
            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${
                    notification.type === "success" ? "bg-emerald-500 text-zinc-950" : "bg-rose-500 text-white"}`}>
                    {notification.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold">{notification.message}</p>
                    <button onClick={() => setNotification({ ...notification, show: false })} className="ml-4 opacity-70 hover:opacity-100">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2rem] p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Hapus Iklan?</h2>
                        <p className="text-zinc-500 font-medium mb-8">Tindakan ini tidak dapat dibatalkan. Iklan akan dihapus secara permanen.</p>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setDeleteConfirm({ show: false, id: null })}
                                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="flex-1 py-4 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-500/20"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Megaphone className="text-emerald-500" size={32} />
                        Kelola Iklan
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1">Kelola banner promosi dan sponsorship berdasarkan halaman website.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Tambah Iklan Baru
                </button>
            </div>

            {/* Ads Grid */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 animate-pulse">Memuat data iklan...</p>
                </div>
            ) : ads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {ads.map((ad) => (
                        <div key={ad.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col">
                            {/* Image Preview */}
                            <div className="h-48 relative overflow-hidden bg-zinc-800">
                                <img 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${ad.image_url}`} 
                                    alt={ad.placement} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            ad.status === 'Aktif' 
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                                            : 'bg-zinc-500/10 border-zinc-500/50 text-zinc-500'}`}>
                                        {ad.status}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layout size={14} className="text-emerald-500" />
                                    <h3 className="text-lg font-bold text-white truncate">Halaman {ad.placement}</h3>
                                </div>
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{ad.description || `Tidak ada deskripsi`}</p>
                                
                                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6 bg-zinc-800/50 p-2 rounded-lg truncate">
                                    <LinkIcon size={14} className="shrink-0 text-emerald-500" />
                                    <span className="truncate">{ad.link_url || "Tanpa Link"}</span>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                                    <button 
                                        onClick={() => handleOpenModal(ad)}
                                        className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => confirmDelete(ad.id)}
                                        className="w-12 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                    <Megaphone size={48} className="mx-auto text-zinc-800 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-500">Belum ada iklan</h3>
                    <p className="text-zinc-600 mt-2">Mulai tambahkan banner iklan pertama Anda.</p>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingAd ? "Edit Iklan" : "Tambah Iklan Baru"}</h2>
                                <p className="text-sm text-zinc-500 mt-1 font-medium">Lengkapi detail iklan di bawah ini.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Placement */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Penempatan Iklan <Layout size={12} />
                                    </label>
                                    <select 
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                                        value={formData.placement}
                                        onChange={(e) => setFormData({...formData, placement: e.target.value})}
                                    >
                                        {PLACEMENT_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Status</label>
                                    <select 
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Link URL */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Link Tujuan <LinkIcon size={12} />
                                </label>
                                <input 
                                    type="url" 
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="https://toko-anda.com"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                                <textarea 
                                    rows="3"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="Jelaskan isi promosi Anda..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Banner Iklan <ImageIcon size={12} />
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
                                        className={`w-full aspect-[21/9] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                                            previewImage ? 'border-emerald-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}
                                    >
                                        {previewImage ? (
                                            <>
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                    <ImageIcon className="text-white" size={32} />
                                                    <span className="text-white font-bold text-sm">Ganti Gambar</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-8">
                                                <ImageIcon className="mx-auto text-zinc-700 mb-3" size={40} />
                                                <p className="text-zinc-500 font-bold text-sm">Klik untuk unggah banner</p>
                                                <p className="text-zinc-600 text-xs mt-1">Saran ukuran: 1200 x 500 px</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {editingAd ? "Simpan Perubahan" : `Terbitkan Iklan`}
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

