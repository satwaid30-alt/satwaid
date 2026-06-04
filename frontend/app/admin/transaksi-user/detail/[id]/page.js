"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Receipt, User, Store, Package, Truck, CreditCard, Clock, CheckCircle2, AlertCircle, Copy, ExternalLink, MapPin, Phone, Mail, Image as ImageIcon, ChevronDown, ChevronUp, ShieldCheck, ArrowRight, Smartphone, Download, ScrollText } from "lucide-react";
import OrderStepper from "@/components/OrderStepper";
import OrderTimeline from "@/components/OrderTimeline";
import { copyToClipboard } from "@/app/utils/clipboard";

export default function AdminTransactionDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(null);
  const [openProductAccordion, setOpenProductAccordion] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showManualCompleteModal, setShowManualCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`);
      const result = await res.json();
      if (res.ok) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
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
      return path.replace("localhost:3000", "localhost:4000");
    }
    return `${process.env.NEXT_PUBLIC_API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/admin-confirm-payment`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      if (res.ok) {
        setShowConfirmModal(false);
        fetchOrderDetails();
      } else {
        alert(result.message || "Gagal konfirmasi");
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleManualCompleteOrder = async () => {
    setIsCompleting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          rating: 5,
          review: "Selesai secara manual oleh Admin atas pengajuan Penjual.",
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setShowManualCompleteModal(false);
        fetchOrderDetails();
      } else {
        alert(result.message || "Gagal menyelesaikan transaksi");
      }
    } catch (err) {
      console.error("Error completing transaction:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan!");
      return;
    }
    setIsRejecting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/reset-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          payment_rejection_reason: rejectionReason,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setShowRejectModal(false);
        setRejectionReason("");
        fetchOrderDetails();
      } else {
        alert(result.message || "Gagal menolak bukti pembayaran");
      }
    } catch (err) {
      console.error("Error resetting payment:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsRejecting(false);
    }
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-950">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Memuat Detail Transaksi...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="w-full min-h-screen text-zinc-300 selection:bg-emerald-500 selection:text-zinc-950 pb-20">
      {/* COMPACT STICKY TOP BAR */}
      <div className="sticky top-0 z-[50] bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-4 py-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/admin/transaksi-user" className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-emerald-500 transition-all group border border-zinc-800">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="h-8 w-px bg-zinc-800"></div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-black text-white tracking-tighter uppercase">Detail Transaksi</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">{order.status.replace("_", " ")}</span>
            </div>
            <p className="text-xs text-zinc-500 font-mono font-medium tracking-normal">{order.order_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="hidden md:flex px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider items-center gap-2 transition-all border border-zinc-800">
            <Download size={14} /> Invoice
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={order.status !== "processing"}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              order.status === "processing" ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 cursor-pointer" : "bg-zinc-800 text-zinc-500 border border-zinc-800/40 cursor-not-allowed opacity-50"
            }`}
          >
            <ShieldCheck size={16} /> Konfirmasi Saldo
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {/* PROGRESS STEPPER */}
        <OrderStepper order={order} />

        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
          {/* LEFT COLUMN (8/12) */}
          <div className="2xl:col-span-8 space-y-8">
            {/* MINIMALIST BUYER & SELLER HUB */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* BUYER CARD - MINIMALIST */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-emerald-500" />
                  Informasi Pembeli
                </h3>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                      <User size={28} className="text-zinc-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-bold text-white tracking-tight leading-tight">{order.receiver_name || order.user?.username || "User Anonymous"}</p>
                      <p className="text-xs font-semibold text-emerald-500 tracking-wider uppercase">@{order.user?.username || "user"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <Mail className="text-emerald-500" size={16} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email</p>
                        <p className="text-xs font-bold text-zinc-300 truncate">{order.user?.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <Phone className="text-emerald-500" size={16} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">No. Telepon</p>
                        <p className="text-xs font-bold text-zinc-300 truncate">{order.phone_number || order.user?.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-start gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <MapPin className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Alamat Pengiriman</p>
                        <p className="text-xs font-semibold text-zinc-300 leading-relaxed mt-0.5">{order.shipping_address || "Alamat N/A"}</p>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-start gap-3 bg-emerald-500/[0.02] p-4 rounded-2xl border border-emerald-500/10">
                      <CreditCard className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Rekening Pengembalian</p>
                        {order.bank_account ? (
                          <>
                            <p className="text-xs font-bold text-white tracking-tight">
                              {order.bank_name || "N/A"} — {order.bank_account}
                            </p>
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase">a.n {order.bank_holder || "N/A"}</p>
                          </>
                        ) : order.user?.bank_accounts ? (
                          <>
                            <p className="text-xs font-bold text-white tracking-tight">
                              {Array.isArray(order.user.bank_accounts) ? `${order.user.bank_accounts[0]?.bank_name || "N/A"} — ${order.user.bank_accounts[0]?.account_number || "N/A"}` : `${order.user.bank_accounts.bank_name || "N/A"} — ${order.user.bank_accounts.account_number || "N/A"}`}
                            </p>
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase">a.n {Array.isArray(order.user.bank_accounts) ? order.user.bank_accounts[0]?.account_name || "N/A" : order.user.bank_accounts.account_name || "N/A"}</p>
                          </>
                        ) : (
                          <p className="text-xs font-semibold text-zinc-500">Belum Mengatur Rekening</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SELLER CARD - MINIMALIST */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Store size={14} className="text-emerald-500" />
                  Informasi Toko
                </h3>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                      <Store size={28} className="text-zinc-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-bold text-white tracking-tight leading-tight">{order.shop?.name || "Toko Unknown"}</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-emerald-500" />
                        <p className="text-xs font-semibold text-zinc-400 uppercase">{order.shop?.city || "Lokasi N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <Smartphone className="text-emerald-500" size={16} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">No. WhatsApp</p>
                        <p className="text-xs font-bold text-zinc-300 truncate">{order.shop?.whatsapp || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <Store className="text-emerald-500" size={16} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Kode Toko</p>
                        <p className="text-xs font-bold text-zinc-300 truncate">{order.shop?.shop_code || `#${order.shop?.id}`}</p>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-start gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60">
                      <MapPin className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Alamat Toko</p>
                        <p className="text-xs font-semibold text-zinc-300 leading-relaxed mt-0.5">{order.shop?.address || "Alamat N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT ACCORDION - FULL WIDTH */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl">
              <button onClick={() => setOpenProductAccordion(!openProductAccordion)} className="w-full p-8 flex items-center justify-between hover:bg-zinc-800/50 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Package size={18} />
                  </div>
                  <div className="text-left space-y-0.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rincian Item Pesanan</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Klik untuk buka/tutup</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center transition-all ${openProductAccordion ? "rotate-180 text-emerald-500 border-emerald-500/30" : "text-zinc-500"}`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-700 ease-in-out ${openProductAccordion ? "max-h-[4000px] opacity-100 p-8 sm:p-10 pt-0" : "max-h-0 opacity-0"}`}>
                <div className="flex flex-col lg:flex-row gap-10">
                  <div className="w-full lg:w-64 aspect-square rounded-[2rem] overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800 shadow-2xl relative group/img">
                    <img src={getImageUrl(getImagesArray(order.product?.images)[0])} alt="Product" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">{order.product?.species || "REPTIL"}</span>
                        {order.product?.product_id && <span className="px-3.5 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">ID: {order.product.product_id}</span>}
                      </div>
                      <h4 className="text-2xl font-bold text-white tracking-tight leading-none">{order.product?.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Harga Satuan", value: formatPrice(order.price) },
                        { label: "Kuantitas", value: `${order.quantity} Ekor` },
                        { label: "Gender", value: order.product?.sex?.toUpperCase() || "-" },
                        { label: "Sisa Stok", value: order.product?.stock || "0", color: "text-emerald-500" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 shadow-inner">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className={`text-sm font-bold ${stat.color || "text-white"} tracking-tight`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Deskripsi Card */}
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] space-y-3 relative overflow-hidden group/desc flex flex-col justify-between shadow-inner">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-500 border-b border-zinc-800/80 pb-2">
                            <ScrollText size={14} />
                            <p className="text-[10px] font-bold uppercase tracking-wider">Deskripsi Produk</p>
                          </div>
                          <div className="text-xs text-zinc-400 font-normal leading-relaxed description-content pl-1" dangerouslySetInnerHTML={{ __html: order.product?.description || "Tidak ada deskripsi." }} />
                        </div>
                      </div>

                      {/* Catatan Pengiriman Card */}
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] space-y-3 relative overflow-hidden group/ship flex flex-col justify-between shadow-inner">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-500 border-b border-zinc-800/80 pb-2">
                            <Truck size={14} />
                            <p className="text-[10px] font-bold uppercase tracking-wider">Catatan Pengiriman</p>
                          </div>
                          <div className="text-xs text-zinc-400 font-normal leading-relaxed description-content pl-1" dangerouslySetInnerHTML={{ __html: order.product?.shipping_description || "Tidak ada catatan pengiriman." }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE */}
            <OrderTimeline order={order} formatPrice={formatPrice} />
          </div>

          {/* RIGHT COLUMN (4/12) */}
          <div className="2xl:col-span-4 space-y-8">
            {/* FINANCIALS SUMMARY - MINIMALIST */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Receipt size={14} />
                </div>
                Ringkasan Tagihan
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group/inv">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Invoice ID</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white tracking-wider font-mono">{order.order_id}</p>
                    <button onClick={() => handleCopy(order.order_id, "invoice")} className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 transition-all border border-zinc-800">
                      {copySuccess === "invoice" ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 px-2">
                  {[
                    { label: "Subtotal Produk", value: formatPrice(order.price * order.quantity) },
                    { label: "Biaya Admin", value: formatPrice(order.admin_fee || 5000) },
                    { label: "Ongkos Kirim", value: order.product?.is_free_shipping ? <span className="text-emerald-500 font-bold">Gratis</span> : formatPrice(order.shipping_cost || 0) },
                    { label: "Biaya Packing", value: order.product?.is_free_packing ? <span className="text-emerald-500 font-bold">Gratis</span> : formatPrice(order.packing_cost || 0) },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-semibold uppercase tracking-wider">{row.label}</span>
                      <span className="text-white font-bold">{row.value}</span>
                    </div>
                  ))}

                  <div className="h-px bg-zinc-800 my-4 border-dashed"></div>

                  <div className="flex justify-between items-center bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Bayar</p>
                      <p className="text-2xl font-bold text-white tracking-tight leading-none">{formatPrice(order.total_price)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT PROOF - MINIMALIST */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ImageIcon size={14} />
                </div>
                Bukti Bayar
              </h3>

              {order.payment_proof ? (
                <div className="space-y-4 relative z-10">
                  <div className="max-h-[320px] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden group/proof relative shadow-2xl transition-all hover:border-emerald-500/30 flex items-center justify-center p-2">
                    <img src={getImageUrl(order.payment_proof)} alt="Proof" className="max-h-[300px] object-contain rounded-xl" />
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-all backdrop-blur-sm">
                      <a href={getImageUrl(order.payment_proof)} target="_blank" rel="noreferrer" className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all">
                        <ExternalLink size={16} /> Buka Gambar
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Status: Terunggah</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed pl-6">Sudah terupload oleh user. Harap verifikasi kesesuaian nominal sebelum konfirmasi.</p>
                  </div>
                </div>
              ) : (
                <div className="p-12 bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-[2rem] text-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-zinc-800">
                    <Clock size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Belum Ada Bukti</p>
                </div>
              )}
            </div>

            {/* MASTER ACTIONS - COMPACT */}
            <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full mb-1"></div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Otoritas Admin</p>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={!order.payment_proof || order.status !== "processing"}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
                    order.payment_proof && order.status === "processing" ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 shadow-lg cursor-pointer" : "bg-zinc-800/40 text-zinc-500 border border-zinc-800/40 cursor-not-allowed opacity-50"
                  }`}
                >
                  Tolak Bukti Pembayaran
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={order.status !== "processing"}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
                    order.status === "processing" ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/20 cursor-pointer" : "bg-zinc-800/40 text-zinc-500 border border-zinc-800/40 cursor-not-allowed opacity-50"
                  }`}
                >
                  Konfirmasi Saldo <ShieldCheck size={18} />
                </button>
                {["shipped", "complained"].includes(order.status) && (
                  <button onClick={() => setShowManualCompleteModal(true)} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 cursor-pointer">
                    Selesaikan Transaksi (Manual) <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isConfirming && setShowConfirmModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                <ShieldCheck size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Konfirmasi Saldo</h2>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Apakah Anda yakin saldo pembayaran sebesar <span className="text-emerald-500 font-semibold">{formatPrice(order.total_price)}</span> sudah masuk ke rekening admin? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <button onClick={() => setShowConfirmModal(false)} disabled={isConfirming} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all">
                  Batal
                </button>
                <button onClick={handleConfirmPayment} disabled={isConfirming} className="py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {isConfirming ? (
                    <>
                      <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "Ya, Konfirmasi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MANUAL COMPLETE CONFIRMATION MODAL */}
      {showManualCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isCompleting && setShowManualCompleteModal(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                <CheckCircle2 size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Selesaikan Transaksi</h2>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Apakah Anda yakin ingin menyelesaikan transaksi ini secara manual atas pengajuan Penjual? Pembayaran akan dilepaskan ke saldo Penjual dengan rating 5-bintang otomatis. Tindakan ini tidak dapat dibatalkan.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <button onClick={() => setShowManualCompleteModal(false)} disabled={isCompleting} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all">
                  Batal
                </button>
                <button onClick={handleManualCompleteOrder} disabled={isCompleting} className="py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                  {isCompleting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "Ya, Selesaikan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REJECT CONFIRMATION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => !isRejecting && (setShowRejectModal(false) || setRejectionReason(""))}></div>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-3xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
                <AlertCircle size={40} className="text-red-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Tolak Bukti Bayar</h2>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Apakah Anda yakin ingin menolak bukti pembayaran ini? Status pesanan akan dikembalikan ke <span className="text-amber-500 font-semibold">Menunggu Pembayaran</span> dan pembeli harus mengunggah bukti pembayaran baru. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="w-full text-left space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Keterangan / Alasan Penolakan</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-red-500 transition-all resize-none font-bold"
                  placeholder="Masukkan alasan penolakan (misal: nominal tidak sesuai, bukti bayar buram)..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <button onClick={() => { setShowRejectModal(false); setRejectionReason(""); }} disabled={isRejecting} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all">
                  Batal
                </button>
                <button onClick={handleRejectPayment} disabled={isRejecting || !rejectionReason.trim()} className="py-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  {isRejecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "Ya, Tolak"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .description-content ul {
          list-style-type: disc !important;
          margin-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .description-content ol {
          list-style-type: decimal !important;
          margin-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .description-content li {
          display: list-item !important;
          margin-bottom: 0.25rem !important;
        }
        .description-content p {
          margin-bottom: 0.5rem !important;
        }
      `}</style>
    </div>
  );
}
