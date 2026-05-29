"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  LayoutDashboard,
  Image as ImageIcon,
  X,
  ChevronRight,
  MapPin,
  MessageCircle,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Truck,
  Info,
  Star,
  Search,
  Filter,
} from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function SellerDashboardPage() {
  const [hasShop, setHasShop] = useState(false);
  const [activeTab, setActiveTab] = useState("riwayat");
  const [successMessage, setSuccessMessage] = useState("");
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [costForm, setCostForm] = useState({
    shipping_cost: "",
    packing_cost: "",
  });
  const [isUpdatingCost, setIsUpdatingCost] = useState(false);
  const [expandedShipping, setExpandedShipping] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("completed");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Form States
  const [shopData, setShopData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    whatsapp: "",
    logo: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    let socket;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // Pre-fill form from profile
        setShopData((prev) => ({
          ...prev,
          address: parsed.address || "",
          city: parsed.city || "",
          whatsapp: (parsed.phone || "").replace(/^\+62/, "").replace(/^0/, ""), // Clean up phone number
        }));
        fetchShop(parsed.id);

        // Setup Socket.io for Real-time Updates
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null
          }
        });
        socket.emit("join_user", parsed.id);

        socket.on("new_notification", () => {
          if (shop?.id) {
            fetchShopOrders(shop.id);
            fetchShopListings(shop.id);
          } else {
            fetchShop(parsed.id);
          }
        });
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [shop?.id]);

  const fetchShop = async (userId) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/shops/user/${userId}`,
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setShop(result.data);
        setHasShop(true);
        fetchShopOrders(result.data.id);
        fetchShopListings(result.data.id);
      }
    } catch (err) {
      console.error("Error fetching shop:", err);
    }
  };

  const fetchShopOrders = async (shopId) => {
    setIsLoadingOrders(true);
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
      setIsLoadingOrders(false);
    }
  };

  const fetchShopListings = async (shopId) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/listings/shop/${shopId}`,
      );
      const result = await response.json();
      if (response.ok) {
        setListings(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderSearchQuery, orderStatusFilter]);

  const handleCostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsUpdatingCost(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${getApiUrl()}/orders/${selectedOrder.id}/shipping-cost`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(costForm),
        },
      );
      if (response.ok) {
        setSuccessMessage("Ongkos kirim berhasil dikirim ke pembeli!");
        setShowCostModal(false);
        fetchShopOrders(shop.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingCost(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_shipping_info":
        return "Menunggu Data Pembeli";
      case "waiting_shipping_cost":
        return "Input Ongkir";
      case "waiting_payment":
        return "Menunggu Pembayaran";
      case "processing":
        return "Perlu Dikirim";
      case "shipped":
        return "Dikirim";
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
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      case "waiting_shipping_cost":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "waiting_payment":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursement_requested":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "disbursed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const [reptileData, setReptileData] = useState({
    name: "",
    species: "",
    morph: "",
    price: "",
    description: "",
    sex: "Unknown",
    age: "Baby",
    images: [],
  });
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-zinc-950 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 animate-in slide-in-from-right-4">
          <CheckCircle2 size={24} />
          {successMessage}
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-2 hover:opacity-70"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Dashboard Seller
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Kelola toko{" "}
            <span className="text-emerald-400 font-bold">
              {shopData.name || "Reptile Shop"}
            </span>{" "}
            dan produk jualanmu.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Produk",
            value: listings.length.toString(),
            icon: Package,
            color: "bg-blue-500",
          },
          {
            label: "Pesanan",
            value: orders
              .filter(
                (o) =>
                  ![
                    "completed",
                    "disbursement_requested",
                    "disbursed",
                    "cancelled",
                    "rejected",
                  ].includes(o.status),
              )
              .length.toString(),
            icon: ShoppingBag,
            color: "bg-amber-500",
          },
          {
            label: "Penghasilan",
            value: (() => {
              const total = orders
                .filter((o) =>
                  ["completed", "disbursement_requested", "disbursed"].includes(
                    o.status,
                  ),
                )
                .reduce((sum, order) => {
                  const netPrice =
                    (parseFloat(order.total_price) || 0) -
                    (parseFloat(order.admin_fee) || 0);
                  return sum + netPrice;
                }, 0);

              return formatPrice(total);
            })(),
            icon: DollarSign,
            color: "bg-emerald-500",
          },
          {
            label: "Rating Toko",
            value: shop?.avgRating || "5.0",
            icon: Star,
            color: "bg-purple-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 p-4 md:p-5 rounded-2xl flex items-center gap-3 md:gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl ${stat.color}/10 ${stat.color.replace("bg-", "text-")} flex items-center justify-center`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-xl font-black text-white">{stat.value}</p>
              {stat.label === "Penghasilan" && (
                <p className="text-[9px] md:text-[10px] text-emerald-500/70 font-bold mt-1 leading-tight">
                  Penghasilan Bersih tanpa biaya admin
                </p>
              )}
              {stat.label === "Rating Toko" && (
                <p className="text-[9px] md:text-[10px] text-purple-500/70 font-bold mt-1 leading-tight">
                  {shop?.totalRatings || 0} Penilaian &{" "}
                  {shop?.totalReviews || 0} Ulasan
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-full md:w-fit overflow-x-auto custom-scrollbar">
        {[
          {
            id: "dashboard",
            label: "Statistik Toko",
            icon: LayoutDashboard,
            href: "/user/toko/dashboard/statistik-toko",
          },
          {
            id: "riwayat",
            label: `Pesanan Selesai (${orders.filter((o) => ["completed", "disbursement_requested", "disbursed"].includes(o.status)).length})`,
            icon: CheckCircle2,
            href: "/user/toko/dashboard",
          },
          //   { id: "inventory", label: "Stok", icon: Package },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "inventory" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-zinc-800 text-zinc-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Stok Belum Tersedia
            </h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-8">
              Kamu belum memiliki reptil yang dijual. Ayo mulai tambahkan
              koleksimu sekarang!
            </p>
            <button
              onClick={() => setActiveTab("add_product")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
            >
              Tambah Produk Pertama
            </button>
          </div>
        )}

        {activeTab === "riwayat" &&
          (() => {
            const filteredOrders = orders.filter((o) => {
              const inProgressStatuses = [
                "pending_shipping_info",
                "waiting_shipping_cost",
                "waiting_payment",
                "processing",
                "shipped",
                "complained",
              ];
              const completedStatuses = [
                "completed",
                "disbursement_requested",
                "disbursed",
              ];
              const matchesStatus =
                orderStatusFilter === "all"
                  ? true
                  : orderStatusFilter === "processing"
                    ? inProgressStatuses.includes(o.status)
                    : orderStatusFilter === "completed"
                      ? completedStatuses.includes(o.status)
                      : o.status === orderStatusFilter;

              const matchesSearch = o.order_id
                .toLowerCase()
                .includes(orderSearchQuery.toLowerCase());
              return matchesStatus && matchesSearch;
            });

            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const paginatedOrders = filteredOrders.slice(
              indexOfFirstItem,
              indexOfLastItem,
            );
            const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Riwayat Penjualan
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Transaksi yang telah selesai dari toko Anda
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {filteredOrders.length}{" "}
                      Transaksi Ditemukan
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Cari Order ID / Nomor Invoice..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-4 text-white text-xs font-medium focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2">
                    <Filter size={14} className="text-zinc-500" />
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer pr-4"
                    >
                      <option value="completed" className="bg-zinc-900">
                        Selesai
                      </option>
                      <option value="processing" className="bg-zinc-900">
                        Dalam Proses
                      </option>
                      <option value="cancelled" className="bg-zinc-900">
                        Dibatalkan
                      </option>
                      <option value="all" className="bg-zinc-900">
                        Semua Status
                      </option>
                    </select>
                  </div>
                </div>

                {filteredOrders.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/50">
                            <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-10">
                              No
                            </th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Order ID
                            </th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Tgl Selesai
                            </th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Pembeli
                            </th>
                            <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Produk
                            </th>
                            <th className="text-right px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Total
                            </th>
                            <th className="text-center px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Status
                            </th>
                            <th className="text-center px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Pengiriman
                            </th>
                            <th className="text-center px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedOrders.map((order, idx) => (
                            <Fragment key={order.id}>
                              <tr
                                key={order.id}
                                className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                              >
                                <td className="px-6 py-5 text-sm font-black text-zinc-600">
                                  {(currentPage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="px-6 py-5">
                                  <span className="text-[11px] font-black text-zinc-300 font-mono tracking-wide">
                                    {order.order_id}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                    <Calendar
                                      size={12}
                                      className="text-emerald-500 shrink-0"
                                    />
                                    {new Date(
                                      order.completed_at || order.updated_at,
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div>
                                    <p className="text-sm font-black text-white">
                                      {order.receiver_name || "-"}
                                    </p>
                                    {/* <p className="text-[10px] text-zinc-500 font-bold">@{order.user?.username || '-'}</p> */}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    {order.product?.images?.[0] && (
                                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                                        <img
                                          src={order.product.images[0]}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-bold text-zinc-300 truncate max-w-[140px]">
                                        {order.product?.name}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="inline-block px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">
                                          ID: {order.product?.product_id || "-"}
                                        </span>
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                          order.product?.type === 'auction'
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                          {order.product?.type === 'auction' ? 'Lelang' : 'Langsung'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-emerald-400">
                                      {formatPrice(
                                        Number(order.total_price) -
                                          (Number(order.admin_fee) || 0),
                                      )}
                                    </span>
                                    {Number(order.admin_fee) > 0 && (
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                                        Net (Tanpa Biaya Admin)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto w-fit border ${getStatusStyle(order.status)}`}
                                  >
                                    {[
                                      "completed",
                                      "disbursement_requested",
                                      "disbursed",
                                    ].includes(order.status) && (
                                      <CheckCircle2 size={10} />
                                    )}
                                    {order.status === "processing" && (
                                      <Clock size={10} />
                                    )}
                                    {getStatusLabel(order.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <button
                                    onClick={() =>
                                      setExpandedShipping(
                                        expandedShipping === order.id
                                          ? null
                                          : order.id,
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                      expandedShipping === order.id
                                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                                    }`}
                                  >
                                    <Truck size={11} />
                                    {expandedShipping === order.id
                                      ? "Tutup"
                                      : "Lihat"}
                                  </button>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <a
                                    href={`/user/toko/pesanan-masuk/detail/${order.id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 hover:border-zinc-600"
                                  >
                                    <ChevronRight size={12} /> Detail Transaksi
                                  </a>
                                </td>
                              </tr>
                              {/* Expandable Shipping Row */}
                              {expandedShipping === order.id && (
                                <tr
                                  key={`ship-${order.id}`}
                                  className="bg-zinc-950/60"
                                >
                                  <td colSpan={8} className="px-8 py-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Resi */}
                                      <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-5 space-y-3">
                                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                          <Info size={11} /> Nomor Resi
                                        </p>
                                        <p className="text-lg font-black text-white tracking-[0.15em] break-all">
                                          {order.tracking_number || (
                                            <span className="text-zinc-600 text-sm font-bold normal-case tracking-normal">
                                              Belum tersedia
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      {/* Alamat */}
                                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                          <MapPin
                                            size={11}
                                            className="text-emerald-500"
                                          />{" "}
                                          Alamat Penerima
                                        </p>
                                        <div className="space-y-1">
                                          <p className="text-sm font-black text-white">
                                            {order.receiver_name || "-"}
                                          </p>
                                          <p className="text-[12px] font-bold text-zinc-500">
                                            {order.phone_number}
                                          </p>
                                          <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                                            {order.shipping_address || "-"}
                                          </p>
                                        </div>
                                      </div>
                                      {/* Foto Bukti */}
                                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                          <ShoppingBag
                                            size={11}
                                            className="text-blue-400"
                                          />{" "}
                                          Bukti Pengiriman
                                        </p>
                                        {order.shipping_proof ? (
                                          <div
                                            onClick={() =>
                                              setZoomImage(
                                                `${getApiUrl()}${order.shipping_proof}`,
                                              )
                                            }
                                            className="aspect-video rounded-xl overflow-hidden border border-zinc-700 cursor-pointer group relative"
                                          >
                                            <img
                                              src={`${getApiUrl()}${order.shipping_proof}`}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <span className="text-[9px] font-black text-white uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                                                Perbesar
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="aspect-video rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                                              Foto tidak tersedia
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {paginatedOrders.map((order, idx) => (
                        <div
                          key={order.id}
                          className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden"
                        >
                          <div className="px-5 py-3 border-b border-zinc-800 bg-emerald-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-zinc-800 rounded-lg flex items-center justify-center text-[9px] font-black text-zinc-500">
                                {(currentPage - 1) * itemsPerPage + idx + 1}
                              </span>
                              <span className="text-[10px] font-black text-white font-mono">
                                {order.order_id}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-widest border ${getStatusStyle(order.status)}`}
                            >
                              {[
                                "completed",
                                "disbursement_requested",
                                "disbursed",
                              ].includes(order.status) && (
                                <CheckCircle2 size={9} />
                              )}
                              {order.status === "processing" && (
                                <Clock size={9} />
                              )}
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Pembeli
                              </span>
                              <div className="text-right">
                                <span className="text-xs font-black text-white block">
                                  {order.receiver_name || "-"}
                                </span>
                                {/* <span className="text-[10px] text-zinc-500 font-bold">@{order.user?.username || '-'}</span> */}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Produk
                              </span>
                              <div className="text-right">
                                <span className="text-xs font-bold text-zinc-300 truncate max-w-[160px] block">
                                  {order.product?.name}
                                </span>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                  <span className="inline-block px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">
                                    ID: {order.product?.product_id || "-"}
                                  </span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                    order.product?.type === 'auction'
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                    {order.product?.type === 'auction' ? 'Lelang' : 'Langsung'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Tgl Selesai
                              </span>
                              <span className="text-xs font-bold text-zinc-400">
                                {new Date(
                                  order.completed_at || order.updated_at,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Total
                              </span>
                              <div className="text-right">
                                <span className="text-sm font-black text-emerald-400">
                                  {formatPrice(
                                    Number(order.total_price) -
                                      (Number(order.admin_fee) || 0),
                                  )}
                                </span>
                                {Number(order.admin_fee) > 0 && (
                                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter block mt-0.5">
                                    Net (Tanpa Biaya Admin)
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Shipping toggle */}
                            <button
                              onClick={() =>
                                setExpandedShipping(
                                  expandedShipping === order.id
                                    ? null
                                    : order.id,
                                )
                              }
                              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border mt-1 ${
                                expandedShipping === order.id
                                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
                              }`}
                            >
                              <Truck size={12} />{" "}
                              {expandedShipping === order.id
                                ? "Sembunyikan"
                                : "Detail Pengiriman"}
                            </button>
                            {expandedShipping === order.id && (
                              <div className="space-y-3 pt-1 animate-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-zinc-950/60 border border-blue-500/20 rounded-2xl space-y-1">
                                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                    Nomor Resi
                                  </p>
                                  <p className="text-sm font-black text-white tracking-widest break-all">
                                    {order.tracking_number || "-"}
                                  </p>
                                </div>
                                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-1">
                                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                    Penerima
                                  </p>
                                  <p className="text-xs font-black text-white">
                                    {order.receiver_name} — {order.phone_number}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    {order.shipping_address}
                                  </p>
                                </div>
                                {order.shipping_proof && (
                                  <div
                                    onClick={() =>
                                      setZoomImage(
                                        `${getApiUrl()}${order.shipping_proof}`,
                                      )
                                    }
                                    className="aspect-video rounded-xl overflow-hidden border border-zinc-700 cursor-pointer"
                                  >
                                    <img
                                      src={`${getApiUrl()}${order.shipping_proof}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            <a
                              href={`/user/toko/pesanan-masuk/detail/${order.id}`}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 mt-1"
                            >
                              <ChevronRight size={12} /> Lihat Detail Transaksi
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Component */}
                    {totalPages > 1 && (
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 pb-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest order-2 md:order-1">
                          Menampilkan {indexOfFirstItem + 1}-
                          {Math.min(indexOfLastItem, filteredOrders.length)}{" "}
                          dari {filteredOrders.length} Pesanan
                        </p>
                        <div className="flex items-center gap-1.5 order-1 md:order-2">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 transition-all"
                          >
                            <ChevronRight size={18} className="rotate-180" />
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter((page) => {
                                // Logic to show limited pages
                                if (totalPages <= 5) return true;
                                return (
                                  Math.abs(page - currentPage) <= 1 ||
                                  page === 1 ||
                                  page === totalPages
                                );
                              })
                              .map((page, index, array) => (
                                <Fragment key={page}>
                                  {index > 0 &&
                                    array[index - 1] !== page - 1 && (
                                      <span className="text-zinc-600 px-1 font-bold">
                                        ...
                                      </span>
                                    )}
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all border ${
                                      currentPage === page
                                        ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </Fragment>
                              ))}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages),
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] border-dashed">
                    <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-700">
                      <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">
                        Belum Ada Penjualan Selesai
                      </h3>
                      <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                        Transaksi yang berhasil diselesaikan akan muncul di
                        sini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageCircle size={100} />
              </div>
              <h3 className="text-xl font-black text-white mb-4">
                Interaksi Pelanggan
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                Pantau pesan masuk dari calon pembeli. Respon yang cepat
                meningkatkan reputasi tokomu.
              </p>
              <button className="flex items-center gap-2 text-emerald-400 font-bold hover:gap-3 transition-all">
                Lihat Pesan Baru
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle size={100} />
              </div>
              <h3 className="text-xl font-black text-white mb-4">
                Tips Penjualan Aman
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                Selalu gunakan jasa pengiriman bergaransi dan pastikan
                pembayaran dilakukan melalui sistem yang aman.
              </p>
              <button className="flex items-center gap-2 text-emerald-400 font-bold hover:gap-3 transition-all">
                Pelajari Selengkapnya
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
          <div
            className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setZoomImage(null)}
          />
          <div className="relative z-10 w-full max-w-4xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-zinc-950 rounded-full flex items-center justify-center transition-all border border-white/10"
            >
              <X size={20} />
            </button>
            <div className="rounded-[2rem] overflow-hidden border border-white/10">
              <img
                src={zoomImage}
                alt="Bukti Pengiriman"
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cost Modal */}
      {showCostModal && selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setShowCostModal(false)}
          ></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border-t-zinc-700">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">
                    Input Invoice Pesanan
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium">
                    Tentukan biaya kirim untuk pesanan{" "}
                    <span className="text-pink-500 font-bold">
                      {selectedOrder.order_id}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setShowCostModal(false)}
                  className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Box: Alamat Pembeli */}
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <MapPin size={14} className="text-pink-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Alamat Tujuan
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white font-bold">
                    {selectedOrder.receiver_name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {selectedOrder.shipping_address}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedOrder.phone_number}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCostSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Biaya Ongkir (IDR)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                        Rp
                      </div>
                      <input
                        required
                        type="number"
                        value={costForm.shipping_cost}
                        onChange={(e) =>
                          setCostForm({
                            ...costForm,
                            shipping_cost: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-pink-500 transition-all font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Biaya Packing (IDR)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                        Rp
                      </div>
                      <input
                        required
                        type="number"
                        value={costForm.packing_cost}
                        onChange={(e) =>
                          setCostForm({
                            ...costForm,
                            packing_cost: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-pink-500 transition-all font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-zinc-800/30 rounded-3xl p-6 space-y-4 border border-zinc-800">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">
                        Harga Produk ({selectedOrder.quantity}x)
                      </span>
                      <span className="text-white">
                        {formatPrice(
                          selectedOrder.price * selectedOrder.quantity,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">Ongkos Kirim</span>
                      <span className="text-white">
                        +{formatPrice(parseInt(costForm.shipping_cost) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">Biaya Packing</span>
                      <span className="text-white">
                        +{formatPrice(parseInt(costForm.packing_cost) || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-800"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-white uppercase tracking-widest">
                      Total Invoice
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {formatPrice(
                        selectedOrder.price * selectedOrder.quantity +
                          (parseInt(costForm.shipping_cost) || 0) +
                          (parseInt(costForm.packing_cost) || 0),
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCostModal(false)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all active:scale-95 border border-zinc-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCost}
                    className="flex-1 py-4 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdatingCost ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Kirim Invoice
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
