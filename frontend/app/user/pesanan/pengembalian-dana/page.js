"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Filter, CheckCircle2, Clock, XCircle, Wallet, Store, ArrowRight, Eye, RefreshCw } from "lucide-react";
import { getApiUrl, getImageUrl } from "@/app/utils/api";

export default function PengembalianDanaPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const ordersRes = await fetch(`${getApiUrl()}/orders/user/${user.id}`);
      const ordersResult = await ordersRes.json();
      if (ordersRes.ok && ordersResult.data) {
        // Filter: cancelled orders with payment uploaded/proof
        const refundOrders = (ordersResult.data || []).filter((o) => o.status === "cancelled" && (o.payment_uploaded_at || o.payment_proof));
        setOrders(refundOrders);
      }
    } catch (err) {
      console.error("Error fetching refund data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    const isNotSubmitted = !order.refund_status;
    const isPending = order.refund_status === "pending";
    const isRefunded = order.refund_status === "refunded";
    const isRejected = order.refund_status === "rejected";

    let matchesStatus = false;
    if (filterStatus === "all") {
      matchesStatus = true;
    } else if (filterStatus === "not_submitted") {
      matchesStatus = isNotSubmitted;
    } else if (filterStatus === "pending") {
      matchesStatus = isPending;
    } else if (filterStatus === "refunded") {
      matchesStatus = isRefunded;
    } else if (filterStatus === "rejected") {
      matchesStatus = isRejected;
    }

    const matchesSearch = order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) || order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Stats calculation
  const counts = {
    all: orders.length,
    not_submitted: orders.filter((o) => !o.refund_status).length,
    pending: orders.filter((o) => o.refund_status === "pending").length,
    refunded: orders.filter((o) => o.refund_status === "refunded").length,
    rejected: orders.filter((o) => o.refund_status === "rejected").length,
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat data pengembalian dana...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Navigation & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link href="/user/pesanan" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-xs font-bold uppercase tracking-wider">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Pesanan
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">Pengembalian Dana</h1>
          <p className="text-zinc-400 font-medium text-sm font-medium">Pantau status refund untuk pesanan yang dibatalkan setelah pembayaran dilakukan.</p>
        </div>

        <button onClick={handleRefresh} disabled={refreshing} className="self-start md:self-auto flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-2xl transition-all text-xs font-black uppercase tracking-widest">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Perbarui Data
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Semua Batal", count: counts.all, colorClass: "text-white" },
          { label: "Belum Diajukan", count: counts.not_submitted, colorClass: "text-blue-400" },
          { label: "Menunggu Transfer", count: counts.pending, colorClass: "text-amber-500" },
          { label: "Refund Berhasil", count: counts.refunded, colorClass: "text-emerald-500" },
        ].map((card) => (
          <div key={card.label} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col gap-1 transition-all shadow-md">
            <p className={`text-2xl font-black ${card.colorClass}`}>{card.count}</p>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input type="text" placeholder="Cari ID Pesanan, Nama Produk, atau Toko..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-900/30 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium" />
        </div>
        <div className="md:col-span-4 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-zinc-900/30 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-black uppercase tracking-widest appearance-none cursor-pointer">
            <option value="all">Semua Status</option>
            <option value="not_submitted">Belum Diajukan ({counts.not_submitted})</option>
            <option value="pending">Menunggu Transfer ({counts.pending})</option>
            <option value="refunded">Refund Berhasil ({counts.refunded})</option>
            <option value="rejected">Refund Ditolak ({counts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Refund List Table (Desktop View) */}
      <div className="hidden md:block bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No.</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Pesanan & Batal</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk & Toko</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Nominal Refund</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {currentItems.length > 0 ? (
                currentItems.map((order, index) => {
                  const isNotSubmitted = !order.refund_status;
                  const isPending = order.refund_status === "pending";
                  const isRefunded = order.refund_status === "refunded";
                  const isRejected = order.refund_status === "rejected";

                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-zinc-650 font-mono">{indexOfFirstItem + index + 1}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-white tracking-wider font-mono uppercase">{order.order_id}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">Batal: {formatDate(order.cancelled_at || order.updated_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-0.5 max-w-[240px]">
                          <p className="text-xs font-black text-white truncate">{order.product?.name || "-"}</p>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Store size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold uppercase truncate">{order.shop?.name || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-sm font-black text-emerald-500 font-mono">{formatPrice(order.total_price)}</span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {isNotSubmitted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Clock size={8} /> Belum Diajukan
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Clock size={8} /> Menunggu Transfer
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={8} /> Selesai
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <XCircle size={8} /> Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <Link
                          href={`/user/pesanan/pengembalian-dana/detail/${order.id}`}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                            isNotSubmitted ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700"
                          }`}
                        >
                          <Eye size={12} /> {isNotSubmitted ? "Ajukan Refund" : "Detail"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 mx-auto">
                        <Wallet size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Tidak Ada Data Refund</p>
                        <p className="text-xs text-zinc-500 font-medium">Anda tidak memiliki pesanan dibatalkan yang memerlukan pengembalian dana.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-4">
        {currentItems.length > 0 ? (
          currentItems.map((order) => {
            const isNotSubmitted = !order.refund_status;
            const isPending = order.refund_status === "pending";
            const isRefunded = order.refund_status === "refunded";
            const isRejected = order.refund_status === "rejected";

            return (
              <div key={order.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-lg">
                {/* Header: Invoice & Status */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white tracking-wider font-mono uppercase">{order.order_id}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">Batal: {formatDate(order.cancelled_at || order.updated_at)}</p>
                  </div>
                  <div>
                    {isNotSubmitted && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider">Belum Diajukan</span>}
                    {isPending && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-wider">Menunggu Transfer</span>}
                    {isRefunded && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-wider">Selesai</span>}
                    {isRejected && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-black uppercase tracking-wider">Ditolak</span>}
                  </div>
                </div>

                {/* Body: Product Info */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-zinc-650">
                    {order.product?.images?.length > 0 ? <img src={getImageUrl(order.product.images)} className="w-full h-full object-cover" alt={order.product.name} /> : <Store size={20} />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-black text-white truncate">{order.product?.name || "-"}</p>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Store size={10} className="text-emerald-500 shrink-0" />
                      <span className="text-[9px] font-bold uppercase truncate">{order.shop?.name || "-"}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      {order.quantity} x {formatPrice(order.price)}
                    </p>
                  </div>
                </div>

                {/* Footer: Refund Value and CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Refund</p>
                    <p className="text-sm font-black text-emerald-500 font-mono">{formatPrice(order.total_price)}</p>
                  </div>
                  <Link
                    href={`/user/pesanan/pengembalian-dana/detail/${order.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                      isNotSubmitted ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700"
                    }`}
                  >
                    <Eye size={12} /> {isNotSubmitted ? "Ajukan" : "Detail"}
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 mx-auto">
                <Wallet size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-widest">Tidak Ada Data Refund</p>
                <p className="text-xs text-zinc-500 font-medium">Anda tidak memiliki pesanan dibatalkan yang memerlukan pengembalian dana.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 flex items-center justify-between gap-4 rounded-3xl mt-6 shadow-lg">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
