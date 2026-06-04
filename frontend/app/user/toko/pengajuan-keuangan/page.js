"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, FileText, CheckCircle2, Clock, DollarSign, Calendar, ShoppingBag, Eye, Receipt, AlertCircle, Info, ChevronLeft, ChevronRight, ArrowUpRight, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { io } from "socket.io-client";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

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

export default function RiwayatTransaksiSeller() {
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const handleBulkRequest = async () => {
    if (selectedOrders.length === 0) return;
    setIsSubmittingBulk(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/orders/bulk-request-disbursement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ order_ids: selectedOrders }),
      });
      const result = await res.json();
      if (res.ok) {
        setActionModal({
          isOpen: true,
          type: "success",
          title: "Pengajuan Berhasil",
          message: result.message || `${selectedOrders.length} Pesanan berhasil diajukan untuk dicairkan sekaligus.`,
          onConfirm: null,
        });
        setSelectedOrders([]);
        fetchShopOrders();
      } else {
        throw new Error(result.message || "Gagal memproses pengajuan");
      }
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Pengajuan Gagal",
        message: err.message || "Terjadi kesalahan saat memproses pengajuan pencairan.",
        onConfirm: null,
      });
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const fetchShopOrders = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Get Shop ID first
      const shopRes = await fetch(`${getApiUrl()}/shops/user/${user.id}`);
      const shopData = await shopRes.json();

      if (shopRes.ok && shopData.data) {
        setShop(shopData.data);
        const res = await fetch(`${getApiUrl()}/orders/shop/${shopData.data.id}`);
        const result = await res.json();
        if (res.ok) {
          // Filter for completed or disbursed orders
          // For now, show all but prioritize those with disbursement info
          setOrders(result.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders();

    // Setup Socket.io for Real-time Updates
    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null,
          },
        });
        socket.emit("join_user", userData.id);

        socket.on("new_notification", () => {
          fetchShopOrders(); // Auto-refresh when disbursement status changes
        });
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/100x100?text=No+Image";

    let finalPath = path;
    try {
      if (typeof path === "string" && (path.startsWith("[") || path.startsWith("{"))) {
        const parsed = JSON.parse(path);
        finalPath = Array.isArray(parsed) ? parsed[0] : parsed;
      } else if (Array.isArray(path)) {
        finalPath = path[0];
      }
    } catch (e) {
      console.error("Error parsing image path", e);
    }

    if (!finalPath) return "https://placehold.co/100x100?text=No+Image";
    if (typeof finalPath !== "string") return "https://placehold.co/100x100?text=Invalid+Path";

    // Return data URLs and absolute URLs as is
    if (finalPath.startsWith("http") || finalPath.startsWith("data:")) return finalPath;

    const baseUrl = getApiUrl();
    const formattedPath = finalPath.startsWith("/") ? finalPath : `/${finalPath}`;
    return `${baseUrl}${formattedPath}`;
  };

  const totalEarnings = orders
    .filter((o) => ["completed", "disbursement_requested"].includes(o.status) || !!(o.disbursed_at || o.disbursement_proof))
    .reduce((acc, curr) => {
      const total = Number(curr.price || 0) * Number(curr.quantity || 1) + Number(curr.shipping_cost || 0) + Number(curr.packing_cost || 0) - Number(curr.additional_fee || 0);
      return acc + total;
    }, 0);

  const totalDisbursedAmount = orders
    .filter((o) => o.disbursed_at || o.disbursement_proof)
    .reduce((acc, curr) => {
      const total = Number(curr.price || 0) * Number(curr.quantity || 1) + Number(curr.shipping_cost || 0) + Number(curr.packing_cost || 0) - Number(curr.additional_fee || 0);
      return acc + total;
    }, 0);

  const totalPendingDisbursement = orders
    .filter((o) => ["completed", "disbursement_requested"].includes(o.status) && !(o.disbursed_at || o.disbursement_proof))
    .reduce((acc, curr) => {
      const total = Number(curr.price || 0) * Number(curr.quantity || 1) + Number(curr.shipping_cost || 0) + Number(curr.packing_cost || 0) - Number(curr.additional_fee || 0);
      return acc + total;
    }, 0);

  const filteredOrders = orders.filter((order) => {
    // Riwayat hanya tampilkan pesanan completed, disbursement_requested, atau sudah dicairkan
    const isRelevant = ["completed", "disbursement_requested"].includes(order.status) || !!(order.disbursed_at || order.disbursement_proof);
    if (!isRelevant) return false;

    const matchesSearch = order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) || order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "disbursed" && (order.disbursed_at || order.disbursement_proof)) ||
      (statusFilter === "requested" && order.status === "disbursement_requested" && !(order.disbursed_at || order.disbursement_proof)) ||
      (statusFilter === "pending" && order.status === "completed" && !(order.disbursed_at || order.disbursement_proof));

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-2 uppercase italic">Pengajuan Keuangan</h1>
          <p className="text-zinc-500 font-medium">Pantau pencairan dana dan bukti transfer dari platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Card 1: Total Pendapatan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-2 md:space-y-4 relative overflow-hidden group">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
            <Wallet size={16} className="md:hidden" />
            <Wallet size={24} className="hidden md:block" />
          </div>
          <div>
            <p className="text-[8px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">Total Pendapatan</p>
            <h3 className="text-xs sm:text-sm md:text-2xl font-black text-white mt-0.5 md:mt-1 leading-none">{formatPrice(totalEarnings)}</h3>
          </div>
        </div>

        {/* Card 2: Sudah Ditransfer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-2 md:space-y-4 relative overflow-hidden group">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={16} className="md:hidden" />
            <CheckCircle2 size={24} className="hidden md:block" />
          </div>
          <div>
            <p className="text-[8px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">Sudah Ditransfer</p>
            <h3 className="text-xs sm:text-sm md:text-2xl font-black text-emerald-500 mt-0.5 md:mt-1 leading-none">{formatPrice(totalDisbursedAmount)}</h3>
          </div>
        </div>

        {/* Card 3: Belum Ditransfer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-2 md:space-y-4 relative overflow-hidden group">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
            <DollarSign size={16} className="md:hidden" />
            <DollarSign size={24} className="hidden md:block" />
          </div>
          <div>
            <p className="text-[8px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">Belum Ditransfer</p>
            <h3 className="text-xs sm:text-sm md:text-2xl font-black text-amber-500 mt-0.5 md:mt-1 leading-none">{formatPrice(totalPendingDisbursement)}</h3>
          </div>
        </div>

        {/* Card 4: Status Pencairan (Pengajuan Aktif & Belum Diajukan) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-2 md:space-y-4 relative overflow-hidden group">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Clock size={16} className="md:hidden" />
            <Clock size={24} className="hidden md:block" />
          </div>
          <div>
            <p className="text-[8px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">Status Pencairan</p>
            <div className="flex items-center gap-3 mt-1.5 md:mt-2">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase">Pengajuan</span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-blue-400">
                  {orders.filter((o) => o.status === "disbursement_requested" && !(o.disbursed_at || o.disbursement_proof)).length} <span className="text-[8px] md:text-xs font-bold text-zinc-600">Trx</span>
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800"></div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase">Belum Diajukan</span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-amber-500">
                  {orders.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof)).length} <span className="text-[8px] md:text-xs font-bold text-zinc-600">Order</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-3 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Cari Nomor Invoice atau Nama Produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 min-w-[200px]">
          <Filter size={16} className="text-zinc-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer w-full pr-4">
            <option value="all" className="bg-zinc-900 text-white">
              Semua Status
            </option>
            <option value="disbursed" className="bg-zinc-900 text-white">
              Sudah Ditransfer
            </option>
            <option value="requested" className="bg-zinc-900 text-white">
              Pengajuan (Menunggu Konfirmasi)
            </option>
            <option value="pending" className="bg-zinc-900 text-white">
              Belum Diajukan
            </option>
          </select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-500/20 transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
          <Info size={20} className="text-emerald-500" />
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
          <strong className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Tip Pencairan Sekaligus:</strong>
          Ajukan pencairan beberapa pesanan sekaligus dengan memilih pesanan pada tabel, lalu klik <span className="text-emerald-400 font-bold">Ajukan Sekaligus</span> untuk memproses semuanya dalam satu langkah.
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof)).length > 0 && currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof)).every((o) => selectedOrders.includes(o.id))}
                      onChange={(e) => {
                        const eligibleOrders = currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof));
                        if (e.target.checked) {
                          setSelectedOrders((prev) => {
                            const newSelection = [...prev];
                            eligibleOrders.forEach((o) => {
                              if (!newSelection.includes(o.id)) newSelection.push(o.id);
                            });
                            return newSelection;
                          });
                        } else {
                          setSelectedOrders((prev) => prev.filter((id) => !eligibleOrders.map((o) => o.id).includes(id)));
                        }
                      }}
                      className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-zinc-400 uppercase tracking-widest text-[9px] font-black">Pilih Semua</span>
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk & ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Waktu Terjual</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Pengajuan</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Transfer</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rincian Dana</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Total Diterima</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-8 py-10 h-24 bg-zinc-900/50"></td>
                  </tr>
                ))
              ) : currentItems.length > 0 ? (
                currentItems.map((order, index) => (
                  <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/50">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2.5">
                        {order.status === "completed" && !(order.disbursed_at || order.disbursement_proof) ? (
                          <>
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrders((prev) => [...prev, order.id]);
                                } else {
                                  setSelectedOrders((prev) => prev.filter((id) => id !== order.id));
                                }
                              }}
                              className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Cairkan</span>
                          </>
                        ) : (
                          <>
                            <span className="w-4 h-4 block bg-zinc-800/40 rounded border border-zinc-800/20 cursor-not-allowed shrink-0"></span>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">Selesai/Review</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center text-xs font-bold text-zinc-500 font-mono">{indexOfFirstItem + index + 1}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <img src={getImageUrl(order.product?.images)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white line-clamp-1">{order.product?.name || "Produk dihapus"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-emerald-500 font-mono tracking-tighter">{order.order_id}</span>
                            <span className="px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">ID: {order.product?.product_id || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                        <Calendar size={14} className="text-zinc-600" />
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {order.disbursement_requested_at ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                            <Calendar size={12} className="text-blue-400/70" />
                            {new Date(order.disbursement_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">{new Date(order.disbursement_requested_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB</span>
                        </div>
                      ) : order.disbursed_at || order.disbursement_proof ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap">Langsung Transfer</span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-600 italic">Belum Diajukan</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {order.disbursed_at ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <Calendar size={12} className="text-emerald-500/70" />
                            {new Date(order.disbursed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">{new Date(order.disbursed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB</span>
                        </div>
                      ) : order.status === "disbursement_requested" ? (
                        <span className="text-[10px] font-bold text-zinc-500 italic">Proses Review</span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-600 italic">Belum Ditransfer</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Produk: {formatPrice(Number(order.price) * Number(order.quantity))}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Ongkir + Pack: {formatPrice(Number(order.shipping_cost) + Number(order.packing_cost))}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-emerald-500">{formatPrice(Number(order.price) * Number(order.quantity) + Number(order.shipping_cost) + Number(order.packing_cost) - (Number(order.additional_fee) || 0))}</span>
                        {order.additional_fee > 0 && <span className="text-[9px] font-bold text-red-500/70 italic">Potongan: {formatPrice(order.additional_fee)}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        {order.disbursed_at || order.disbursement_proof ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Transfer Berhasil
                          </div>
                        ) : order.status === "disbursement_requested" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                            <ArrowUpRight size={10} /> Pengajuan
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                            <Clock size={10} /> Belum Diajukan
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {order.disbursed_at || order.disbursement_proof ? (
                          <Link href={`/user/toko/pengajuan-keuangan/detail/${order.id}`} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 hover:border-zinc-600 group/btn min-w-[140px] justify-center">
                            <FileText size={14} className="text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                            Detail Transfer
                          </Link>
                        ) : order.status === "disbursement_requested" ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 min-w-[140px] justify-center cursor-default">
                            <ArrowUpRight size={14} />
                            Menunggu Admin
                          </div>
                        ) : (
                          <Link href={`/user/toko/pengajuan-keuangan/pengajuan/${order.id}`} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] inline-flex items-center gap-2">
                            <ArrowUpRight size={14} /> Ajukan Pencairan
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-700 border border-zinc-800/50">
                        <Receipt size={40} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-black uppercase tracking-widest">Belum Ada Transaksi</p>
                        <p className="text-zinc-500 text-xs font-medium">Data pencairan dana Anda akan muncul di sini setelah pesanan selesai.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {/* Select All & Summary Control Bar for Mobile */}
        {!isLoading && currentItems.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof)).length > 0 && currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof)).every((o) => selectedOrders.includes(o.id))}
                onChange={(e) => {
                  const eligibleOrders = currentItems.filter((o) => o.status === "completed" && !(o.disbursed_at || o.disbursement_proof));
                  if (e.target.checked) {
                    setSelectedOrders((prev) => {
                      const newSelection = [...prev];
                      eligibleOrders.forEach((o) => {
                        if (!newSelection.includes(o.id)) newSelection.push(o.id);
                      });
                      return newSelection;
                    });
                  } else {
                    setSelectedOrders((prev) => prev.filter((id) => !eligibleOrders.map((o) => o.id).includes(id)));
                  }
                }}
                className="rounded border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-5 h-5 cursor-pointer"
              />
              <div>
                <span className="text-white text-xs font-black uppercase tracking-wider">Pilih Semua</span>
                <span className="text-[9px] text-zinc-500 block leading-tight font-bold">Untuk Pencairan Massal</span>
              </div>
            </label>
            {selectedOrders.length > 0 && (
              <button onClick={() => setSelectedOrders([])} className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                Bersihkan ({selectedOrders.length})
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-48 animate-pulse"></div>)
        ) : currentItems.length > 0 ? (
          currentItems.map((order, index) => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 active:scale-[0.99] transition-all duration-300">
              {/* Card Header: Invoice ID & Status Badge */}
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-3">
                  {order.status === "completed" && !(order.disbursed_at || order.disbursement_proof) ? (
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders((prev) => [...prev, order.id]);
                        } else {
                          setSelectedOrders((prev) => prev.filter((id) => id !== order.id));
                        }
                      }}
                      className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                    />
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-zinc-600 font-mono">#{indexOfFirstItem + index + 1}</span>
                    <p className="text-[11px] font-black text-emerald-500 font-mono tracking-tighter">{order.order_id}</p>
                  </div>
                </div>
                <div>
                  {order.disbursed_at || order.disbursement_proof ? (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">Transfer Berhasil</span>
                  ) : order.status === "disbursement_requested" ? (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">Pengajuan</span>
                  ) : (
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg text-[8px] font-black uppercase tracking-widest">Belum Diajukan</span>
                  )}
                </div>
              </div>

              {/* Card Body: Product Image & Details */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                  <img src={getImageUrl(order.product?.images)} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-black text-white line-clamp-1">{order.product?.name || "Produk dihapus"}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-500 rounded font-black uppercase tracking-widest border border-zinc-800">ID: {order.product?.product_id || "-"}</span>
                    <span className="text-[9px] font-bold text-zinc-500">Qty: {order.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800/40 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">Tanggal Terjual</span>
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Calendar size={12} className="text-zinc-500" />
                    {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">Tanggal Pengajuan</span>
                  {order.disbursement_requested_at ? (
                    <span className="text-blue-400 font-bold flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-400/70" />
                      {new Date(order.disbursement_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - {new Date(order.disbursement_requested_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB
                    </span>
                  ) : order.disbursed_at || order.disbursement_proof ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">Langsung Transfer</span>
                  ) : (
                    <span className="text-zinc-600 font-bold italic">Belum Diajukan</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">Tanggal Transfer</span>
                  {order.disbursed_at ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                      <Calendar size={12} className="text-emerald-500/70" />
                      {new Date(order.disbursed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - {new Date(order.disbursed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB
                    </span>
                  ) : order.status === "disbursement_requested" ? (
                    <span className="text-zinc-500 font-bold italic">Review Admin</span>
                  ) : (
                    <span className="text-zinc-600 font-bold italic">Belum Cair</span>
                  )}
                </div>

                <div className="border-t border-zinc-800/40 pt-2.5 flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">Rincian Dana</span>
                  <div className="text-right text-[9px] text-zinc-400 space-y-0.5 font-bold">
                    <p>Produk: {formatPrice(Number(order.price) * Number(order.quantity))}</p>
                    <p>Ongkir + Pack: {formatPrice(Number(order.shipping_cost) + Number(order.packing_cost))}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer: Payout Amount & CTA Button */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Pencairan Dana</p>
                  <p className="text-sm font-black text-emerald-500">{formatPrice(Number(order.price) * Number(order.quantity) + Number(order.shipping_cost) + Number(order.packing_cost) - (Number(order.additional_fee) || 0))}</p>
                  {order.additional_fee > 0 && <p className="text-[9px] font-bold text-red-500/70 italic">Potongan: {formatPrice(order.additional_fee)}</p>}
                </div>
                <div className="flex-1 max-w-[180px]">
                  {order.disbursed_at || order.disbursement_proof ? (
                    <Link href={`/user/toko/pengajuan-keuangan/detail/${order.id}`} className="w-full flex items-center justify-center gap-1.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-zinc-700">
                      <FileText size={12} className="text-emerald-500" />
                      Detail
                    </Link>
                  ) : order.status === "disbursement_requested" ? (
                    <div className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-500/10 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 cursor-default text-center leading-tight">Proses Review</div>
                  ) : (
                    <Link href={`/user/toko/pengajuan-keuangan/pengajuan/${order.id}`} className="w-full flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98]">
                      <ArrowUpRight size={12} /> Ajukan
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Tidak ada data</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} dari {filteredOrders.length} Transaksi
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

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex gap-6 items-start group hover:border-emerald-500/30 transition-all">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <DollarSign size={28} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Kapan Dana Saya Cair?</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Dana akan diproses oleh Admin segera setelah pembeli mengonfirmasi pesanan diterima atau saat transaksi dinyatakan selesai.{" "}
              {shop && shop.membership_level === "Enterprise Seller" ? (
                <span className="text-purple-400 font-semibold">Karena toko Anda telah diupgrade (Enterprise Seller), proses pencairan dana diprioritaskan selesai dalam 1 hari kerja.</span>
              ) : shop && shop.membership_level === "Pro Seller" ? (
                <span className="text-emerald-400 font-semibold">Karena toko Anda telah diupgrade (Pro Seller), proses pencairan dana diprioritaskan selesai dalam 1-2 hari kerja.</span>
              ) : (
                "Proses transfer biasanya memakan waktu 3-5 hari kerja."
              )}
            </p>
          </div>
        </div>
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex gap-6 items-start group hover:border-blue-500/30 transition-all">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Info size={28} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Potongan Biaya</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">Pencairan dana yang Anda terima adalah nilai bersih (Subtotal Produk + Ongkir + Packing) dikurangi biaya tambahan jika ada (misal: biaya admin transfer antar bank).</p>
          </div>
        </div>
      </div>

      {/* Centered Bulk Confirmation Modal (Appears immediately when selectedOrders.length > 0) */}
      {selectedOrders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button onClick={() => setSelectedOrders([])} className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
              <span className="font-bold text-sm">✕</span>
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 mt-2">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Konfirmasi Pencairan</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pencairan Dana Sekaligus</p>
            </div>

            {/* Selected Items Breakdown List */}
            <div className="bg-zinc-950/45 border border-zinc-800/80 rounded-2xl p-5 space-y-3.5 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
              {orders
                .filter((o) => selectedOrders.includes(o.id))
                .map((order) => (
                  <div key={order.id} className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2.5 last:border-0 last:pb-0">
                    <div className="text-left">
                      <p className="font-black text-white line-clamp-1 max-w-[190px]">{order.product?.name || "Produk dihapus"}</p>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{order.order_id}</p>
                    </div>
                    <p className="font-black text-emerald-500 text-right shrink-0 ml-4">{formatPrice(Number(order.price) * Number(order.quantity) + Number(order.shipping_cost) + Number(order.packing_cost))}</p>
                  </div>
                ))}
            </div>

            {/* Payout Summary */}
            <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Total Pesanan</span>
                <span className="font-black text-white">{selectedOrders.length} Produk Terjual</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">Total Dana Bersih</span>
                <span className="text-base font-black text-emerald-400">{formatPrice(orders.filter((o) => selectedOrders.includes(o.id)).reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.quantity) + Number(curr.shipping_cost) + Number(curr.packing_cost)), 0))}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  await handleBulkRequest();
                }}
                disabled={isSubmittingBulk}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_25px_rgba(16,185,129,0.2)]"
              >
                {isSubmittingBulk ? "Memproses..." : "Ajukan Sekarang"} <ArrowUpRight size={14} />
              </button>
              <button onClick={() => setSelectedOrders([])} disabled={isSubmittingBulk} className="w-full py-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionModal isOpen={actionModal.isOpen} onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))} type={actionModal.type} title={actionModal.title} message={actionModal.message} onConfirm={actionModal.onConfirm} />
    </div>
  );
}
