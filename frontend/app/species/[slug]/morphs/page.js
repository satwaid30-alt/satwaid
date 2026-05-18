"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";

export default function SpeciesMorphs() {
    const { slug } = useParams();
    const [species, setSpecies] = useState(null);
    const [morphGroups, setMorphGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMorph, setSelectedMorph] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const fetchMorphData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch species detail
                const sRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species/${slug}`);
                const sData = await sRes.json();

                if (sRes.ok) {
                    setSpecies(sData.data);

                    // 2. Fetch morph groups for this species
                    const mRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups?species_id=${sData.data.id}`);

                    const mData = await mRes.json();
                    if (mRes.ok) {
                        setMorphGroups(mData.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch morph data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMorphData();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!species) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-zinc-900">Informasi Tidak Tersedia</h1>
                    <Link href={`/species/${slug}`} className="text-emerald-600 font-bold hover:underline">
                        Kembali ke Detail Spesies
                    </Link>
                </div>
            </div>
        );
    }

    // Flatten all morphs into a single list with category info
    const allMorphs = morphGroups.flatMap(group =>
        (group.items || []).map(item => ({
            ...item,
            categoryName: group.group_name
        }))
    );

    // Filter berdasarkan kata kunci search
    const filteredMorphs = allMorphs.filter(m => {
        return m.name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(filteredMorphs.length / ITEMS_PER_PAGE) || 1;
    const currentMorphs = filteredMorphs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-white text-zinc-900">
            <Navbar theme="light" />

            <main className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-12 overflow-x-auto whitespace-nowrap pb-2">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
                        <span>›</span>
                        <Link href="/species" className="hover:text-emerald-600 transition-colors">Spesies</Link>
                        <span>›</span>
                        <Link href={`/species/${slug}`} className="hover:text-emerald-600 transition-colors">{species.name}</Link>
                        <span>›</span>
                        <span className="text-zinc-900 font-bold">Genetik & Morph</span>
                    </nav>

                    <div className="space-y-12">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-6xl font-black text-zinc-900 leading-tight mb-6 tracking-tighter">
                                Genetik & Morph <span className="text-emerald-600"><br />{species.name}</span>
                            </h1>
                            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                                Daftar lengkap kombinasi warna dan pola (morph) {species.name}
                            </p>
                        </div>

                        {/* Filter & Search */}
                        <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 space-y-6">
                            {/* Search Input */}
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-3">Cari Morph</h3>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama morph..."
                                        className="block w-full pl-11 pr-4 py-3 border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium text-zinc-900 transition-colors"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-4xl border border-zinc-100 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-950 text-white">
                                            <th className="px-4 py-4 md:px-8 md:py-6 text-[10px] font-black uppercase tracking-widest w-12 md:w-20 text-center">No</th>
                                            <th className="px-4 py-4 md:px-8 md:py-6 text-[10px] font-black uppercase tracking-widest w-32 md:w-48">Kelompok</th>
                                            <th className="px-4 py-4 md:px-8 md:py-6 text-[10px] font-black uppercase tracking-widest min-w-[200px] md:w-64">Nama Morph</th>
                                            <th className="px-4 py-4 md:px-8 md:py-6 text-[10px] font-black uppercase tracking-widest w-24 md:w-40 text-center">Visual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {currentMorphs.map((morph, idx) => (
                                            <tr key={idx} className="group hover:bg-emerald-50/40 transition-colors duration-300">
                                                <td className="px-4 py-4 md:px-8 md:py-6 text-center">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-xl bg-zinc-100 text-[10px] md:text-xs font-black text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                                        {((currentPage - 1) * ITEMS_PER_PAGE) + idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 md:px-8 md:py-6">
                                                    <span className="inline-block px-2 py-1 md:px-3 md:py-1 bg-emerald-100 text-black text-[9px] md:text-[10px] font-black uppercase rounded-lg whitespace-nowrap">
                                                        {morph.categoryName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 md:px-8 md:py-6">
                                                    <p className="font-black text-zinc-900 group-hover:text-emerald-600 transition-colors text-base md:text-lg tracking-tight">
                                                        {morph.name}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 md:px-8 md:py-6 text-center">
                                                    <button
                                                        onClick={() => setSelectedMorph(morph)}
                                                        className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-zinc-100 text-zinc-400 rounded-xl md:rounded-2xl hover:border-emerald-600 hover:text-emerald-600 hover:scale-110 transition-all duration-300"
                                                        title="Lihat Visual"
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between border border-zinc-100 bg-white px-6 py-4 rounded-3xl mt-4">
                                <div className="mb-4 sm:mb-0">
                                    <p className="text-sm text-zinc-500 font-medium">
                                        Menampilkan <span className="font-bold text-zinc-900">{filteredMorphs.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}</span> hingga <span className="font-bold text-zinc-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMorphs.length)}</span> dari <span className="font-bold text-zinc-900">{filteredMorphs.length}</span> hasil
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => {
                                                setCurrentPage(prev => Math.max(prev - 1, 1));
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {(() => {
                                            const pages = [];
                                            if (totalPages <= 7) {
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                if (currentPage <= 3) {
                                                    pages.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
                                                } else if (currentPage >= totalPages - 2) {
                                                    pages.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                                } else {
                                                    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                                }
                                            }

                                            return pages.map((page, idx) => {
                                                if (page === '...') {
                                                    return (
                                                        <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-200 focus:outline-offset-0 bg-white">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <button
                                                        key={`page-${page}`}
                                                        onClick={() => {
                                                            setCurrentPage(page);
                                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                                        }}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-offset-2 ${currentPage === page
                                                                ? "z-10 bg-emerald-600 text-white ring-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                                                : "text-zinc-900 ring-zinc-200 bg-white hover:bg-zinc-50"}`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            });
                                        })()}

                                        <button
                                            onClick={() => {
                                                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center pt-8">
                            <Link
                                href={`/species/${slug}`}
                                className="inline-flex items-center gap-4 bg-zinc-900 text-white px-10 py-5 rounded-3xl font-black text-lg hover:bg-emerald-600 hover:-translate-y-1 transition-all duration-300"
                            >
                                <span>←</span> Kembali ke Profil Spesies
                            </Link>
                        </div>
                    </div>
                </div>
            </main >

            {/* Visual Modal */}
            {
                selectedMorph && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div
                            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-2xl animate-in fade-in duration-500"
                            onClick={() => setSelectedMorph(null)}
                        />
                        <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[32px] md:rounded-[40px] animate-in zoom-in-95 duration-500 shadow-2xl">
                            <button
                                onClick={() => setSelectedMorph(null)}
                                className="absolute top-4 right-4 md:top-8 md:right-8 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/50 md:bg-white/10 backdrop-blur-md text-zinc-900 border border-zinc-200 md:border-zinc-100 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative aspect-square md:aspect-auto border-r border-zinc-100 bg-zinc-50/50">
                                    {selectedMorph.image ? (
                                        <img
                                            src={selectedMorph.image}
                                            alt={selectedMorph.name}
                                            className="w-full h-full object-contain p-8 select-none pointer-events-none drop-shadow-sm"
                                            draggable={false}
                                            onContextMenu={(e) => e.preventDefault()}
                                            onDragStart={(e) => e.preventDefault()}
                                        />

                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center space-y-4 p-12">
                                                <div className="text-6xl mb-4">📸</div>
                                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Visual Representation</p>
                                                <h4 className="text-2xl font-black text-zinc-900">{selectedMorph.name}</h4>
                                                <p className="text-sm text-zinc-500 italic max-w-xs mx-auto">
                                                    Segera hadir: Galeri foto HD eksklusif untuk morph ini.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 md:p-12 lg:p-16 space-y-6 md:space-y-8 self-center">
                                    <div className="space-y-3 md:space-y-4">
                                        <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-black uppercase rounded-full tracking-widest">
                                            {selectedMorph.categoryName}
                                        </span>

                                        <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter leading-none">
                                            {selectedMorph.name}
                                        </h2>
                                    </div>
                                    <div className="space-y-5 md:space-y-6">
                                        <div className="space-y-3 md:space-y-4">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Detail Genetik & Karakteristik</p>

                                            <div className="overflow-hidden rounded-2xl border border-zinc-100">
                                                <table className="w-full text-left text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-zinc-50 border-b border-zinc-100">
                                                            <th className="px-5 py-3 font-black text-zinc-900 w-1/3">Karakteristik</th>
                                                            <th className="px-5 py-3 font-black text-zinc-900">Deskripsi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-50">
                                                        {selectedMorph.details ? (
                                                            Object.entries(selectedMorph.details).map(([key, value], dIdx) => (
                                                                <tr key={dIdx} className="hover:bg-zinc-50/50 transition-colors">
                                                                    <td className="px-5 py-3 font-bold text-zinc-500 bg-zinc-50/30">{key}</td>
                                                                    <td className="px-5 py-3 text-zinc-600 font-medium text-justify">{value}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td className="px-5 py-3 font-bold text-zinc-500 bg-zinc-50/30">Keterangan Umum</td>
                                                                <td className="px-5 py-3 text-zinc-600 font-medium">{selectedMorph.description}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-zinc-100 space-y-4">
                                            {selectedMorph.kelompok && (
                                                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                                        <span className="text-xl">🏷️</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                                            Kelompok
                                                        </p>
                                                        <p className="text-xs text-zinc-500 font-bold leading-tight">
                                                            {selectedMorph.kelompok}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedMorph.geneticInfo && selectedMorph.showGeneticInfo !== false && (
                                                <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">

                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100">
                                                        <span className="text-xl">🧬</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                                            Informasi Genetik
                                                        </p>
                                                        <p className="text-xs text-zinc-600 font-bold leading-tight">
                                                            {selectedMorph.geneticInfo}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
