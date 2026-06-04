"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getImageUrl, getLogoUrl } from "@/app/utils/api";
import { ChevronLeft, ChevronRight, Wallet, Building, User, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, MessageCircle, ArrowRight, ExternalLink, Store, Package, Calendar, Copy, Check, ShieldCheck, HelpCircle, Image as ImageIcon } from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function UserRefundDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  // Core Page States
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Bank Form States
  const [bankForm, setBankForm] = useState({
    bank_name: "",
    bank_account: "",
    bank_holder: "",
  });

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "Ya, Kirim",
    cancelText: "Batal",
    onConfirm: null,
  });

  // Fetch Order details
  const fetchOrderDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();

      if (res.ok && result.data) {
        const orderData = result.data;

        // Verify order status is cancelled
        if (orderData.status !== "cancelled") {
          alert("Pesanan tidak dalam status dibatalkan");
          router.push("/user/pesanan/pengembalian-dana");
          return;
        }

        // Verify ownership on client-side
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (orderData.user_id !== user.id) {
            alert("Anda tidak memiliki akses untuk melihat pengembalian dana ini");
            router.push("/user/pesanan/pengembalian-dana");
            return;
          }
        }

        setOrder(orderData);

        // Pre-fill form if bank_account already exists in order
        if (orderData.bank_account) {
          setBankForm({
            bank_name: orderData.bank_name || "",
            bank_account: orderData.bank_account || "",
            bank_holder: orderData.bank_holder || "",
          });
        } else {
          // Fallback to user profile saved bank account
          try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
              const userObj = JSON.parse(userStr);
              // Fetch user details from API to get latest bank accounts
              const userRes = await fetch(`${getApiUrl()}/users/${userObj.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (userRes.ok) {
                const userResult = await userRes.json();
                const freshUser = userResult.data;
                const bankAccounts = freshUser.bank_accounts || freshUser.bankAccounts || [];
                if (bankAccounts.length > 0) {
                  const defaultBank = bankAccounts[0];
                  setBankForm({
                    bank_name: defaultBank.bank_name || defaultBank.bankName || "",
                    bank_account: defaultBank.account_number || defaultBank.accountNumber || "",
                    bank_holder: defaultBank.account_name || defaultBank.accountName || defaultBank.accountHolder || defaultBank.account_holder || "",
                  });
                }
              }
            }
          } catch (profileErr) {
            console.error("Gagal load data rekening profil:", profileErr);
          }
        }
      } else {
        alert("Detail pengembalian dana tidak ditemukan");
        router.push("/user/pesanan/pengembalian-dana");
      }
    } catch (err) {
      console.error("Error fetching refund detail:", err);
      alert("Gagal memuat detail pengembalian dana");
    } finally {
      setLoading(false);
    }
  };

  // Socket IO real-time updates
  useEffect(() => {
    fetchOrderDetail();

    const userStr = localStorage.getItem("user");
    let socket;
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const token = localStorage.getItem("token");
        socket = io(getSocketUrl(), {
          auth: {
            token: token ? `Bearer ${token}` : null,
          },
        });
        socket.emit("join_user", userData.id);

        socket.on("new_notification", () => {
          fetchOrderDetail(); // Refresh order info on state change
        });
      } catch (e) {
        console.error("Socket error on refund details:", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleOpenConfirmSubmit = (e) => {
    e.preventDefault();
    if (!bankForm.bank_name) {
      alert("Silakan pilih Nama Bank");
      return;
    }
    if (!bankForm.bank_account.trim()) {
      alert("Nomor rekening wajib diisi");
      return;
    }
    if (!bankForm.bank_holder.trim()) {
      alert("Nama pemilik rekening wajib diisi");
      return;
    }

    setModalConfig({
      isOpen: true,
      type: "save",
      title: "Kirim Rekening Refund?",
      message: "Pastikan nomor rekening dan nama pemilik sudah benar dan sesuai. Setelah dikirim, data ini tidak dapat diubah secara mandiri.",
      confirmText: "Ya, Kirim Data",
      cancelText: "Periksa Kembali",
      onConfirm: executeSubmitRefundRequest,
    });
  };

  const executeSubmitRefundRequest = async () => {
    setIsSubmitting(true);
    setModalConfig((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/orders/${id}/request-refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(bankForm),
      });

      const result = await res.json();
      if (res.ok) {
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Pengajuan Terkirim",
          message: "Data rekening refund berhasil dikirim. Admin SatwaiD akan segera memverifikasi dan memproses pengembalian dana Anda.",
          confirmText: "Oke",
          onConfirm: null,
        });
        fetchOrderDetail();
      } else {
        throw new Error(result.message || "Gagal mengajukan refund");
      }
    } catch (err) {
      console.error(err);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Pengajuan Gagal",
        message: err.message || "Terjadi kesalahan saat mengirim pengajuan refund.",
        confirmText: "Coba Lagi",
        onConfirm: null,
      });
    } finally {
      setIsSubmitting(false);
      setModalConfig((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return (
      new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const handleWhatsAppCS = () => {
    const message = encodeURIComponent(`Halo Admin SatwaiD, saya ingin menanyakan perihal refund untuk pesanan saya dengan Invoice ID: ${order?.order_id}.`);
    window.open(`https://wa.me/628123456789?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat detail pengembalian...</p>
      </div>
    );
  }

  if (!order) return null;

  // Determine Refund Step / Flow Statuses
  const isBankSubmitted = !!order.refund_status;
  const isRefunded = order.refund_status === "refunded";
  const isRejected = order.refund_status === "rejected";
  const isNotSubmitted = !order.refund_status;
  const isPending = order.refund_status === "pending";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Global Confirmation Modal */}
      <ActionModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} onConfirm={modalConfig.onConfirm} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} isLoading={modalConfig.isLoading} />

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/user/pesanan/pengembalian-dana" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-xs font-bold uppercase tracking-wider">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
            <ChevronLeft size={16} />
          </div>
          Kembali ke Pengembalian Dana
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID Invoice</span>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            <span className="text-xs font-black text-white font-mono uppercase">{order.order_id}</span>
            <button onClick={() => handleCopy(order.order_id, "invoice")} className="text-zinc-500 hover:text-emerald-500 transition-colors" title="Copy Invoice ID">
              {copySuccess === "invoice" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Stepper Tracker */}
      <div className="bg-[#0b0c0e]/80 border border-zinc-800/60 rounded-[2.5rem] p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          {/* Step 1: Cancelled */}
          <div className="flex-1 flex items-start gap-4">
            <div className="w-14 h-14 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
              <XCircle size={24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Tahap 1</p>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Pesanan Dibatalkan</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">Batal pada: {formatDate(order.cancelled_at || order.updated_at)}</p>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className={`hidden md:flex items-center justify-center shrink-0 px-2 ${isBankSubmitted ? "text-emerald-500" : "text-amber-500"}`}>
            <ChevronRight size={18} />
          </div>

          {/* Step 2: Rekening Submission */}
          <div className="flex-1 flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isBankSubmitted ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-amber-500/5 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]"}`}>
              {isBankSubmitted ? <CheckCircle2 size={24} /> : <Clock size={24} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isBankSubmitted ? "text-emerald-500" : "text-amber-500"}`}>Tahap 2</p>
                {isBankSubmitted ? (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Selesai</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Sedang Proses</span>
                )}
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Pengajuan Rekening</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{isBankSubmitted ? "Detail rekening telah berhasil dikirim" : "Menunggu penginputan detail rekening bank Anda"}</p>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className={`hidden md:flex items-center justify-center shrink-0 px-2 ${isRefunded ? "text-emerald-500" : isRejected ? "text-red-500" : isPending ? "text-amber-500" : "text-zinc-800"}`}>
            <ChevronRight size={18} />
          </div>

          {/* Step 3: Admin Review and Process */}
          <div className={`flex-1 flex items-start gap-4 ${isNotSubmitted ? "opacity-40" : ""}`}>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isRefunded
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : isRejected
                    ? "bg-red-500/5 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    : isPending
                      ? "bg-amber-500/5 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-600"
              }`}
            >
              {isRefunded ? <ShieldCheck size={24} /> : isRejected ? <XCircle size={24} /> : <Wallet size={24} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isRefunded ? "text-emerald-500" : isRejected ? "text-red-500" : isPending ? "text-amber-500" : "text-zinc-500"}`}>Tahap 3</p>
                {isRefunded ? (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Selesai</span>
                ) : isRejected ? (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Ditolak</span>
                ) : isPending ? (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Sedang Proses</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-zinc-850 text-zinc-500 border border-zinc-800">Belum Mulai</span>
                )}
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Proses Transfer Dana</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">{isRefunded ? "Dana berhasil ditransfer ke rekening Anda" : isRejected ? "Pengajuan refund ditolak oleh Admin" : isPending ? "Menunggu peninjauan dan transfer dari Admin" : "Menunggu penyelesaian tahap sebelumnya"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Refund Details and submission form */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card 1: Cancellation Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-500" /> Keterangan Pembatalan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/40 p-6 rounded-3xl border border-zinc-800/60">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Tanggal Pembatalan</p>
                <p className="text-sm font-bold text-white">{formatDate(order.cancelled_at || order.updated_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Status Pemrosesan</p>
                <div>
                  {isRefunded && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={10} /> Selesai ditransfer
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <XCircle size={10} /> Refund Ditolak
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Clock size={10} /> Menunggu Review Admin
                    </span>
                  )}
                  {isNotSubmitted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <AlertCircle size={10} /> Belum Diajukan
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Alasan Pembatalan</p>
              <div className="bg-zinc-950/40 p-6 rounded-3xl border border-zinc-800/60">
                <p className="text-sm text-zinc-300 leading-relaxed font-semibold">{order.rejection_reason || order.cancellation_reason || "Tidak ada alasan pembatalan yang dicantumkan."}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Refund Destination (Rekening Penerima) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2.5">
                <Building size={16} className="text-emerald-500" /> Rekening Tujuan Refund
              </h3>

              {isBankSubmitted && <span className="text-[9px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">Terkunci</span>}
            </div>

            {isBankSubmitted ? (
              // Submitted View (Read-Only)
              <div className="space-y-6">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nama Bank</p>
                      <p className="text-sm font-black text-white">{order.bank_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nomor Rekening</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-mono tracking-wider">{order.bank_account}</span>
                        <button onClick={() => handleCopy(order.bank_account, "bank_acc")} className="text-zinc-500 hover:text-emerald-500 transition-colors">
                          {copySuccess === "bank_acc" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nama Pemilik Rekening</p>
                      <p className="text-sm font-black text-white uppercase">{order.bank_holder}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-2xl text-xs font-semibold text-emerald-400">
                  <ShieldCheck size={18} className="shrink-0" />
                  <span>Data rekening telah dikirim ke Admin. Kami akan mengembalikan dana ke rekening di atas.</span>
                </div>
              </div>
            ) : (
              // Form View (Submission)
              <form onSubmit={handleOpenConfirmSubmit} className="space-y-6">
                <div className="p-5 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl text-xs font-semibold text-amber-500 flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>Silakan masukkan detail rekening Anda untuk memproses pengembalian dana.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Select Bank */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Nama Bank</label>
                    <select required value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium">
                      <option value="" disabled>
                        Pilih Bank
                      </option>
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="BNI">BNI (Bank Negara Indonesia)</option>
                      <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      <option value="Mandiri">Mandiri (Bank Mandiri)</option>
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Nomor Rekening</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: 1234567890"
                      value={bankForm.bank_account}
                      onChange={(e) => setBankForm({ ...bankForm, bank_account: e.target.value.replace(/[^0-9-]/g, "") })}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium font-mono"
                    />
                  </div>

                  {/* Account Holder */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Nama Pemilik Rekening</label>
                    <input
                      required
                      type="text"
                      placeholder="Sesuai buku tabungan"
                      value={bankForm.bank_holder}
                      onChange={(e) => setBankForm({ ...bankForm, bank_holder: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium uppercase"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {isSubmitting ? "Mengirim data..." : "Kirim Pengajuan Refund"}
                </button>
              </form>
            )}
          </div>

          {/* Card 3: Admin Review / Proof of Transfer */}
          {(isRefunded || isRejected || isPending) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-500" /> Hasil Peninjauan Admin
              </h3>

              {isRefunded && (
                <div className="space-y-6">
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm">
                      <CheckCircle2 size={20} />
                      <span>DANA BERHASIL DITRANSFER</span>
                    </div>
                    {order.refunded_at && <p className="text-xs text-zinc-400 font-medium">Diproses pada: {formatDate(order.refunded_at)}</p>}
                    {order.refund_notes && (
                      <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-black uppercase tracking-wider mb-1">Catatan Admin</p>
                        <p className="text-xs text-zinc-300 font-semibold">{order.refund_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Refund Proof Image */}
                  {order.refund_proof && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">Bukti Transfer Refund</p>

                      {order.refund_proof.match(/\.(jpeg|jpg|gif|png|webp)/i) || order.refund_proof.startsWith("data:") ? (
                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-3xl max-w-sm overflow-hidden relative group">
                          <img src={getImageUrl(order.refund_proof)} alt="Bukti Transfer Refund" className="w-full h-auto object-contain rounded-2xl max-h-60 cursor-zoom-in hover:opacity-90 transition-opacity" onClick={() => setZoomImage(getImageUrl(order.refund_proof))} />
                          <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                            <span className="text-white text-xs font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl">Zoom Gambar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 text-zinc-400">
                            <ImageIcon size={18} className="text-emerald-500" />
                            <span className="text-xs font-semibold truncate max-w-xs">{order.refund_proof}</span>
                          </div>
                          <a href={order.refund_proof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black text-white uppercase tracking-wider rounded-lg transition-all">
                            Buka Tautan <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isRejected && (
                <div className="space-y-6">
                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-red-500 font-bold text-sm">
                      <XCircle size={20} />
                      <span>PENGAJUAN REFUND DITOLAK</span>
                    </div>
                    {order.refund_notes && (
                      <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
                        <p className="text-xs text-zinc-500 font-black uppercase tracking-wider mb-1">Alasan Penolakan</p>
                        <p className="text-xs text-zinc-300 font-semibold">{order.refund_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleWhatsAppCS} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                      <MessageCircle size={14} /> Hubungi CS SatwaiD
                    </button>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3 text-amber-500 font-bold text-sm animate-pulse">
                    <Clock size={20} />
                    <span>MENUNGGU TRANSFER ADMIN</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">Pengajuan rekening refund Anda telah tercatat. Admin kami sedang meninjau detail transaksi sebelum melakukan transfer. Terima kasih atas kesabaran Anda.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Cost Breakdown & Product Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Card 1: Cost breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2.5">
              <CreditCard size={16} className="text-emerald-500" /> Rincian Pengembalian
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Subtotal Produk</span>
                <span className="text-white font-bold">{formatPrice(order.price * order.quantity)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Biaya Pengiriman</span>
                <span className="text-white font-bold">{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Biaya Packing</span>
                <span className="text-white font-bold">{formatPrice(order.packing_cost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Biaya Admin / Penanganan</span>
                <span className="text-white font-bold">{formatPrice(order.admin_fee)}</span>
              </div>

              <div className="h-px bg-zinc-800/80 my-4"></div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-black text-sm uppercase tracking-wider block">Total Refund</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dana dikembalikan 100%</span>
                </div>
                <span className="text-2xl font-black text-emerald-500 tracking-tighter">{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Product & Shop Information */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2.5">
              <Package size={16} className="text-emerald-500" /> detail produk
            </h3>

            {/* Product details */}
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shrink-0 relative">
                {order.product?.images?.length > 0 ? (
                  <img src={getImageUrl(order.product.images[0])} className="w-full h-full object-cover" alt={order.product.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-800">
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-black text-white truncate hover:text-emerald-400 transition-colors">{order.product?.name}</h4>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[8px] font-black uppercase tracking-wider rounded">{order.product?.species}</span>
                  <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-wider rounded ${order.product?.sex === "Male" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : order.product?.sex === "Female" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                    {order.product?.sex || "Unsex"}
                  </span>
                </div>
                <p className="text-xs font-bold text-zinc-500 pt-1">
                  {order.quantity} x {formatPrice(order.price)}
                </p>
              </div>
            </div>

            {/* Shop info */}
            <div className="pt-6 border-t border-zinc-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center text-zinc-500 shrink-0">{order.shop?.logo_url ? <img src={getLogoUrl(order.shop.logo_url)} className="w-full h-full object-cover" /> : <Store size={20} />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nama Toko</p>
                  <p className="text-xs font-black text-white truncate uppercase">{order.shop?.name}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button onClick={handleWhatsAppCS} className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <HelpCircle size={12} className="text-emerald-500" /> Bantuan CS SatwaiD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-300" onClick={() => setZoomImage(null)}></div>
          <div className="relative z-10 max-w-4xl max-h-[85vh] overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900/60 p-4 ">
            <button onClick={() => setZoomImage(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-zinc-950/80 border border-zinc-800 hover:bg-zinc-850 p-2.5 rounded-full transition-all z-20">
              <XCircle size={20} />
            </button>
            <img src={zoomImage} alt="Zoomed Proof" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
