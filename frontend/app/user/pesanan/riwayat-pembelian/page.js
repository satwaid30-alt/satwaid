"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, CheckCircle2, Store, Eye, AlertCircle, Calendar, ArrowLeft, Clock, Package, ChevronLeft, ChevronRight } from "lucide-react";
import ActionModal from "@/components/ActionModal";
import { getApiUrl } from "@/app/utils/api";

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

export default function RiwayatPembelianPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Global Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "",
    isLoading: false,
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setIsLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const url = `${getApiUrl()}/orders/user/${user.id}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        // Filter only completed orders (including disbursement states which are technically 'completed' for the buyer)
        const completedOrders = (result.data || []).filter((o) => ["completed", "disbursement_requested", "disbursed"].includes(o.status));
        setOrders(completedOrders);
      } else {
        console.error("Failed to fetch orders:", result.message);
      }
    } catch (err) {
      console.error("Error fetching orders from", getApiUrl(), err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getImagesArray = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      return JSON.parse(images);
    } catch (e) {
      return [];
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("data:image")) return path;
    if (path.startsWith("http")) {
      if (typeof window !== "undefined") {
        try {
          const urlObj = new URL(path);
          if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" || urlObj.port === "4000" || urlObj.port === "3000") {
            urlObj.hostname = window.location.hostname;
            urlObj.port = "4000";
          }
          return urlObj.toString();
        } catch (e) {
          return path;
        }
      }
      return path.replace("localhost:3000", "localhost:4000");
    }
    return `${getApiUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const filteredOrders = orders.filter((order) => {
    const productName = order.product?.name || "";
    const orderId = order.order_id || "";
    return productName.toLowerCase().includes(searchQuery.toLowerCase()) || orderId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
            <CheckCircle2 size={14} />
            Transaksi Selesai
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Riwayat Pembelian</h1>
          <p className="text-zinc-400 font-medium">Daftar semua produk yang telah berhasil Anda beli</p>
        </div>
        <Link href="/user/pesanan" className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Pesanan
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Cari item di riwayat pembelian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-48 bg-zinc-900/50 border border-zinc-800 rounded-3xl animate-pulse" />)
        ) : currentItems.length > 0 ? (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800">
                      <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No.</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID & Tanggal</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Toko</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {currentItems.map((order, index) => (
                      <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-4 py-6 text-center">
                          <span className="text-[11px] font-black text-zinc-600 font-mono">{indexOfFirstItem + index + 1}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-white tracking-wider font-mono uppercase">{order.order_id}</p>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Calendar size={12} />
                              <span className="text-[10px] font-bold">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                              <img src={getImageUrl(getImagesArray(order.product?.images)[0])} alt={order.product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-white truncate max-w-[200px]">{order.product?.name}</p>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                {order.quantity} Item • {order.product?.type === "sell" ? "Beli" : "Lelang"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <Store size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{order.shop?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm font-black text-emerald-500 font-mono">{formatPrice(order.total_price)}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Selesai</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center items-center gap-2">
                            <Link href={`/user/pesanan/detail-pesanan/${order.id}`} className="p-2.5 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 rounded-xl transition-all active:scale-90 border border-zinc-700 hover:border-emerald-400" title="Lihat Detail">
                              <Eye size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {currentItems.map((order) => (
                <div key={order.id} className="bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden transition-all group">
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/40">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{order.order_id}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">Selesai</div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                      <img src={getImageUrl(getImagesArray(order.product?.images)[0])} alt={order.product?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                          <Store size={12} />
                          <span className="text-[9px] font-black uppercase tracking-tight truncate">{order.shop?.name}</span>
                        </div>
                        <h3 className="text-sm font-black text-white truncate">{order.product?.name}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-black text-emerald-500">{formatPrice(order.total_price)}</p>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{order.quantity} Item</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-4 bg-zinc-900/40 border-t border-zinc-800 flex items-center gap-3">
                    <Link href={`/user/pesanan/detail-pesanan/${order.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 text-[10px] font-black uppercase tracking-widest transition-all">
                      <Eye size={14} /> Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center space-y-6 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] border-dashed">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
              <ShoppingBag size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Belum Ada Riwayat</h3>
              <p className="text-zinc-500 max-w-xs mx-auto text-sm">Transaksi yang sudah selesai akan muncul di sini secara otomatis.</p>
            </div>
            <Link href="/toko" className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-3 rounded-2xl transition-all active:scale-95">
              Mulai Belanja
            </Link>
          </div>
        ) : null}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem]">
          <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} dari {filteredOrders.length} Riwayat
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

      {/* Global Action Modal Rendering */}
      <ActionModal isOpen={actionModal.isOpen} onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))} onConfirm={actionModal.onConfirm} type={actionModal.type} title={actionModal.title} message={actionModal.message} confirmText={actionModal.confirmText} isLoading={actionModal.isLoading} />
    </div>
  );
}
