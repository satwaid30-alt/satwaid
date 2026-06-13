"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CountUp from "react-countup";
import { MapPin, ShoppingBag, Store, ArrowRight, Star, Truck, Package, ChevronRight, ChevronLeft, Zap, Sparkles, MessageSquare, Search, PawPrint, ShieldCheck, FileSearch, ShieldAlert, Gavel, Clock, Tag, HelpCircle, User, Home as HomeIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import MobileMenuGrid from "../components/MobileMenuGrid";
import ProductCard from "../components/ProductCard";
import { io } from "socket.io-client";
import { SPECIES_DATA } from "../data/species";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function Home() {
  const [speciesCount, setSpeciesCount] = useState(SPECIES_DATA.length);
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const carouselRefs = useRef({}); // To store refs for each category carousel
  const [chatCounts, setChatCounts] = useState({});

  // Mobile & Desktop Ad Carousel State & Handlers
  const [advertisements, setAdvertisements] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const activeSlides = useMemo(() => {
    return advertisements.map((ad, index) => {
      const glowGradients = ["from-emerald-500/20 to-teal-500/20", "from-amber-500/20 to-orange-500/20", "from-blue-500/20 to-indigo-500/20"];

      return {
        id: ad.id,
        title: "Promosi",
        description: ad.description || "",
        badge: "PROMOSI MITRA",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        buttonText: "Kunjungi Link",
        link_url: ad.link_url || "",
        image_url: ad.image_url.startsWith("http") ? ad.image_url : `${getApiUrl()}${ad.image_url}`,
        glowColor: glowGradients[index % glowGradients.length],
      };
    });
  }, [advertisements]);

  const slidesLength = activeSlides.length;

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; // Reset to avoid unexpected jumps
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (slidesLength <= 1) return;
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe Left -> Next
      setActiveAdIndex((prev) => (prev + 1) % slidesLength);
    } else if (touchEndX.current - touchStartX.current > 50) {
      // Swipe Right -> Prev
      setActiveAdIndex((prev) => (prev - 1 + slidesLength) % slidesLength);
    }
  };

  // Auto rotation for ad slides
  useEffect(() => {
    if (slidesLength <= 1) return;
    const interval = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % slidesLength);
    }, 5000);
    return () => clearInterval(interval);
  }, [slidesLength]);

  const scroll = useCallback((catId, direction) => {
    const ref = carouselRefs.current[catId];
    if (ref) {
      const { scrollLeft, clientWidth } = ref;
      let scrollAmount;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
      const isTablet = typeof window !== "undefined" && window.innerWidth < 1024;

      if (isMobile) {
        // w-40 is 160px, gap-4 is 16px. One card scroll = 176px. 2 cards = 352px
        scrollAmount = 352;
      } else if (isTablet) {
        // w-52 is 208px, gap-4 is 16px. One card scroll = 224px. 2 cards = 448px
        scrollAmount = 448;
      } else {
        scrollAmount = clientWidth * 0.8;
      }

      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/listings`);
        const result = await response.json();
        if (response.ok) {
          const activeOnes = (result.data || []).filter((item) => item.status?.toLowerCase() === "active");
          setListings(activeOnes);
          return activeOnes;
        }
      } catch (err) {
        console.error("Failed to fetch listings from", getApiUrl(), err);
      } finally {
        setIsLoadingListings(false);
      }
    };

    const fetchChatCounts = async (listingsData) => {
      const productIds = listingsData.map((l) => l.id);
      const counts = {};

      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const res = await fetch(`${getApiUrl()}/chats/product/${pid}`);
            const result = await res.json();
            if (res.ok) {
              counts[pid] = result.count || 0;
            }
          } catch (e) {
            console.error("Error fetching product chat count from", getApiUrl(), e);
          }
        }),
      );
      setChatCounts(counts);
    };

    const fetchAdvertisements = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/advertisements`);
        const result = await response.json();
        if (response.ok) {
          const berandaAds = (result.data || []).filter((ad) => ad.placement?.toLowerCase() === "beranda" && ad.status?.toLowerCase() === "aktif");
          setAdvertisements(berandaAds);
        }
      } catch (err) {
        console.error("Failed to fetch advertisements from", getApiUrl(), err);
      }
    };

    fetchListings().then((data) => {
      if (data) fetchChatCounts(data);
    });
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    let socket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[Home Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Home Socket] Connection error:", err.message);
      // If auth error, retry as guest
      if (err.message?.toLowerCase().includes("auth") && socket.auth?.token) {
        socket.auth = {};
        socket.connect();
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Home Socket] Disconnected:", reason);
    });

    // Real-time Listing Events
    socket.on("new_listing_published", (newProduct) => {
      console.log("[Socket] New listing published:", newProduct);
      if (newProduct && newProduct.status?.toLowerCase() === "active") {
        setListings((prev) => {
          if (prev.some((item) => String(item.id) === String(newProduct.id))) {
            return prev.map((item) => (String(item.id) === String(newProduct.id) ? newProduct : item));
          }
          return [newProduct, ...prev];
        });
      }
    });

    socket.on("listing_status_updated", (updated) => {
      console.log("[Socket] Listing status updated:", updated);
      const dataId = updated.id || updated.listing_id;
      if (updated.status?.toLowerCase() !== "active") {
        setListings((prev) => prev.filter((item) => String(item.id) !== String(dataId)));
      } else {
        setListings((prev) => {
          if (prev.some((item) => String(item.id) === String(dataId))) {
            return prev.map((item) => (String(item.id) === String(dataId) ? { ...item, status: updated.status } : item));
          }
          // If we don't have it, we might need a full refetch, but here we can just do nothing for now
          // as we need full object data, or we could fetch the specific listing.
          return prev;
        });
      }
    });

    socket.on("listing_deleted", (deleted) => {
      console.log("[Socket] Listing deleted:", deleted);
      const deletedId = deleted.id || deleted.listing_id;
      setListings((prev) => prev.filter((item) => String(item.id) !== String(deletedId)));
    });

    socket.on("listing_bid_updated", (data) => {
      console.log("[Socket] Received listing_bid_updated on homepage:", data);
      const dataId = data.listing_id || data.id;
      setListings((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(dataId)) {
            const updatedBid = data.current_bid || data.highest_bid || data.current_price;
            return {
              ...item,
              current_bid: updatedBid,
              current_price: updatedBid,
              bid_count: data.bid_count || (item.bid_count ? item.bid_count + 1 : 1),
            };
          }
          return item;
        }),
      );
    });

    // Real-time Advertisement Events
    socket.on("new_advertisement_published", (ad) => {
      if (ad.status?.toLowerCase() === "aktif" && ad.placement?.toLowerCase() === "beranda") {
        setAdvertisements((prev) => [ad, ...prev]);
      }
    });

    socket.on("advertisement_updated", (updatedAd) => {
      setAdvertisements((prev) => {
        const isTargetPlacement = updatedAd.placement?.toLowerCase() === "beranda";
        const isActive = updatedAd.status?.toLowerCase() === "aktif";
        const exists = prev.some((ad) => ad.id === updatedAd.id);

        if (exists) {
          if (!isActive || !isTargetPlacement) {
            return prev.filter((ad) => ad.id !== updatedAd.id);
          }
          return prev.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad));
        } else if (isActive && isTargetPlacement) {
          return [updatedAd, ...prev];
        }
        return prev;
      });
    });

    socket.on("advertisement_deleted", ({ id }) => {
      setAdvertisements((prev) => prev.filter((ad) => ad.id !== id));
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.shop?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (item.species || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [listings, searchQuery]);

  const groupedListings = useMemo(() => {
    const groups = filteredListings
      .filter((l) => l.type !== "auction")
      .reduce((acc, listing) => {
        const cat = listing.species || "Lainnya";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(listing);
        return acc;
      }, {});
    return groups;
  }, [filteredListings]);

  const auctionListings = useMemo(() => {
    return filteredListings.filter((l) => l.type === "auction");
  }, [filteredListings]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-200 font-sans">
      <Navbar theme="dark" />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-zinc-900 border-b border-zinc-800 hidden md:block">
        <div className="absolute inset-0 z-0">
          <img src="/images/Background.jpg" alt="Hero Background" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/80 to-zinc-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Temukan Satwa <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Favoritmu</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">Marketplace terpercaya untuk jual beli satwa, perlengkapan, dan komunitas pecinta fauna.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/toko" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-105">
              Mulai Belanja <ArrowRight size={20} />
            </Link>
            <Link href="/komunitas" className="px-8 py-4 bg-white/10 border border-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md">
              Gabung Komunitas <MessageSquare size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium 3D Landscape Ad Deck Carousel (Optimized for Mobile/Handphones & Desktop) */}
      {slidesLength > 0 && (
        <section className="pt-24 pb-12 md:py-12 relative overflow-hidden select-none">
          {/* Glowing decorative background backlights */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 " />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 " />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Centered slide indicator controls */}
            <div className="flex items-center justify-center mb-8 sm:mb-10">
              {/* Dot Indicators */}
              <div className="flex gap-2">
                {Array.from({ length: slidesLength }).map((_, idx) => (
                  <button key={idx} onClick={() => setActiveAdIndex(idx)} className={`h-2 rounded-full transition-all duration-300 ${activeAdIndex === idx ? "w-6 bg-emerald-500" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} aria-label={`Slide ${idx + 1}`} />
                ))}
              </div>
            </div>

            {/* 3D Landscape Deck Wrapper */}
            <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative w-full max-w-4xl mx-auto aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center overflow-visible">
              {activeSlides.map((ad, idx) => {
                const isActive = idx === activeAdIndex;
                const isLeft = idx === (activeAdIndex - 1 + slidesLength) % slidesLength;
                const isRight = idx === (activeAdIndex + 1) % slidesLength;

                let positionClasses = "z-0 opacity-0 scale-[0.7] translate-x-[50%] pointer-events-none";
                if (isActive) {
                  positionClasses = "z-30 opacity-100 scale-100 translate-x-0 bg-zinc-100 shadow-xl group";
                } else if (isLeft) {
                  positionClasses = "z-10 opacity-30 scale-[0.82] -translate-x-[15%] sm:-translate-x-[25%] pointer-events-none bg-zinc-100/80";
                } else if (isRight) {
                  positionClasses = "z-10 opacity-30 scale-[0.82] translate-x-[15%] sm:translate-x-[25%] pointer-events-none bg-zinc-100/80";
                }

                return (
                  <div key={ad.id} className={`absolute w-[85%] sm:w-full h-full rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 flex flex-col justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${positionClasses} ${ad.link_url ? "cursor-pointer" : ""}`}>
                    {/* Full-bleed Widescreen Background Image (Fits perfectly without cropping) */}
                    <img
                      src={ad.image_url}
                      className="absolute inset-0 w-full h-full object-fill transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      alt={ad.title}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.target.src = "/images/lizards.png";
                      }}
                    />

                    {/* Subtle colorful glow matching the active slide */}
                    <div className={`absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr ${ad.glowColor} rounded-full blur-[80px] opacity-25 z-10`} />

                    {/* Entire Widescreen Clickable Link Layer (Opens in new tab) */}
                    <Link href={ad.link_url || "/toko"} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-30 cursor-pointer" aria-label="Kunjungi link promosi" />
                    {/* Understated Faded/Disguised bottom-left indicator */}
                    <div className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 bg-black/30 border border-white/5 text-white/60 font-black text-[7px] sm:text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all duration-300 z-20 pointer-events-none uppercase tracking-widest">
                      {ad.buttonText || "Kunjungi Link"}
                      <ArrowRight size={8} className="opacity-40" />
                    </div>
                  </div>
                );
              })}

              {/* Navigation Chevrons (Visible on Mobile & Desktop) */}
              {slidesLength > 1 && (
                <>
                  <button
                    onClick={() => setActiveAdIndex((prev) => (prev - 1 + slidesLength) % slidesLength)}
                    className="flex absolute left-2 sm:left-4 md:-left-12 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/40 sm:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 items-center justify-center transition-all active:scale-90 z-40 backdrop-blur-sm"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setActiveAdIndex((prev) => (prev + 1) % slidesLength)}
                    className="flex absolute right-2 sm:right-4 md:-right-12 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/40 sm:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 items-center justify-center transition-all active:scale-90 z-40 backdrop-blur-sm"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pt-8 pb-24 md:py-24 bg-zinc-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -ml-64 -mb-64" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Mobile Menu Grid (Visible on mobile/handphones only, white cards) */}
          <MobileMenuGrid className="mb-6 px-1" />
          <div className="max-w-4xl mx-auto mb-6 md:mb-10 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full group">
              <div className="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                <Search className="w-4.5 h-4.5 md:w-5 md:h-5" />
              </div>
              <input
                type="text"
                placeholder="Cari produk atau nama toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-3 md:py-4 pl-11 md:pl-14 pr-4 md:pr-6 rounded-2xl md:rounded-[1.5rem] text-xs md:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-72 group">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-zinc-900 font-black py-3 md:py-4 pl-5 md:pl-8 pr-10 md:pr-12 rounded-2xl md:rounded-[1.5rem] text-xs md:text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                {Object.keys(groupedListings).map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 md:right-5 flex items-center pointer-events-none text-zinc-400 group-hover:text-emerald-500 transition-colors">
                <ChevronRight className="w-4.5 h-4.5 md:w-5 md:h-5 rotate-90" />
              </div>
            </div>
          </div>

          {/* ===== AUCTION SECTION ===== */}
          {auctionListings.length > 0 && (
            <div className="space-y-8 animate-fade-in-up mb-4">
              <div className="flex items-center justify-between bg-white border border-zinc-100 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <h3 className="text-sm sm:text-2xl font-black text-zinc-900 flex items-center gap-1.5 sm:gap-2">Lelang</h3>
                  <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => scroll("__auction__", "left")} className="p-1.5 sm:p-2 border border-zinc-200 rounded-lg sm:rounded-xl hover:bg-zinc-50 transition-all">
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
                  </button>
                  <button onClick={() => scroll("__auction__", "right")} className="p-1.5 sm:p-2 border border-zinc-200 rounded-lg sm:rounded-xl hover:bg-zinc-50 transition-all">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
                  </button>
                </div>
              </div>
              <div
                ref={(el) => {
                  if (el) carouselRefs.current["__auction__"] = el;
                }}
                className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
              >
                {auctionListings.map((product) => (
                  <div key={product.id} className="w-40 sm:w-52 lg:w-[calc((100%-64px)/5)] shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoadingListings ? (
            <div className="space-y-8">
              {/* Inline loading indicator */}
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                {/* Spinner */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <PawPrint size={24} className="text-white" />
                  </div>
                  <div className="absolute -inset-1.5 rounded-[18px] border-2 border-emerald-400/40 animate-spin border-t-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-zinc-700">Memuat Beranda</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Menunggu rekomendasi satwa dari server…</p>
                </div>
                {/* Dot bounce */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>

              {/* Skeleton cards below the spinner */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
            <div className="space-y-6">
              {Object.entries(groupedListings)
                .filter(([catName]) => activeTab === "Semua" || activeTab === catName)
                .map(([catName, catProducts]) => {
                  if (catProducts.length === 0) return null;

                  return (
                    <div key={catName} className="space-y-8 animate-fade-in-up">
                      <div className="flex items-center justify-between bg-white border border-zinc-100 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-4 mb-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                        <h3 className="text-sm sm:text-2xl font-black text-zinc-900">{catName}</h3>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button onClick={() => scroll(catName, "left")} className="p-1.5 sm:p-2 border border-zinc-200 rounded-lg sm:rounded-xl hover:bg-zinc-50 transition-all">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
                          </button>
                          <button onClick={() => scroll(catName, "right")} className="p-1.5 sm:p-2 border border-zinc-200 rounded-lg sm:rounded-xl hover:bg-zinc-50 transition-all">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
                          </button>
                        </div>
                      </div>
                      <div
                        ref={(el) => {
                          if (el) carouselRefs.current[catName] = el;
                        }}
                        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
                      >
                        {catProducts.map((product) => (
                          <div key={product.id} className="w-40 sm:w-52 lg:w-[calc((100%-64px)/5)] shrink-0">
                            <ProductCard product={product} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Empty State */}
              {listings.length === 0 && (
                <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                  <div className="flex justify-center mb-8 text-zinc-300">
                    <ShoppingBag size={64} strokeWidth={1.5} />
                  </div>
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
            <p className="text-sm md:text-base text-zinc-500 leading-relaxed font-medium px-4 md:px-0">SatwaiD hadir sebagai platform jual beli satwa terpercaya yang menghubungkan pembeli dengan seller dan breeder berkualitas di seluruh Indonesia melalui sistem transaksi yang aman dan transparan.</p>
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
              <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-4">Ribuan pilihan satwa dan perlengkapan hobi dari seller terpercaya.</p>
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
              <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-2">Seluruh transaksi di SatwaiD menggunakan sistem Rekber untuk memberikan pengalaman jual beli yang lebih aman, transparan, dan terpercaya.</p>
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
              <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-4">Seluruh aktivitas transaksi tercatat secara jelas dan mudah dipantau.</p>
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
              <p className="text-xs md:text-[13px] text-zinc-500 leading-relaxed font-medium px-2">SatwaiD berkomitmen menjaga perdagangan satwa yang legal dan aman.</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
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
                }
                `}</style>
    </div>
  );
}
