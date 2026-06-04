"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gavel, Search, Clock, CheckCircle2, XCircle, Store, ArrowRight, AlertCircle, Eye, Sparkles } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

// Individual Card Component with self-contained countdown state
function AuctionCard({ listing, currentUserId }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState(listing.status); // active, ended, etc.

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const start = listing.start_date ? new Date(listing.start_date).getTime() : 0;
      const end = listing.end_date ? new Date(listing.end_date).getTime() : 0;

      if (start > now) {
        setAuctionStatus("scheduled");
        const distance = start - now;
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      } else if (end > now) {
        setAuctionStatus("active");
        const distance = end - now;
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      } else {
        setAuctionStatus("ended");
        setTimeLeft(null);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [listing]);

  // Derive userStatus directly during render to prevent cascading render cycles
  const isEnded = auctionStatus === "ended" || listing.status === "ended" || listing.status === "sold";
  const isHighest = listing.highest_bidder_id === currentUserId;
  const userStatus = isEnded ? (isHighest ? "won" : "lost") : isHighest ? "highest" : "outbid";

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getStatusStyles = () => {
    switch (userStatus) {
      case "highest":
        return {
          label: "Tertinggi",
          badge: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
          description: "Penawaran Anda saat ini memimpin lelang!",
        };
      case "outbid":
        return {
          label: "Tersalip",
          badge: "bg-amber-950/80 text-amber-400 border-amber-500/30",
          description: "Penawaran Anda telah dilompati! Pasang bid baru untuk memimpin.",
        };
      case "won":
        return {
          label: "Menang",
          badge: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
          description: "Selamat! Anda memenangkan lelang. Selesaikan pembayaran di tab Pesanan Aktif.",
        };
      case "lost":
        return {
          label: "Kalah",
          badge: "bg-red-950/80 text-red-400 border-red-500/30",
          description: "Lelang selesai. Anda tidak memenangkan lelang ini.",
        };
      default:
        return {
          label: "Diikuti",
          badge: "bg-zinc-950/80 text-zinc-400 border-zinc-800",
          description: "Anda mengikuti lelang ini.",
        };
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden transition-all group p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Image section */}
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700 relative mx-auto md:mx-0">
        <img src={listing.images?.[0]} alt={listing.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${statusStyle.badge} backdrop-blur-md`}>{statusStyle.label}</div>
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-zinc-500 mb-1">
          <Store size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">{listing.shop?.name}</span>
          {listing.product_id && (
            <>
              <span className="text-zinc-750">•</span>
              <span className="text-[9px] font-black bg-zinc-800/50 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-700/50 uppercase tracking-widest">ID Produk: {listing.product_id}</span>
            </>
          )}
        </div>
        <h3 className="text-base md:text-xl font-black text-white mb-2 line-clamp-2">{listing.name}</h3>

        {/* Timer info */}
        <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-400 mb-4 bg-zinc-950/40 w-fit mx-auto md:mx-0 px-3 py-1.5 rounded-xl border border-zinc-800/80">
          <Clock size={12} className="text-zinc-500" />
          {auctionStatus === "scheduled" && timeLeft && (
            <span className="text-amber-500 font-bold">
              Dimulai dalam {timeLeft.d > 0 ? `${timeLeft.d}h ` : ""}
              {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
            </span>
          )}
          {auctionStatus === "active" && timeLeft && (
            <span className="text-emerald-400 font-bold">
              Sisa: {timeLeft.d > 0 ? `${timeLeft.d}h ` : ""}
              {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
            </span>
          )}
          {auctionStatus === "ended" && <span className="text-zinc-500 font-medium">Lelang telah berakhir</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-800/50">
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Tawaran Tertinggi</p>
            <p className="text-sm md:text-base font-black text-white">{formatPrice(listing.current_bid)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Tawaran Anda</p>
            <p className="text-sm md:text-base font-black text-emerald-500">{formatPrice(listing.user_max_bid)}</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Total Penawaran</p>
            <p className="text-sm md:text-base font-black text-zinc-400">{listing.bid_count} Kali</p>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold text-zinc-400">
          <Sparkles size={12} className="text-emerald-500" />
          <span>{statusStyle.description}</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-row md:flex-col justify-center items-stretch gap-3 w-full md:w-auto shrink-0 self-stretch md:self-start">
        <Link href={`/toko/detail-lelang/${listing.id}`} className="flex-1 md:flex-none px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-2xl transition-all text-xs font-black flex items-center justify-center gap-2 active:scale-95">
          <Eye size={14} /> Detail Lelang
        </Link>
      </div>
    </div>
  );
}

export default function LelangPage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua"); // "semua", "berjalan", "menang", "kalah"
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUserBids = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${getApiUrl()}/bids/user/${userId}`);
      const result = await response.json();
      if (response.ok && result.data) {
        setListings(result.data);
      }
    } catch (err) {
      console.error("Error fetching user bids:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        fetchUserBids(user.id);
      } catch (e) {
        console.error("Error parsing user data", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Setup Socket.IO for Live Updates
  useEffect(() => {
    if (!currentUser) return;

    let socket;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      socket = io(getSocketUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });

      // Join user room
      socket.emit("join_user", currentUser.id);

      socket.on("new_notification", () => {
        fetchUserBids(currentUser.id);
      });

      socket.on("listing_bid_updated", (data) => {
        // If a bid update comes in for any listing, refresh the data to update current highest bid, user status, etc.
        fetchUserBids(currentUser.id);
      });

      socket.on("auction_ended", () => {
        fetchUserBids(currentUser.id);
      });
    } catch (e) {
      console.error("Socket connection error", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentUser]);

  const filteredListings = listings.filter((item) => {
    // Exclude ended/finished auctions
    const now = new Date().getTime();
    const end = item.end_date ? new Date(item.end_date).getTime() : 0;
    const isEnded = item.status === "ended" || item.status === "sold" || end <= now;

    if (isEnded) return false;

    // Search query filter
    const matchesSearch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (item.shop?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    let matchesTab = true;
    if (activeTab === "berjalan") {
      matchesTab = item.user_status === "highest" || item.user_status === "outbid";
    } else if (activeTab === "menang") {
      matchesTab = item.user_status === "won" || item.user_status === "highest";
    } else if (activeTab === "kalah") {
      matchesTab = item.user_status === "lost" || item.user_status === "outbid";
    }

    return matchesSearch && matchesTab;
  });

  const getTabCount = (tabId) => {
    const activeListings = listings.filter((item) => {
      const now = new Date().getTime();
      const end = item.end_date ? new Date(item.end_date).getTime() : 0;
      const isEnded = item.status === "ended" || item.status === "sold" || end <= now;
      return !isEnded;
    });

    if (tabId === "semua") return activeListings.length;
    if (tabId === "berjalan") {
      return activeListings.filter((item) => item.user_status === "highest" || item.user_status === "outbid").length;
    }
    if (tabId === "menang") {
      return activeListings.filter((item) => item.user_status === "won" || item.user_status === "highest").length;
    }
    if (tabId === "kalah") {
      return activeListings.filter((item) => item.user_status === "lost" || item.user_status === "outbid").length;
    }
    return 0;
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">Lelang Aktif</h1>
          <p className="text-zinc-400 font-medium">Pantau semua lelang yang sedang Anda ikuti dan tawaran Anda</p>
        </div>
        <div>
          <Link href="/lelang" className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group">
            Cari Lelang Lain
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-emerald-500" />
          </Link>
        </div>
      </div>

      {/* Filter & Search Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-2 md:p-3 flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Cari lelang berdasarkan nama produk atau toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl md:rounded-2xl py-3 md:py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-xs md:text-sm font-medium"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {[
            { id: "semua", label: "Semua" },
            { id: "berjalan", label: "Berjalan" },
            { id: "menang", label: "Tertinggi / Menang" },
            { id: "kalah", label: "Tersalip / Kalah" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-3 px-4 md:px-6 py-3 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all border ${
                activeTab === tab.id ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${activeTab === tab.id ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>{getTabCount(tab.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-44 bg-zinc-900/50 border border-zinc-800 rounded-3xl animate-pulse" />)
        ) : filteredListings.length > 0 ? (
          filteredListings.map((item) => <AuctionCard key={item.id} listing={item} currentUserId={currentUser?.id} />)
        ) : (
          <div className="py-20 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] border-dashed">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
              <Gavel size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Tidak Ada Lelang</h3>
              <p className="text-zinc-500 max-w-xs mx-auto text-sm">{searchQuery ? "Lelang yang Anda cari tidak ditemukan." : "Anda belum memiliki riwayat keikutsertaan lelang pada kategori ini."}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
