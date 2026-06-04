"use client";

import Navbar from "../../components/Navbar";
import MobileMenuGrid from "../../components/MobileMenuGrid";
import ProductCard from "../../components/ProductCard";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import { MapPin, ShoppingBag, Store, Truck, Package, Zap, Search, ChevronRight, ChevronLeft, ArrowUpRight, MessageSquare, Gavel, Home } from "lucide-react";

// Dummy data for products
// Categories remains static for now as requested focused on product data
const categories = [
  {
    id: "Reptil",
    name: "Reptil",
    color: "from-emerald-500 to-teal-700",
    bgLight: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    id: "Mamalia",
    name: "Mamalia",
    color: "from-amber-400 to-orange-600",
    bgLight: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    id: "Burung",
    name: "Burung",
    color: "from-sky-400 to-blue-600",
    bgLight: "bg-sky-50",
    text: "text-sky-700",
  },
  {
    id: "Ikan",
    name: "Ikan",
    color: "from-blue-500 to-cyan-700",
    bgLight: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    id: "Amfibi",
    name: "Amfibi",
    color: "from-lime-500 to-green-700",
    bgLight: "bg-lime-50",
    text: "text-lime-700",
  },
  {
    id: "Serangga",
    name: "Serangga",
    color: "from-orange-500 to-red-700",
    bgLight: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    id: "Invertebrata Lainnya",
    name: "Invertebrata Lainnya",
    color: "from-zinc-500 to-zinc-700",
    bgLight: "bg-zinc-50",
    text: "text-zinc-700",
  },
  {
    id: "Unggas",
    name: "Unggas",
    color: "from-yellow-500 to-orange-700",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
  },
  {
    id: "Hewan Lainnya",
    name: "Hewan Lainnya",
    color: "from-purple-500 to-indigo-700",
    bgLight: "bg-purple-50",
    text: "text-purple-700",
  },
  {
    id: "Pakan Hewan",
    name: "Pakan Hewan",
    color: "from-amber-700 to-orange-900",
    bgLight: "bg-amber-50",
    text: "text-amber-900",
  },
  {
    id: "Perlengkapan & Aksesoris",
    name: "Perlengkapan & Aksesoris",
    color: "from-rose-500 to-pink-700",
    bgLight: "bg-rose-50",
    text: "text-rose-700",
  },
];

