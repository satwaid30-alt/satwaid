"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import {
  ShoppingBag,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  XCircle,
  Search,
  Filter,
  Package,
  Truck,
  Info,
  ChevronRight,
  Store,
  ScrollText,
  CreditCard,
  Hash,
  MessageCircle,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { io } from "socket.io-client";

export default function PesananMasukPage() {
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState(null);

  // Success Message state
  const [successMessage, setSuccessMessage] = useState("");

  // Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState(null); // stores order object
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const shopIdRef = useRef(null);

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
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        socketInstance = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null
          }
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
    try {
      const response = await fetch(
        `${getApiUrl()}/shops/user/${userId}`,
      );
      const result = await response.json();
      if (response.ok && result.data) {
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
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/orders/shop/${shopId}`,
      );
      const result = await response.json();
      if (response.ok) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/orders/${cancellingOrder.id}/cancel`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancellation_reason: cancellationReason }),
        },
      );

      if (response.ok) {
        setOrders(
          orders.map((o) =>
            o.id === cancellingOrder.id ? { ...o, status: "cancelled" } : o,
          ),
        );
        setCancellingOrder(null);
        setCancellationReason("");
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

  // Active orders only — completed/cancelled/disbursement orders are in Riwayat Penjualan & Pengajuan Keuangan
  // disbursement_requested dan disbursed adalah status SETELAH transaksi selesai (proses keuangan internal)
  const activeOrders = orders.filter(
    (o) =>
      ![
        "completed",
        "cancelled",
        "cancelled_dismissed",
        "disbursement_requested",
        "disbursed",
      ].includes(o.status),
  );

  const filteredOrders = activeOrders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" &&
        [
          "pending_shipping_info",
          "waiting_shipping_cost",
          "waiting_shipment",
        ].includes(order.status)) ||
      (activeTab === "payment" && order.status === "waiting_payment") ||
      (activeTab === "process" &&
        ["processing", "waiting_shipment", "shipped"].includes(order.status)) ||
      (activeTab === "complained" && order.status === "complained");
    return matchesSearch && matchesTab;
  });

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">
          Memuat Pesanan Masuk...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">
            Proses Transaksi
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 font-medium">
            Pantau dan kelola setiap tahapan transaksi penjualan yang sedang
            berjalan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href="/user/toko/dashboard"
            className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group shrink-0"
          >
            <CheckCircle2 size={14} className="text-emerald-500" />
            Riwayat Penjualan
          </Link>
          <div className="relative group flex-1 sm:min-w-[300px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors"
              size={18}
            />
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

      {/* Filter Tabs - Optimized for Mobile & Desktop */}
      <div className="flex flex-col gap-4">
        {/* Mobile Select Dropdown */}
        <div className="sm:hidden relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
            <Filter size={18} />
          </div>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:border-emerald-500 transition-all text-xs font-black uppercase appearance-none cursor-pointer"
          >
            {[
              { id: "all", label: "Semua", count: activeOrders.length },
              {
                id: "pending",
                label: "Tindakan",
                count: activeOrders.filter((o) =>
                  [
                    "pending_shipping_info",
                    "waiting_shipping_cost",
                    "waiting_shipment",
                  ].includes(o.status),
                ).length,
              },
              {
                id: "payment",
                label: "Belum Bayar",
                count: activeOrders.filter(
                  (o) => o.status === "waiting_payment",
                ).length,
              },
              {
                id: "process",
                label: "Diproses",
                count: activeOrders.filter((o) =>
                  ["processing", "waiting_shipment", "shipped"].includes(
                    o.status,
                  ),
                ).length,
              },
              {
                id: "complained",
                label: "Komplain",
                count: activeOrders.filter((o) => o.status === "complained")
                  .length,
              },
            ].map((tab) => (
              <option
                key={tab.id}
                value={tab.id}
                className="bg-zinc-900 text-white py-2"
              >
                {tab.label} ({tab.count})
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <ChevronRight size={18} className="rotate-90" />
          </div>
        </div>

        {/* Desktop/Tablet Button Tabs */}
        <div className="hidden sm:flex sm:flex-wrap items-center gap-2">
          {[
            {
              id: "all",
              label: "Semua",
              count: activeOrders.length,
              icon: <ShoppingBag size={16} />,
            },
            {
              id: "pending",
              label: "Tindakan",
              count: activeOrders.filter((o) =>
                [
                  "pending_shipping_info",
                  "waiting_shipping_cost",
                  "waiting_shipment",
                ].includes(o.status),
              ).length,
              icon: <AlertCircle size={16} />,
            },
            {
              id: "payment",
              label: "Belum Bayar",
              count: activeOrders.filter((o) => o.status === "waiting_payment")
                .length,
              icon: <CreditCard size={16} />,
            },
            {
              id: "process",
              label: "Diproses",
              count: activeOrders.filter((o) =>
                ["processing", "waiting_shipment", "shipped"].includes(
                  o.status,
                ),
              ).length,
              icon: <Clock size={16} />,
            },
            {
              id: "complained",
              label: "Komplain",
              count: activeOrders.filter((o) => o.status === "complained")
                .length,
              icon: <AlertCircle size={16} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                activeTab === tab.id
                  ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black ml-1 ${activeTab === tab.id ? "bg-zinc-950/20 text-zinc-900" : "bg-emerald-500 text-zinc-950"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-10 right-10 z-50 bg-emerald-500 text-zinc-950 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={24} />
          {successMessage}
        </div>
      )}

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900/30 border border-zinc-800 rounded-3xl md:rounded-[2.5rem] overflow-hidden hover:border-zinc-700 transition-all group flex flex-col"
            >
              {/* Card Header */}
              <div className="px-3 md:px-8 py-3 md:py-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/50">
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <Hash size={14} className="md:w-5 md:h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[7px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        Order ID
                      </p>
                      <p className="text-[10px] md:text-sm font-black text-white tracking-tight">
                        {order.order_id}
                      </p>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-zinc-800 hidden md:block"></div>
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={12}
                      className="text-zinc-500 md:w-4 md:h-4"
                    />
                    <span className="text-[9px] md:text-[11px] font-bold text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-4 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl border text-[9px] md:text-xs font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Order Stepper */}
              <div className="px-3 md:px-8 py-2.5 md:py-4 bg-zinc-900/30 border-b border-zinc-800/50 overflow-x-auto no-scrollbar">
                <div className="flex items-center justify-between min-w-[320px] md:min-w-[600px] gap-1 md:gap-4">
                  {[
                    { id: "data", label: "Data", step: 1 },
                    { id: "ongkir", label: "Ongkir", step: 2 },
                    { id: "bayar", label: "Bayar", step: 3 },
                    { id: "verifikasi", label: "Verifikasi", step: 4 },
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
                    const isComplaint =
                      order.status === "complained" && s.step === 6;

                    return (
                      <div
                        key={s.id}
                        className="flex-1 flex flex-col gap-0.5 md:gap-2 relative"
                      >
                        <div
                          className={`h-[2px] md:h-1.5 rounded-full transition-all duration-700 ${isComplaint ? "bg-red-500 animate-pulse" : isDone ? "bg-emerald-500" : "bg-zinc-800"} ${isCurrent ? "animate-pulse" : ""}`}
                        ></div>
                        <span
                          className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest text-center transition-colors duration-500 ${isComplaint ? "text-red-500" : isDone ? "text-emerald-500" : "text-zinc-600"}`}
                        >
                          {isComplaint ? "Komplain" : s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auto Confirmation Notice Banner */}
              {order.status === "shipped" && (
                <div className="mx-3 md:mx-8 mt-4 md:mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                  <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                      Informasi Penyelesaian Otomatis
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold italic leading-relaxed">
                      Jika tidak ada konfirmasi pembeli dalam 2×24 jam,
                      transaksi akan diproses otomatis. Hubungi admin jika
                      membutuhkan bantuan lebih lanjut.
                    </p>
                  </div>
                </div>
              )}

              {/* Card Body - 4 Column Layout */}
              <div className="p-3 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-start">
                {/* Column 1: Judul Produk */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <ShoppingBag size={12} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      Judul Produk
                    </span>
                  </div>
                  <div className="flex flex-row md:flex-col gap-3 items-center md:items-start">
                    <div
                      onClick={() =>
                        setSelectedImage(order.product?.images?.[0])
                      }
                      className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 relative group-hover:scale-105 transition-transform duration-500 cursor-zoom-in group/img"
                    >
                      <img
                        src={order.product?.images?.[0]}
                        className="w-full h-full object-cover"
                        alt={order.product?.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent"></div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Search size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-[7px] text-zinc-400 rounded font-black uppercase tracking-widest">
                          {order.product?.species}
                        </span>
                        <span className="text-zinc-700 font-bold text-[8px]">
                          •
                        </span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                          Qty: {order.quantity}
                        </span>
                      </div>
                      <h3 className="text-xs md:text-base font-black text-white tracking-tight leading-tight line-clamp-2 md:line-clamp-none">
                        {order.product?.name}
                      </h3>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        Pembeli: {order.user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Rincian Biaya */}
                <div className="space-y-4 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Rincian Biaya
                    </span>
                  </div>
                  <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 space-y-2.5 flex-1">
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        Harga Produk
                      </span>
                      <span className="text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">
                        {formatPrice(order.price * order.quantity)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        Biaya Admin
                      </span>
                      <span className="text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">
                        +{formatPrice(order.admin_fee || 5000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        Ongkos Kirim
                      </span>
                      <span className="text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">
                        {order.product?.is_free_shipping ? (
                          <span className="text-emerald-500 uppercase text-[9px] font-black">
                            Gratis
                          </span>
                        ) : (
                          `+${formatPrice(order.shipping_cost || 0)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center group/cost">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        Biaya Packing
                      </span>
                      <span className="text-xs font-black text-zinc-300 group-hover/cost:text-white transition-colors">
                        {order.product?.is_free_packing ? (
                          <span className="text-emerald-500 uppercase text-[9px] font-black">
                            Gratis
                          </span>
                        ) : (
                          `+${formatPrice(order.packing_cost || 0)}`
                        )}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-1"></div>
                    <div className="flex justify-between items-center pt-1">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none mb-1">
                          Total Tagihan
                        </span>
                        <span className="text-lg font-black text-white leading-none tracking-tighter">
                          {formatPrice(order.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions in Column 2 */}
                  <div className="space-y-2 pt-2">
                    {order.status === "waiting_shipping_cost" && (
                      <Link
                        href={`/user/toko/pesanan-masuk/biaya-kirim/${order.id}`}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest text-center active:scale-95 block"
                      >
                        Input Ongkir
                      </Link>
                    )}
                    {["waiting_shipment", "payment_verified"].includes(
                      order.status,
                    ) && (
                      <Link
                        href={`/user/toko/pesanan-masuk/pengiriman/${order.id}`}
                        className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-zinc-950 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest text-center active:scale-95 block"
                      >
                        Input Resi
                      </Link>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/user/toko/pesanan-masuk/detail/${order.id}`}
                        className="py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-all font-black text-[8px] uppercase tracking-widest text-center border border-emerald-400 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={10} /> Proses Transaksi
                      </Link>
                      <a
                        href={`https://wa.me/${order.phone_number?.replace(/^0/, "62")}?text=Halo ${order.user?.username}, saya penjual dari toko ${shop?.name}. Terkait pesanan ${order.order_id}, ...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all font-black text-[8px] uppercase tracking-widest text-center border border-zinc-700 flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle size={10} className="text-emerald-500" />{" "}
                        Hubungi WA Pembeli
                      </a>
                    </div>
                    {![
                      "cancelled",
                      "completed",
                      "shipped",
                      "complained",
                    ].includes(order.status) && (
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="w-full py-2 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all font-black text-[8px] uppercase tracking-widest text-center border border-red-500/10 flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={10} /> Batalkan Transaksi
                      </button>
                    )}
                  </div>
                </div>

                {/* Column 3: Alamat Pengirim */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <MapPin size={14} className="text-pink-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Alamat Pengirim
                    </span>
                  </div>
                  {order.shipping_address ? (
                    <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-tight">
                          {order.receiver_name}
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium line-clamp-3 hover:line-clamp-none transition-all">
                          {order.shipping_address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 w-fit">
                        <MessageCircle size={10} className="text-zinc-500" />
                        {order.phone_number}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-950/20 rounded-2xl p-6 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center space-y-3 h-[140px]">
                      <Clock
                        size={20}
                        className="text-zinc-700 animate-pulse"
                      />
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic leading-tight">
                        Menunggu Alamat...
                      </p>
                    </div>
                  )}
                </div>

                {/* Column 4: Pesanan Komplain */}
                <div className="space-y-4">
                  <div
                    onClick={() => toggleComplaint(order.id)}
                    className="flex items-center justify-between md:justify-start gap-2 text-zinc-500 mb-2 cursor-pointer md:cursor-default group/comp"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert
                        size={14}
                        className={
                          order.status === "complained"
                            ? "text-red-500"
                            : "text-zinc-500"
                        }
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Pesanan Komplain
                      </span>
                    </div>
                    {/* Mobile Toggle Icon */}
                    <div className="md:hidden">
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-300 ${expandedComplaints[order.id] ? "rotate-90 text-white" : "text-zinc-600"}`}
                      />
                    </div>
                  </div>

                  <div
                    className={`${expandedComplaints[order.id] ? "block" : "hidden"} md:block animate-in slide-in-from-top-2 duration-300`}
                  >
                    {order.status === "complained" ? (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
                        <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                          <p className="text-[10px] text-white leading-relaxed font-medium italic line-clamp-2 hover:line-clamp-none">
                            {order.complaint_description ||
                              "Tidak ada deskripsi."}
                          </p>
                        </div>
                        {order.complaint_image && (
                          <div
                            onClick={() =>
                              setSelectedImage(
                                order.complaint_image.startsWith("http")
                                  ? order.complaint_image
                                  : `${getApiUrl()}${order.complaint_image}`,
                              )
                            }
                            className="relative h-16 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-zoom-in group/complaint"
                          >
                            <img
                              src={
                                order.complaint_image.startsWith("http")
                                  ? order.complaint_image
                                  : `${getApiUrl()}${order.complaint_image}`
                              }
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt="Bukti Komplain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/complaint:opacity-100 transition-opacity flex items-center justify-center">
                              <Search size={14} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-zinc-950/20 rounded-2xl p-6 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center space-y-3 h-[140px]">
                        <CheckCircle2
                          size={20}
                          className="text-emerald-500/30"
                        />
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">
                          Tidak Ada Komplain
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[4rem] border-dashed">
            <div className="w-32 h-32 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-zinc-700">
              <ShoppingBag size={64} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                Belum Ada Pesanan
              </h3>
              <p className="text-zinc-500 max-w-sm mx-auto font-medium">
                Pesanan dari pelanggan tokomu akan muncul di sini secara
                otomatis.
              </p>
            </div>
            <button className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Refresh Data <Clock size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isCancelling && setCancellingOrder(null)}
          ></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <AlertCircle size={24} />
                </div>
                <button
                  onClick={() => setCancellingOrder(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Batalkan Transaksi?
                </h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Anda akan membatalkan pesanan{" "}
                  <span className="text-white font-bold">
                    {cancellingOrder.order_id}
                  </span>
                  . Stok produk akan dikembalikan secara otomatis.
                </p>
              </div>

              <form onSubmit={handleCancelOrder} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Alasan Pembatalan
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white focus:outline-none focus:border-red-500 transition-all font-medium text-sm resize-none"
                    placeholder="Sebutkan alasan pembatalan (misal: Stok rusak, kendala kurir, dll)..."
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelling || !cancellationReason.trim()}
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
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedImage(null)}
          ></div>
          <div className="relative z-10 max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-0 right-0 m-4 md:m-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-xl border border-white/10 z-20 group"
            >
              <X
                size={24}
                className="group-hover:rotate-90 transition-transform duration-500"
              />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
              <img
                src={selectedImage}
                className="max-w-full max-h-full object-contain rounded-2xl"
                alt="Zoomed View"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
