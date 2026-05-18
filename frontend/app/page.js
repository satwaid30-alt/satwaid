"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CountUp from "react-countup";
import { MapPin, ShoppingBag, Store, ArrowRight, Star, Truck, Package, ChevronRight, ChevronLeft, Zap, Sparkles, MessageSquare, Search, PawPrint, ShieldCheck, FileSearch, ShieldAlert } from "lucide-react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
// import { BLOG_POSTS } from "../data/blog-posts";

const CATEGORIES = [
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

export default function Home() {
    const [speciesCount, setSpeciesCount] = useState(0);
    const [listings, setListings] = useState([]);
    const [isLoadingListings, setIsLoadingListings] = useState(true);
    const [activeTab, setActiveTab] = useState("Semua");
    const [searchQuery, setSearchQuery] = useState("");
    const carouselRefs = useRef({}); // To store refs for each category carousel
    // const carouselRefs = useRef({}); // To store refs for each category carousel
    const [chatCounts, setChatCounts] = useState({});

    const scroll = useCallback((catId, direction) => {
        const ref = carouselRefs.current[catId];
        if (ref) {
            const { scrollLeft, clientWidth } = ref;
            const scrollAmount = clientWidth * 0.8;
            const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
            ref.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        const fetchSpeciesCount = async () => {
            if (!process.env.NEXT_PUBLIC_API_URL) return;
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`);
                const data = await response.json();
                if (response.ok) {
                    setSpeciesCount(data.data.length);
                }
            } catch (err) {
                console.error("Failed to fetch species count from", process.env.NEXT_PUBLIC_API_URL, err);
            }
        };

        const fetchListings = async () => {
            if (!process.env.NEXT_PUBLIC_API_URL) {
                setIsLoadingListings(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings`);
                const result = await response.json();
                if (response.ok) {
                    const activeOnes = (result.data || []).filter(item =>
                        item.status?.toLowerCase() === 'active'
                    );
                    setListings(activeOnes);
                    return activeOnes;
                }
            } catch (err) {
                console.error("Failed to fetch listings from", process.env.NEXT_PUBLIC_API_URL, err);
            } finally {
                setIsLoadingListings(false);
            }
        };

        const fetchChatCounts = async (listingsData) => {
            if (!process.env.NEXT_PUBLIC_API_URL) return;
            const productIds = listingsData.map(l => l.id);
            const counts = {};

            await Promise.all(productIds.map(async (pid) => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/product/${pid}`);
                    const result = await res.json();
                    if (res.ok) {
                        counts[pid] = result.count || 0;
                    }
                } catch (e) {
                    console.error("Error fetching product chat count from", process.env.NEXT_PUBLIC_API_URL, e);
                }
            }));
            setChatCounts(counts);
        };

        fetchSpeciesCount();
        fetchListings().then(data => {
            if (data) fetchChatCounts(data);
        });
    }, []);

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.shop?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.species || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [listings, searchQuery]);

    const groupedListings = useMemo(() => {
        const groups = filteredListings.reduce((acc, listing) => {
            const cat = listing.species || "Lainnya";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(listing);
            return acc;
        }, {});
        return groups;
    }, [filteredListings]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    };

    const CountdownTimer = ({ endTime }) => {
        const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

        useEffect(() => {
            if (!endTime) return;
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = new Date(endTime).getTime() - now;
                if (distance < 0) {
                    clearInterval(timer);
                    setTimeLeft({ h: '00', m: '00', s: '00' });
                } else {
                    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft({
                        h: h.toString().padStart(2, '0'),
                        m: m.toString().padStart(2, '0'),
                        s: s.toString().padStart(2, '0')
                    });
                }
            }, 1000);
            return () => clearInterval(timer);
        }, [endTime]);

        return (
            <div className="flex items-center gap-1">
                <div className="bg-emerald-50 text-emerald-600 font-black px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] min-w-[22px] text-center">{timeLeft.h}</div>
                <span className="text-emerald-300 text-[10px] font-bold">:</span>
                <div className="bg-emerald-50 text-emerald-600 font-black px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] min-w-[22px] text-center">{timeLeft.m}</div>
                <span className="text-emerald-300 text-[10px] font-bold">:</span>
                <div className="bg-emerald-50 text-emerald-600 font-black px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] min-w-[22px] text-center">{timeLeft.s}</div>
            </div>
        );
    };



    return (
        <div className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-200 font-sans">
            <Navbar />

            <section className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden bg-zinc-950">
                <div className="absolute inset-0">
                    <Image
                        src="/images/Background.jpg"
                        alt="Hero Reptil Eksotis"
                        fill
                        className="object-cover brightness-[0.6] object-center scale-105 animate-slow-zoom"
                        priority
                        quality={100}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-0" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent z-0" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10 pt-28 pb-14 sm:pt-40 sm:pb-24 lg:pt-52 lg:pb-36">
                    <div className="max-w-2xl space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide">
                            <Sparkles size={16} className="text-emerald-400" />
                            <span className="uppercase tracking-widest text-[10px] sm:text-[11px]">Sahabat Fauna Indonesia</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
                            Temukan Satwa  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Favoritmu</span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-xl leading-relaxed font-medium">
                            Marketplace terpercaya untuk jual beli satwa, perlengkapan, dan komunitas pecinta fauna.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-4">
                            <Link href="/toko" className="group bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all hover:scale-105 flex items-center justify-center gap-2">
                                Mulai Belanja <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            {/* <Link href="/species" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center">
                                Lihat Spesies
                            </Link> */}
                        </div>

                        {/* <div className="pt-12 mt-12 border-t border-white/10 grid gap-4 sm:grid-cols-3">
                            {[
                                { label: "Happy Customers", value: 1200, prefix: "+", suffix: "" },
                                { label: "Spesies Terdaftar", value: speciesCount, prefix: "", suffix: "" },
                                { label: "Artikel Edukasi", value: BLOG_POSTS.length, prefix: "", suffix: "" }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-1">
                                    <h4 className="text-4xl md:text-5xl font-black text-white flex items-baseline gap-1">
                                        <span className="text-emerald-500">{stat.prefix}</span>
                                        <CountUp end={stat.value} duration={2.5} />
                                        <span className="text-zinc-500 text-2xl">{stat.suffix}</span>
                                    </h4>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                </div>
                            ))}
                        </div> */}
                    </div>
                </div>
            </section>

            <section className="py-24 bg-zinc-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -ml-64 -mb-64" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-4 mb-10">
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                            <Zap size={14} /> Kategori Satwa
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight">Etalase <span className="text-emerald-600">Satwa </span></h2>
                    </div>

                    <div className="max-w-4xl mx-auto mb-10 flex flex-col md:flex-row gap-4 items-center">
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
                                className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-4 pl-14 pr-6 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* Category Select */}
                        <div className="relative w-full md:w-72 group">
                            <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="w-full bg-white border border-zinc-200 text-zinc-900 font-black py-4 px-8 rounded-[1.5rem] appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="Semua">Semua Kategori</option>
                                {CATEGORIES.map((cat) => (
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

                    {isLoadingListings ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white border border-zinc-100 rounded-3xl min-h-[20rem] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {CATEGORIES.filter(cat => activeTab === "Semua" || activeTab === cat.id).map((cat) => {
                                const catProducts = groupedListings[cat.id] || [];
                                if (catProducts.length === 0) return null;

                                return (
                                    <div key={cat.id} className="space-y-8 animate-fade-in-up">
                                        <div className="flex items-center justify-between bg-white border border-zinc-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mb-4">
                                            <h3 className="text-lg sm:text-2xl font-black text-zinc-900">{cat.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => scroll(cat.id, 'left')} className="p-2 border border-zinc-200 rounded-xl"><ChevronLeft size={20} /></button>
                                                <button onClick={() => scroll(cat.id, 'right')} className="p-2 border border-zinc-200 rounded-xl"><ChevronRight size={20} /></button>
                                            </div>
                                        </div>
                                        <div ref={el => { if (el) carouselRefs.current[cat.id] = el; }} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4">
                                            {catProducts.map((product) => (
                                                <div key={product.id} className="w-40 sm:w-52 lg:w-[calc((100%-64px)/5)] shrink-0">
                                                    <ProductCard product={product} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Fallback Categories (NEW) */}
                            {activeTab === "Semua" && Object.entries(groupedListings)
                                .filter(([catId]) => !CATEGORIES.find(c => c.id === catId))
                                .map(([catId, products]) => (
                                    <div key={catId} className="space-y-8 animate-fade-in-up">
                                        <div className="flex items-center justify-between bg-white border border-zinc-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-2xl text-white">
                                                    📦
                                                </div>
                                                <div>
                                                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">{catId}</h3>
                                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-0.5">{products.length} Produk Tersedia</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => scroll(catId, 'left')} className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"><ChevronLeft size={20} /></button>
                                                <button onClick={() => scroll(catId, 'right')} className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"><ChevronRight size={20} /></button>
                                            </div>
                                        </div>
                                        <div
                                            ref={el => { if (el) carouselRefs.current[catId] = el; }}
                                            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
                                        >
                                            {products.map((product) => (
                                                <div key={product.id} className="w-40 sm:w-52 lg:w-[calc((100%-64px)/5)] shrink-0">
                                                    <ProductCard product={product} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }

                            {/* Empty State */}
                            {listings.length === 0 && (
                                <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                                    <div className="text-7xl mb-8">🦎</div>
                                    <h3 className="text-3xl font-black text-zinc-900 mb-3">Belum Ada Koleksi</h3>
                                    <p className="text-zinc-500 max-w-md mx-auto text-lg">Saat ini belum ada produk aktif.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
            <section className="py-16 md:py-24 bg-zinc-50 border-t border-zinc-100/85 relative overflow-hidden">
                {/* Subtle soft decorative circles */}
                <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Header Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 md:mb-6 tracking-tight">
                            Mengapa Memilih <span className="text-emerald-600">SatwaiD</span>?
                        </h2>
                        <p className="text-sm md:text-base text-zinc-500 leading-relaxed font-medium px-4 md:px-0">
                            SatwaiD hadir sebagai platform jual beli satwa terpercaya yang menghubungkan pembeli dengan seller dan breeder berkualitas di seluruh Indonesia melalui sistem transaksi yang aman dan transparan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 text-center">
                        {/* Ragam Hewan / Seller Terpercaya */}
                        <div className="flex flex-col items-center space-y-3 md:space-y-5 group cursor-pointer">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-1">
                                {/* Inner soft filled blob */}
                                <div className="absolute inset-1.5 md:inset-2 bg-emerald-50/70 rounded-[55%_45%_55%_45%_/_45%_55%_45%_55%] transition-all group-hover:scale-105 duration-500"></div>
                                {/* Primary Sketchy Outline */}
                                <div className="absolute inset-1 md:inset-1.5 border border-emerald-600 rounded-[60%_40%_60%_40%_/_40%_60%_40%_60%] rotate-[15deg] transition-all group-hover:rotate-[45deg] group-hover:border-emerald-500 duration-700"></div>
                                {/* Secondary offset Sketchy Outline */}
                                <div className="absolute inset-0.5 border border-emerald-600/30 rounded-[45%_55%_40%_60%_/_60%_40%_55%_45%] -rotate-[10deg] transition-all group-hover:rotate-[15deg] duration-700"></div>
                                <PawPrint size={40} className="w-8 h-8 md:w-10 md:h-10 text-emerald-700 relative z-10 transition-transform group-hover:scale-110 duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 transition-colors group-hover:text-emerald-600 duration-300">Seller Terpercaya</h3>
                            <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-4">
                                Ribuan pilihan satwa dan perlengkapan hobi dari seller terpercaya.
                            </p>
                        </div>

                        {/* Aman Bertransaksi */}
                        <div className="flex flex-col items-center space-y-3 md:space-y-5 group cursor-pointer">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-1">
                                {/* Inner soft filled blob */}
                                <div className="absolute inset-1.5 md:inset-2 bg-emerald-50/70 rounded-[40%_60%_50%_50%_/_50%_40%_60%_50%] transition-all group-hover:scale-105 duration-500"></div>
                                {/* Primary Sketchy Outline */}
                                <div className="absolute inset-1 md:inset-1.5 border border-emerald-600 rounded-[50%_50%_40%_60%_/_60%_40%_60%_40%] rotate-[-12deg] transition-all group-hover:rotate-[-45deg] group-hover:border-emerald-500 duration-700"></div>
                                {/* Secondary offset Sketchy Outline */}
                                <div className="absolute inset-0.5 border border-emerald-600/30 rounded-[55%_45%_50%_50%_/_45%_55%_45%_55%] rotate-[8deg] transition-all group-hover:rotate-[-15deg] duration-700"></div>
                                <ShieldCheck size={40} className="w-8 h-8 md:w-10 md:h-10 text-emerald-700 relative z-10 transition-transform group-hover:scale-110 duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 transition-colors group-hover:text-emerald-600 duration-300">Aman Bertransaksi</h3>
                            <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-2">
                                Seluruh transaksi di SatwaiD menggunakan sistem Rekber untuk memberikan pengalaman jual beli yang lebih aman, transparan, dan terpercaya.
                            </p>
                        </div>

                        {/* Transparan */}
                        <div className="flex flex-col items-center space-y-3 md:space-y-5 group cursor-pointer">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-1">
                                {/* Inner soft filled blob */}
                                <div className="absolute inset-1.5 md:inset-2 bg-emerald-50/70 rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] transition-all group-hover:scale-105 duration-500"></div>
                                {/* Primary Sketchy Outline */}
                                <div className="absolute inset-1 md:inset-1.5 border border-emerald-600 rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] rotate-[45deg] transition-all group-hover:rotate-[90deg] group-hover:border-emerald-500 duration-700"></div>
                                {/* Secondary offset Sketchy Outline */}
                                <div className="absolute inset-0.5 border border-emerald-600/30 rounded-[50%_50%_45%_55%_/_55%_45%_50%_50%] -rotate-[25deg] transition-all group-hover:rotate-[-45deg] duration-700"></div>
                                <FileSearch size={40} className="w-8 h-8 md:w-10 md:h-10 text-emerald-700 relative z-10 transition-transform group-hover:scale-110 duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 transition-colors group-hover:text-emerald-600 duration-300">Transparansi Sistem</h3>
                            <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-4">
                                Seluruh aktivitas transaksi tercatat secara jelas dan mudah dipantau.
                            </p>
                        </div>

                        {/* Pengawasan Hewan */}
                        <div className="flex flex-col items-center space-y-3 md:space-y-5 group cursor-pointer">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center mb-1">
                                {/* Inner soft filled blob */}
                                <div className="absolute inset-1.5 md:inset-2 bg-emerald-50/70 rounded-[45%_55%_60%_40%_/_55%_40%_60%_45%] transition-all group-hover:scale-105 duration-500"></div>
                                {/* Primary Sketchy Outline */}
                                <div className="absolute inset-1 md:inset-1.5 border border-emerald-600 rounded-[55%_45%_45%_55%_/_45%_55%_55%_45%] rotate-[-8deg] transition-all group-hover:rotate-[-35deg] group-hover:border-emerald-500 duration-700"></div>
                                {/* Secondary offset Sketchy Outline */}
                                <div className="absolute inset-0.5 border border-emerald-600/30 rounded-[40%_60%_50%_50%_/_50%_40%_60%_50%] rotate-[18deg] transition-all group-hover:rotate-[5deg] duration-700"></div>
                                <ShieldAlert size={40} className="w-8 h-8 md:w-10 md:h-10 text-emerald-700 relative z-10 transition-transform group-hover:scale-110 duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 transition-colors group-hover:text-emerald-600 duration-300">Pengawasan Hewan</h3>
                            <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-2">
                                SatwaiD berkomitmen menjaga perdagangan satwa yang legal dan aman.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx global>{`
                @keyframes slow-zoom {
                    0% { transform: scale(1.05); }
                    100% { transform: scale(1.15); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 20s ease-in-out infinite alternate;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                `}</style>
        </div>
    );
}
