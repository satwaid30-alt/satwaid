"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";
import { ShoppingBag, MapPin, DollarSign, Clock, CheckCircle2, AlertCircle, X, XCircle, Search, Filter, Package, Truck, Info, ChevronRight, ChevronLeft, Store, ScrollText, CreditCard, Hash, MessageCircle, ShieldAlert, Calendar } from "lucide-react";

const getPaginationRange = (currentPage, totalPages) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
  if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};
import { io } from "socket.io-client";

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm") || lower.endsWith(".mkv") || lower.endsWith(".3gp");
};

export default function PesananMasukPage() {
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [successMessage, setSuccessMessage] = useState("");
  const [activeAdminFee, setActiveAdminFee] = useState(5000);

  useEffect(() => {
    let active = true;
    const fetchAdminFee = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/settings/admin-fee`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && typeof result.adminFee === "number" && active) {
            setActiveAdminFee(result.adminFee);
          }
        }
      } catch (err) {
        console.error("Error fetching admin fee settings:", err);
      }
    };
    fetchAdminFee();

    const handleAdminFeeUpdated = (e) => {
      if (typeof e.detail === "number" && active) {
        setActiveAdminFee(e.detail);
      }
    };
    window.addEventListener("admin_fee_updated", handleAdminFeeUpdated);

    return () => {
      active = false;
      window.removeEventListener("admin_fee_updated", handleAdminFeeUpdated);
    };
  }, []);

  // Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState(null); // stores order object
  const [cancelOption, setCancelOption] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedComplaints, setExpandedComplaints] = useState({});
  const shopIdRef = useRef(null);

  const handleCloseCancelModal = () => {
    setCancellingOrder(null);
    setCancelOption("");
    setCustomCancelReason("");
  };

  const toggleComplaint = (orderId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    shopIdRef.current = shop?.id;
  }, [shop?.id]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    let socketInstance;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        fetchShop(parsed.id);

        // Setup Socket.io for Real-time Updates
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        socketInstance = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null,
          },
        });

        socketInstance.on("connect", () => {
          console.log("[Socket] Connected to server, joining room:", parsed.id);
          socketInstance.emit("join_user", parsed.id);
        });

        socketInstance.on("new_notification", (notif) => {
          console.log("[Socket] Received new_notification:", notif);
          if (shopIdRef.current) {
            fetchOrders(shopIdRef.current, true); // silent refresh
          } else {
            fetchShop(parsed.id);
          }
        });

        socketInstance.on("order_updated", (update) => {
          console.log("[Socket] Order updated received:", update);
          if (shopIdRef.current) {
            fetchOrders(shopIdRef.current, true); // silent refresh
          }
        });

        setSocket(socketInstance);
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  // Dynamic join for each order room
  useEffect(() => {
    if (socket && orders.length > 0) {
      orders.forEach((order) => {
        socket.emit("join_order", order.id);
      });
      console.log(`[Socket] Dynamically joined room for ${orders.length} orders`);
    }
  }, [socket, orders.map((o) => o.id).join(",")]);

  const fetchShop = async (userId) => {
    if (!userId || userId === "undefined" || userId === "null") {
      console.warn("fetchShop skipped: invalid userId:", userId);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/shops/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.data) {
        setShop(result.data);
        fetchOrders(result.data.id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error fetching shop:", err);
      setIsLoading(false);
    }
  };

  const fetchOrders = async (shopId, silent = false) => {
    if (!shopId || shopId === "undefined" || shopId === "null") {
      console.warn("fetchOrders skipped: invalid shopId:", shopId);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/orders/shop/${shopId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setOrders(result.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    const finalReason = cancelOption === "Lainnya" ? customCancelReason : cancelOption;
    if (!finalReason || !finalReason.trim()) return;

    setIsCancelling(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${getApiUrl()}/orders/${cancellingOrder.id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ cancellation_reason: finalReason }),
      });

      if (response.ok) {
        setOrders(orders.map((o) => (o.id === cancellingOrder.id ? { ...o, status: "cancelled" } : o)));
        handleCloseCancelModal();
        setSuccessMessage("Pesanan berhasil dibatalkan");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        alert(error.message || "Gagal membatalkan pesanan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "Menunggu Alamat";
      case "waiting_shipping_cost":
        return "Perlu Input Ongkir";
      case "waiting_payment":
        return "Menunggu Pembayaran";
      case "processing":
        return "Menunggu Verifikasi";
      case "waiting_shipment":
        return "Perlu Dikirim";
      case "shipped":
        return "Dikirim";
      case "payment_verified":
        return "Perlu Dikirim";
      case "complained":
        return "Dikomplain";
      case "completed":
        return "Selesai";
      case "disbursement_requested":
        return "Selesai";
      case "disbursed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "waiting_shipping_cost":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "waiting_payment":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "processing":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "waiting_shipment":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "shipped":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "payment_verified":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "complained":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursement_requested":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const activeOrders = orders.filter((o) => !["completed", "cancelled", "cancelled_dismissed", "disbursement_requested", "disbursed"].includes(o.status));
  const complainedOrders = orders.filter((o) => o.status === "complained");

  const filteredOrders = activeOrders.filter((order) => {
    const matchesSearch = order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) || order.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && ["pending_shipping_info", "waiting_shipping_cost", "waiting_shipment"].includes(order.status)) ||
      (activeTab === "payment" && order.status === "waiting_payment") ||
      (activeTab === "process" && ["processing", "waiting_shipment", "shipped"].includes(order.status)) ||
      (activeTab === "complained" && order.status === "complained");
    return matchesSearch && matchesTab;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat Pesanan Masuk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">Proses Transaksi</h1>
          <p className="text-xs md:text-sm text-zinc-500 font-medium">Pantau dan kelola setiap tahapan transaksi penjualan yang sedang berjalan.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link href="/user/toko/dashboard" className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group shrink-0">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Riwayat Penjualan
          </Link>
          <div className="relative group flex-1 sm:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari Order ID atau Nama Produk..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 md:py-3.5 pl-12 pr-6 text-white focus:outline-none focus:border-emerald-500 transition-all text-xs md:text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs - Styled exactly like /user/pesanan */}
      <div className="flex items-center gap-6 md:gap-8 border-b border-zinc-800/80 overflow-x-auto overflow-y-hidden pb-2 md:pb-px w-full custom-tab-scrollbar">
        {[
          {
            id: "all",
            label: "Semua",
            count: activeOrders.length,
          },
          {
            id: "pending",
            label: "Tindakan",
            count: activeOrders.filter((o) => ["pending_shipping_info", "waiting_shipping_cost", "waiting_shipment"].includes(o.status)).length,
          },
          {
            id: "payment",
            label: "Belum Bayar",
            count: activeOrders.filter((o) => o.status === "waiting_payment").length,
          },
          {
            id: "process",
            label: "Diproses",
            count: activeOrders.filter((o) => ["processing", "waiting_shipment", "shipped"].includes(o.status)).length,
          },
          {
            id: "complained",
            label: "Komplain",
            count: activeOrders.filter((o) => o.status === "complained").length,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const hasBadge = tab.count !== undefined && tab.count > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 pb-4 text-xs md:text-sm font-black uppercase tracking-wider transition-all relative border-b-2 -mb-[2px] whitespace-nowrap ${isActive ? "border-emerald-500 text-emerald-500" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}
            >
              <span>{tab.label}</span>
              {hasBadge && <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black tracking-normal transition-all shrink-0 ${isActive ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400 group-hover:bg-amber-500 group-hover:text-zinc-950"}`}>{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-10 right-10 z-50 bg-emerald-500 text-zinc-950 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={24} />
          {successMessage}
        </div>
      )}

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {currentItems.length > 0 ? (
          currentItems.map((order) => (
            <div key={order.id} className="bg-zinc-900/20 backdrop-blur-md border border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 group flex flex-col">
              {/* Card Header */}
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50">
                <div className="flex flex-wrap items-center gap-3 md:gap-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <Hash size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Order ID</p>
                      <p className="text-xs font-black text-white tracking-tight">{order.order_id}</p>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>{getStatusLabel(order.status)}</div>
                  {order.status === "waiting_payment" && order.payment_rejection_reason && (
                    <div className="px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1">
                      <AlertCircle size={10} className="shrink-0" />
                      Pembayaran Ditolak Admin
                    </div>
                  )}
                </div>
              </div>

              {/* Order Stepper */}
              <div className="px-4 md:px-6 py-3.5 bg-zinc-950/40 border-b border-zinc-800/40">
                <div className="w-full flex items-center justify-between gap-1.5 md:gap-3">
                  {[
                    { id: "data", label: "Data", step: 1 },
                    { id: "ongkir", label: "Ongkir", step: 2 },
                    { id: "bayar", label: "Bayar", step: 3 },
                    { id: "verifikasi", label: "Verif", step: 4 },
                    { id: "kirim", label: "Kirim", step: 5 },
                    { id: "selesai", label: "Selesai", step: 6 },
                  ].map((s, i) => {
                    const statusOrder = {
                      pending_shipping_info: 1,
                      waiting_shipping_cost: 2,
                      waiting_payment: 3,
                      processing: 4,
                      payment_verified: 5,
                      waiting_shipment: 5,
                      shipped: 5,
                      complained: 5,
                      completed: 6,
                      cancelled: 0,
                    };
                    const currentStep = statusOrder[order.status] || 1;
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    const isComplaint = order.status === "complained" && s.step === 6;

                    return (
                      <div key={s.id} className="flex-1 flex flex-col gap-1 relative">
                        <div className={`h-1 rounded-full transition-all duration-700 ${isComplaint ? "bg-red-500 animate-pulse" : isDone ? "bg-emerald-500" : "bg-zinc-800"} ${isCurrent ? "animate-pulse" : ""}`}></div>
                        <span className={`text-[8px] font-black uppercase tracking-wider text-center transition-colors duration-500 ${isComplaint ? "text-red-500" : isDone ? "text-emerald-400" : "text-zinc-600"}`}>{isComplaint ? "Komplain" : s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auto Confirmation Notice Banner */}
              {order.status === "shipped" && (
                <div className="mx-4 md:mx-6 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                  <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Informasi Penyelesaian Otomatis</p>
                    <p className="text-[9px] text-zinc-400 font-bold italic leading-relaxed">Jika tidak ada konfirmasi pembeli dalam 2×24 jam, transaksi akan diproses otomatis. Hubungi admin jika membutuhkan bantuan lebih lanjut.</p>
                  </div>
                </div>
              )}

              {/* Complaint Notification for Seller */}
              {order.status === "complained" && (
                <div className="mx-4 md:mx-6 mt-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3.5 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left">
                    <p className="text-xs md:text-sm font-black text-red-500 uppercase tracking-wider leading-none">Perhatian: Ada Komplain Aktif!</p>
                    <p className="text-[11px] md:text-xs text-zinc-400 font-bold leading-relaxed mt-1">
                      Transaksi ini sedang dikomplain oleh pembeli. Harap segera hubungi/berdiskusi dengan pembeli untuk menyelesaikan masalah ini. Apabila komplain telah disepakati dan diselesaikan, pembeli harus menekan tombol <strong>Selesaikan Pesanan/Komplain</strong> untuk menyelesaikan transaksi.
                    </p>
                  </div>
                </div>
              )}

              {/* Card Body - Responsive Inner Grid */}
              <div className="p-4 md:p-6 space-y-5 flex-1 flex flex-col">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-4 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-800/40">
                        <div onClick={() => setSelectedImage(getImageUrl(item.product?.images))} className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 relative group/img cursor-zoom-in">
                          {(() => {
                            const mediaUrl = getImageUrl(item.product?.images);
                            return isVideoUrl(mediaUrl) ? (
                              <video src={mediaUrl} className="w-full h-full object-cover animate-in fade-in" preload="metadata" muted playsInline />
                            ) : (
                              <img src={mediaUrl || "https://placehold.co/400x400/f4f4f5/71717a?text=No+Image"} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" alt={item.product?.name} />
                            );
                          })()}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent"></div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Search size={14} className="text-white" />
                          </div>
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest">{item.product?.species}</span>
                            <span className="text-zinc-700 font-bold text-[8px]">•</span>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Qty: {item.quantity}</span>
                          </div>
                          <h3 className="text-xs md:text-sm font-black text-white tracking-tight leading-snug truncate hover:whitespace-normal transition-all duration-300">{item.product?.name}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Harga:</span>
                            <span className="text-emerald-500 font-black">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/20 rounded-xl border border-zinc-800/40 text-[9px] font-black uppercase tracking-wider">
                      <span className="text-zinc-500">Pembeli:</span>
                      <span className="text-emerald-500 font-black">{order.user?.username}</span>
                    </div>
                  </div>
                ) : (
                  /* Legacy Product Detail Header */
                  <div className="flex items-center gap-4 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-800/40">
                    <div onClick={() => setSelectedImage(getImageUrl(order.product?.images))} className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 relative group/img cursor-zoom-in">
                      {(() => {
                        const mediaUrl = getImageUrl(order.product?.images);
                        return isVideoUrl(mediaUrl) ? (
                          <video src={mediaUrl} className="w-full h-full object-cover animate-in fade-in" preload="metadata" muted playsInline />
                        ) : (
                          <img src={mediaUrl || "https://placehold.co/400x400/f4f4f5/71717a?text=No+Image"} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" alt={order.product?.name} />
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent"></div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Search size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest">{order.product?.species}</span>
                        <span className="text-zinc-700 font-bold text-[8px]">•</span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Qty: {order.quantity}</span>
                      </div>
                      <h3 className="text-xs md:text-sm font-black text-white tracking-tight leading-snug truncate hover:whitespace-normal transition-all duration-300">{order.product?.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Pembeli:</span>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{order.user?.username}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Details (Receipt) & Actions */}
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Rincian Biaya</span>
                  </div>
                  <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800/40 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 group/cost border-b border-zinc-800/40 pb-2.5 font-bold">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-tight">Harga Produk</span>
                        {order.items && order.items.length > 1 && <span className="text-[9px] text-zinc-500 font-bold mt-1 leading-normal max-w-full sm:max-w-[320px] bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/20">{order.items.map((item) => `${item.product?.name || "Produk"} (x${item.quantity})`).join(", ")}</span>}
                      </div>
                      <span className="text-[11px] md:text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">{formatPrice(order.items && order.items.length > 0 ? order.items.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0) : order.price * order.quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-tight">Biaya Admin</span>
                      <span className="text-[11px] md:text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">+{formatPrice(order.admin_fee !== undefined && order.admin_fee !== null ? order.admin_fee : activeAdminFee)}</span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-tight">Ongkos Kirim</span>
                      <span className="text-[11px] md:text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">{order.product?.is_free_shipping ? <span className="text-emerald-500 uppercase text-[10px] md:text-xs font-black">Gratis</span> : `+${formatPrice(order.shipping_cost || 0)}`}</span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-tight">Biaya Packing</span>
                      <span className="text-[11px] md:text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">{order.product?.is_free_packing ? <span className="text-emerald-500 uppercase text-[10px] md:text-xs font-black">Gratis</span> : `+${formatPrice(order.packing_cost || 0)}`}</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-1.5"></div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Total Tagihan</span>
                      <span className="text-sm md:text-lg font-black text-white tracking-tighter">{formatPrice(order.total_price)}</span>
                    </div>
                  </div>

                  {/* Actions and CTAs */}
                  <div className="space-y-2 pt-1">
                    <div className={`grid gap-2 ${["waiting_shipping_cost", "waiting_shipment", "payment_verified"].includes(order.status) ? "grid-cols-2" : "grid-cols-1"}`}>
                      {order.status === "waiting_shipping_cost" ? (
                        <Link href={`/user/toko/pesanan-masuk/biaya-kirim/${order.id}`} className="py-2 bg-[#228B22] hover:bg-[#4CBB17] text-white rounded-xl transition-all font-black text-[8px] uppercase tracking-widest text-center border border-[#228B22] hover:border-[#4CBB17] flex items-center justify-center gap-1">
                          <Truck size={10} /> Input Resi
                        </Link>
                      ) : ["waiting_shipment", "payment_verified"].includes(order.status) ? (
                        <Link href={`/user/toko/pesanan-masuk/pengiriman/${order.id}`} className="py-2 bg-[#228B22] hover:bg-[#4CBB17] text-white rounded-xl transition-all font-black text-[8px] uppercase tracking-widest text-center border border-[#228B22] hover:border-[#4CBB17] flex items-center justify-center gap-1">
                          <Truck size={10} /> Input Resi
                        </Link>
                      ) : null}
                      <Link href={`/user/toko/pesanan-masuk/detail/${order.id}`} className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all font-black text-[8px] uppercase tracking-widest text-center border border-zinc-700 hover:border-zinc-600 flex items-center justify-center gap-1">
                        <Info size={10} /> Detail
                      </Link>
                    </div>
                    {!["cancelled", "completed", "shipped", "complained"].includes(order.status) && (
                      <button onClick={() => setCancellingOrder(order)} className="w-full py-2 bg-red-500/5 hover:bg-red-500 hover:text-white text-text-white rounded-xl transition-all font-black text-[8px] uppercase tracking-widest text-center border border-red-500/10 hover:border-red-500/20 flex items-center justify-center gap-1">
                        <XCircle size={10} /> Batalkan Transaksi
                      </button>
                    )}
                  </div>
                </div>

                {/* Complaint Section (Conditionally rendered at the bottom) */}
                {order.status === "complained" && (
                  <div className="mt-4 border border-red-500/20 hover:border-red-500/30 rounded-2xl overflow-hidden bg-red-950/5 transition-all duration-300 shadow-lg shadow-red-950/10">
                    {/* Header / Trigger */}
                    <div onClick={() => toggleComplaint(order.id)} className="flex items-center justify-between gap-3 px-4 py-3.5 bg-red-500/10 cursor-pointer select-none hover:bg-red-500/15 transition-colors border-b border-red-500/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-red-500 border border-red-500/20">
                          <ShieldAlert size={14} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Pesanan Komplain</h4>
                          <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest">Tinjau Bukti</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-red-400 px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20">Tinjau</span>
                        <ChevronRight size={14} className={`transition-transform duration-300 ${expandedComplaints[order.id] ? "rotate-90 text-white" : "text-zinc-500"}`} />
                      </div>
                    </div>

                    {/* Body Content */}
                    {expandedComplaints[order.id] && (
                      <div className="p-4 space-y-3.5 bg-zinc-950/40 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Description / Reason */}
                          <div className="flex-1 space-y-1.5">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Alasan Komplain</span>
                            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/50 min-h-[80px] flex flex-col justify-center">
                              <p className="text-xs text-zinc-300 leading-relaxed font-medium italic">&ldquo;{order.complaint_description || "Tidak ada deskripsi alasan komplain dari pembeli."}&rdquo;</p>
                            </div>
                          </div>

                          {/* Media Proof (Not full size) */}
                          {order.complaint_image && (
                            <div className="space-y-1.5 shrink-0">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block sm:text-right mr-1">Bukti Lampiran</span>
                              <div onClick={() => setSelectedImage(getImageUrl(order.complaint_image))} className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-zoom-in group/complaint shadow-md hover:border-zinc-700 transition-colors">
                                {isVideoUrl(order.complaint_image) ? (
                                  <div className="relative w-full h-full">
                                    <video src={getImageUrl(order.complaint_image)} className="w-full h-full object-cover" preload="metadata" muted />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                      <div className="w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                                        <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-white ml-0.5"></div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img src={getImageUrl(order.complaint_image)} className="w-full h-full object-cover group-hover/complaint:scale-105 transition-transform duration-500" alt="Bukti Komplain" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/complaint:opacity-100 transition-opacity flex items-center justify-center">
                                  <Search size={14} className="text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-2 py-32 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[4rem] border-dashed">
            <div className="w-32 h-32 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-zinc-700">
              <ShoppingBag size={64} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">Belum Ada Pesanan</h3>
              <p className="text-zinc-500 max-w-sm mx-auto font-medium">Pesanan dari pelanggan tokomu akan muncul di sini secara otomatis.</p>
            </div>
            <button
              onClick={() => {
                if (shop?.id) fetchOrders(shop.id);
              }}
              className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
            >
              Refresh Data <Clock size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} dari {filteredOrders.length} Pesanan
          </p>
          <div className="flex items-center">
            <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 divide-x divide-zinc-800 overflow-hidden">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
                <ChevronLeft size={16} />
              </button>
              {getPaginationRange(currentPage, totalPages).map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  disabled={page === "..."}
                  className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all ${page === currentPage ? "bg-zinc-800 text-white font-black" : page === "..." ? "text-zinc-500 cursor-default bg-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 bg-zinc-950"}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isCancelling && handleCloseCancelModal()}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <AlertCircle size={24} />
                </div>
                <button onClick={() => handleCloseCancelModal()} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Batalkan Transaksi?</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Anda akan membatalkan pesanan <span className="text-white font-bold">{cancellingOrder.order_id}</span>. Stok produk akan dikembalikan secara otomatis.
                </p>
              </div>

              <form onSubmit={handleCancelOrder} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alasan Pembatalan</label>
                  <div className="relative">
                    <select required value={cancelOption} onChange={(e) => setCancelOption(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-6 pr-12 text-white focus:outline-none focus:border-red-500 transition-all text-sm font-medium cursor-pointer appearance-none">
                      <option value="" disabled>
                        Pilih Alasan Pembatalan
                      </option>
                      <option value="Produk/satwa tidak tersedia (stok habis)">Produk/satwa tidak tersedia (stok habis)</option>
                      <option value="Kondisi satwa tidak layak dikirim / sakit">Kondisi satwa tidak layak dikirim / sakit</option>
                      <option value="Satwa mengalami kendala kesehatan mendadak">Satwa mengalami kendala kesehatan mendadak</option>
                      <option value="Kendala pengiriman ke lokasi buyer">Kendala pengiriman ke lokasi buyer</option>
                      <option value="Data/alamat pengiriman buyer tidak lengkap">Data/alamat pengiriman buyer tidak lengkap</option>
                      <option value="Buyer tidak dapat dihubungi">Buyer tidak dapat dihubungi</option>
                      <option value="Permintaan pembatalan dari Buyer">Permintaan pembatalan dari Buyer</option>
                      <option value="Terjadi kesalahan data atau harga produk">Terjadi kesalahan data atau harga produk</option>
                      <option value="Kendala operasional seller">Kendala operasional seller</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                {cancelOption === "Lainnya" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Detail Alasan Pembatalan</label>
                    <textarea
                      required
                      rows={4}
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white focus:outline-none focus:border-red-500 transition-all font-semibold text-sm resize-none leading-relaxed"
                      placeholder="Sebutkan detail alasan pembatalan lainnya secara lengkap..."
                    ></textarea>
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="button" onClick={() => handleCloseCancelModal()} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest">
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelling || !cancelOption || (cancelOption === "Lainnya" && !customCancelReason.trim())}
                    className="flex-[2] py-4 bg-red-500 hover:bg-red-400 text-zinc-950 font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
                  >
                    {isCancelling ? "Membatalkan..." : "Ya, Batalkan Pesanan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}></div>
          <div className="relative z-10 max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 m-4 md:m-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-xl border border-white/10 z-20 group">
              <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
              {isVideoUrl(selectedImage) ? <video src={selectedImage} controls className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" autoPlay /> : <img src={selectedImage} className="max-w-full max-h-full object-contain rounded-2xl" alt="Zoomed View" />}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #09090b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-tab-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #52525b #09090b;
        }
        .custom-tab-scrollbar::-webkit-scrollbar {
          height: 4px !important;
          display: block !important;
        }
        .custom-tab-scrollbar::-webkit-scrollbar-track {
          background: #09090b !important;
        }
        .custom-tab-scrollbar::-webkit-scrollbar-thumb {
          background: #52525b !important;
          border-radius: 9999px !important;
        }
      `}</style>
    </div>
  );
}