export default function TokoPage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [currentUser, setCurrentUser] = useState(null);

  // Ad Carousel States & Refs
  const [advertisements, setAdvertisements] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    fetchActiveListings();
    fetchAdvertisements();
    // Load current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    // Socket.IO Setup
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const socket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });

    // Real-time Advertisement Events
    socket.on("new_advertisement_published", (ad) => {
      if (ad.status?.toLowerCase() === "aktif" && ad.placement?.toLowerCase() === "toko") {
        setAdvertisements((prev) => [ad, ...prev]);
      }
    });

    socket.on("advertisement_updated", (updatedAd) => {
      setAdvertisements((prev) => {
        const isTargetPlacement = updatedAd.placement?.toLowerCase() === "toko";
        const isActive = updatedAd.status?.toLowerCase() === "aktif";
        const exists = prev.some((ad) => ad.id === updatedAd.id);

        if (exists) {
          if (!isActive || !isTargetPlacement) {
            // Remove if no longer active or placement changed
            return prev.filter((ad) => ad.id !== updatedAd.id);
          }
          // Update existing
          return prev.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad));
        } else if (isActive && isTargetPlacement) {
          // Add if newly matches criteria
          return [updatedAd, ...prev];
        }
        return prev;
      });
    });

    socket.on("advertisement_deleted", ({ id }) => {
      setAdvertisements((prev) => prev.filter((ad) => ad.id !== id));
    });

    // Real-time Listing Events
    socket.on("new_listing_published", (listing) => {
      if (listing.type === "regular" && listing.status?.toLowerCase() === "active") {
        setListings((prev) => {
          if (prev.some((item) => item.id === listing.id)) return prev;
          return [listing, ...prev];
        });
      }
    });

    socket.on("listing_status_updated", (data) => {
      setListings((prev) => {
        const exists = prev.some((item) => item.id === data.id);
        if (data.status?.toLowerCase() === "active") {
          if (exists) {
            return prev.map((item) => (item.id === data.id ? { ...item, status: data.status } : item));
          } else {
            // Since we don't have the full object here, we re-fetch to get it
            fetchActiveListings();
            return prev;
          }
        } else {
          // Removed from active listings
          return prev.filter((item) => item.id !== data.id);
        }
      });
    });

    socket.on("listing_deleted", ({ id }) => {
      setListings((prev) => prev.filter((item) => item.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/advertisements`);
      const result = await response.json();
      if (response.ok) {
        const activeAds = (result.data || []).filter((ad) => ad.status?.toLowerCase() === "aktif" && ad.placement?.toLowerCase() === "toko");
        setAdvertisements(activeAds);
      }
    } catch (err) {
      console.error("Error fetching advertisements for Toko:", err);
    }
  };

  const slides = useMemo(() => {
    // Filter advertisements based on activeTab
    let filteredAds = [];
    if (activeTab !== "Semua") {
      // Find ads specifically for activeTab (e.g., Reptil, Mamalia)
      filteredAds = advertisements.filter((ad) => ad.category === activeTab);
    }

    // If there are no ads specifically for this activeTab (or activeTab is "Semua"),
    // fallback to general Toko ads (category is null, undefined, empty, or "Semua Kategori")
    if (filteredAds.length === 0) {
      filteredAds = advertisements.filter((ad) => !ad.category || ad.category === "Semua Kategori" || ad.category === "Semua");
    }

    return filteredAds.map((ad, idx) => ({
      id: ad.id || `ad-${idx}`,
      image_url: ad.image_url.startsWith("http") ? ad.image_url : `${getApiUrl()}${ad.image_url}`,
      mobile_image_url: ad.mobile_image_url ? (ad.mobile_image_url.startsWith("http") ? ad.mobile_image_url : `${getApiUrl()}${ad.mobile_image_url}`) : null,
      link_url: ad.link_url || "#",
      badge: ad.badge || "",
      title: ad.title || "",
      description: ad.description || "",
      buttonText: ad.button_text || "",
      isAd: true,
    }));
  }, [advertisements, activeTab]);

  // Auto rotation effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  // Reset activeAdIndex when activeTab changes to start at the first slide of the new category
  useEffect(() => {
    setActiveAdIndex(0);
  }, [activeTab]);

  // Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const difference = touchStartX.current - touchEndX.current;
    if (Math.abs(difference) > swipeThreshold) {
      if (difference > 0) {
        setActiveAdIndex((prev) => (prev + 1) % slides.length);
      } else {
        setActiveAdIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const fetchActiveListings = async () => {
    try {
      console.log("Fetching listings...");
      // Use 127.0.0.1 for more reliable local connection in some environments
      const response = await fetch(`${getApiUrl()}/listings`);
      const result = await response.json();

      console.log("API Response:", result);

      if (response.ok) {
        // Case-insensitive status check
        const activeOnes = (result.data || []).filter((item) => item.status?.toLowerCase() === "active" && item.type !== "auction");
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
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (item.name || "").toLowerCase().includes(query) || (item.shop?.name || "").toLowerCase().includes(query) || (item.species || "").toLowerCase().includes(query);

      const matchesCategory = activeTab === "Semua" || item.species === activeTab;

      return matchesSearch && matchesCategory;
    });
  }, [listings, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-200">
      <Navbar theme="dark" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-zinc-900 border-b border-zinc-800 hidden md:block">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero.png" alt="Hero Background" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/80 to-zinc-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Etalase <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Satwa</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">Temukan hewan peliharaan impian, kebutuhan perawatan, dan perlengkapan hobi terlengkap dalam satu platform terpercaya.</p>

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
                className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-4 pl-14 pr-6 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-72 group">
              <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full bg-white border border-zinc-200 text-zinc-900 font-black py-4 px-8 rounded-[1.5rem] appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 md:py-16">
        {/* Promo Banner Image Carousel for Mobile (Visible on mobile only, at the top) */}
        {slides.length > 0 && (
          <div className="block md:hidden mb-6 px-1">
            <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative rounded-2xl overflow-hidden bg-zinc-900 text-white aspect-[2.1/1] min-h-[140px] flex items-center group shadow-md border border-zinc-100/10">
              {slides.map((slide, idx) => {
                const isActive = idx === activeAdIndex;
                return (
                  <div key={slide.id} className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out flex items-center p-4 ${isActive ? "opacity-100 scale-100 pointer-events-auto z-10" : "opacity-0 scale-105 pointer-events-none z-0"}`}>
                    <img src={slide.mobile_image_url || slide.image_url} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                    <div className="relative z-20 w-full text-left">
                      {slide.badge && <span className="inline-flex items-center bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wider mb-1">{slide.badge}</span>}
                      {slide.title && <h2 className="text-xs sm:text-sm font-black mb-0.5 leading-tight text-white">{slide.title}</h2>}
                      {slide.description && <p className="text-zinc-300 text-[8px] sm:text-[10px] max-w-[70%] opacity-90 leading-normal line-clamp-1 mb-1.5">{slide.description}</p>}
                      {slide.buttonText && (
                        <Link href={slide.link_url} className="inline-flex items-center gap-1 bg-white hover:bg-zinc-100 text-zinc-900 font-bold px-2.5 py-1 rounded-lg text-[8px] transition-all duration-300 shadow-sm">
                          {slide.buttonText}
                          <ArrowUpRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dot Indicators */}
              {slides.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
                  {slides.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveAdIndex(idx)} className={`h-0.5 rounded-full transition-all duration-300 ${activeAdIndex === idx ? "w-3 bg-emerald-500" : "w-1 bg-white/30"}`} aria-label={`Go to slide ${idx + 1}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu Grid (Visible on mobile/handphones only, white cards) */}
        <MobileMenuGrid className="mb-6 px-1" />

        {/* Search & Select for Mobile (Visible on mobile only, below menu) */}
        <div className="block md:hidden space-y-3 mb-8 px-1">
          {/* Search Input */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Cari produk atau nama toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-3 pl-11 pr-4 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Category Select */}
          <div className="relative w-full group">
            <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full bg-white border border-zinc-200 text-zinc-900 font-black py-3 px-5 pr-10 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer">
              <option value="Semua">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400 group-hover:text-emerald-500 transition-colors">
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>
        {/* Trending Items */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-1">Rekomendasi Terbaru</h2>
              <p className="text-zinc-500">Hewan dan perlengkapan pilihan untuk Anda</p>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="space-y-8">
              {/* Inline loading indicator */}
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                {/* Spinner */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <ShoppingBag size={24} className="text-white" />
                  </div>
                  <div className="absolute -inset-1.5 rounded-[18px] border-2 border-emerald-400/40 animate-spin border-t-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-zinc-700">Memuat Produk</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Menunggu konten dari server…</p>
                </div>
                {/* Dot bounce */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>

              {/* Skeleton cards below the spinner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-[300px] animate-pulse border border-zinc-100" style={{ animationDelay: `${(i - 1) * 60}ms` }}>
                    <div className="w-full h-1/2 bg-zinc-100 rounded-t-2xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-zinc-100 w-1/4 rounded-full" />
                      <div className="h-4 bg-zinc-100 w-3/4 rounded-full" />
                      <div className="h-3 bg-zinc-100 w-1/2 rounded-full" />
                      <div className="h-8 bg-zinc-100 w-full rounded-xl mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {paginatedListings.length > 0 ? (
                paginatedListings.map((product) => <ProductCard key={product.id} product={product} />)
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
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200/60 px-4 py-8 sm:px-6 mt-12 gap-4">
              {/* Mobile/Small Screens Pagination Info */}
              <div className="sm:hidden text-center">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Halaman <span className="text-emerald-600">{currentPage}</span> dari {totalPages}
                </p>
              </div>

              <div className="flex w-full justify-between items-center sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-[48%] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-[48%] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronLeft size={16} className="rotate-180" />
                </button>
              </div>

              {/* Desktop Pagination Info */}
              <div className="hidden sm:block">
                <p className="text-sm text-zinc-500 font-medium">
                  Showing <span className="font-black text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-black text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredListings.length)}</span> of <span className="font-black text-zinc-900">{filteredListings.length}</span> results
                </p>
              </div>

              {/* Desktop Page Numbers */}
              <div className="hidden sm:block">
                <nav className="isolate inline-flex gap-1 rounded-xl" aria-label="Pagination">
                  <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all">
                    <span className="sr-only">Previous</span>
                    <ChevronLeft size={20} />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`relative inline-flex items-center rounded-xl px-4 py-2 text-sm font-black transition-all ${currentPage === pageNum ? "z-10 bg-emerald-500 text-white scale-110" : "text-zinc-500 hover:bg-zinc-100"}`}>
                          {pageNum}
                        </button>
                      );
                    } else if ((pageNum === currentPage - 2 && pageNum > 1) || (pageNum === currentPage + 2 && pageNum < totalPages)) {
                      return (
                        <span key={pageNum} className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-zinc-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all">
                    <span className="sr-only">Next</span>
                    <ChevronLeft size={20} className="rotate-180" />
                  </button>
                </nav>
              </div>
            </div>
          )}
        </section>

        {/* Promo Banner Image Carousel - only render when there are active ads */}
        {slides.length > 0 && (
          <section className="mt-20 hidden md:block">
            <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative rounded-[2rem] overflow-hidden bg-zinc-900 text-white aspect-[1.8/1] sm:aspect-[2/1] md:aspect-[3/1] min-h-[190px] sm:min-h-[220px] md:min-h-0 flex items-center group/carousel shadow-xl border border-zinc-100/10">
              {slides.map((slide, idx) => {
                const isActive = idx === activeAdIndex;
                return (
                  <div key={slide.id} className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out flex items-center p-5 pb-9 sm:p-8 sm:pb-10 md:p-14 ${isActive ? "opacity-100 scale-100 pointer-events-auto z-10" : "opacity-0 scale-105 pointer-events-none z-0"}`}>
                    {/* Banner Desktop */}
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover hidden md:block transition-transform duration-[5000ms] ease-out"
                      style={{
                        transform: isActive ? "scale(1.02)" : "scale(1.08)",
                      }}
                    />
                    {/* Banner Mobile (Full Size, No Crop) */}
                    <img
                      src={slide.mobile_image_url || slide.image_url}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover block md:hidden transition-transform duration-[5000ms] ease-out"
                      style={{
                        transform: isActive ? "scale(1.02)" : "scale(1.08)",
                      }}
                    />
                    <div className="absolute inset-0" />

                    <div className="relative z-20 w-full md:w-2/3 flex flex-col items-center md:items-start text-center md:text-left">
                      {slide.badge && <span className="inline-flex items-center bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-xl text-[9px] sm:text-[11px] md:text-xs font-black tracking-widest mb-2 sm:mb-2.5 md:mb-4 backdrop-blur-md">{slide.badge}</span>}
                      {slide.title && <h2 className="text-base sm:text-2xl md:text-5xl lg:text-6xl font-black mb-1.5 sm:mb-2 md:mb-4 leading-tight">{slide.title}</h2>}
                      {slide.description && <p className="text-zinc-300 text-[11px] sm:text-sm md:text-lg max-w-lg opacity-90 leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-none mb-3 sm:mb-4 md:mb-6">{slide.description}</p>}

                      {slide.buttonText && (
                        <Link href={slide.link_url} className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 hover:scale-105 active:scale-95 text-zinc-900 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs md:text-base transition-all duration-300 shadow-md">
                          {slide.buttonText}
                          <ArrowUpRight size={14} className="md:w-[18px] md:h-[18px]" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Navigation Chevrons */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveAdIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="absolute left-4 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -translate-x-2 group-hover/carousel:translate-x-0 hidden sm:flex"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={() => setActiveAdIndex((prev) => (prev + 1) % slides.length)}
                    className="absolute right-4 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 translate-x-2 group-hover/carousel:translate-x-0 hidden sm:flex"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2.5 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
                    {slides.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveAdIndex(idx)} className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${activeAdIndex === idx ? "w-4 md:w-6 bg-emerald-500" : "w-1 md:w-1.5 bg-white/30 hover:bg-white/50"}`} aria-label={`Go to slide ${idx + 1}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
