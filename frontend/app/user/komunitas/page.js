"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Flame, TrendingUp, Clock, Plus, Filter, Search, Heart, Share2, MoreVertical, Edit, Trash2, X, Image as ImageIcon, Star } from "lucide-react";
import Link from "next/link";

export default function UserKomunitasPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("diskusi_saya");

    const [user, setUser] = useState(null);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "Diskusi Umum",
        description: "",
        date: new Date().toISOString().split('T')[0],
        image: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchTopics(parsedUser.id);
        }
    }, []);

    const fetchTopics = async (userId) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics?user_id=${userId}`);
            const data = await res.json();
            if (res.ok) setTopics(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi ukuran maksimal 500KB (500 * 1024 bytes)
        if (file.size > 500 * 1024) {
            setErrorModal({ isOpen: true, message: "Maaf, ukuran gambar terlalu besar! Maksimal ukuran file adalah 500KB." });
            e.target.value = ""; // Reset input file
            return;
        }

        setSelectedImage(URL.createObjectURL(file));

        const formDataObj = new FormData();
        formDataObj.append("image", file);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formDataObj
            });
            const data = await res.json();
            if (res.ok) {
                setFormData({ ...formData, image: data.url });
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    user_id: user.id
                })
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchTopics(user.id);
                setFormData({ title: "", category: "Diskusi Umum", description: "", date: new Date().toISOString().split('T')[0], image: "" });
                setSelectedImage(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus topik ini?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchTopics(user.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Dummy data
    const myTopics = [
        {
            id: 1,
            title: "Pertolongan Pertama Leopard Gecko Drop Tail",
            category: "Kesehatan Reptil",
            replies: 12,
            likes: 45,
            status: "Aktif",
            lastActivity: "2 hari yang lalu"
        },
        {
            id: 2,
            title: "Setup Terrarium Bioactive untuk Crested Gecko",
            category: "Diskusi Umum",
            replies: 34,
            likes: 120,
            status: "Aktif",
            lastActivity: "1 minggu yang lalu"
        }
    ];

    const savedTopics = [
        {
            id: 3,
            title: "Cara mengatasi Ball Python mogok makan (strike feeding) selama musim hujan",
            author: "reptile_master99",
            category: "Kesehatan Reptil",
            replies: 45,
            likes: 128,
            lastActivity: "2 jam yang lalu"
        }
    ];

    // Stats calculations
    const topicsCount = topics.length;
    const likesReceived = topics.reduce((sum, topic) => sum + (topic.likes || 0), 0);
    const reputationPoints = likesReceived * 100;

    // Hitung bintang berdasarkan poin reputasi (kelipatan 3000), maksimal 5
    const calculatedStars = Math.floor(reputationPoints / 3000);
    const starsCount = Math.min(calculatedStars, 5);

    return (
        <div className="space-y-6 ">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Komunitas Saya</h1>
                    <p className="text-sm text-zinc-400 mt-1">Kelola diskusi, komentar, dan aktivitas komunitas Anda.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all"
                >
                    <Plus size={18} />
                    Buat Topik Baru
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <MessageSquare size={14} className="sm:w-[24px] sm:h-[24px]" />
                    </div>
                    <div className="min-w-0 w-full">
                        <p className="text-zinc-500 text-[8px] sm:text-xs font-bold uppercase tracking-wider mb-0 sm:mb-1 truncate">Topik</p>
                        <p className="text-sm sm:text-2xl font-black text-white truncate">{topicsCount.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Heart size={14} className="sm:w-[24px] sm:h-[24px]" />
                    </div>
                    <div className="min-w-0 w-full">
                        <p className="text-zinc-500 text-[8px] sm:text-xs font-bold uppercase tracking-wider mb-0 sm:mb-1 truncate">Suka</p>
                        <p className="text-sm sm:text-2xl font-black text-white truncate">{likesReceived.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-2 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Flame size={14} className="sm:w-[24px] sm:h-[24px]" />
                    </div>
                    <div className="min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-0 sm:mb-1 gap-1">
                            <p className="text-zinc-500 text-[8px] sm:text-xs font-bold uppercase tracking-wider truncate">Reputasi</p>
                            {starsCount > 0 && (
                                <div className="flex text-amber-400 gap-0.5 justify-center sm:justify-end" title={`${calculatedStars} Total Bintang Didapatkan`}>
                                    {Array.from({ length: starsCount }).map((_, i) => (
                                        <Star key={i} size={8} className="fill-current sm:w-[14px] sm:h-[14px]" />
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm sm:text-2xl font-black text-white truncate">{reputationPoints.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col ">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-b border-zinc-800">
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab("diskusi_saya")}
                            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'diskusi_saya' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                        >
                            <MessageSquare size={16} /> Diskusi Saya
                        </button>
                        <button
                            onClick={() => setActiveTab("disimpan")}
                            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'disimpan' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                        >
                            <Heart size={16} /> Disimpan
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Cari topik..."
                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4">
                    {activeTab === "diskusi_saya" && (
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-10 text-zinc-500">Memuat topik...</div>
                            ) : topics.length === 0 ? (
                                <div className="text-center py-10 text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800 border-dashed">
                                    Belum ada topik yang Anda buat.
                                </div>
                            ) : (
                                topics.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(topic => (
                                    <div key={topic.id} className="flex flex-col md:flex-row justify-between gap-4 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800/30 transition-all group">
                                        {topic.image && (
                                            <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                                                <img src={topic.image.startsWith('http') ? topic.image : `${process.env.NEXT_PUBLIC_API_URL}${topic.image}`} alt={topic.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                    {topic.category}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${topic.status === 'Aktif' ? 'bg-blue-500/10 text-blue-500' : topic.status === 'Ditolak' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {topic.status === 'Pending' ? 'Menunggu Verifikasi' : topic.status}
                                                </span>
                                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(topic.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                {topic.title}
                                            </h3>
                                            {topic.status === 'Ditolak' && topic.rejection_reason && (
                                                <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                                    <p className="text-xs font-bold text-red-400 mb-1">Alasan Penolakan:</p>
                                                    <p className="text-xs text-red-200">{topic.rejection_reason}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 pt-2">
                                                <span className="flex items-center gap-1"><MessageSquare size={14} /> {topic.replies} Balasan</span>
                                                <span className="flex items-center gap-1"><Heart size={14} /> {topic.likes} Suka</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 md:border-l md:border-zinc-800 md:pl-4 shrink-0">
                                            <Link
                                                href={'/user/komunitas/edit/' + topic.id}
                                                className="px-3 py-1.5 text-zinc-400 hover:text-amber-500 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 flex items-center gap-2"
                                                title="Edit Topik"
                                            >
                                                <Edit size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                                            </Link>
                                            <Link
                                                href={'/komunitas/' + topic.id}
                                                className="px-3 py-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 flex items-center gap-2"
                                                title="Lihat Diskusi"
                                            >
                                                <Search size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Diskusi</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(topic.id)}
                                                className="px-3 py-1.5 text-zinc-400 hover:text-red-500 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 flex items-center gap-2"
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "disimpan" && (
                        <div className="space-y-3">
                            {savedTopics.map(topic => (
                                <div key={topic.id} className="flex flex-col md:flex-row justify-between gap-4 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800/30 transition-all group">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                                            <span className="font-bold text-zinc-400">@{topic.author}</span>
                                            <span>•</span>
                                            <span>{topic.lastActivity}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                            {topic.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 pt-1">
                                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded uppercase tracking-wider">
                                                {topic.category}
                                            </span>
                                            <span className="flex items-center gap-1"><MessageSquare size={14} /> {topic.replies}</span>
                                            <span className="flex items-center gap-1"><Heart size={14} /> {topic.likes}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 md:border-l md:border-zinc-800 md:pl-4">
                                        <Link href={'/komunitas/' + topic.id} className="px-3 py-1.5 text-xs font-bold text-zinc-900 hover:text-white bg-emerald-500 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700">
                                            Baca Topik
                                        </Link>
                                        <button className="p-2 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors border border-transparent" title="Hapus dari Disimpan">
                                            <Heart size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Buat Topik */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl my-auto">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h3 className="text-xl font-bold text-white">Buat Topik Baru</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-300">Judul Topik</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Masukkan judul diskusi..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-300">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                    >
                                        <option value="Diskusi Umum">Diskusi Umum</option>
                                        <option value="Kesehatan/Penyakit">Kesehatan/Penyakit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-300">Isi / Deskripsi Topik</label>
                                <textarea
                                    required
                                    rows="5"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                    placeholder="Tuliskan isi diskusi Anda secara detail..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-300">Tanggal Topik</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-300">Gambar Pendukung (Opsional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="topicImage"
                                        />
                                        <label htmlFor="topicImage" className="flex items-center gap-3 w-full bg-zinc-950 border border-zinc-800 hover:border-emerald-500 text-zinc-400 rounded-xl px-4 py-3 cursor-pointer transition-colors group">
                                            <ImageIcon size={20} className="group-hover:text-emerald-500 transition-colors" />
                                            <span className="truncate flex-1">{selectedImage ? "Gambar Dipilih" : "Pilih Gambar..."}</span>
                                        </label>
                                        <p className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1.5">
                                            <span className="text-amber-500 text-sm">⚠️</span> Maksimal ukuran file: 500KB
                                        </p>
                                        {selectedImage && (
                                            <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-zinc-800">
                                                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-zinc-800 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className={'px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors flex items-center gap-2 ' + (isSubmitting ? 'opacity-70 cursor-not-allowed' : '')}>
                                    {isSubmitting ? "Menyimpan..." : "Posting Topik"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Error */}
            {errorModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/10">
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Gagal Mengunggah</h3>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    {errorModal.message}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-center">
                            <button
                                onClick={() => setErrorModal({ isOpen: false, message: "" })}
                                className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

