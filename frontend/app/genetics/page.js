"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function GeneticsListing() {
    const [speciesList, setSpeciesList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGeneticsData = async () => {
            setIsLoading(true);
            try {
                // Fetch species and their morph counts
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`);
                const data = await response.json();

                if (response.ok) {
                    // For each species, fetch its morph groups to get count
                    const enrichedSpecies = await Promise.all(data.data.map(async (s) => {
                        const mRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups?species_id=${s.id}`);
                        const mData = await mRes.json();
                        const totalMorphs = mData.data.reduce((acc, g) => acc + (g.items?.length || 0), 0);
                        return { ...s, totalMorphs };
                    }));

                    // Filter only those with morphs
                    setSpeciesList(enrichedSpecies.filter(s => s.totalMorphs > 0));
                }
            } catch (err) {
                console.error("Failed to fetch genetics data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGeneticsData();
    }, []);


    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <Navbar theme="light" />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
                {/* Header Section */}
                <div className="text-center space-y-4 mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">
                        Database <span className="text-emerald-600">Genetik & Morph</span>
                    </h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
                        Jelajahi keanekaragaman genetik dan mutasi warna (morph) dari berbagai spesies reptil populer di seluruh dunia.
                    </p>
                </div>

                {/* Grid Listing */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-zinc-100" />
                        ))}
                    </div>
                ) : speciesList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {speciesList.map((species) => {
                            const totalMorphs = species.totalMorphs;
                            const imageSrc = species.image ? (species.image.startsWith('http') ? species.image : (species.image.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL}${species.image}` : species.image)) : "/images/snakes.png";


                            return (
                                <Link
                                    href={`/species/${species.slug}/morphs`}
                                    key={species.id}
                                    className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 hover:-translate-y-2 transition-all duration-300 relative"
                                >
                                    <div className="relative aspect-video overflow-hidden">
                                        <img
                                            src={imageSrc}
                                            alt={species.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">{species.category}</p>
                                            <h3 className="text-2xl font-black">{species.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm italic text-zinc-500 font-medium pb-2 border-b border-zinc-100">{species.scientificName}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">🧬</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Mutasi</p>
                                                    <p className="text-lg font-black text-emerald-600">{totalMorphs} Morph</p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                →
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                        <span className="text-6xl block mb-6">🧬</span>
                        <h3 className="text-xl font-bold text-zinc-900">Belum ada data genetik</h3>
                        <p className="text-zinc-500">Saat ini belum ada data morph spesifik untuk spesies manapun.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

