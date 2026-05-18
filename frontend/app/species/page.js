"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";

export default function SpeciesListing() {
    const [speciesData, setSpeciesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("Semua");

    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`);
                const data = await response.json();
                if (response.ok) {
                    setSpeciesData(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch species:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSpecies();
    }, []);

    const filters = [
        { id: "Semua", label: "Semua" },
        { id: "Ular", label: "Ular" },
        { id: "Kadal", label: "Kadal" },
        { id: "Tokek/Gecko", label: "Gecko" },
        { id: "Kura-kura", label: "Kura-kura" }
    ];

    const filteredSpecies = speciesData.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "Semua" || item.category === activeFilter;
        return matchesSearch && matchesFilter;
    });


    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <Navbar theme="light" />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
                {/* Header Section */}
                <div className="text-center space-y-4 mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">
                        Eksplorasi <span className="text-emerald-600">Spesies</span>
                    </h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
                        Temukan informasi lengkap mengenai berbagai jenis reptil dari seluruh penjuru dunia, mulai dari karakteristik hingga cara perawatannya.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <input
                            type="text"
                            placeholder="Cari nama spesies atau nama ilmiah..."
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 pl-14 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">🔍</span>
                    </div>

                    <div className="relative w-full md:w-auto">
                        <select
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            className="w-full md:w-auto bg-white border border-zinc-200 rounded-2xl px-6 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-zinc-700 cursor-pointer pr-12"
                        >
                            {filters.map(filter => (
                                <option key={filter.id} value={filter.id}>
                                    {filter.label}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Grid Listing */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 animate-pulse">
                                <div className="aspect-4/5 bg-zinc-100" />
                                <div className="p-6 space-y-3">
                                    <div className="h-2 w-20 bg-zinc-100 rounded" />
                                    <div className="h-4 w-40 bg-zinc-100 rounded" />
                                    <div className="h-2 w-32 bg-zinc-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredSpecies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {filteredSpecies.map((species) => (
                            <Link
                                href={`/species/${species.slug}`}
                                key={species.id}
                                className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 hover:-translate-y-2 transition-all duration-300"
                            >
                                <div className="relative aspect-4/5 overflow-hidden">
                                    <img
                                        src={species.image ? (species.image.startsWith('http') ? species.image : (species.image.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL}${species.image}` : species.image)) : "/images/snakes.png"}
                                        alt={species.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 select-none pointer-events-none"
                                        draggable={false}
                                        onContextMenu={(e) => e.preventDefault()}
                                        onDragStart={(e) => e.preventDefault()}
                                    />

                                    <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-6 space-y-2">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                        {species.category}
                                    </p>
                                    <h3 className="text-xl font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">{species.name}</h3>
                                    <p className="text-sm italic text-zinc-400 font-medium">{species.scientificName}</p>
                                    <p className="text-sm text-zinc-500 line-clamp-2 pt-2 leading-relaxed">
                                        {species.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                        <span className="text-6xl block mb-6">🦎</span>
                        <h3 className="text-xl font-bold text-zinc-900">Spesies tidak ditemukan</h3>
                        <p className="text-zinc-500">Coba gunakan kata kunci pencarian yang lain.</p>
                    </div>
                )}

            </main>

        </div>
    );
}

