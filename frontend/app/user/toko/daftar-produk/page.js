"use client";

import { Tag, Trash2, Edit, Eye, Search, Plus, CheckCircle2, ChevronLeft, ChevronRight, ShoppingBag, AlertCircle, XCircle, Truck, ScrollText, RotateCcw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";
import QuotaCard from "@/components/QuotaCard";
import { useShopQuota } from "@/hooks/useShopQuota";

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".3gp")
  );
};

const getPaginationRange = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

export default function DaftarJualanPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [shopId, setShopId] = useState(null);
  const { quota, loading: quotaLoading } = useShopQuota(shopId);

  // Unified Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
    isLoading: false,
    id: null,
  });

  const [, setTick] = useState(0);

  // Timer to force re-render for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActiveAuctions = listings.some((item) => {
        if (item.type !== "auction") return false;
        const status = item.status?.toLowerCase() || "active";
        const now = new Date();
        const endDate = item.end_date ? new Date(item.end_date) : null;
        return status === "active" && endDate && endDate > now;
      });

      if (hasActiveAuctions) {
        setTick((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [listings]);

  useEffect(() => {
    fetchMyListings();

    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const userData = JSON.parse(userRaw);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const socket = io(getSocketUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected to server");
        socket.emit("join_user", userData.id);
      });

      socket.on("new_notification", (data) => {
        console.log("[Socket] Received new_notification on product list:", data);
        fetchMyListings();
      });

      socket.on("listing_bid_updated", (data) => {
        console.log("[Socket] Received listing_bid_updated on product list:", data);
        fetchMyListings();
      });

      socket.on("listing_status_updated", (data) => {
        console.log("[Socket] Received listing_status_updated:", data);
        setListings((prevListings) => prevListings.map((item) => (item.id === data.id ? { ...item, status: data.status, rejection_reason: data.rejection_reason } : item)));
      });

      socket.on("listing_deleted", (data) => {
        console.log("[Socket] Received listing_deleted:", data);
        setListings((prevListings) => prevListings.filter((item) => item.id !== data.id));
        window.dispatchEvent(new CustomEvent("sync_quota"));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const fetchMyListings = async () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return;
      const userData = JSON.parse(userRaw);

      const shopRes = await fetch(`${getApiUrl()}/shops/user/${userData.id}`);
      const shopData = await shopRes.json();

      if (shopRes.ok && shopData.data) {
        // Store shopId so the hook can fetch quota
        setShopId(shopData.data.id);

        const listingsRes = await fetch(`${getApiUrl()}/listings/shop/${shopData.data.id}?all=true`);
        const listingsData = await listingsRes.json();

        if (listingsRes.ok) {
          setListings(listingsData.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setActionModal({
      isOpen: true,
      type: "danger",
      title: "Hapus Iklan Produk",
      message: `Apakah Anda yakin ingin menghapus iklan "${item.name}" secara PERMANEN? Tindakan ini akan menghapus data iklan dari toko Anda dan tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus Permanen",
      onConfirm: () => processDelete(item.id),
    });
  };

  const processDelete = async (id) => {
    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        setListings(listings.filter((item) => item.id !== id));
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Berhasil Dihapus",
          message: "Iklan produk telah berhasil dihapus secara permanen dari sistem.",
          confirmText: "Oke",
          onConfirm: () => setActionModal({ isOpen: false }),
        });
        window.dispatchEvent(new CustomEvent("sync_quota"));
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Gagal Menghapus",
        message: "Terjadi kesalahan teknis saat mencoba menghapus iklan.",
        confirmText: "Tutup",
        onConfirm: () => setActionModal({ isOpen: false }),
      });
    }
  };

  const handleDismissCancellation = async (orderId, listingId) => {
    if (!orderId) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${getApiUrl()}/orders/${encodeURIComponent(orderId)}/dismiss-cancellation`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const result = await res.json();
        // Update local state to remove the cancelled mark from this listing
        // Also sync the stock if returned
        setListings((prev) =>
          prev.map((item) =>
            item.id === listingId
              ? {
                  ...item,
                  latestCancelledOrderId: null,
                  lastOrderStatus: "cancelled_dismissed",
                  stock: result.currentStock !== null ? result.currentStock : item.stock,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("Error dismissing cancellation:", err);
    }
  };

  const getEffectiveStatus = (item) => {
    let status = item.status?.toLowerCase() || "active";

    if (item.type === "auction") {
      const now = new Date();
      const startDate = item.start_date ? new Date(item.start_date) : null;
      const endDate = item.end_date ? new Date(item.end_date) : null;
      const isEnded = status === "ended" || status === "sold" || (endDate && endDate <= now);

      if (isEnded) {
        if (Number(item.bid_count) > 0) {
          if (item.latestOrderId) {
            const orderStatus = item.lastOrderStatus?.toLowerCase();
            if (["completed", "disbursed", "disbursement_requested"].includes(orderStatus)) {
              return "auction_completed";
            }
            if (orderStatus === "cancelled" || orderStatus === "cancelled_dismissed") {
              return "auction_cancelled_dismissed";
            }
            return "auction_in_transaction";
          }
          return "auction_waiting_checkout";
        }
        return "auction_no_bids";
      }

      // Auction is active and currently running (between start & end date)
      if (status === "active" && startDate && startDate <= now && endDate && endDate > now) {
        return "proses_lelang";
      }
    }

    if (status === "active" && item.stock <= 0) return "sold";
    return status;
  };

  const filteredListings = listings.flatMap((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.species.toLowerCase().includes(searchQuery.toLowerCase()) || (item.product_id && item.product_id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || item.type === filterType;

    const effectiveStatus = getEffectiveStatus(item);

    // Exclude completed or cancelled auctions from product list (already in dashboard)
    if (item.type === "auction" && ["auction_completed", "auction_cancelled_dismissed", "auction_cancelled_transaction"].includes(effectiveStatus)) {
      return [];
    }

    let matchesStatus = false;
    if (filterStatus === "all") {
      matchesStatus = true;
    } else if (filterStatus === "sold") {
      matchesStatus = effectiveStatus === "sold";
    } else if (filterStatus === "rejected") {
      matchesStatus = ["rejected", "cancelled"].includes(effectiveStatus);
    } else if (filterStatus === "active") {
      // 'active' filter: only show non-running auctions + non-auction actives
      // auction_in_transaction & auction_waiting_checkout are post-auction, not "active"
      matchesStatus = ["active", "proses_lelang", "auction_in_transaction", "auction_waiting_checkout"].includes(effectiveStatus);
    } else {
      matchesStatus = effectiveStatus === filterStatus;
    }

    const rows = [];

    if (matchesSearch && matchesType && matchesStatus) {
      rows.push({ ...item, isVirtual: false, displayStatus: effectiveStatus });
    }

    return rows;
  });

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const paginatedListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "active":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "proses_lelang":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      case "rejected":
      case "cancelled":
      case "cancelled_order":
      case "auction_cancelled_transaction":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "sold":
      case "auction_completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "auction_in_transaction":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "auction_waiting_checkout":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "auction_no_bids":
      case "auction_cancelled_dismissed":
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "proses_lelang":
        return "Proses Lelang";
      case "pending":
        return "Pending";
      case "sold":
        return "Terjual";
      case "rejected":
        return "Ditolak Admin";
      case "cancelled":
        return "Batal Sistem";
      case "cancelled_order":
        return "Dibatalkan";
      case "auction_completed":
        return "Lelang Selesai (Terjual)";
      case "auction_cancelled_transaction":
        return "Dibatalkan";
      case "auction_cancelled_dismissed":
        return "Lelang Selesai (Batal)";
      case "auction_in_transaction":
        return "Proses Transaksi";
      case "auction_waiting_checkout":
        return "Menunggu Checkout";
      case "auction_no_bids":
        return "Lelang Selesai (Tidak Ada Bid)";
      default:
        return status || "Aktif";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat data jualan anda...</p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">Daftar Produk Toko</h1>
          <p className="text-zinc-500 text-sm mt-1">Kelola semua iklan jualan dan lelang reptil Anda.</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuotaCard quota={quota} loading={quotaLoading} />
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest leading-tight">Total Produk</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-0.5">Seluruh iklan aktif & non-aktif</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none text-white">{listings.length}</span>
                  <span className="text-zinc-600 font-bold text-xs sm:text-sm">iklan</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold mt-0.5 uppercase tracking-wider">Terdaftar di sistem</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tipe Produk</p>
                <p className="text-xs sm:text-sm font-black text-blue-400">
                  {listings.filter((item) => item.type === "sell").length} <span className="text-zinc-600 text-[8px] font-bold uppercase">Reguler</span>
                  <span className="text-zinc-700 mx-1">•</span>
                  {listings.filter((item) => item.type === "auction").length} <span className="text-zinc-600 text-[8px] font-bold uppercase">Lelang</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest leading-tight">Produk Pending</p>
                  <p className="text-[9px] text-zinc-600 font-bold mt-0.5">Menunggu persetujuan admin</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none ${listings.filter((item) => getEffectiveStatus(item) === "pending").length > 0 ? "text-amber-400 animate-pulse" : "text-white"}`}>{listings.filter((item) => getEffectiveStatus(item) === "pending").length}</span>
                  <span className="text-zinc-600 font-bold text-xs sm:text-sm">produk</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold mt-0.5 uppercase tracking-wider">Menunggu verifikasi</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status Lain</p>
                <p className="text-xs sm:text-sm font-black text-red-400">
                  {listings.filter((item) => getEffectiveStatus(item) === "rejected").length} <span className="text-zinc-600 text-[8px] font-bold uppercase">Ditolak</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-[2rem] flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input type="text" placeholder="Cari nama Produk atau id produk..." className="w-full bg-zinc-950 border border-transparent rounded-[1.5rem] pl-14 pr-6 py-4 text-sm text-white focus:border-emerald-500 transition-all outline-none" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="hidden md:flex bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-1.5">
            {[
              { id: "all", label: "Tipe: Semua" },
              { id: "sell", label: "Jual" },
              { id: "auction", label: "Lelang" },
            ].map((type) => (
              <button key={type.id} onClick={() => handleFilterChange(type.id)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filterType === type.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}>
                {type.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-1.5">
            {[
              { id: "all", label: "Status: Semua" },
              { id: "active", label: "Aktif" },
              { id: "pending", label: "Pending" },
              { id: "sold", label: "Terjual" },
              { id: "rejected", label: "Dibatalkan" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => {
                  setFilterStatus(status.id);
                  setCurrentPage(1);
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${filterStatus === status.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            <select value={filterType} onChange={(e) => handleFilterChange(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-white text-xs font-black px-4 py-4 rounded-2xl outline-none appearance-none">
              <option value="all">Tipe: Semua</option>
              <option value="sell">Jual</option>
              <option value="auction">Lelang</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-950 border border-zinc-800 text-white text-xs font-black px-4 py-4 rounded-2xl outline-none appearance-none"
            >
              <option value="all">Status: Semua</option>
              <option value="active">Aktif</option>
              <option value="pending">Pending</option>
              <option value="sold">Terjual</option>
              <option value="rejected">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table View (Desktop) */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">No.</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Produk</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Tanggal</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Harga / Bid</th>
                {/* <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Nomor Invoice</th> */}
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Stok</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Status</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedListings.length > 0 ? (
                paginatedListings.map((item, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr key={item.id} className="transition-colors group hover:bg-zinc-800/30">
                      <td className="p-6 text-xs font-bold text-zinc-600">{globalIndex + 1}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 group-hover:border-zinc-700 transition-all">
                            {item.images && item.images[0] && isVideoUrl(item.images[0]) ? (
                              <video src={getImageUrl(item.images[0])} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                            ) : (
                              <img src={item.images && item.images[0] ? getImageUrl(item.images[0]) : "https://placehold.co/400x400/18181b/52525b?text=No+Image"} alt={item.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white line-clamp-1">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{item.species}</p>
                              {item.product_id && (
                                <>
                                  <span className="text-zinc-700 text-[10px]">•</span>
                                  <p className="text-[10px] font-mono font-black text-zinc-400">{item.product_id}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${item.type === "sell" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{item.type === "sell" ? "Reguler" : "Lelang"}</span>
                            </div>
                            {item.displayStatus === "rejected" && item.rejection_reason && (
                              <div className="flex items-start gap-1.5 mt-2 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2 max-w-xs">
                                <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] font-bold text-red-400 leading-snug">{item.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-bold text-zinc-400">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">{new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-white">{formatPrice(item.type === "sell" ? item.price : item.current_bid || item.start_bid)}</p>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-white">{item.stock || 0}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${getStatusStyles(item.displayStatus)}`}>{getStatusLabel(item.displayStatus)}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          <>
                            <Link
                              href={item.type === "auction" ? `/user/toko/lelang-produk/detail/${item.id}` : `/user/toko/daftar-produk/detail/${item.id}`}
                              className={`w-10 h-10 bg-zinc-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 ${item.type === "auction" ? "hover:bg-amber-500 hover:text-zinc-950" : "hover:bg-emerald-500 hover:text-zinc-950"}`}
                              title="Detail Iklan"
                            >
                              <Eye size={18} />
                            </Link>
                            {item.type === "auction" && item.latestOrderUuid && (
                              <Link href={`/user/toko/pesanan-masuk/detail/${item.latestOrderUuid}`} className="w-10 h-10 bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-violet-500/20" title="Kelola Transaksi Lelang">
                                <ShoppingBag size={18} />
                              </Link>
                            )}
                            {item.type === "auction"
                              ? (Number(item.bid_count || 0) === 0 || item.displayStatus === "auction_cancelled_dismissed") &&
                                item.displayStatus !== "proses_lelang" && (
                                  <>
                                    <Link href={`/user/toko/lelang-produk/edit/${item.id}`} className="w-10 h-10 bg-zinc-800 text-white hover:bg-amber-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all active:scale-90" title="Edit Lelang">
                                      <Edit size={18} />
                                    </Link>
                                    <Link href={`/user/toko/lelang-produk/edit/${item.id}?reauction=true`} className="w-10 h-10 bg-zinc-800 text-white hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all active:scale-90" title="Lelang Kembali">
                                      <RotateCcw size={18} />
                                    </Link>
                                    <button onClick={() => openDeleteModal(item)} className="w-10 h-10 bg-zinc-800 text-white hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90" title="Hapus Lelang">
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )
                              : item.displayStatus !== "sold" && (
                                  <>
                                    <Link href={`/user/toko/jual-produk/edit/${item.id}`} className="w-10 h-10 bg-zinc-800 text-white hover:bg-amber-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all active:scale-90" title="Edit Iklan">
                                      <Edit size={18} />
                                    </Link>
                                    <button onClick={() => openDeleteModal(item)} className="w-10 h-10 bg-zinc-800 text-white hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90" title="Hapus Iklan">
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                          </>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-600">{listings.length > 0 ? <Search size={32} /> : <Tag size={32} />}</div>
                      <div>
                        <p className="text-lg font-black text-white">{listings.length > 0 ? "Data tidak ditemukan" : "Belum ada iklan"}</p>
                        <p className="text-zinc-500 text-sm italic">{listings.length > 0 ? "- Silakan cari dengan kata kunci lain atau ubah filter Anda -" : "- Belum ada data untuk ditampilkan -"}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card View (Mobile) */}
      <div className="md:hidden space-y-4">
        {paginatedListings.length > 0 ? (
          paginatedListings.map((item, index) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Card Header */}
              <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-black text-zinc-500">{index + 1}</span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(item.displayStatus)}`}>{getStatusLabel(item.displayStatus)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${item.type === "sell" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{item.type === "sell" ? "Reguler" : "Lelang"}</span>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                    {item.images && item.images[0] && isVideoUrl(item.images[0]) ? (
                      <video src={getImageUrl(item.images[0])} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                    ) : (
                      <img src={item.images && item.images[0] ? getImageUrl(item.images[0]) : "https://placehold.co/400x400/18181b/52525b?text=No+Image"} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white line-clamp-1 mb-0.5">{item.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{item.species}</p>
                      {item.product_id && <p className="text-[9px] font-mono font-black text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{item.product_id}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{formatPrice(item.type === "sell" ? item.price : item.current_bid || item.start_bid)}</span>
                      <span className="text-[10px] font-bold italic text-zinc-500">{`Stok: ${item.stock || 0}`}</span>
                    </div>
                  </div>
                </div>
                {item.displayStatus === "rejected" && item.rejection_reason && (
                  <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3">
                    <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Alasan Penolakan Admin</p>
                      <p className="text-[10px] font-bold text-red-300 leading-snug">{item.rejection_reason}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-xl col-span-2">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ScrollText size={10} className={item.latestOrderId ? "text-emerald-500" : "text-zinc-500"} />
                      Nomor Invoice
                    </p>
                    {item.latestOrderId ? <p className="text-[10px] font-black text-white font-mono">{item.latestOrderId}</p> : <p className="text-[10px] font-bold text-zinc-600 italic">Belum Terjual</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <>
                    <Link
                      href={item.type === "auction" ? `/user/toko/lelang-produk/detail/${item.id}` : `/user/toko/daftar-produk/detail/${item.id}`}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 text-zinc-400 rounded-xl transition-all border border-zinc-700 ${item.type === "auction" ? "hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-500" : "hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500"}`}
                    >
                      <Eye size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Detail</span>
                    </Link>
                    {item.type === "auction" && item.latestOrderUuid && (
                      <Link href={`/user/toko/pesanan-masuk/detail/${item.latestOrderUuid}`} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl transition-all border border-violet-500/20 hover:border-violet-600 font-bold">
                        <ShoppingBag size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Transaksi</span>
                      </Link>
                    )}
                    {item.type === "auction"
                      ? (Number(item.bid_count || 0) === 0 || item.displayStatus === "auction_cancelled_dismissed") &&
                        item.displayStatus !== "proses_lelang" && (
                          <>
                            <Link href={`/user/toko/lelang-produk/edit/${item.id}`} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-amber-500">
                              <Edit size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                            </Link>
                            <Link href={`/user/toko/lelang-produk/edit/${item.id}?reauction=true`} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-emerald-500">
                              <RotateCcw size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Lelang</span>
                            </Link>
                            <button onClick={() => openDeleteModal(item)} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-700 hover:border-red-500">
                              <Trash2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Hapus</span>
                            </button>
                          </>
                        )
                      : item.displayStatus !== "sold" && (
                          <>
                            <Link href={`/user/toko/jual-produk/edit/${item.id}`} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-amber-500">
                              <Edit size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                            </Link>
                            <button onClick={() => openDeleteModal(item)} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-700 hover:border-red-500">
                              <Trash2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Hapus</span>
                            </button>
                          </>
                        )}
                  </>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center text-center space-y-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-700">{listings.length > 0 ? <Search size={32} /> : <Tag size={32} />}</div>
            <div>
              <p className="text-sm font-black text-white">{listings.length > 0 ? "Data tidak ditemukan" : "Belum ada iklan"}</p>
              <p className="text-xs text-zinc-500 italic mt-1">{listings.length > 0 ? "- Coba kata kunci atau filter lain -" : "Data jualan Anda akan muncul di sini"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] mt-6">
          <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredListings.length)} dari {filteredListings.length} Produk jualan
          </p>
          <div className="flex items-center">
            <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 divide-x divide-zinc-800 overflow-hidden">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
                <ChevronLeft size={16} />
              </button>

              {getPaginationRange(currentPage, totalPages).map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === "number" && goToPage(page)}
                  disabled={page === "..."}
                  className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all ${page === currentPage ? "bg-zinc-800 text-white font-black" : page === "..." ? "text-zinc-500 cursor-default bg-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 bg-zinc-950"}`}
                >
                  {page}
                </button>
              ))}

              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Action Modal */}
      <ActionModal isOpen={actionModal.isOpen} onClose={() => setActionModal({ ...actionModal, isOpen: false })} onConfirm={actionModal.onConfirm} isLoading={actionModal.isLoading} type={actionModal.type} title={actionModal.title} message={actionModal.message} confirmText={actionModal.confirmText} />
    </div>
  );
}
