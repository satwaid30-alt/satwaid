"use client";

import { Package, Search, Eye, Trash2, ShoppingBag, CheckCircle2, XCircle, AlertCircle, Edit, Info, MessageSquare, MoreVertical, Store, RotateCcw, Bell, Sparkles, X, Ban } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getLogoUrl, getImageUrl } from "@/app/utils/api";

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm") || lower.endsWith(".mkv") || lower.endsWith(".3gp");
};

export default function AdminDetailProdukPage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Real-time state
  const [toasts, setToasts] = useState([]);
  const [newItemIds, setNewItemIds] = useState(new Set());
  const [newPendingCount, setNewPendingCount] = useState(0);
  const toastIdRef = useRef(0);

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
    rejectionReason: "",
    showReasonInput: false,
  });

  // Toast helpers
  const addToast = (toast) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [{ id, ...toast }, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    fetchListings();

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const socket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });

    socket.on("connect", () => {
      socket.emit("join_admin");
      console.log("[Admin Socket] Joined admin_room — real-time aktif");
    });

    socket.on("new_listing_admin", (newListing) => {
      // Tambah ke daftar produk
      setListings((prev) => {
        if (prev.some((item) => item.id === newListing.id)) return prev;
        return [newListing, ...prev];
      });

      // Tandai sebagai item baru untuk highlight animasi
      setNewItemIds((prev) => new Set([...prev, newListing.id]));
      setTimeout(() => {
        setNewItemIds((prev) => {
          const next = new Set(prev);
          next.delete(newListing.id);
          return next;
        });
      }, 8000);

      // Update counter pending baru
      if (newListing.status?.toLowerCase() === "pending") {
        setNewPendingCount((prev) => prev + 1);
      }

      // Tampilkan toast notification
      addToast({
        type: "new",
        title: "Pengajuan Produk Baru!",
        message: newListing.name || "Produk baru menunggu moderasi.",
        shop: newListing.shop?.name || "Toko",
        listingId: newListing.id,
      });
    });

    socket.on("listing_updated_admin", (updatedListing) => {
      setListings((prev) => prev.map((item) => (item.id === updatedListing.id ? { ...item, ...updatedListing } : item)));
    });

    socket.on("listing_deleted_admin", (data) => {
      setListings((prev) => prev.filter((item) => item.id !== data.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/listings?all=true`);
      const result = await response.json();
      if (response.ok) {
        setListings(result.data);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setActionModal({
      isOpen: true,
      type: "danger",
      title: "Hapus Produk",
      message: `Apakah Anda yakin ingin menghapus produk "${item.name}" secara permanen? Data ini tidak dapat dikembalikan.`,
      confirmText: "Ya, Hapus Permanen",
      id: item.id,
      onConfirm: () => processDelete(item.id),
    });
  };

  const processDelete = async (id) => {
    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (response.ok) {
        fetchListings();
        setActionModal({ isOpen: false });
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
    } finally {
      setActionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const openBulkVerifyModal = () => {
    const pendingCount = listings.filter((l) => l.status?.toLowerCase() === "pending").length;
    setActionModal({
      isOpen: true,
      type: "success",
      title: "Setujui Semua Pending",
      message: `Apakah Anda yakin ingin memverifikasi dan menyetujui ${pendingCount} produk pending sekaligus? Semua produk ini akan langsung aktif di marketplace.`,
      confirmText: "Ya, Setujui Semua",
      id: null,
      onConfirm: () => processBulkVerify(),
    });
  };

  const processBulkVerify = async () => {
    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/listings/bulk-verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await response.json();
      if (response.ok) {
        addToast({
          type: "success",
          title: "Verifikasi Masal Berhasil!",
          message: result.message || "Semua produk pending telah disetujui.",
          shop: "Sistem Admin",
          listingId: "",
        });
        fetchListings();
        setActionModal({ isOpen: false });
      } else {
        alert(result.message || "Gagal memproses verifikasi massal");
      }
    } catch (err) {
      console.error("Error bulk verifying listings:", err);
      alert("Terjadi kesalahan koneksi saat memproses verifikasi massal");
    } finally {
      setActionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const openCancelAuctionModal = (item) => {
    setActionModal({
      isOpen: true,
      type: "warning",
      title: "Batalkan Lelang",
      message: `Apakah Anda yakin ingin membatalkan lelang untuk "${item.name}"? Tuliskan alasan pembatalan lelang di bawah:`,
      confirmText: "Batalkan Lelang",
      id: item.id,
      rejectionReason: "",
      showReasonInput: true,
      onConfirm: () => {}, // dummy, will be intercepted
    });
  };

  const processCancelAuction = async (id, reason) => {
    if (!reason || !reason.trim()) {
      alert("Harap masukkan alasan pembatalan lelang.");
      return;
    }

    setActionModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/listings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: reason.trim(),
        }),
      });

      if (response.ok) {
        addToast({
          type: "success",
          title: "Lelang Dibatalkan",
          message: "Lelang berhasil dibatalkan dan produk diturunkan.",
          shop: "Sistem Admin",
          listingId: id,
        });
        fetchListings();
        setActionModal({ isOpen: false, showReasonInput: false, rejectionReason: "" });
      } else {
        const result = await response.json();
        alert(result.message || "Gagal membatalkan lelang");
      }
    } catch (err) {
      console.error("Error cancelling auction:", err);
      alert("Terjadi kesalahan koneksi saat memproses pembatalan lelang");
    } finally {
      setActionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product_id && item.product_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.latestOrderId && item.latestOrderId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const paginatedListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "sold":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "history":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const getStatusLabel = (status) => {
    if (status?.toLowerCase() === "sold") return "Terjual";
    return status || "Active";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 lg:p-10 space-y-8 animate-in fade-in duration-700 relative">
      {/* ── Toast Notifications (Real-time) ── */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto flex items-start gap-3 bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50 w-[320px] animate-in slide-in-from-right-5 duration-400">
            {/* Icon */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Bell size={16} className="text-amber-400 animate-pulse" />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{toast.title}</p>
              </div>
              <p className="text-xs font-bold text-white line-clamp-1">{toast.message}</p>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                dari <span className="text-zinc-300">{toast.shop}</span>
              </p>
              {toast.listingId && (
                <Link href={`/admin/toko-user/detail-produk/detail/${toast.listingId}`} className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                  <Eye size={10} /> Lihat Detail →
                </Link>
              )}
            </div>
            {/* Close */}
            <button onClick={() => removeToast(toast.id)} className="shrink-0 w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="text-emerald-500" size={32} />
            Manajemen Produk
          </h1>
          <p className="text-zinc-500 mt-1 font-medium flex items-center gap-2">
            Data produk dari seluruh mitra toko marketplace.
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {listings.filter((l) => l.status?.toLowerCase() === "pending").length > 0 && (
            <button
              onClick={openBulkVerifyModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/15"
            >
              <CheckCircle2 size={16} />
              Setujui Semua Pending
            </button>
          )}
          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
            <div className="px-4 py-2 text-center border-r border-zinc-800">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Produk</p>
              <p className="text-xl font-black text-white">{listings.length}</p>
            </div>
            <div className="px-4 py-2 text-center relative">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Menunggu</p>
              <p className="text-xl font-black text-amber-500 flex items-center gap-1.5">
                {listings.filter((l) => l.status === "pending").length}
                {newPendingCount > 0 && (
                  <button
                    onClick={() => {
                      setStatusFilter("pending");
                      setNewPendingCount(0);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded-full animate-bounce"
                    title={`${newPendingCount} pengajuan baru`}
                  >
                    +{newPendingCount}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="relative group flex-1 w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari ID produk, nama produk, toko, invoice, atau spesies..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all shadow-xl font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-2xl gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar shadow-lg">
          {[
            { id: "all", label: "Semua", icon: Package },
            {
              id: "pending",
              label: "Pending",
              icon: AlertCircle,
              color: "text-amber-500",
            },
            {
              id: "active",
              label: "Aktif",
              icon: CheckCircle2,
              color: "text-emerald-500",
            },
            {
              id: "rejected",
              label: "Ditolak",
              icon: XCircle,
              color: "text-red-500",
            },
            {
              id: "history",
              label: "History",
              icon: RotateCcw,
              color: "text-zinc-400",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${statusFilter === tab.id ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
            >
              <tab.icon size={14} className={statusFilter === tab.id ? tab.color || "text-emerald-500" : "text-zinc-500"} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table View (Desktop) */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">No.</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Produk</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Toko</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Tanggal</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Harga / Stok</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Status</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Invoice</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Tgl Terjual</th>
                <th className="p-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedListings.length > 0 ? (
                paginatedListings.map((item, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <tr key={item.id} className={`hover:bg-zinc-800/30 transition-all duration-700 group ${newItemIds.has(item.id) ? "bg-amber-500/5 border-l-2 border-amber-500" : ""}`}>
                      {/* Badge baru di atas row jika baru masuk */}
                      <td className="p-6 text-xs font-bold text-zinc-600">
                        <div className="flex flex-col items-center gap-1">
                          <span>{globalIndex + 1}</span>
                          {newItemIds.has(item.id) && <span className="text-[7px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">NEW</span>}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-inner group-hover:border-zinc-700 transition-all">
                            {item.images && item.images[0] ? (
                              isVideoUrl(item.images[0]) ? (
                                <video src={getImageUrl(item.images[0])} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                              ) : (
                                <img src={getImageUrl(item.images[0])} alt={item.name} className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                <ShoppingBag size={20} />
                              </div>
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
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">{item.shop?.logo_url ? <img src={getLogoUrl(item.shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={12} className="text-zinc-500" />}</div>
                          <p className="text-xs font-bold text-zinc-400">{item.shop?.name}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-bold text-zinc-400">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">{new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-white">Rp {new Number(item.type === "sell" ? item.price : item.current_bid || item.start_bid).toLocaleString("id-ID")}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-0.5">
                          Stok: <span className="text-emerald-500">{item.stock || 0}</span>
                        </p>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm w-fit ${getStatusStyles(item.status)}`}>{getStatusLabel(item.status)}</span>
                      </td>
                      <td className="p-6">
                        {item.latestOrderId ? (
                          <div className="flex flex-col gap-1 w-fit">
                            {item.latestOrderId.split(", ").map((inv) => {
                              const [orderId, status] = inv.split("::");
                              return (
                                 <div key={orderId} className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-sm w-fit">
                                   <span className="text-[10px] font-black text-white font-mono tracking-tighter">{orderId}</span>
                                   {status === "cancelled" && <span className="text-[8px] text-red-400 font-bold uppercase shrink-0">(Batal)</span>}
                                   {status === "cancelled_dismissed" && <span className="text-[8px] text-red-400 font-bold uppercase shrink-0">(Dibatalkan (Dibersihkan))</span>}
                                   {status === "disbursed" && <span className="text-[8px] text-emerald-400 font-bold uppercase shrink-0">(Dicairkan)</span>}
                                 </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-600 italic">Belum Terjual</span>
                        )}
                      </td>
                      <td className="p-6">
                        {item.sold_at ? (
                          <>
                            <p className="text-xs font-bold text-zinc-400">
                              {new Date(item.sold_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">{new Date(item.sold_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                          </>
                        ) : (
                          <p className="text-xs font-black text-zinc-700">-</p>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/toko-user/detail-produk/detail/${item.id}`} className="w-10 h-10 bg-zinc-800 text-white hover:bg-emerald-500 hover:text-zinc-950 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90" title="Detail & Moderasi">
                            <Eye size={18} />
                          </Link>
                          {item.type === "auction" && item.status?.toLowerCase() === "active" && (
                            <button
                              onClick={() => openCancelAuctionModal(item)}
                              className="w-10 h-10 bg-zinc-800 text-white hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                              title="Batalkan Lelang"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                          <button onClick={() => openDeleteModal(item)} className="w-10 h-10 bg-zinc-800 text-white hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90" title="Hapus Produk">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-600">
                        <Package size={32} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">Produk tidak ditemukan</p>
                        <p className="text-zinc-500 text-sm italic">- Belum ada data untuk ditampilkan -</p>
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
          paginatedListings.map((item, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <div key={item.id} className={`border rounded-[2rem] overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-300 transition-all ${newItemIds.has(item.id) ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900 border-zinc-800"}`} style={{ animationDelay: `${index * 50}ms` }}>
                {/* Card Header: No & Status */}
                <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-black text-zinc-500">{globalIndex + 1}</span>
                    {newItemIds.has(item.id) && (
                      <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <Sparkles size={8} /> Baru
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(item.status)}`}>{getStatusLabel(item.status)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${item.type === "sell" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{item.type === "sell" ? "Jual" : "Lelang"}</span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-inner">
                      {item.images && item.images[0] ? (
                        isVideoUrl(item.images[0]) ? (
                          <video src={getImageUrl(item.images[0])} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                        ) : (
                          <img src={getImageUrl(item.images[0])} alt={item.name} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-950">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white line-clamp-1 mb-0.5">{item.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{item.species}</p>
                        {item.product_id && <p className="text-[9px] font-mono font-black text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{item.product_id}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">{item.shop?.logo_url ? <img src={getLogoUrl(item.shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={10} className="text-zinc-500" />}</div>
                        <p className="text-[10px] font-bold text-zinc-400 truncate">{item.shop?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-xl">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Harga / Stok</p>
                      <p className="text-[10px] font-bold text-zinc-300">Rp {new Number(item.type === "sell" ? item.price : item.current_bid || item.start_bid).toLocaleString("id-ID")}</p>
                      <p className="text-[9px] text-emerald-500 font-black mt-0.5">Stok: {item.stock || 0}</p>
                    </div>
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-xl">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Nomor Invoice</p>
                      {item.latestOrderId ? (
                        <div className="flex flex-col gap-1">
                          {item.latestOrderId.split(", ").map((inv) => {
                            const [orderId, status] = inv.split("::");
                            return (
                              <div key={orderId} className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-white font-mono block">{orderId}</span>
                                {status === "cancelled" && <span className="text-[8px] text-red-400 font-bold uppercase">(Batal)</span>}
                                {status === "cancelled_dismissed" && <span className="text-[8px] text-red-400 font-bold uppercase">(Dibatalkan (Dibersihkan))</span>}
                                {status === "disbursed" && <span className="text-[8px] text-emerald-400 font-bold uppercase">(Dicairkan)</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-600 italic">Belum Terjual</span>
                      )}
                    </div>
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-xl col-span-2">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Terakhir Update</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-zinc-300">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-[9px] font-bold text-zinc-600">{new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Link href={`/admin/toko-user/detail-produk/detail/${item.id}`} className="flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-emerald-500">
                      <Eye size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Detail</span>
                    </Link>
                    {item.type === "auction" && item.status?.toLowerCase() === "active" ? (
                      <button onClick={() => openCancelAuctionModal(item)} className="flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-700 hover:border-red-500">
                        <Ban size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Batal</span>
                      </button>
                    ) : (
                      <Link href={`/user/toko/jual-produk/edit/${item.id}`} className="flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-amber-500">
                        <Edit size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                      </Link>
                    )}
                    <button onClick={() => openDeleteModal(item)} className="flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-700 hover:border-red-500">
                      <Trash2 size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 flex flex-col items-center text-center space-y-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-700">
              <Package size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-white">Produk tidak ditemukan</p>
              <p className="text-xs text-zinc-500 italic mt-1">Data produk akan muncul di sini</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredListings.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800 px-4 py-8 gap-6 sm:px-6">
          {/* Mobile View */}
          <div className="flex flex-col items-center gap-4 sm:hidden w-full">
            <div className="flex items-center justify-between w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl shadow-inner">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all active:scale-90 ${currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-800 hover:text-white"}`}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Halaman</span>
                <span className="text-sm font-black text-white">
                  {currentPage} <span className="text-zinc-600 mx-1">/</span> {totalPages}
                </span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all active:scale-90 ${currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-800 hover:text-white"}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
              Menampilkan <span className="text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-zinc-300">{Math.min(currentPage * itemsPerPage, filteredListings.length)}</span> dari <span className="text-zinc-300">{filteredListings.length}</span> produk
            </p>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500 font-bold">
                Menampilkan <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="text-white">{Math.min(currentPage * itemsPerPage, filteredListings.length)}</span> dari <span className="text-white">{filteredListings.length}</span> hasil
              </p>
            </div>
            <div>
              <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`relative inline-flex items-center px-3 py-2 text-zinc-500 transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 text-zinc-400"}`}>
                  <span className="sr-only">Previous</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .map((page) => {
                    const isCurrent = currentPage === page;

                    if (totalPages > 7) {
                      if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-600 bg-zinc-900 border-x border-zinc-800">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-black transition-all ${
                          isCurrent ? "z-10 bg-emerald-500 text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500" : "text-zinc-400 hover:bg-zinc-800 bg-zinc-900 border-x border-zinc-800"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })
                  .filter(Boolean)}

                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={`relative inline-flex items-center px-3 py-2 text-zinc-500 transition-colors ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 text-zinc-400"}`}>
                  <span className="sr-only">Next</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Action Modal */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false, showReasonInput: false, rejectionReason: "" })}
        onConfirm={actionModal.onConfirm ? () => {
          if (actionModal.showReasonInput) {
            processCancelAuction(actionModal.id, actionModal.rejectionReason);
          } else {
            actionModal.onConfirm();
          }
        } : null}
        isLoading={actionModal.isLoading}
        type={actionModal.type}
        title={actionModal.title}
        message={actionModal.message}
        confirmText={actionModal.confirmText}
      >
        {actionModal.showReasonInput && (
          <div className="relative mt-2">
            <MessageSquare className="absolute left-5 top-5 text-zinc-500" size={20} />
            <textarea
              placeholder="Tuliskan alasan pembatalan lelang secara jelas..."
              className="w-full bg-zinc-950 border border-zinc-800 text-white pl-14 pr-6 py-5 rounded-3xl focus:outline-none focus:border-red-500 transition-all min-h-[140px] text-sm leading-relaxed"
              value={actionModal.rejectionReason || ""}
              onChange={(e) => setActionModal({ ...actionModal, rejectionReason: e.target.value })}
            />
          </div>
        )}
      </ActionModal>
    </div>
  );
}
