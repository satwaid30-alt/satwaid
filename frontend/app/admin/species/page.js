"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreVertical,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";



export default function SpeciesAdminPage() {
    const [species, setSpecies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchSpecies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`);
            const data = await response.json();
            if (response.ok) {
                setSpecies(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch species:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecies();
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus spesies "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                // Refresh list
                fetchSpecies();
            } else {
                const data = await response.json();
                alert(`Gagal menghapus: ${data.message}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Terjadi kesalahan saat menghapus data.");
        }
    };

    const filteredSpecies = species.filter(s =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Manajemen Spesies</h1>
                    <p className="text-zinc-500 font-medium">Kelola database reptil, deskripsi, dan morfologi.</p>
                </div>
                <Link
                    href="/admin/species/new"
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Tambah Spesies Baru
                </Link>

            </div>

            {/* Filters & Search */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama atau nama ilmiah..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600"
                    />
                </div>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all border border-zinc-700/50">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Spesies</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Kategori</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Ukuran / Umur</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="text-emerald-500 animate-spin" size={40} />
                                            <p className="text-zinc-500 font-bold">Mengambil data dari server...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSpecies.length > 0 ? (
                                filteredSpecies.map((s) => (
                                    <tr key={s.id} className="hover:bg-zinc-800/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden relative border border-zinc-700 group-hover:border-emerald-500/50 transition-colors bg-zinc-800">
                                                    <img
                                                        src={s.image ? (s.image.startsWith('http') ? s.image : (s.image.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL}${s.image}` : s.image)) : "/images/snakes.png"}
                                                        alt={s.name}
                                                        className="w-full h-full object-cover"
                                                    />


                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-tight">{s.name}</p>
                                                    <p className="text-sm text-zinc-500 italic">{s.scientificName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                                {s.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm">
                                                <p className="font-bold text-zinc-300">{s.size}</p>
                                                <p className="text-zinc-500">{s.lifespan}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-sm font-bold text-emerald-500">Aktif</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/species/edit/${s.slug}`}
                                                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50 shadow-sm active:scale-90"
                                                >
                                                    <Edit size={18} />
                                                </Link>

                                                <button 
                                                    onClick={() => handleDelete(s.id, s.name)}
                                                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50 shadow-sm active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                                <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50 shadow-sm active:scale-90">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-zinc-500 font-bold text-lg">Tidak ada spesies ditemukan.</p>
                                            <p className="text-zinc-600 text-sm">Coba kata kunci lain atau tambahkan spesies baru.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-zinc-500 font-medium">Menampilkan <span className="text-white font-bold">1 - {filteredSpecies.length}</span> dari <span className="text-white font-bold">{species.length}</span> spesies</p>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 font-black flex items-center justify-center transition-all shadow-lg shadow-emerald-500/10">
                            1
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50 font-bold">
                            2
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
