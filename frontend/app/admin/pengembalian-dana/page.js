"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  User,
  Store,
  ArrowRight,
  RefreshCw,
  Copy,
  Receipt
} from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getImageUrl } from "@/app/utils/api";

export default function AdminRefundPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copySuccess, setCopySuccess] = useState(null);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  // Form State
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [refundProofPreview, setRefundProofPreview] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal adalah 1MB.");
      return;
    }

    setRefundProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRefundProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setRefundProofFile(null);
    setRefundProofPreview("");
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRefunds = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/refunds`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setRefunds(result.data);
      } else {
        setError(result.message || "Gagal memuat data dari server");
      }
    } catch (err) {
      console.error("Error fetching refunds:", err);
      setError(err.message || "Terjadi kesalahan koneksi jaringan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRefunds();

    // Setup Socket.io for Real-time Updates
    let socket;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("admin_token") : null;
      socket = io(getApiUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null
        }
      });

      socket.on("connect", () => {
        console.log("[Socket] Admin Refunds Connected");
        socket.emit("join_admin");
      });

      socket.on("admin_notification", (data) => {
        console.log("[Socket] Received admin notification:", data);
        fetchRefunds(true);
      });

      socket.on("order_updated_admin", (data) => {
        console.log("[Socket] Received order updated admin event:", data);
        fetchRefunds(true);
      });
    } catch (e) {
      console.error("Socket connection error:", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRefunds(true);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getRefundBankDetails = (order) => {
    if (order.bank_account) {
      return {
        bankName: order.bank_name || "N/A",
        accountNumber: order.bank_account,
        accountName: order.bank_holder || "N/A"
      };
    }
    
    if (order.user?.bank_accounts) {
      const bankAccounts = order.user.bank_accounts;
      let bankObj = null;
      if (Array.isArray(bankAccounts)) {
        if (bankAccounts.length > 0) {
          bankObj = bankAccounts[0];
        }
      } else if (typeof bankAccounts === 'object') {
        bankObj = bankAccounts;
      } else {
        try {
          const parsed = JSON.parse(bankAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            bankObj = parsed[0];
          } else if (typeof parsed === 'object') {
            bankObj = parsed;
          }
        } catch (e) {}
      }

      if (bankObj) {
        return {
          bankName: bankObj.bank_name || bankObj.bankName || "N/A",
          accountNumber: bankObj.account_number || bankObj.accountNumber || "N/A",
          accountName: bankObj.account_name || bankObj.accountName || bankObj.accountHolder || bankObj.account_holder || "N/A"
        };
      }
    }

    return null;
  };

  const handleOpenProcessModal = (refund) => {
    setSelectedRefund(refund);
    setRefundProofFile(null);
    setRefundProofPreview("");
    setRefundNotes("");
    setShowProcessModal(true);
  };

  const handleOpenRejectModal = (refund) => {
    setSelectedRefund(refund);
    setRefundNotes("");
    setShowRejectModal(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!refundProofFile) {
      alert("Bukti transfer (Gambar) wajib diunggah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("image", refundProofFile);
      formData.append("refund_notes", refundNotes);

      const res = await fetch(`${getApiUrl()}/orders/${selectedRefund.id}/refund`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: formData
      });

      const result = await res.json();
      if (res.ok) {
        setShowProcessModal(false);
        setRefundProofFile(null);
        setRefundProofPreview("");
        fetchRefunds();
      } else {
        alert(result.message || "Gagal memproses refund");
      }
    } catch (err) {
      console.error("Error processing refund:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    if (!refundNotes.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/orders/${selectedRefund.id}/reject-refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          refund_notes: refundNotes
        })
      });

      const result = await res.json();
      if (res.ok) {
        setShowRejectModal(false);
        fetchRefunds();
      } else {
        alert(result.message || "Gagal menolak refund");
      }
    } catch (err) {
      console.error("Error rejecting refund:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredRefunds = refunds.filter((refund) => {
    const matchesStatus =
      filterStatus === "all" ? true : refund.refund_status === filterStatus;

    const matchesSearch =
      refund.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Stats Counters
  const counts = {
    all: refunds.length,
    pending: refunds.filter((r) => r.refund_status === "pending" || !r.refund_status).length,
    refunded: refunds.filter((r) => r.refund_status === "refunded").length,
    rejected: refunds.filter((r) => r.refund_status === "rejected").length
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRefunds.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Data Pengembalian Dana...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <Wallet className="text-emerald-500" size={28} /> Kelola Pengembalian Dana
          </h1>
          <p className="text-xs text-zinc-500 font-medium italic uppercase tracking-widest">
            Tinjau pembatalan transaksi berbayar dan kelola transfer refund ke rekening pembeli
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Perbarui
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex items-start gap-4 animate-in fade-in duration-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Gagal Memuat Data Refund</h4>
            <p className="text-xs text-zinc-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Semua Permintaan", count: counts.all, colorClass: "text-white" },
          { label: "Menunggu Transfer", count: counts.pending, colorClass: "text-amber-500" },
          { label: "Transfer Berhasil", count: counts.refunded, colorClass: "text-emerald-500" },
          { label: "Refund Ditolak", count: counts.rejected, colorClass: "text-red-500" }
        ].map((card) => (
          <div
            key={card.label}
            className="p-5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col gap-2 transition-all shadow-lg"
          >
            <p className={`text-3xl font-black ${card.colorClass}`}>{card.count}</p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Nama Pembeli, Produk, atau Toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
          />
        </div>
        <div className="md:col-span-4 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-black uppercase tracking-widest appearance-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Transfer ({counts.pending})</option>
            <option value="refunded">Transfer Berhasil ({counts.refunded})</option>
            <option value="rejected">Refund Ditolak ({counts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Pesanan & Batal</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk & Toko</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pembeli</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rekening Refund</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Nominal</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Bukti Bayar</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {currentItems.length > 0 ? (
                currentItems.map((refund, index) => {
                  const bank = getRefundBankDetails(refund);
                  const isPending = refund.refund_status === "pending" || !refund.refund_status;
                  const isRefunded = refund.refund_status === "refunded";
                  const isRejected = refund.refund_status === "rejected";

                  return (
                    <tr key={refund.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-zinc-600">{indexOfFirstItem + index + 1}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-white tracking-wider font-mono">{refund.order_id}</p>
                            <button
                              onClick={() => handleCopy(refund.order_id, `inv-${refund.id}`)}
                              className="text-zinc-600 hover:text-white transition-colors"
                            >
                              {copySuccess === `inv-${refund.id}` ? (
                                <CheckCircle2 size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500">
                            Batal: {formatDate(refund.cancelled_at || refund.updated_at)}
                          </p>
                          {refund.rejection_reason && (
                            <div className="pt-1.5 border-t border-zinc-800/50 mt-1 max-w-[200px]">
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Alasan Batal</p>
                              <p className="text-[9px] text-zinc-500 italic leading-snug line-clamp-2">{refund.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1 max-w-[200px]">
                          <p className="text-xs font-black text-white truncate">{refund.product?.name || "-"}</p>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Store size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold uppercase truncate">{refund.shop?.name || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-emerald-500" />
                            <span className="text-xs font-black text-white">@{refund.user?.username || "user"}</span>
                          </div>
                          {refund.user?.phone && (
                            <p className="text-[9px] font-bold text-zinc-500 font-mono pl-4">{refund.user.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {bank ? (
                          <div className="space-y-1 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850 max-w-[240px]">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-white tracking-tight">{bank.bankName}</p>
                              <button
                                onClick={() => handleCopy(bank.accountNumber, `bank-${refund.id}`)}
                                className="text-zinc-600 hover:text-white transition-colors"
                              >
                                {copySuccess === `bank-${refund.id}` ? (
                                  <CheckCircle2 size={10} className="text-emerald-500" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                            </div>
                            <p className="text-xs font-black text-emerald-400 font-mono tracking-wider">{bank.accountNumber}</p>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter truncate">a.n. {bank.accountName}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-500">
                            <AlertCircle size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Rekening Belum Diatur</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-sm font-black text-white">{formatPrice(refund.total_price)}</span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {refund.payment_proof ? (
                          <button
                            onClick={() => setZoomImage(refund.payment_proof)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            <Eye size={10} /> Preview
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-650 uppercase tracking-wider">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <Clock size={8} /> Pending
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={8} /> Refunded
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            <XCircle size={8} /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenProcessModal(refund)}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                            >
                              Proses
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(refund)}
                              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-[9px] uppercase tracking-widest transition-all active:scale-95"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 max-w-[150px] mx-auto">
                            {refund.refund_notes && (
                              <p className="text-[9px] text-zinc-500 italic leading-snug line-clamp-2">
                                &ldquo;{refund.refund_notes}&rdquo;
                              </p>
                            )}
                            {refund.refund_proof && (
                              <a
                                href={refund.refund_proof}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-400 hover:underline uppercase tracking-widest"
                              >
                                Bukti Transfer <ExternalLink size={8} />
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-650 mx-auto">
                        <Wallet size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Tidak Ada Data Refund</p>
                        <p className="text-xs text-zinc-500 font-medium">
                          Seluruh pengajuan pengembalian dana telah selesai diproses.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
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

      {/* PROCESS REFUND MODAL */}
      {showProcessModal && selectedRefund && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            onClick={() => !isSubmitting && setShowProcessModal(false)}
          ></div>
          <form
            onSubmit={handleProcessRefund}
            className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-inner mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Proses Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Selesaikan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{selectedRefund.order_id}</span> sebesar <span className="text-emerald-400 font-bold">{formatPrice(selectedRefund.total_price)}</span>.
              </p>
            </div>

            {/* Rekening Info Box */}
            {getRefundBankDetails(selectedRefund) && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tujuan Rekening Buyer</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Bank</span>
                  <span className="font-bold text-white">{getRefundBankDetails(selectedRefund).bankName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Nomor Rekening</span>
                  <span className="font-bold text-emerald-400 font-mono tracking-wider">
                    {getRefundBankDetails(selectedRefund).accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Atas Nama</span>
                  <span className="font-bold text-white uppercase">{getRefundBankDetails(selectedRefund).accountName}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Gambar Bukti Transfer <span className="text-red-500">*</span>
                </label>
                
                {!refundProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group p-6">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                        <ImageIcon size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-zinc-300 group-hover:text-white transition-colors">
                          Pilih / Unggah Gambar Bukti Transfer
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500">
                          Format: PNG, JPG, JPEG (Maks. 1MB)
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                    <img
                      src={refundProofPreview}
                      alt="Preview Bukti Transfer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Catatan Admin (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Masukkan keterangan tambahan jika diperlukan..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                disabled={isSubmitting}
                className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !refundProofFile}
                className="py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Proses Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT REFUND MODAL */}
      {showRejectModal && selectedRefund && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            onClick={() => !isSubmitting && setShowRejectModal(false)}
          ></div>
          <form
            onSubmit={handleRejectRefund}
            className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner mb-2">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Tolak Refund Dana</h2>
              <p className="text-xs text-zinc-400 font-medium">
                Tolak pengajuan pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">{selectedRefund.order_id}</span>. Status refund akan berubah menjadi ditolak.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Masukkan alasan lengkap penolakan pengembalian dana..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-red-500 transition-all resize-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isSubmitting}
                className="py-4 bg-zinc-850 hover:bg-zinc-850/80 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !refundNotes.trim()}
                className="py-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Tolak Refund"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ZOOM IMAGE MODAL (BUYER PAYMENT PROOF) */}
      {zoomImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
            onClick={() => setZoomImage(null)}
          ></div>
          <div className="max-w-4xl max-h-[85vh] relative z-10 overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 shadow-3xl animate-in zoom-in duration-300">
            <img
              src={getImageUrl(zoomImage)}
              alt="Zoomed Payment Proof"
              className="max-w-full max-h-[80vh] object-contain rounded-[2rem]"
            />
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setZoomImage(null)}
                className="w-10 h-10 bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <a
                href={getImageUrl(zoomImage)}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/30"
              >
                <ExternalLink size={14} /> Buka Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
