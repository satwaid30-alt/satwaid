"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, XCircle, Clock, Search, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AdminKomunitasPage() {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Pending"); // 'Pending' or 'Aktif' or 'Ditolak'
    
    // Modal states
    const [statusModal, setStatusModal] = useState({ isOpen: false, topicId: null, newStatus: '', rejectionReason: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, topicId: null });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`);
            const data = await res.json();
            if (res.ok) {
                setTopics(data.data);
            }
        } catch (err) {
            console.error("Error fetching topics:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const promptUpdateStatus = (id, newStatus) => {
        setStatusModal({ isOpen: true, topicId: id, newStatus, rejectionReason: '' });
    };

    const executeUpdateStatus = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem("admin_token");
            const bodyData = { status: statusModal.newStatus };
            if (statusModal.newStatus === 'Ditolak') {
                bodyData.rejection_reason = statusModal.rejectionReason;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/${statusModal.topicId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                fetchTopics();
                setStatusModal({ isOpen: false, topicId: null, newStatus: '', rejectionReason: '' });
            }
        } catch (err) {
            console.error("Error updating topic:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const promptDelete = (id) => {
        setDeleteModal({ isOpen: true, topicId: id });
    };

    const executeDelete = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics/${deleteModal.topicId}`, { 
                method: "DELETE",
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (res.ok) {
                alert("Topik berhasil dihapus permanen");
                fetchTopics();
                setDeleteModal({ isOpen: false, topicId: null });
            } else {
                const data = await res.json();
                alert("Gagal menghapus topik: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Error deleting topic:", err);
            alert("Terjadi kesalahan koneksi saat menghapus topik.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredTopics = topics.filter(t => t.status === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Verifikasi Komunitas</h1>
                    <p className="text-sm text-zinc-400 mt-1">Kelola dan verifikasi topik diskusi yang dibuat oleh pengguna.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 pb-px">
                <button 
                    onClick={() => setActiveTab("Pending")}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'Pending' ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Clock size={16} /> Menunggu Verifikasi ({topics.filter(t => t.status === 'Pending').length})
                </button>
                <button 
                    onClick={() => setActiveTab("Aktif")}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'Aktif' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    <CheckCircle size={16} /> Disetujui ({topics.filter(t => t.status === 'Aktif').length})
                </button>
                <button 
                    onClick={() => setActiveTab("Ditolak")}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'Ditolak' ? 'border-red-500 text-red-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    <XCircle size={16} /> Ditolak ({topics.filter(t => t.status === 'Ditolak').length})
                </button>
            </div>

            {/* Content */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-950/50 text-zinc-500 font-bold border-b border-zinc-800 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Penulis</th>
                                <th className="px-6 py-4">Topik & Kategori</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredTopics.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-500">
                                            <MessageSquare size={32} className="mb-3 opacity-50" />
                                            <p>Tidak ada topik dalam kategori ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTopics.map(topic => (
                                    <tr key={topic.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-500 shrink-0 overflow-hidden">
                                                    {topic.author?.avatar_url ? (
                                                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${topic.author.avatar_url}`} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        topic.author?.username?.charAt(0).toUpperCase() || 'U'
                                                    )}
                                                </div>
                                                <div className="font-bold text-white">@{topic.author?.username || 'Unknown'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-4 max-w-sm sm:max-w-xl whitespace-normal">
                                                {topic.image && (
                                                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-zinc-800">
                                                        <img src={topic.image.startsWith('http') ? topic.image : `${process.env.NEXT_PUBLIC_API_URL}${topic.image}`} alt={topic.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="font-bold text-white line-clamp-1" title={topic.title}>{topic.title}</div>
                                                    <p className="text-xs text-zinc-400 mt-1 mb-2 line-clamp-2 leading-relaxed" title={topic.description}>{topic.description}</p>
                                                    <div className="text-[10px] font-bold text-zinc-400 bg-zinc-800 inline-block px-2 py-0.5 rounded uppercase tracking-wider">{topic.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 font-medium">
                                            {new Date(topic.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Action Buttons based on tab */}
                                                {activeTab === 'Pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => promptUpdateStatus(topic.id, 'Aktif')}
                                                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                        >
                                                            <CheckCircle size={14} /> Setujui
                                                        </button>
                                                        <button 
                                                            onClick={() => promptUpdateStatus(topic.id, 'Ditolak')}
                                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                        >
                                                            <XCircle size={14} /> Tolak
                                                        </button>
                                                    </>
                                                )}
                                                {activeTab !== 'Pending' && (
                                                    <button 
                                                        onClick={() => promptUpdateStatus(topic.id, 'Pending')}
                                                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                    >
                                                        <Clock size={14} /> Tinjau Ulang
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => promptDelete(topic.id)}
                                                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-colors ml-2"
                                                    title="Hapus Permanen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Update Confirmation Modal */}
            {statusModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${statusModal.newStatus === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500' : statusModal.newStatus === 'Ditolak' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-400'}`}>
                                {statusModal.newStatus === 'Aktif' ? <CheckCircle size={32} /> : statusModal.newStatus === 'Ditolak' ? <XCircle size={32} /> : <Clock size={32} />}
                            </div>
                            <div className="space-y-2 w-full">
                                <h3 className="text-xl font-bold text-white">Konfirmasi Verifikasi</h3>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    Apakah Anda yakin ingin mengubah status topik ini menjadi <span className={`font-bold ${statusModal.newStatus === 'Aktif' ? 'text-emerald-500' : statusModal.newStatus === 'Ditolak' ? 'text-red-500' : 'text-amber-500'}`}>{statusModal.newStatus === 'Aktif' ? 'Disetujui' : statusModal.newStatus === 'Ditolak' ? 'Ditolak' : 'Menunggu Verifikasi'}</span>?
                                </p>
                                
                                {statusModal.newStatus === 'Ditolak' && (
                                    <div className="mt-4 text-left w-full">
                                        <label className="block text-xs font-bold text-zinc-400 mb-2">Alasan Penolakan (Opsional)</label>
                                        <textarea 
                                            value={statusModal.rejectionReason}
                                            onChange={(e) => setStatusModal({ ...statusModal, rejectionReason: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors resize-none text-sm"
                                            placeholder="Tuliskan alasan mengapa topik ini ditolak..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex gap-3">
                            <button 
                                onClick={() => setStatusModal({ isOpen: false, topicId: null, newStatus: '', rejectionReason: '' })}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeUpdateStatus}
                                disabled={isProcessing}
                                className={`flex-1 px-4 py-2.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${statusModal.newStatus === 'Aktif' ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' : statusModal.newStatus === 'Ditolak' ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isProcessing ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Ya, Ubah"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/10">
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0">
                                <Trash2 size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Hapus Topik</h3>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    Apakah Anda yakin ingin menghapus topik ini secara permanen? Aksi ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex gap-3">
                            <button 
                                onClick={() => setDeleteModal({ isOpen: false, topicId: null })}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeDelete}
                                disabled={isProcessing}
                                className={`flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isProcessing ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Hapus"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

