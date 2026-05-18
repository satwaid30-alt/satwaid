"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import Navbar from "../../../components/Navbar";
import Accordion from "../../../components/Accordion";

export default function SpeciesDetail() {
    const { slug } = useParams();
    const [species, setSpecies] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species/${slug}`);

                const data = await response.json();
                if (response.ok) {
                    setSpecies(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch species detail:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSpecies();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-bold">Memuat detail spesies...</p>
                </div>
            </div>
        );
    }

    if (!species) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-zinc-900">Spesies Tidak Ditemukan</h1>
                    <Link href="/species" className="text-emerald-600 font-bold hover:underline">
                        Kembali ke Daftar Spesies
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-white text-zinc-900">
            <Navbar theme="light" />

            <main className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
                        <span>›</span>
                        <Link href="/species" className="hover:text-emerald-600 transition-colors">Spesies</Link>
                        <span>›</span>
                        <span className="text-zinc-900 font-bold">{species.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Left Column: Image & Stats */}
                        <div className="lg:sticky lg:top-32 space-y-8">
                            <div className="relative aspect-square rounded-4xl overflow-hidden border border-zinc-100">
                                <img
                                    src={species.image ? (species.image.startsWith('http') ? species.image : (species.image.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL}${species.image}` : species.image)) : "/images/snakes.png"}
                                    alt={species.name}
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onDragStart={(e) => e.preventDefault()}
                                />


                                {/* <div className="absolute top-8 left-8 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                                    Tingkat: {species.difficulty}
                                </div> */}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-center space-y-1">
                                    <p className="text-[12px] font-bold text-emerald-600 uppercase tracking-widest">Ukuran Maksimun</p>
                                    <p className="text-lg font-black text-zinc-900">{species.size}</p>
                                </div>
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-center space-y-1">
                                    <p className="text-[12px] font-bold text-emerald-600 uppercase tracking-widest">Lama Hidup</p>
                                    <p className="text-lg font-black text-zinc-900">{species.lifespan}</p>
                                </div>
                            </div>

                            {/* Additional Information Accordions */}
                            {(species.healthIssues || species.breedingGuide) && (
                                <div className="divide-y divide-zinc-100">
                                    {species.healthIssues && (
                                        <Accordion title="Kesehatan & Penyakit" icon="🩺">
                                            <ul className="space-y-4">
                                                {species.healthIssues.map((issue, idx) => {
                                                    const parts = issue.split(':');
                                                    const title = parts[0];
                                                    const desc = parts.length > 1 ? parts.slice(1).join(':') : null;
                                                    return (
                                                        <li key={idx} className="flex gap-4 items-start bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                                                            <span className="shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="text-red-900 leading-relaxed font-medium">
                                                                {desc ? (
                                                                    <>
                                                                        <strong className="font-black block text-red-950 mb-2">{title}:</strong>
                                                                        <div className="space-y-2">
                                                                            {desc.split('\n').map((line, i) => {
                                                                                const trimmed = line.trim();
                                                                                if (trimmed.startsWith('•')) {
                                                                                    return (
                                                                                        <div key={i} className="flex gap-3 items-start pl-1">
                                                                                            <span className="shrink-0 text-red-500 font-black">•</span>
                                                                                            <span className="flex-1">{trimmed.replace('•', '').trim()}</span>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return trimmed ? (
                                                                                    <p key={i} className="whitespace-pre-line">{line}</p>
                                                                                ) : null;
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                ) : <p className="whitespace-pre-line">{issue}</p>}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </Accordion>
                                    )}

                                    {species.breedingGuide && (
                                        <Accordion title="Panduan Breeding" icon="🥚">
                                            <ul className="space-y-4">
                                                {species.breedingGuide.map((guide, idx) => {
                                                    const parts = guide.split(':');
                                                    const title = parts[0];
                                                    const desc = parts.length > 1 ? parts.slice(1).join(':') : null;
                                                    return (
                                                        <li key={idx} className="flex gap-4 items-start bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                                            <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="text-blue-900 leading-relaxed font-medium">
                                                                {desc ? (
                                                                    <>
                                                                        <strong className="font-black block text-blue-950 mb-2">{title}:</strong>
                                                                        <div className="space-y-2">
                                                                            {desc.split('\n').map((line, i) => {
                                                                                const trimmed = line.trim();
                                                                                if (trimmed.startsWith('•')) {
                                                                                    return (
                                                                                        <div key={i} className="flex gap-3 items-start pl-1">
                                                                                            <span className="shrink-0 text-blue-600 font-black">•</span>
                                                                                            <span className="flex-1">{trimmed.replace('•', '').trim()}</span>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return trimmed ? (
                                                                                    <p key={i} className="whitespace-pre-line">{line}</p>
                                                                                ) : null;
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                ) : <p className="whitespace-pre-line">{guide}</p>}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </Accordion>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Info & Description */}
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    {species.category}
                                </span>
                                <h1 className="text-5xl md:text-6xl font-black text-zinc-900 leading-tight tracking-tighter">
                                    {species.name}
                                </h1>
                                <p className="text-xl italic text-zinc-400 font-medium">
                                    {species.scientificName}
                                </p>
                            </div>

                            <div className="divide-y divide-zinc-100">
                                <Accordion title="Tentang Spesies" icon="🦎">
                                    <div className="space-y-4">
                                        {species.description.split('\n').map((paragraph, index) => (
                                            paragraph.trim() ? (
                                                <p key={index} className="text-lg text-zinc-600 leading-relaxed font-medium text-justify">
                                                    {paragraph}
                                                </p>
                                            ) : null
                                        ))}
                                    </div>
                                </Accordion>

                                <Accordion title="Asal Usul & Habitat" icon="📍">
                                    <div className="space-y-4">
                                        {Array.isArray(species.origin) ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {species.origin.map((item, idx) => (
                                                    <div key={idx} className="flex gap-3 items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                        <span className="shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-zinc-900 font-bold text-sm">
                                                            {item}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-zinc-600 font-bold leading-relaxed">{species.origin}</p>
                                        )}
                                        {species.habitat && (
                                            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                                <span className="text-xl">🌿</span>
                                                <p className="text-emerald-900 font-bold">Habitat: {species.habitat}</p>
                                            </div>
                                        )}
                                    </div>
                                </Accordion>

                                <Accordion title="Makanan Utama" icon="🍖">
                                    <div className="space-y-3">
                                        {Array.isArray(species.diet) ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {species.diet.map((item, idx) => (
                                                    <div key={idx} className="flex gap-3 items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                        <span className="shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-zinc-900 font-bold text-sm">
                                                            {item}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-zinc-600 font-bold leading-relaxed">{species.diet}</p>
                                        )}
                                    </div>
                                </Accordion>

                                <Accordion title="Tips Perawatan" icon="✨">
                                    <ul className="space-y-4">
                                        {species.careTips.map((tip, idx) => (
                                            <li key={idx} className="flex gap-4 items-start bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                                <span className="shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-emerald-800 font-medium leading-relaxed">{tip}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </Accordion>

                                {species.morph_groups && species.morph_groups.length > 0 && (

                                    <div className="py-8 border-b border-zinc-100 group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                                                    <span className="text-2xl">🧬</span>
                                                    Genetik & Morph
                                                </h3>
                                                <p className="text-zinc-500 font-medium text-sm">
                                                    Temukan ribuan variasi warna dan genetik {species.name} yang unik.
                                                </p>
                                            </div>
                                            <Link
                                                href={`/species/${slug}/morphs`}
                                                className="inline-flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-zinc-900 transition-all duration-300 group-hover:-translate-y-1"
                                            >
                                                Lihat Semua Morph <span>→</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {species.references && species.references.length > 0 && (
                                    <Accordion title="Referensi Ilmiah" icon="📚">
                                        <div className="space-y-4">
                                            {species.references.map((ref, idx) => (
                                                <div key={idx} className="text-sm text-zinc-500 leading-relaxed font-medium pl-4 border-l-2 border-emerald-500">
                                                    {ref}
                                                </div>
                                            ))}
                                        </div>
                                    </Accordion>
                                )}
                            </div>

                            <div className="pt-6">
                                <Link href="/species" className="inline-flex items-center gap-3 text-zinc-400 font-bold hover:text-emerald-600 transition-colors group">
                                    <span className="transition-transform group-hover:-translate-x-1">←</span> Kembali ke Daftar
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

