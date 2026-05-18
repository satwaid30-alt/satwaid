"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Dna,
    Filter,
    Loader2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MorphGroupsAdminPage() {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [speciesFilter, setSpeciesFilter] = useState("Semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups`);
            const data = await response.json();
            if (response.ok) {
                setGroups(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch morph groups:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Hapus grup morfologi "${name}"?`)) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups/${id}`, {
                method: "DELETE",
            });
            if (response.ok) fetchGroups();
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const filteredGroups = groups.filter(g =>
        (speciesFilter === "Semua" || g.species?.name === speciesFilter) &&
        (g.group_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

    // Reset to first page when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, speciesFilter]);

    const speciesOptions = ["Semua", ...new Set(groups.map(g => g.species?.name).filter(Boolean))];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Grup <span className="text-emerald-500">Morfologi</span></h1>
                    <p className="text-zinc-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Kelola data variasi genetik per kategori</p>
                </div>
                <Link
                    href="/admin/morph-groups/new"
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-4 rounded-2xl flex items-center gap-3 font-black transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Tambah Grup Baru
                </Link>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6 mb-10">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama grup..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 pl-16 pr-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-600"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-800/30 p-2 rounded-2xl border border-zinc-700/30">
                        <Filter className="ml-4 text-zinc-500" size={18} />
                        <select
                            value={speciesFilter}
                            onChange={(e) => setSpeciesFilter(e.target.value)}
                            className="bg-transparent text-white font-bold px-4 py-2 focus:outline-none cursor-pointer appearance-none pr-8"
                        >
                            {speciesOptions.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Kategori</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Nama Grup</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Jumlah Morf</th>
                                <th className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(4)].map((_, j) => (
                                            <td key={j} className="px-8 py-6"><div className="h-4 bg-zinc-800 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedGroups.length > 0 ? (
                                paginatedGroups.map((g) => (
                                    <tr key={g.id} className="group hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                {g.species?.name || "Spesies Dihapus"}
                                            </span>
                                        </td>

                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-800 text-zinc-500 rounded-xl flex items-center justify-center">
                                                    <Dna size={18} />
                                                </div>
                                                <p className="font-bold text-lg text-white">{g.group_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-zinc-400 font-bold">{g.items?.length || 0} Variasi</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/morph-groups/edit/${g.id}`}
                                                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(g.id, g.group_name)}
                                                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all text-zinc-400 border border-zinc-700/50"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <p className="text-zinc-500 font-bold">Belum ada grup morfologi.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-10 gap-6">
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                            Menampilkan <span className="text-white">{indexOfFirstItem + 1}</span> - <span className="text-white">{Math.min(indexOfLastItem, filteredGroups.length)}</span> dari <span className="text-emerald-500">{filteredGroups.length}</span> Grup
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 disabled:opacity-20 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 transition-all shadow-lg"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-2xl border border-zinc-700/30">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                                                ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-700"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 disabled:opacity-20 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 transition-all shadow-lg"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

