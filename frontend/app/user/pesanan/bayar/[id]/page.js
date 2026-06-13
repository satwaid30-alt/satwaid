"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ShoppingBag, MapPin, Truck, CreditCard, Clock, Package, ChevronLeft, Wallet, Copy, Banknote, Receipt, Info, X, CheckCircle2, Eye, QrCode } from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";
import { copyToClipboard } from "@/app/utils/clipboard";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";
import { uploadImageToS3 } from "@/components/HandleUpload";

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
  const [previewImage, setPreviewImage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("qris");

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

    // --- Validasi 1: Blokir ekstensi berbahaya & dokumen ---
    const blockedExtensions = [
      ".php", ".exe", ".svg",
      ".pdf",
      ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ];
    const fileName = file.name.toLowerCase();
    const hasBlockedExtension = blockedExtensions.some((ext) => fileName.endsWith(ext));
    if (hasBlockedExtension) {
      alert("Format file tidak diizinkan. Hanya gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan.");
      e.target.value = "";
      return;
    }

    // --- Validasi 2: Blokir MIME type berbahaya & dokumen ---
    const blockedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/x-php",
      "application/x-httpd-php",
      "application/octet-stream",
      "image/svg+xml",
      "text/html",
      "text/javascript",
    ];
    if (blockedMimeTypes.includes(file.type)) {
      alert("Tipe file tidak diizinkan. Hanya gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan.");
      e.target.value = "";
      return;
    }

    // --- Validasi 3: Whitelist MIME type gambar yang diizinkan ---
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.type)) {
      alert("Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
      e.target.value = "";
      return;
    }

    // --- Validasi 4: Ukuran file maksimal 1MB ---
    if (file.size > 1 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal adalah 1 MB.");
      e.target.value = "";
      return;
    }

    // --- Keamanan 5: Rename file secara acak sebelum dikirim ---
    const extension = fileName.split(".").pop();
    const randomName = `${crypto.randomUUID()}.${extension}`;
    const renamedFile = new File([file], randomName, { type: file.type });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const { objectKey } = await uploadImageToS3(renamedFile, token, "payments");
      setPaymentProof("/" + objectKey);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert(err.message || "Terjadi kesalahan saat mengunggah gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentProof) {
      alert("Harap unggah bukti pembayaran terlebih dahulu.");
      return;
    }

    setConfirming(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${getApiUrl()}/orders/${id}/confirm-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${getApiUrl()}/orders/${id}/reset-payment`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
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

  const renderPaymentCard = (isMobile = false) => {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 ${isMobile ? "w-full border-zinc-800/60 bg-zinc-950/20 p-4 sm:p-6" : "bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 lg:p-8 shadow-2xl group"}`}>
        {/* Ambient glow effect for desktop */}
        {!isMobile && <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none"></div>}

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Wallet size={16} className="text-emerald-500 animate-pulse" />
                Metode Pembayaran (Admin)
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">Silakan pilih salah satu metode pembayaran di bawah ini.</p>
            </div>
            <div className="self-start sm:self-center px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Verifikasi Instan</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950 border border-zinc-850 rounded-2xl">
            <button
              type="button"
              onClick={() => setPaymentMethod("qris")}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                paymentMethod === "qris"
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
                  : "bg-transparent text-zinc-500 hover:text-white"
              }`}
            >
              <QrCode size={14} />
              QRIS
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bca")}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                paymentMethod === "bca"
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
                  : "bg-transparent text-zinc-500 hover:text-white"
              }`}
            >
              <CreditCard size={14} />
              Transfer BCA
            </button>
          </div>

          {paymentMethod === "qris" ? (
            /* QRIS Content */
            <div className="flex flex-col md:grid md:grid-cols-12 gap-6 items-center animate-in fade-in duration-300">
              {/* Left/Middle: QR Container */}
              <div className="md:col-span-5 w-full flex flex-col items-center gap-3">
                <div className="relative w-full max-w-[200px] aspect-square overflow-hidden rounded-2xl bg-black border-2 border-zinc-800 p-2.5 group/qr shadow-lg shadow-black/40">
                  {/* Scanner Target corners */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm"></div>
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm"></div>
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm"></div>
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br-sm"></div>

                  <img src="/images/Pembayaran.jpeg" alt="QRIS Payment Details" className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover/qr:scale-105" />
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-[200px]">
                  <button type="button" onClick={() => setPreviewImage("/images/Pembayaran.jpeg")} className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all">
                    <Eye size={10} /> Perbesar Kode QR
                  </button>
                </div>
              </div>

              {/* Right: Payment Instructions & Details */}
              <div className="md:col-span-7 w-full space-y-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Petunjuk Pembayaran QRIS</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">1</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">Pindai kode QRIS dengan aplikasi pembayaran pilihan Anda.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">2</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">
                        Masukkan nominal transfer persis sesuai tagihan: <span className="text-emerald-400 font-black">{formatPrice(order.total_price)}</span>.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">3</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">Simpan bukti pembayaran, lalu unggah di bawah.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BCA Bank Transfer Content */
            <div className="flex flex-col md:grid md:grid-cols-12 gap-6 items-center animate-in fade-in duration-300">
              {/* Left/Middle: BCA Details Container */}
              <div className="md:col-span-5 w-full flex flex-col items-center gap-3">
                <div className="w-full max-w-[200px] bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-lg shadow-black/40 relative">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-black tracking-wider uppercase">
                    BCA
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nomor Rekening</p>
                    <p className="text-sm font-black text-white tracking-widest font-mono">8480483953</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("8480483953", "bca_account")}
                    className="relative w-full py-2.5 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Copy size={13} />
                    <span>Salin Rekening</span>
                    {copySuccess === "bca_account" && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-400 animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
                        No. Rekening Disalin!
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Payment Instructions & Details */}
              <div className="md:col-span-7 w-full space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Nama Pemilik Rekening</p>
                    <p className="text-xs font-black text-white">Oky Hari Anfianto</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Nominal Transfer</p>
                    <p className="text-sm font-black text-emerald-400 font-mono">{formatPrice(order.total_price)}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Petunjuk Pembayaran Transfer</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">1</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">Lakukan transfer ke rekening BCA Oky Hari Anfianto di atas.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">2</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">
                        Pastikan nominal persis sesuai tagihan: <span className="text-emerald-400 font-black">{formatPrice(order.total_price)}</span>.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-bold shrink-0">3</span>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">Simpan struk/bukti transfer Anda, lalu unggah di bawah.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning / Note */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
            <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-500/80 font-medium leading-relaxed italic">PENTING: Pastikan nominal transfer sesuai dengan total tagihan invoice agar proses verifikasi berjalan lancar.</p>
          </div>
        </div>
      </div>
    );
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
          <div className="hidden lg:block w-full">{renderPaymentCard(false)}</div>

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
              <div className="block lg:hidden w-full pt-4 border-t border-zinc-800/60">{renderPaymentCard(true)}</div>
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
                  {order.payment_rejection_reason && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Bukti Pembayaran Ditolak</p>
                        <p className="text-[10px] text-zinc-450 font-medium leading-relaxed italic">
                          &ldquo;{order.payment_rejection_reason}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Image Upload Area */}
                  <div className="bg-zinc-950/40 border-2 border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 relative group transition-all duration-300">
                    {paymentProof ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group/uploaded">
                        <img src={getImageUrl(paymentProof)} alt="Bukti Bayar" className="w-full h-full object-contain" />

                        {/* Floating Action Bar */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                          <button type="button" onClick={() => setPreviewImage(getImageUrl(paymentProof))} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all">
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
                          <p className="text-[9px] text-zinc-500 font-medium">JPG, PNG, WEBP, GIF • Maksimal 1 MB</p>
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
      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300 animate-out fade-out duration-200">
          <button type="button" onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 w-12 h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-800 flex items-center justify-center transition-all z-10">
            <X size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
            <img src={previewImage} alt="Review Image" className="max-w-full max-h-full object-contain rounded-2xl border border-zinc-800 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
