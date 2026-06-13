"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ImageIcon, Save } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

export default function EditKomunitasPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

    const [formData, setFormData] = useState({
        title: "",
        category: "Diskusi Umum",
        description: "",
        date: "",
        image: ""
    });

    useEffect(() => {
        if (id) fetchTopic(id);
    }, [id]);

    const fetchTopic = async (topicId) => {
        try {
            const res = await fetch(`${getApiUrl()}/topics`);
            const data = await res.json();
            if (res.ok) {
                const topic = data.data.find(t => t.id === topicId);
                if (topic) {
                    setFormData({
                        title: topic.title,
                        category: topic.category,
                        description: topic.description,
                        date: new Date(topic.date).toISOString().split('T')[0],
                        image: topic.image || ""
                    });
                    if (topic.image) {
                        setSelectedImage(getImageUrl(topic.image));
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching topic:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Validasi File Extension & MIME Type
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

        // Blokir ekstensi berbahaya: .php, .exe, .svg
        // Serta memblokir PDF dan semua dokumen Office (.doc, .docx, .xls, .xlsx, .ppt, .pptx)
        const blockedExtensions = ['.php', '.exe', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        const isBlockedExtension = blockedExtensions.some(ext => fileName.endsWith(ext));

        // Blokir PDF dan Office MIME types
        const isOfficeOrPdfMime = file.type === 'application/pdf' || 
            file.type.startsWith('application/msword') || 
            file.type.startsWith('application/vnd.ms-') || 
            file.type.startsWith('application/vnd.openxmlformats-officedocument');

        // Validasi kebolehan MIME tipe dan ekstensi gambar
        const isAllowedMime = allowedMimeTypes.includes(file.type);
        const isAllowedExtension = allowedExtensions.includes(fileExtension);

        if (isBlockedExtension || isOfficeOrPdfMime || !isAllowedMime || !isAllowedExtension) {
            setErrorModal({ 
                isOpen: true, 
                message: "Format file tidak didukung! Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF). File PDF, dokumen Office, SVG, PHP, atau EXE tidak diizinkan." 
            });
            e.target.value = ""; // Reset input file
            return;
        }

        // 2. Validasi ukuran maksimal 1MB (1 * 1024 * 1024 bytes)
        if (file.size > 1 * 1024 * 1024) {
            setErrorModal({ isOpen: true, message: "Maaf, ukuran gambar terlalu besar! Maksimal ukuran file adalah 1MB." });
            e.target.value = ""; // Reset input file
            return;
        }

        // 3. Rename file secara acak (random) untuk keamanan tambahan
        const randomString = Math.random().toString(36).substring(2, 15);
        const randomFilename = `${Date.now()}_${randomString}${fileExtension}`;
        const renamedFile = new File([file], randomFilename, { type: file.type });

        setSelectedImage(URL.createObjectURL(renamedFile));

        try {
            const token = localStorage.getItem("token");
            const { objectKey } = await uploadImageToS3(renamedFile, token, "listings");
            setFormData({ ...formData, image: `/${objectKey}` });
        } catch (err) {
            console.error("Upload error:", err);
            setErrorModal({ isOpen: true, message: err.message || "Gagal mengunggah gambar." });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem("token");

        try {
            // Ketika user mengedit topik, otomatis status dikembalikan ke 'Pending' untuk di-review ulang
            const payload = { ...formData, status: "Pending", rejection_reason: null };

            const res = await fetch(`${getApiUrl()}/topics/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push("/user/komunitas");
            } else {
                const data = await res.json();
                setErrorModal({ isOpen: true, message: data.message || "Gagal mengupdate topik." });
            }
        } catch (err) {
            console.error("Submit error:", err);
            setErrorModal({ isOpen: true, message: "Terjadi kesalahan sistem. Silakan coba lagi." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 mt-4 animate-pulse">Memuat data topik...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/user/komunitas" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors border border-zinc-800">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white">Edit Topik</h1>
                    <p className="text-sm text-zinc-400 mt-1">Perbarui informasi dan isi diskusi Anda.</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-300">Judul Topik</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Contoh: Cara merawat Leopard Gecko yang mogok makan"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-300">Kategori Topik</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                        <option value="Diskusi Umum">Diskusi Umum</option>
                        <option value="Kesehatan/Penyakit">Kesehatan/Penyakit</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-300">Isi / Deskripsi Topik</label>
                    <textarea
                        required
                        rows="8"
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
                                <span className="truncate flex-1">{selectedImage ? "Ubah Gambar" : "Pilih Gambar..."}</span>
                            </label>
                             <p className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1.5">
                                 <span className="text-amber-500 text-sm">⚠️</span> Maksimal ukuran file: 1MB
                             </p>
                            {selectedImage && (
                                <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-zinc-800">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
                    <Link href="/user/komunitas" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                        Batal
                    </Link>
                    <button type="submit" disabled={isSubmitting} className={`px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}>
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <><Save size={18} /> Simpan Perubahan</>
                        )}
                    </button>
                </div>
            </form>

            {/* Modal Error */}
            {errorModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden">
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
