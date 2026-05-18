"use client";

import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import Footer from "../../components/Footer";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
    MapPin,
    ShoppingBag,
    Store,
    Truck,
    Package, Zap, Search, ChevronRight
} from "lucide-react";

// Dummy data for products
// Categories remains static for now as requested focused on product data
const categories = [
    { id: "Reptil", name: "Reptil", color: "from-emerald-500 to-teal-700", bgLight: "bg-emerald-50", text: "text-emerald-700" },
    { id: "Mamalia", name: "Mamalia", color: "from-amber-400 to-orange-600", bgLight: "bg-amber-50", text: "text-amber-700" },
    { id: "Burung", name: "Burung", color: "from-sky-400 to-blue-600", bgLight: "bg-sky-50", text: "text-sky-700" },
    { id: "Ikan", name: "Ikan", color: "from-blue-500 to-cyan-700", bgLight: "bg-blue-50", text: "text-blue-700" },
    { id: "Amfibi", name: "Amfibi", color: "from-lime-500 to-green-700", bgLight: "bg-lime-50", text: "text-lime-700" },
    { id: "Serangga", name: "Serangga", color: "from-orange-500 to-red-700", bgLight: "bg-orange-50", text: "text-orange-700" },
    { id: "Invertebrata Lainnya", name: "Invertebrata Lainnya", color: "from-zinc-500 to-zinc-700", bgLight: "bg-zinc-50", text: "text-zinc-700" },
    { id: "Unggas", name: "Unggas", color: "from-yellow-500 to-orange-700", bgLight: "bg-yellow-50", text: "text-yellow-700" },
    { id: "Hewan Lainnya", name: "Hewan Lainnya", color: "from-purple-500 to-indigo-700", bgLight: "bg-purple-50", text: "text-purple-700" },
    { id: "Pakan Hewan", name: "Pakan Hewan", color: "from-amber-700 to-orange-900", bgLight: "bg-amber-50", text: "text-amber-900" },
    { id: "Perlengkapan & Aksesoris", name: "Perlengkapan & Aksesoris", color: "from-rose-500 to-pink-700", bgLight: "bg-rose-50", text: "text-rose-700" },
];

export default function TokoPage() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchActiveListings();
        // Load current user from localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const fetchActiveListings = async () => {
        try {
            console.log("Fetching listings...");
            // Use 127.0.0.1 for more reliable local connection in some environments
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings`);
            const result = await response.json();

            console.log("API Response:", result);

            if (response.ok) {
                // Case-insensitive status check
                const activeOnes = (result.data || []).filter(item =>
                    item.status?.toLowerCase() === 'active'
                );
                console.log("Filtered Active Listings:", activeOnes);
                setListings(activeOnes);
            }
        } catch (err) {
            console.error("Error fetching listings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    };

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                (item.name || "").toLowerCase().includes(query) ||
                (item.shop?.name || "").toLowerCase().includes(query) ||
                (item.species || "").toLowerCase().includes(query);

            const matchesCategory = activeTab === "Semua" || item.species === activeTab;

            return matchesSearch && matchesCategory;
        });
    }, [listings, searchQuery, activeTab]);

    const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
    const paginatedListings = filteredListings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-200">
            <Navbar theme="dark" />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-zinc-900 border-b border-zinc-800">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero.png"
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/80 to-zinc-900" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700/10 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Platform Jual Beli Terpercaya
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Etalase  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Satwa</span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                        Temukan hewan peliharaan impian, kebutuhan perawatan, dan perlengkapan hobi terlengkap dalam satu platform terpercaya.
                    </p>

                    {/* Search & Filter Bar */}
                    <div className="max-w-4xl mx-auto mb-16 flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari produk atau nama toko..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-4 pl-14 pr-6 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xl shadow-zinc-200/50"
                            />
                        </div>

                        {/* Category Select */}
                        <div className="relative w-full md:w-72 group">
                            <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="w-full bg-white border border-zinc-200 text-zinc-900 font-black py-4 px-8 rounded-[1.5rem] appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xl shadow-zinc-200/50 cursor-pointer"
                            >
                                <option value="Semua">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-zinc-400 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight size={20} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 py-16">

                {/* Trending Items */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-1">Rekomendasi Terbaru</h2>
                            <p className="text-zinc-500">Hewan dan perlengkapan pilihan untuk Anda</p>
                        </div>

                    </div>

                    {/* Mobile Reference Filter Bar (Matches Screenshot) */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <div key={i} className="bg-white rounded-2xl h-[300px] animate-pulse border border-zinc-100 shadow-sm">
                                    <div className="w-full h-1/2 bg-zinc-100 rounded-t-2xl"></div>
                                    <div className="p-5 space-y-4">
                                        <div className="h-4 bg-zinc-100 w-1/4 rounded"></div>
                                        <div className="h-6 bg-zinc-100 w-3/4 rounded"></div>
                                        <div className="h-4 bg-zinc-100 w-1/2 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            {paginatedListings.length > 0 ? (
                                paginatedListings.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                        <Search className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900">Tidak Menemukan Hasil</h3>
                                    <p className="text-zinc-500">Coba gunakan kata kunci lain untuk mencari {searchQuery}.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && totalPages > 1 && (
                        <div className="mt-16 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${currentPage === 1
                                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-emerald-500 hover:text-emerald-600 shadow-sm"
                                    }`}
                            >
                                <ChevronRight size={20} className="rotate-180" />
                                <span className="hidden sm:inline">Sebelumnya</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Basic pagination logic to show limited numbers can be added here if needed
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-black transition-all ${currentPage === pageNum
                                                ? "bg-emerald-500 text-zinc-900 shadow-lg shadow-emerald-500/20"
                                                : "bg-white border border-zinc-200 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${currentPage === totalPages
                                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-emerald-500 hover:text-emerald-600 shadow-sm"
                                    }`}
                            >
                                <span className="hidden sm:inline">Berikutnya</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    <div className="mt-10 sm:hidden flex justify-center">
                        <Link href="/toko/semua" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-6 py-3 rounded-full transition-colors">
                            Lihat Semua Produk
                        </Link>
                    </div>
                </section>

                {/* Promo Banner */}
                <section className="mt-20">
                    <div className="relative rounded-3xl overflow-hidden bg-zinc-900 text-white p-8 md:p-12 shadow-xl shadow-emerald-500/10 min-h-[400px] flex items-center">
                        <img
                            src="/images/Komodo.png"
                            alt="Promo Banner"
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent"></div>

                        <div className="relative z-10 md:w-2/3">
                            <img src="/images/Logo-Reptile.png" alt="Logo" className="w-16 h-16 mb-6 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20" />
                            <span className="inline-block bg-emerald-500 px-3 py-1 rounded-lg text-xs font-black tracking-widest mb-4">
                                PROMO EKSKLUSIF
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                                Diskon Ongkir <br /><span className="text-emerald-400">Hingga Rp 50.000</span>
                            </h2>
                            <p className="text-zinc-300 text-lg mb-8 max-w-lg opacity-90">
                                Khusus pengiriman hewan melalui kurir terpercaya. Aman, garansi hidup sampai tujuan ke seluruh Indonesia!
                            </p>
                            <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                Klaim Promo Sekarang
                            </button>
                        </div>
                    </div>
                </section>


            </main>

            <Footer />
        </div>
    );
}

