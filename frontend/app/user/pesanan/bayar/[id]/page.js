"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ShoppingBag, MapPin, Truck, CreditCard, Clock, Package, ChevronLeft, Wallet, Copy, Banknote, Receipt, Info, X, CheckCircle2, Eye } from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";
import { copyToClipboard } from "@/app/utils/clipboard";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function PaymentPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const [paymentProof, setPaymentProof] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchOrderDetails();

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
          fetchOrderDetails(); // Auto-refresh when status changes
        });
      } catch (e) {
        console.error("Socket connection error", e);
      }
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/orders/${id}`);
      const result = await res.json();
      if (res.ok && result.data) {
        setOrder(result.data);
        // If status changes to shipping or completed, redirect to main transaksi detail
        if (result.data.status !== "waiting_payment" && result.data.status !== "processing") {
          router.push(`/user/pesanan/transaksi/${id}`);
        }
      } else {
        alert("Gagal memuat detail pesanan");
        router.push("/user/pesanan");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: Max 500KB
    if (file.size > 500 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal adalah 500KB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${getApiUrl()}/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setPaymentProof(getApiUrl() + result.url);
      } else {
        alert(result.message || "Gagal mengunggah gambar");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Terjadi kesalahan saat mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentProof) {
      alert("Harap unggah bukti pembayaran terlebih dahulu.");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`${getApiUrl()}/orders/${id}/confirm-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_proof: paymentProof }),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/user/pesanan/transaksi/${id}`);
        }, 3000);
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      alert("Kesalahan sistem");
    } finally {
      setConfirming(false);
    }
  };

  const handleResetPayment = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan konfirmasi dan mengulang proses pembayaran?")) return;

    setResetting(true);
    try {
      const res = await fetch(`${getApiUrl()}/orders/${id}/reset-payment`, {
        method: "PUT",
      });
      if (res.ok) {
        fetchOrderDetails();
        setPaymentProof("");
      }
    } catch (err) {
      console.error("Error resetting payment:", err);
    } finally {
      setResetting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (path) => {
    if (!path) return "/placeholder.png";

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

    if (!finalPath) return "/placeholder.png";
    if (typeof finalPath !== "string") return "/placeholder.png";

    // Return data URLs and absolute URLs as is
    if (finalPath.startsWith("http") || finalPath.startsWith("data:")) return finalPath;

    const baseUrl = getApiUrl();
    const formattedPath = finalPath.startsWith("/") ? finalPath : `/${finalPath}`;
    return `${baseUrl}${formattedPath}`;
  };

  const handleCopy = async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 bg-black">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Menyiapkan invoice...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/user/pesanan/transaksi/${id}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-all">
            <ChevronLeft size={18} />
          </div>
          <span className="text-sm font-bold">Kembali</span>
        </Link>
        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full border border-amber-500/20">
          <Clock size={16} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Menunggu Pembayaran</span>
        </div>
      </div>

      {/* Stepper Section */}
      <OrderStepper currentStatus={order.status} />

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-zinc-900 border border-emerald-500/50 p-12 rounded-[3rem] text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} className="text-zinc-950" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white italic tracking-tighter">SUCCESS!</h2>
              <p className="text-zinc-400 text-sm font-medium">Pembayaran Anda sedang diverifikasi oleh penjual.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Bank Info & Timeline (Desktop Left, Mobile Bottom) */}
        <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1 w-full">
          {/* Admin Payment Methods Card */}
          <div className="hidden lg:block bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={16} className="text-emerald-500" /> Rekening Pembayaran (Admin)
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-medium italic">Silahkan lakukan transfer ke rekening resmi berikut</p>
                </div>
                <div className="self-start sm:self-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0">
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verifikasi Manual</span>
                </div>
              </div>

              <div className="flex justify-center md:justify-start">
                {[{ bank: "BCA", acc: "8480483953", name: "Oky Hari Anfianto" }].map((method, idx) => (
                  <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:border-emerald-500/20 transition-all group/item flex flex-col justify-between min-h-[140px] w-full max-w-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl group-hover/item:bg-emerald-500/[0.04] transition-all"></div>

                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">{method.bank}</span>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider pt-1.5">REKENING TRANSAKSI</p>
                      </div>
                      <button onClick={() => handleCopy(method.acc, method.bank)} className="shrink-0 p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90 relative">
                        {copySuccess === method.bank ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copySuccess === method.bank && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 text-[8px] font-black px-2 py-0.5 rounded animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">Disalin!</span>}
                      </button>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xl font-black text-white tracking-widest font-mono select-all">{method.acc}</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">a/n {method.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-500/80 font-medium leading-relaxed italic">PENTING: Pastikan nominal transfer sesuai dengan total tagihan invoice agar proses verifikasi berjalan dengan lancar.</p>
              </div>
            </div>
          </div>

          {/* Timeline / Riwayat Perjalanan */}
          <div>
            <OrderTimeline order={order} formatPrice={formatPrice} />
          </div>
        </div>

        {/* Right Column: Invoice & Payment Upload (Desktop Right, Mobile Top) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-10 order-1 lg:order-2 w-full">
          {/* Invoice Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white">
              <Receipt size={120} />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-850 text-[9px] font-black text-zinc-400 uppercase tracking-widest rounded-md">
                    <Receipt size={12} className="text-emerald-500" /> Rincian Invoice
                  </span>
                  <h4 className="text-base font-black text-white tracking-wider font-mono pt-1">{order.order_id}</h4>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tanggal Pemesanan</p>
                  <p className="text-xs font-bold text-zinc-300">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>

              {/* Product Summary */}
              <div className="flex gap-4 items-center bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60 group/prod">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                  <img src={getImageUrl(order.product?.images)} alt="Product" className="w-full h-full object-cover group-hover/prod:scale-105 transition-transform duration-500" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-widest">{order.product?.species}</span>
                    <span className="text-[8px] font-black text-zinc-500 font-mono">ID: {order.product?.product_id || "-"}</span>
                  </div>
                  <h5 className="text-xs font-black text-white truncate">{order.product?.name}</h5>
                  <p className="text-[10px] font-bold text-zinc-400">
                    {order.quantity} x <span className="text-emerald-400 font-black">{formatPrice(order.price)}</span>
                  </p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Subtotal Produk</span>
                  <span className="text-zinc-300 font-bold font-mono">{formatPrice(order.price * order.quantity)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Biaya Admin</span>
                  <span className="text-zinc-300 font-bold font-mono">{formatPrice(order.admin_fee)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Ongkos Kirim</span>
                  <span className="text-zinc-300 font-bold font-mono">{order.product?.is_free_shipping ? <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] uppercase tracking-wider font-black">Gratis</span> : formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Biaya Packing</span>
                  <span className="text-zinc-300 font-bold font-mono">{order.product?.is_free_packing ? <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] uppercase tracking-wider font-black">Gratis</span> : formatPrice(order.packing_cost)}</span>
                </div>

                <div className="h-[1px] bg-zinc-800/80 border-dashed border-zinc-700 my-4"></div>

                {/* Total Price Section */}
                <div className="w-full bg-zinc-950/80 border border-emerald-500/25 p-5 rounded-2xl flex items-center justify-between gap-4 group/total">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Total Tagihan</p>
                    <p className="text-2xl font-black text-white tracking-tight">{formatPrice(order.total_price)}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(order.total_price.toString(), "amount")}
                    className="relative shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 rounded-xl transition-all duration-300 active:scale-95 text-xs font-black uppercase tracking-widest"
                  >
                    <Copy size={14} className="group-hover/total:rotate-6 transition-transform" />
                    <span>Salin</span>
                    {copySuccess === "amount" && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-400 animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">Nominal Disalin!</span>}
                  </button>
                </div>
              </div>

              {/* Bank Info block inside Invoice Card - visible only on mobile/tablet */}
              <div className="block lg:hidden w-full space-y-4 pt-4 border-t border-zinc-800/60">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Rekening Pembayaran (Admin)</p>
                </div>
                <div className="flex justify-center">
                  {[{ bank: "BCA", acc: "8480483953", name: "Oky Hari Anfianto" }].map((method, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl flex flex-col justify-between min-h-[130px] w-full max-w-sm">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl"></div>

                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{method.bank}</span>
                          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider pt-1">REKENING TRANSAKSI</p>
                        </div>
                        <button onClick={() => handleCopy(method.acc, method.bank)} className="shrink-0 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-90 relative">
                          {copySuccess === method.bank ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copySuccess === method.bank && <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">Disalin!</span>}
                        </button>
                      </div>

                      <div className="mt-3 space-y-0.5">
                        <p className="text-lg font-black text-white tracking-widest font-mono select-all">{method.acc}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">a/n {method.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Upload Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Konfirmasi Pembayaran</h4>
                  <p className="text-[9px] text-zinc-500 font-medium italic">Unggah bukti transfer untuk memulai verifikasi</p>
                </div>
              </div>

              {order.status === "waiting_payment" ? (
                <div className="space-y-6">
                  {/* Image Upload Area */}
                  <div className="bg-zinc-950/40 border-2 border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 relative group transition-all duration-300">
                    {paymentProof ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group/uploaded">
                        <img src={paymentProof} alt="Bukti Bayar" className="w-full h-full object-contain" />

                        {/* Floating Action Bar */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                          <button type="button" onClick={() => setIsPreviewOpen(true)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all">
                            <Eye size={12} /> Lihat
                          </button>
                          <button type="button" onClick={() => setPaymentProof("")} className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all">
                            <X size={12} /> Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-3 cursor-pointer">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto text-zinc-500 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all duration-300">
                          {uploading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <Receipt size={20} />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white uppercase tracking-wider">Pilih Bukti Pembayaran</p>
                          <p className="text-[9px] text-zinc-500 font-medium">JPG, PNG • Maksimal 500KB</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirming || showSuccess || uploading || !paymentProof}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                      confirming || showSuccess || uploading || !paymentProof ? "bg-zinc-800/50 text-zinc-600 border border-zinc-800/40 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    }`}
                  >
                    {confirming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        Mengirimkan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Kirim Bukti Pembayaran
                      </>
                    )}
                  </button>
                </div>
              ) : order.status === "processing" ? (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                      <Clock size={18} className="animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-white uppercase tracking-widest">Sedang Diverifikasi</p>
                      <p className="text-[9px] text-zinc-500 font-medium">Pembayaran sedang dalam proses verifikasi oleh Admin.</p>
                    </div>
                  </div>

                  <button onClick={handleResetPayment} disabled={resetting} className="w-full py-3.5 border border-red-500/25 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 active:scale-95">
                    {resetting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : "Batal Konfirmasi & Upload Ulang"}
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">Status Pembayaran: {order.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {isPreviewOpen && paymentProof && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <button type="button" onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 w-12 h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-800 flex items-center justify-center transition-all z-10">
            <X size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
            <img src={paymentProof} alt="Bukti Transfer Review" className="max-w-full max-h-full object-contain rounded-2xl border border-zinc-800" />
          </div>
        </div>
      )}
    </div>
  );
}
